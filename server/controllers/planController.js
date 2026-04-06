import { pool } from "../config/db.js";

/* CREATE PLAN */
export const createPlan = async (req, res) => {
  try {
    const {
      name,
      roi,
      directReferral,
      ceilingLimit,
      investmentRange,
      status
    } = req.body;

    const result = await pool.query(
      `INSERT INTO plans 
      (name, roi, direct_referral, ceiling_limit, investment_range, status)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *`,
      [name, roi, directReferral, ceilingLimit, investmentRange, status || "active"]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error("createPlan error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* GET ALL PLANS */
export const getPlans = async (req, res) => {
  try {
    const isAdmin = req.user?.role === "admin";

    const query = isAdmin
      ? "SELECT * FROM plans ORDER BY id DESC"
      : "SELECT * FROM plans WHERE status = 'active' ORDER BY id DESC";

    const result = await pool.query(query);

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* UPDATE PLAN */
export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      roi,
      directReferral,
      ceilingLimit,
      investmentRange,
      status
    } = req.body;

    const result = await pool.query(
      `UPDATE plans 
       SET name=$1, roi=$2, direct_referral=$3, ceiling_limit=$4, investment_range=$5, status=$6
       WHERE id=$7 RETURNING *`,
      [name, roi, directReferral, ceilingLimit, investmentRange, status, id]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error("updatePlan error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* UPDATE STATUS */
export const updatePlanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await pool.query(
      "UPDATE plans SET status=$1 WHERE id=$2",
      [status, id]
    );

    res.json({ message: "Status updated" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* DELETE PLAN (optional) */
export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM plans WHERE id=$1", [id]);

    res.json({ message: "Plan deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};