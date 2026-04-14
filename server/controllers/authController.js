import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../config/db.js";
import { createUser } from "../models/userModel.js";
import { createReferralChain } from "../models/referralModel.js";
import { generateUserCode } from "../utils/generateUserCode.js";
import { sendSignupOtpEmail } from "../utils/mailer.js";

const OTP_MINUTES = Number(process.env.OTP_EXPIRE_MINUTES || 10);

/* ================= SIGNUP (OTP SEND) ================= */
export const signup = async (req, res) => {
  try {
    const { name, lastname, email, phone, password, referralCode } = req.body;

    if (!name || !lastname || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ❌ REMOVED strict email uniqueness check (now multiple users allowed)

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    const signupId = uuidv4(); // 🔥 unique per signup

    const payload = {
      name,
      lastname,
      email: normalizedEmail,
      phone,
      password,
      referralCode: referralCode?.trim() || null,
    };

    const expiresAt = new Date(Date.now() + OTP_MINUTES * 60 * 1000);

    // ✅ insert without conflict (multiple rows allowed)
    await pool.query(
      `
      INSERT INTO pending_signups (id, email, otp_hash, payload, expires_at)
      VALUES ($1, $2, $3, $4::jsonb, $5)
      `,
      [signupId, normalizedEmail, otpHash, JSON.stringify(payload), expiresAt]
    );

    await sendSignupOtpEmail({
      to: normalizedEmail,
      otp,
      name,
    });

    return res.status(200).json({
      message: "OTP sent to your email",
      signupId, // 🔥 IMPORTANT for frontend
    });
  } catch (error) {
    console.error("Signup OTP error:", error);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
};

/* ================= VERIFY OTP ================= */
export const verifySignupOtp = async (req, res) => {
  const client = await pool.connect();

  try {
    const { signupId, otp } = req.body;

    if (!signupId || !otp) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const pendingRes = await client.query(
      "SELECT * FROM pending_signups WHERE id = $1",
      [signupId]
    );

    const pending = pendingRes.rows[0];

    if (!pending) {
      return res.status(400).json({ message: "Signup not found" });
    }

    // ⛔ OTP expired
    if (new Date(pending.expires_at).getTime() < Date.now()) {
      await client.query("DELETE FROM pending_signups WHERE id = $1", [signupId]);
      return res.status(400).json({ message: "OTP expired" });
    }

    // ⛔ invalid OTP
    const isMatch = await bcrypt.compare(String(otp), pending.otp_hash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const { name, lastname, email, phone, password, referralCode } =
      pending.payload;

    await client.query("BEGIN");

    let sponsor = null;

    // 🔍 FIND SPONSOR
    if (referralCode) {
      const refUser = await client.query(
        "SELECT id, user_code FROM users WHERE user_code = $1",
        [referralCode]
      );

      if (!refUser.rows[0]) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Invalid referral code" });
      }

      sponsor = refUser.rows[0];
    }

    // 🔐 PASSWORD HASH
    const hashedPassword = await bcrypt.hash(password, 10);

    const user_code = generateUserCode();

    // ✅ CREATE USER
    const user = await createUser(
      {
        user_code,
        password: hashedPassword,
        role: "user",
        name,
        lastname,
        email,
        phone,
        referred_by: sponsor ? sponsor.user_code : null,
      },
      client
    );

    // 🔥 MAIN FIX: INSERT INTO referrals TABLE
    if (sponsor) {
      // (optional) keep your old tree logic
      await createReferralChain(client, user.user_code, sponsor.user_code);

      // ✅ IMPORTANT INSERT (this was missing)
      await client.query(
  `
  INSERT INTO referrals
  (referrer_user_id, referred_user_id, level, created_at)
  VALUES ($1, $2, 1, NOW())
  `,
  [sponsor.id, user.id]
);
    }

    // 🧹 CLEANUP
    await client.query("DELETE FROM pending_signups WHERE id = $1", [signupId]);

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Account verified and created successfully",
      user_code: user.user_code,
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Verify OTP error:", error);
    return res.status(500).json({ message: "OTP verification failed" });
  } finally {
    client.release();
  }
};

/* ================= ADMIN SIGNUP (UNCHANGED) ================= */
export const adminSignup = async (req, res) => {
  try {
    const { name, lastname, email, phone, password, adminSecret } = req.body;

    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user_code = "ADMIN" + Math.floor(1000 + Math.random() * 9000);

    const admin = await createUser({
      user_code,
      password: hashedPassword,
      role: "admin",
      name,
      lastname,
      email,
      phone,
      referred_by: null,
    });

    res.status(201).json({
      message: "Admin created",
      user_code: admin.user_code,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ================= LOGIN (UNCHANGED) ================= */
export const login = async (req, res) => {
  try {
    const { user_code, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE user_code = $1",
      [user_code]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.status) {
      return res.status(403).json({
        message: "Your account is deactivated. Contact admin.",
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role,
      user_code: user.user_code,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ================= ADMIN LOGIN AS USER (UNCHANGED) ================= */
export const loginAsUser = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, role, user_code, status
       FROM users
       WHERE id = $1`,
      [id]
    );

    const targetUser = result.rows[0];

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (targetUser.status === false) {
      return res.status(403).json({ message: "User account is deactivated" });
    }

    const token = jwt.sign(
      { id: targetUser.id, role: targetUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      role: targetUser.role,
      user_code: targetUser.user_code,
      redirectTo:
        targetUser.role === "admin"
          ? "/admin/dashboard"
          : "/user-dashboard",
    });
  } catch (error) {
    console.error("loginAsUser error:", error);
    res.status(500).json({ error: error.message });
  }
};