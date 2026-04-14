import { pool } from "../config/db.js";

/* ================= GET SUMMARY ================= */
export const getWithdrawSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const [roiRes, directRes, levelRes, withdrawRes] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(amount),0) AS total
         FROM roi_transactions
         WHERE user_id = $1`,
        [userId]
      ),

      pool.query(
        `SELECT COALESCE(SUM(amount),0) AS total
         FROM level_income
         WHERE user_id = $1
         AND income_type IN ('direct','plan_direct')`,
        [userId]
      ),

      pool.query(
        `SELECT COALESCE(SUM(amount),0) AS total
         FROM level_income
         WHERE user_id = $1
         AND income_type = 'level'`,
        [userId]
      ),

      pool.query(
        `SELECT
          COALESCE(SUM(amount) FILTER (
            WHERE LOWER(status) = 'approved' AND LOWER(wallet_type) = 'roi'
          ),0) AS roi_withdrawn,

          COALESCE(SUM(amount) FILTER (
            WHERE LOWER(status) = 'approved' AND LOWER(wallet_type) = 'direct'
          ),0) AS direct_withdrawn,

          COALESCE(SUM(amount) FILTER (
            WHERE LOWER(status) = 'approved' AND LOWER(wallet_type) = 'level'
          ),0) AS level_withdrawn

        FROM withdrawals
        WHERE user_id = $1`,
        [userId]
      )
    ]);

    const roiTotal = Number(roiRes.rows[0].total || 0);
    const directTotal = Number(directRes.rows[0].total || 0);
    const levelTotal = Number(levelRes.rows[0].total || 0);

    const withdrawn = withdrawRes.rows[0];

    const roiAvailable = roiTotal - Number(withdrawn.roi_withdrawn || 0);
    const directAvailable = directTotal - Number(withdrawn.direct_withdrawn || 0);
    const levelAvailable = levelTotal - Number(withdrawn.level_withdrawn || 0);

    res.json({
      roi: Math.max(0, roiAvailable),
      direct: Math.max(0, directAvailable),
      level: Math.max(0, levelAvailable),
      reward: 0,
      usdtPrice: 90
    });

  } catch (err) {
    console.error("summary error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/* ================= CREATE WITHDRAW ================= */
export const createWithdraw = async (req, res) => {
  try {
    const userId = req.user.id;
    let { walletType, currencyType, amount } = req.body;

    const amt = Number(amount);

    if (!walletType || !currencyType || !amt) {
      return res.status(400).json({ message: "All fields required" });
    }

    walletType = walletType.toLowerCase();

    if (!["roi", "level", "direct", "reward"].includes(walletType)) {
      return res.status(400).json({ message: "Invalid wallet type" });
    }

    if (amt < 20) {
      return res.status(400).json({ message: "Minimum $20 required" });
    }

    // ===== CHECK BALANCE =====
    const [roiRes, directRes, levelRes, approvedRes] = await Promise.all([
      pool.query(`SELECT COALESCE(SUM(amount),0) AS total FROM roi_transactions WHERE user_id=$1`, [userId]),
      pool.query(`SELECT COALESCE(SUM(amount),0) AS total FROM level_income WHERE user_id=$1 AND income_type IN ('direct','plan_direct')`, [userId]),
      pool.query(`SELECT COALESCE(SUM(amount),0) AS total FROM level_income WHERE user_id=$1 AND income_type='level'`, [userId]),
      pool.query(`
        SELECT
          COALESCE(SUM(amount) FILTER (WHERE status='approved' AND wallet_type='roi'),0) AS roi_withdrawn,
          COALESCE(SUM(amount) FILTER (WHERE status='approved' AND wallet_type='direct'),0) AS direct_withdrawn,
          COALESCE(SUM(amount) FILTER (WHERE status='approved' AND wallet_type='level'),0) AS level_withdrawn
        FROM withdrawals
        WHERE user_id=$1
      `, [userId])
    ]);

    const balances = {
      roi: Number(roiRes.rows[0].total) - Number(approvedRes.rows[0].roi_withdrawn),
      direct: Number(directRes.rows[0].total) - Number(approvedRes.rows[0].direct_withdrawn),
      level: Number(levelRes.rows[0].total) - Number(approvedRes.rows[0].level_withdrawn),
      reward: 0
    };

    if (amt > balances[walletType]) {
      return res.status(400).json({
        message: `Insufficient balance. Available ${balances[walletType].toFixed(2)}`
      });
    }

    // ===== INSERT WITH FIXED TIME =====
    await pool.query(
      `INSERT INTO withdrawals
       (user_id, wallet_type, currency_type, amount, status, created_at)
       VALUES ($1, $2, $3, $4, 'pending', NOW())`,
      [userId, walletType, currencyType, amt]
    );

    res.json({ message: "Withdraw request created" });

  } catch (err) {
    console.error("createWithdraw error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/* ================= USER WITHDRAW LIST ================= */
export const getMyWithdrawals = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT *
      FROM withdrawals
      WHERE user_id = $1
      ORDER BY id DESC
    `, [userId]);

    res.json(result.rows);

  } catch (err) {
    console.error("getMyWithdrawals error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/* ================= ADMIN WITHDRAW LIST ================= */
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
      ORDER BY w.id DESC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error("getAllWithdrawals error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/* ================= UPDATE STATUS ================= */
export const updateWithdrawStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, transactionId, approvedAmount } = req.body;

    await pool.query(
      `UPDATE withdrawals
       SET status = $1,
           transaction_id = COALESCE($2, transaction_id),
           approved_amount = COALESCE($3, approved_amount)
       WHERE id = $4`,
      [status, transactionId || null, approvedAmount ?? null, id]
    );

    res.json({ message: "Status updated" });

  } catch (err) {
    console.error("updateWithdrawStatus error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/* ================= DELETE ================= */
export const deleteWithdraw = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(`DELETE FROM withdrawals WHERE id=$1`, [id]);

    res.json({ message: "Deleted" });

  } catch (err) {
    console.error("deleteWithdraw error:", err.message);
    res.status(500).json({ error: err.message });
  }
};