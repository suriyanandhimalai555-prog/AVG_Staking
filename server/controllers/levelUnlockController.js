import { pool } from "../config/db.js";

// ✅ GET ALL
export const getLevelUnlocks = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM level_unlock_config ORDER BY level ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getLevelUnlocks error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ CREATE
export const createLevelUnlock = async (req, res) => {
  try {
    const { level, direct_staking } = req.body;

    // ✅ FIXED VALIDATION
    if (level === undefined || direct_staking === undefined) {
      return res.status(400).json({ message: "All fields required" });
    }

    const result = await pool.query(
      `INSERT INTO level_unlock_config (level, direct_staking)
       VALUES ($1,$2) RETURNING *`,
      [Number(level), Number(direct_staking)]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("create error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ UPDATE
export const updateLevelUnlock = async (req, res) => {
  try {
    const { id } = req.params;
    const { level, direct_staking } = req.body;

    // ✅ ALSO FIX HERE (important)
    if (level === undefined || direct_staking === undefined) {
      return res.status(400).json({ message: "All fields required" });
    }

    await pool.query(
      `UPDATE level_unlock_config 
       SET level=$1, direct_staking=$2
       WHERE id=$3`,
      [Number(level), Number(direct_staking), id]
    );

    res.json({ message: "Updated" });
  } catch (err) {
    console.error("update error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ DELETE
export const deleteLevelUnlock = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "DELETE FROM level_unlock_config WHERE id=$1",
      [id]
    );

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("delete error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ TOGGLE STATUS
export const toggleLevelUnlockStatus = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `UPDATE level_unlock_config 
       SET status = NOT status
       WHERE id=$1`,
      [id]
    );

    res.json({ message: "Status toggled" });
  } catch (err) {
    console.error("toggle error:", err);
    res.status(500).json({ error: err.message });
  }
};