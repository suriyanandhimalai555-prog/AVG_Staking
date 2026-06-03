import { pool } from "../config/db.js";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import crypto from "crypto";
import path from "path";

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.AWS_S3_BUCKET;
const PUBLIC_BASE_URL = process.env.S3_PUBLIC_BASE_URL || "";

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const buildPublicUrl = (key) => {
  if (PUBLIC_BASE_URL) {
    return `${PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`;
  }

  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
};

const safeNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const uploadBufferToS3 = async (file, folder = "banner-slides") => {
  const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
  const key = `${folder}/${Date.now()}-${crypto.randomUUID()}${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  return {
    key,
    url: buildPublicUrl(key),
  };
};

const deleteFromS3 = async (key) => {
  if (!key) return;

  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
};

export const getApprovedBannerUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        ur.user_id,
        u.name,
        u.lastname,
        u.phone,
        u.user_code,
        ur.reward,
        ur.target_amount,
        ur.progress,
        ur.achieved_date,
        COALESCE(bs.id, 0) AS slide_id,
        bs.image_url,
        bs.s3_key,
        COALESCE(bs.sort_order, 0) AS sort_order,
        COALESCE(bs.is_active, false) AS is_active
      FROM user_rewards ur
      INNER JOIN users u ON u.id = ur.user_id
      LEFT JOIN banner_slides bs
        ON bs.user_id = ur.user_id
       AND bs.reward = ur.reward
       AND bs.target_amount = ur.target_amount
      WHERE ur.status = 'approved'
      ORDER BY ur.achieved_date DESC NULLS LAST, ur.user_id DESC
    `);

    const rows = result.rows.map((row) => ({
      userId: row.user_id,
      username: `${row.name || ""} ${row.lastname || ""}`.trim(),
      phone: row.phone || "-",
      userCode: row.user_code || "-",
      reward: row.reward,
      target_amount: safeNumber(row.target_amount),
      progress: safeNumber(row.progress),
      achieved_date: row.achieved_date,
      slideId: row.slide_id,
      image_url: row.image_url || null,
      s3_key: row.s3_key || null,
      sort_order: Number(row.sort_order || 0),
      is_active: row.is_active,
    }));

    res.json(rows);
  } catch (err) {
    console.error("getApprovedBannerUsers error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const upsertBannerSlide = async (req, res) => {
  try {
    const {
      userId,
      username,
      phone,
      userCode,
      reward,
      target_amount,
      progress,
      achievedDate,
      sort_order = 0,
      is_active = true,
    } = req.body;

    if (!userId || !reward || !target_amount) {
      return res.status(400).json({
        message: "userId, reward and target_amount are required",
      });
    }

    const existingRes = await pool.query(
      `
      SELECT id, image_url, s3_key
      FROM banner_slides
      WHERE user_id = $1
        AND reward = $2
        AND target_amount = $3
      LIMIT 1
      `,
      [userId, reward, target_amount]
    );

    const existing = existingRes.rows[0] || null;
    let imageUrl = existing?.image_url || null;
    let s3Key = existing?.s3_key || null;

    if (req.file) {
      const uploaded = await uploadBufferToS3(req.file);
      imageUrl = uploaded.url;
      s3Key = uploaded.key;

      if (existing?.s3_key) {
        await deleteFromS3(existing.s3_key);
      }
    }

    if (!imageUrl) {
      return res.status(400).json({
        message: "Image is required for first upload",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO banner_slides (
        user_id,
        reward,
        target_amount,
        progress,
        username,
        phone,
        user_code,
        achieved_date,
        image_url,
        s3_key,
        sort_order,
        is_active,
        updated_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW()
      )
      ON CONFLICT (user_id, reward, target_amount)
      DO UPDATE SET
        progress = EXCLUDED.progress,
        username = EXCLUDED.username,
        phone = EXCLUDED.phone,
        user_code = EXCLUDED.user_code,
        achieved_date = EXCLUDED.achieved_date,
        image_url = EXCLUDED.image_url,
        s3_key = EXCLUDED.s3_key,
        sort_order = EXCLUDED.sort_order,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
      RETURNING *
      `,
      [
        userId,
        reward,
        target_amount,
        safeNumber(progress),
        username || "",
        phone || "",
        userCode || "",
        achievedDate || null,
        imageUrl,
        s3Key,
        Number(sort_order || 0),
        String(is_active) === "true" || is_active === true,
      ]
    );

    res.json({
      message: "Banner slide saved successfully",
      slide: result.rows[0],
    });
  } catch (err) {
    console.error("upsertBannerSlide error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getPublicBannerSlides = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        user_id AS "userId",
        username,
        phone,
        user_code AS "userCode",
        reward,
        target_amount,
        progress,
        achieved_date AS "achievedDate",
        image_url AS "imageUrl",
        sort_order AS "sortOrder",
        is_active AS "isActive"
      FROM banner_slides
      WHERE is_active = TRUE
      ORDER BY sort_order ASC, created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("getPublicBannerSlides error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const toggleBannerSlideStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE banner_slides
      SET is_active = NOT is_active
      WHERE id = $1
      RETURNING id, is_active
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Slide not found" });
    }

    res.json({
      message: "Banner slide status updated",
      slide: result.rows[0],
    });
  } catch (err) {
    console.error("toggleBannerSlideStatus error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteBannerSlide = async (req, res) => {
  try {
    const { id } = req.params;

    const existingRes = await pool.query(
      `SELECT s3_key FROM banner_slides WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (existingRes.rows.length === 0) {
      return res.status(404).json({ message: "Slide not found" });
    }

    const s3Key = existingRes.rows[0].s3_key;

    await pool.query(`DELETE FROM banner_slides WHERE id = $1`, [id]);
    await deleteFromS3(s3Key);

    res.json({ message: "Banner slide deleted successfully" });
  } catch (err) {
    console.error("deleteBannerSlide error:", err);
    res.status(500).json({ error: err.message });
  }
};