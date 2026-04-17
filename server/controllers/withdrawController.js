import { pool } from "../config/db.js";

const round2 = (value) => Number(Number(value || 0).toFixed(2));

/* GET AVAILABLE WALLET SUMMARY */
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

      // Only reserve money for NEW withdrawals
      pool.query(
        `SELECT
          COALESCE(SUM(amount) FILTER (
            WHERE COALESCE(balance_reserved, false) = true
              AND LOWER(wallet_type) = 'roi'
              AND LOWER(status) IN ('pending', 'approved')
          ),0) AS roi_reserved,

          COALESCE(SUM(amount) FILTER (
            WHERE COALESCE(balance_reserved, false) = true
              AND LOWER(wallet_type) = 'direct'
              AND LOWER(status) IN ('pending', 'approved')
          ),0) AS direct_reserved,

          COALESCE(SUM(amount) FILTER (
            WHERE COALESCE(balance_reserved, false) = true
              AND LOWER(wallet_type) = 'level'
              AND LOWER(status) IN ('pending', 'approved')
          ),0) AS level_reserved
         FROM withdrawals
         WHERE user_id = $1`,
        [userId]
      ),
    ]);

    const roiTotal = Number(roiRes.rows[0].total || 0);
    const directTotal = Number(directRes.rows[0].total || 0);
    const levelTotal = Number(levelRes.rows[0].total || 0);

    const reserved = withdrawRes.rows[0];

    const roiReserved = Number(reserved.roi_reserved || 0);
    const directReserved = Number(reserved.direct_reserved || 0);
    const levelReserved = Number(reserved.level_reserved || 0);

    const roiAvailable = Math.max(0, roiTotal - roiReserved);
    const directAvailable = Math.max(0, directTotal - directReserved);
    const levelAvailable = Math.max(0, levelTotal - levelReserved);

    res.json({
      roi: round2(roiAvailable),
      direct: round2(directAvailable),
      level: round2(levelAvailable),

      roiTotal: round2(roiTotal),
      directTotal: round2(directTotal),
      levelTotal: round2(levelTotal),

      reward: 0,
      usdtPrice: 90,
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
    let { walletType, currencyType, amount } = req.body;

    const amt = Number(amount);

    if (!walletType || !currencyType || !amount) {
      return res.status(400).json({ message: "All fields required" });
    }

    walletType = String(walletType).toLowerCase();

    if (!["roi", "level", "direct", "reward"].includes(walletType)) {
      return res.status(400).json({ message: "Invalid wallet type" });
    }

    if (Number.isNaN(amt) || amt <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (amt < 20) {
      return res.status(400).json({ message: "Minimum $20 required" });
    }

    // Total earned
    const [roiRes, directRes, levelRes, reservedRes] = await Promise.all([
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
            WHERE COALESCE(balance_reserved, false) = true
              AND LOWER(wallet_type) = 'roi'
              AND LOWER(status) IN ('pending', 'approved')
          ),0) AS roi_reserved,

          COALESCE(SUM(amount) FILTER (
            WHERE COALESCE(balance_reserved, false) = true
              AND LOWER(wallet_type) = 'direct'
              AND LOWER(status) IN ('pending', 'approved')
          ),0) AS direct_reserved,

          COALESCE(SUM(amount) FILTER (
            WHERE COALESCE(balance_reserved, false) = true
              AND LOWER(wallet_type) = 'level'
              AND LOWER(status) IN ('pending', 'approved')
          ),0) AS level_reserved
         FROM withdrawals
         WHERE user_id = $1`,
        [userId]
      ),
    ]);

    const availableMap = {
      roi: Number(roiRes.rows[0].total || 0) - Number(reservedRes.rows[0].roi_reserved || 0),
      direct: Number(directRes.rows[0].total || 0) - Number(reservedRes.rows[0].direct_reserved || 0),
      level: Number(levelRes.rows[0].total || 0) - Number(reservedRes.rows[0].level_reserved || 0),
      reward: 0,
    };

    if (amt > availableMap[walletType]) {
      return res.status(400).json({
        message: `Insufficient balance. Available ${Math.max(0, availableMap[walletType]).toFixed(2)}`,
      });
    }

    await pool.query(
      `INSERT INTO withdrawals
       (user_id, wallet_type, currency_type, amount, status, balance_reserved, created_at)
       VALUES ($1, $2, $3, $4, 'pending', true, NOW())`,
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

    const result = await pool.query(
      `SELECT * FROM withdrawals
       WHERE user_id = $1
       ORDER BY id DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("get withdrawals error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* UPDATE STATUS */
export const updateWithdrawStatus = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { status, transactionId, approvedAmount } = req.body;

    const newStatus = String(status || "").toLowerCase();

    if (!["approved", "rejected"].includes(newStatus)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    await client.query("BEGIN");

    const currentRes = await client.query(
      `SELECT id, status, balance_reserved
       FROM withdrawals
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    if (currentRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Withdrawal not found" });
    }

    const current = currentRes.rows[0];

    if (String(current.status).toLowerCase() !== "pending") {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Only pending requests can be updated" });
    }

    if (newStatus === "approved") {
      await client.query(
        `UPDATE withdrawals
         SET status = 'approved',
             transaction_id = COALESCE($1, transaction_id),
             approved_amount = COALESCE($2, approved_amount),
             balance_reserved = true
         WHERE id = $3`,
        [transactionId || null, approvedAmount ?? null, id]
      );
    }

    if (newStatus === "rejected") {
      // Release the reserved amount back to the wallet
      await client.query(
        `UPDATE withdrawals
         SET status = 'rejected',
             transaction_id = NULL,
             approved_amount = NULL,
             balance_reserved = false
         WHERE id = $1`,
        [id]
      );
    }

    await client.query("COMMIT");
    res.json({ message: "Status updated" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("updateWithdrawStatus error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
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
        u.user_code,

        b.account_holder_name,
        b.bank_name,
        b.account_number,
        b.ifsc_code,
        b.branch,
        b.upi_id,
        b.gpay_number

      FROM withdrawals w
      JOIN users u 
        ON u.id = w.user_id

      LEFT JOIN LATERAL (
        SELECT *
        FROM bank_details bd
        WHERE bd.user_id = w.user_id
        ORDER BY bd.id DESC
        LIMIT 1
      ) b ON TRUE

      ORDER BY w.id DESC;
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("getAllWithdrawals error:", err);
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