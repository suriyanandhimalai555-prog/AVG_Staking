import { pool } from "../config/db.js";

const round2 = (value) => Number(Number(value || 0).toFixed(2));

/* GET AVAILABLE WALLET SUMMARY */
export const getWithdrawSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const [
      roiRes,
      directRes,
      levelRes,
      withdrawRes
    ] = await Promise.all([

      // ✅ TOTAL ROI (GROSS)
      pool.query(
        `SELECT COALESCE(SUM(total_earned),0) AS total
         FROM roi_transactions rt
         JOIN user_plans up ON up.id = rt.user_plan_id
         WHERE up.user_id = $1`,
        [userId]
      ),

      // ✅ TOTAL DIRECT
      pool.query(
        `SELECT COALESCE(SUM(amount),0) AS total
         FROM level_income
         WHERE user_id = $1
         AND income_type IN ('direct','plan_direct')`,
        [userId]
      ),

      // ✅ TOTAL LEVEL
      pool.query(
        `SELECT COALESCE(SUM(amount),0) AS total
         FROM level_income
         WHERE user_id = $1
         AND income_type = 'level'`,
        [userId]
      ),

      // ✅ TOTAL APPROVED WITHDRAWALS
      pool.query(
        `SELECT
          COALESCE(SUM(amount) FILTER (
            WHERE LOWER(status) = 'approved' AND wallet_type = 'roi'
          ),0) AS roi_withdrawn,

          COALESCE(SUM(amount) FILTER (
            WHERE LOWER(status) = 'approved' AND wallet_type = 'directReferral'
          ),0) AS direct_withdrawn,

          COALESCE(SUM(amount) FILTER (
            WHERE LOWER(status) = 'approved' AND wallet_type = 'level'
          ),0) AS level_withdrawn

        FROM withdrawals
        WHERE user_id = $1`,
        [userId]
      )
    ]);

    // 🔹 GROSS (EARNINGS)
    const roiTotal = Number(roiRes.rows[0].total || 0);
    const directTotal = Number(directRes.rows[0].total || 0);
    const levelTotal = Number(levelRes.rows[0].total || 0);

    // 🔹 WITHDRAWN
    const withdrawn = withdrawRes.rows[0];

    const roiWithdrawn = Number(withdrawn.roi_withdrawn || 0);
    const directWithdrawn = Number(withdrawn.direct_withdrawn || 0);
    const levelWithdrawn = Number(withdrawn.level_withdrawn || 0);

    // 🔹 AVAILABLE (WALLET)
    const roiAvailable = Math.max(0, roiTotal - roiWithdrawn);
    const directAvailable = Math.max(0, directTotal - directWithdrawn);
    const levelAvailable = Math.max(0, levelTotal - levelWithdrawn);

    res.json({
      // ✅ WALLET (deducted)
      roi: Number(roiAvailable.toFixed(2)),
      directReferral: Number(directAvailable.toFixed(2)),
      level: Number(levelAvailable.toFixed(2)),

      // ✅ EARNINGS (no deduction)
      roiTotal: Number(roiTotal.toFixed(2)),
      directTotal: Number(directTotal.toFixed(2)),
      levelTotal: Number(levelTotal.toFixed(2)),

      reward: 0,
      usdtPrice: 90
    });

  } catch (err) {
    console.error("summary error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* CREATE WITHDRAW */
export const createWithdraw = async (req, res) => {
  try {
    const userId = req.user.id;
    const { walletType, currencyType, amount } = req.body;

    const amt = Number(amount);

    if (!walletType || !currencyType || !amount) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (!["roi", "level", "directReferral", "reward"].includes(walletType)) {
      return res.status(400).json({ message: "Invalid wallet type" });
    }

    if (Number.isNaN(amt) || amt <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (amt < 20) {
      return res.status(400).json({ message: "Minimum $20 required" });
    }

    // get current available balance
    const summaryRes = await pool.query(
      `SELECT
          COALESCE(SUM(total_earned),0) AS roi_gross
       FROM roi_transactions rt
       JOIN user_plans up ON up.id = rt.user_plan_id
       WHERE up.user_id = $1`,
      [userId]
    );

    const directRes = await pool.query(
      `SELECT COALESCE(SUM(amount),0) AS total
       FROM level_income
       WHERE user_id = $1
       AND income_type IN ('direct', 'plan_direct')`,
      [userId]
    );

    const levelRes = await pool.query(
      `SELECT COALESCE(SUM(amount),0) AS total
       FROM level_income
       WHERE user_id = $1
       AND income_type = 'level'`,
      [userId]
    );

    const approvedRes = await pool.query(
      `SELECT
          COALESCE(SUM(amount) FILTER (
            WHERE UPPER(status) = 'APPROVED' AND wallet_type = 'roi'
          ), 0) AS roi_withdrawn,

          COALESCE(SUM(amount) FILTER (
            WHERE UPPER(status) = 'APPROVED' AND wallet_type = 'directReferral'
          ), 0) AS direct_withdrawn,

          COALESCE(SUM(amount) FILTER (
            WHERE UPPER(status) = 'APPROVED' AND wallet_type = 'level'
          ), 0) AS level_withdrawn,

          COALESCE(SUM(amount) FILTER (
            WHERE UPPER(status) = 'APPROVED' AND wallet_type = 'reward'
          ), 0) AS reward_withdrawn
       FROM withdrawals
       WHERE user_id = $1`,
      [userId]
    );

    const roiAvailable = Math.max(
      0,
      Number(summaryRes.rows[0].roi_gross || 0) -
      Number(approvedRes.rows[0].roi_withdrawn || 0)
    );

    const directAvailable = Math.max(
      0,
      Number(directRes.rows[0].total || 0) -
      Number(approvedRes.rows[0].direct_withdrawn || 0)
    );

    const levelAvailable = Math.max(
      0,
      Number(levelRes.rows[0].total || 0) -
      Number(approvedRes.rows[0].level_withdrawn || 0)
    );

    const rewardAvailable = Math.max(
      0,
      0 - Number(approvedRes.rows[0].reward_withdrawn || 0)
    );

    const availableMap = {
      roi: roiAvailable,
      directReferral: directAvailable,
      level: levelAvailable,
      reward: rewardAvailable,
    };

    if (amt > availableMap[walletType]) {
      return res.status(400).json({
        message: `Insufficient balance. Available ${availableMap[walletType].toFixed(2)}`,
      });
    }

    await pool.query(
      `INSERT INTO withdrawals
       (user_id, wallet_type, currency_type, amount, status)
       VALUES ($1, $2, $3, $4, 'PENDING')`,
      [userId, walletType, currencyType, amt]
    );

    res.json({ message: "Withdraw request created" });
  } catch (err) {
    console.error("createWithdraw error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* GET MY WITHDRAWALS */
export const getMyWithdrawals = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT * FROM withdrawals
      WHERE user_id=$1
      ORDER BY id DESC
    `, [userId]);

    res.json(result.rows);

  } catch (err) {
    console.error("get withdrawals error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET ALL WITHDRAW REQUESTS (ADMIN)
export const getAllWithdrawals = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
  w.*,
  u.name,
  u.lastname,
  u.user_code
FROM withdrawals w
JOIN users u ON u.id = w.user_id
ORDER BY w.id DESC;
    `);

    res.json(result.rows);

  } catch (err) {
    console.error("getAllWithdrawals error:", err);
    res.status(500).json({ error: err.message });
  }
};

// APPROVE / REJECT
export const updateWithdrawStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await pool.query(
      `UPDATE withdrawals SET status=$1 WHERE id=$2`,
      [status, id]
    );

    res.json({ message: "Status updated" });

  } catch (err) {
    console.error("updateWithdrawStatus error:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE
export const deleteWithdraw = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(`DELETE FROM withdrawals WHERE id=$1`, [id]);

    res.json({ message: "Deleted" });

  } catch (err) {
    console.error("deleteWithdraw error:", err);
    res.status(500).json({ error: err.message });
  }
};