import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import logo from "../assets/logo.png";
import "../styles/auth.css";
import { MailIcon } from "./AuthIcons";

const Otp = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 🔥 Recover state if page refreshed
  const storedSignup = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("pendingSignup") || "null");
    } catch {
      return null;
    }
  })();

  const state = location.state || storedSignup;

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // 🔥 Only this controls success UI
  const [createdUserCode, setCreatedUserCode] = useState("");

  useEffect(() => {
    if (!state?.signupId || !state?.email || !state?.formData) {
      navigate("/signup", { replace: true });
    }
  }, [state, navigate]);

  const referralLink = useMemo(() => {
    if (!createdUserCode) return "";
    return `${window.location.origin}/auth/registration?referral_code=${encodeURIComponent(
      createdUserCode
    )}`;
  }, [createdUserCode]);

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      return toast.error("OTP is required");
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${import.meta.env.VITE_APP_BASE_URL}/api/auth/verify-signup-otp`,
        {
          signupId: state.signupId,
          otp: otp.trim(),
        }
      );

      console.log("VERIFY RESPONSE:", res.data); // 🧪 debug

      if (!res.data?.user_code) {
        throw new Error("User code not returned from server");
      }

      // ✅ Set user code FIRST
      setCreatedUserCode(res.data.user_code);

      // cleanup
      sessionStorage.removeItem("pendingSignup");

      toast.success("Email verified and account created");
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "OTP verification failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    const { name, lastname, email, phone, password, referralCode } =
      state.formData;

    if (!name || !lastname || !email || !phone || !password) {
      return toast.error(
        "Signup data missing. Go back and fill the form again."
      );
    }

    try {
      setResending(true);

      const res = await axios.post(
        `${import.meta.env.VITE_APP_BASE_URL}/api/auth/signup`,
        {
          name: name.trim(),
          lastname: lastname.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          referralCode: referralCode?.trim() || undefined,
        }
      );

      const nextState = {
        signupId: res.data.signupId,
        email: email.trim(),
        formData: state.formData,
      };

      sessionStorage.setItem("pendingSignup", JSON.stringify(nextState));

      toast.success("OTP resent successfully");

      navigate("/otp", {
        replace: true,
        state: nextState,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Resend OTP failed");
    } finally {
      setResending(false);
    }
  };

  const copyText = async (text, msg) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(msg);
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-left">
          <div className="logo-box">
            <img src={logo} alt="AVG Logo" />
          </div>

          <h1>
            <span className="light-text">Verify </span>
            <span className="accent">OTP</span>
          </h1>

          <p>We sent a verification code to your email address.</p>
        </div>

        <div className="auth-right">
          <div className="auth-card">

            {/* 🔥 SUCCESS UI (based on user_code) */}
            {createdUserCode ? (
              <div className="success-panel">
                <h2 className="auth-heading">
                  <span className="accent">Account created</span>
                </h2>

                <p className="success-note">
                  Your user code is also your referral code.
                </p>

                <div className="code-box">
                  <span className="code-label">User Code</span>
                  <div className="code-value">{createdUserCode}</div>
                </div>

                <div className="code-box">
                  <span className="code-label">Referral Link</span>
                  <div className="code-link">{referralLink}</div>
                </div>

                <div className="action-row">
                  <button
                    className="secondary-btn"
                    onClick={() =>
                      copyText(createdUserCode, "User code copied")
                    }
                  >
                    Copy User Code
                  </button>

                  <button
                    className="primary-btn"
                    onClick={() =>
                      copyText(referralLink, "Referral link copied")
                    }
                  >
                    Copy Referral Link
                  </button>
                </div>

                <button
                  className="primary-btn"
                  onClick={() => navigate("/login")}
                >
                  Continue to Login
                </button>
              </div>
            ) : (
              <>
                {/* 🔥 OTP FORM */}
                <h2 className="auth-heading">
                  Enter <span className="accent">OTP</span>
                </h2>

                <p className="auth-subtitle">
                  We sent a 6-digit OTP to <b>{state?.email || "-"}</b>
                </p>

                <form className="auth-form" onSubmit={handleVerify}>
                  <div className="field">
                    <label>OTP</label>
                    <div className="input-shell">
                      <span className="input-icon">
                        <MailIcon />
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                      />
                    </div>
                  </div>

                  <button className="primary-btn" disabled={loading}>
                    {loading ? "Verifying..." : "Verify OTP"}
                  </button>

                  <div className="footer-link">
                    Didn’t get OTP?{" "}
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resending}
                    >
                      {resending ? "Resending..." : "Resend OTP"}
                    </button>
                  </div>

                  <div className="footer-link">
                    Back to{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/signup")}
                    >
                      Signup
                    </button>
                  </div>
                </form>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Otp;