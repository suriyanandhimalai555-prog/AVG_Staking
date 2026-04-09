import { pool } from "../config/db.js";
import { creditLevelIncome } from "./levelController.js";

const parseNumber = (value, fallback = 0) => {
  if (value === null || value === undefined) return fallback;
  const match = String(value).match(/[\d.]+/);
  const num = match ? parseFloat(match[0]) : Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const getCeilingMultiplier = (plan) => {
  const raw = plan.ceiling_limit ?? plan.ceilingLimit ?? "2X";
  const mult = parseNumber(raw, 2);
  return mult > 0 ? mult : 2;
};

const resolveUserId = async (value) => {
  if (!value) return null;

  if (typeof value === "number" || /^\d+$/.test(String(value))) {
    return Number(value);
  }

  const result = await pool.query(
    `SELECT id FROM users WHERE user_code = $1 LIMIT 1`,
    [String(value).trim()]
  );

  return result.rows[0]?.id || null;
};

const getUserCode = async (userId) => {
  const res = await pool.query(
    `SELECT user_code FROM users WHERE id = $1`,
    [userId]
  );
  return res.rows[0]?.user_code || null;
};

const getCreditedPlanId = async (receiverUserId) => {
  const plansRes = await pool.query(
    `
    SELECT 
      up.id,
      up.amount,
      up.created_at,
      p.ceiling_limit,
      COALESCE(r.total_roi, 0) AS roi_income,
      COALESCE(i.total_referral_income, 0) AS referral_income
    FROM user_plans up
    JOIN plans p ON p.id = up.plan_id
    LEFT JOIN (
      SELECT user_plan_id, SUM(amount) AS total_roi
      FROM roi_transactions
      GROUP BY user_plan_id
    ) r ON r.user_plan_id = up.id
    LEFT JOIN (
      SELECT credited_user_plan_id, SUM(amount) AS total_referral_income
      FROM level_income
      GROUP BY credited_user_plan_id
    ) i ON i.credited_user_plan_id = up.id
    WHERE up.user_id = $1
      AND up.status = 'active'
    ORDER BY up.created_at ASC, up.id ASC
    `,
    [receiverUserId]
  );

  for (const plan of plansRes.rows) {
    const deposit = Number(plan.amount || 0);
    const maxReturn = deposit * getCeilingMultiplier(plan);
    const used = Number(plan.roi_income || 0) + Number(plan.referral_income || 0);

    if (used < maxReturn) {
      return plan.id;
    }
  }

  return null;
};

const insertEarning = async ({
  receiverUserId,
  receiverUserCode,
  fromUserId,
  fromUserCode,
  sourceUserPlanId,
  amount,
  percentage,
  level,
  incomeType,
}) => {
  let remainingAmount = Number(amount || 0);
  if (remainingAmount <= 0) return;

  const plansRes = await pool.query(
    `
    SELECT 
      up.id,
      up.amount,
      up.created_at,
      p.ceiling_limit,
      COALESCE(r.total_roi, 0) AS roi_income,
      COALESCE(i.total_referral_income, 0) AS referral_income
    FROM user_plans up
    JOIN plans p ON p.id = up.plan_id
    LEFT JOIN (
      SELECT user_plan_id, SUM(amount) AS total_roi
      FROM roi_transactions
      GROUP BY user_plan_id
    ) r ON r.user_plan_id = up.id
    LEFT JOIN (
      SELECT credited_user_plan_id, SUM(amount) AS total_referral_income
      FROM level_income
      GROUP BY credited_user_plan_id
    ) i ON i.credited_user_plan_id = up.id
    WHERE up.user_id = $1
      AND up.status = 'active'
    ORDER BY up.created_at ASC, up.id ASC
    `,
    [receiverUserId]
  );

  for (const plan of plansRes.rows) {
    if (remainingAmount <= 0) break;

    const deposit = Number(plan.amount || 0);
    const maxReturn = deposit * getCeilingMultiplier(plan);
    const used = Number(plan.roi_income || 0) + Number(plan.referral_income || 0);
    const capacity = Math.max(0, maxReturn - used);

    if (capacity <= 0) continue;

    const toInsert = Math.min(capacity, remainingAmount);

    await pool.query(
      `
      INSERT INTO level_income
      (
        user_id,
        from_user_id,
        to_user_code,
        from_user_code,
        user_plan_id,
        credited_user_plan_id,
        level,
        amount,
        percentage,
        income_type
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      `,
      [
        receiverUserId,
        fromUserId,
        receiverUserCode,
        fromUserCode,
        sourceUserPlanId,
        plan.id,
        level,
        toInsert,
        percentage,
        incomeType,
      ]
    );

    remainingAmount -= toInsert;
  }
};

/* BUY PLAN */
export const buyPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId, amount } = req.body;

    if (!planId || !amount) {
      return res.status(400).json({ message: "Missing data" });
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const planRes = await pool.query(
      "SELECT * FROM plans WHERE id = $1",
      [planId]
    );

    const plan = planRes.rows[0];
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    // ✅ FIXED ROI CALCULATION
    const roiPercent = parseFloat(
      String(plan.roi || "0").replace(/[^\d.]/g, "")
    );

    const dailyROI = (numericAmount * roiPercent) / 100;

    await pool.query("BEGIN");

    const result = await pool.query(
      `INSERT INTO user_plans
        (user_id, plan_id, amount, daily_roi, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [userId, planId, numericAmount, dailyROI]
    );

    await pool.query("COMMIT");

    res.json({
      message: "Plan request submitted successfully",
      request: result.rows[0],
    });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("buyPlan error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* USER LOGGED-IN PLANS */
export const getUserPlans = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      WITH income AS (
        SELECT
          COALESCE(credited_user_plan_id, user_plan_id) AS plan_key,
          SUM(CASE WHEN income_type IN ('direct', 'plan_direct') THEN amount ELSE 0 END) AS direct_income,
          SUM(CASE WHEN income_type = 'level' THEN amount ELSE 0 END) AS level_income
        FROM level_income
        GROUP BY COALESCE(credited_user_plan_id, user_plan_id)
      ),
      roi AS (
        SELECT
          user_plan_id,
          SUM(amount) AS total_roi
        FROM roi_transactions
        GROUP BY user_plan_id
      )
      SELECT
        up.id,
        p.name AS plan_name,
        p.ceiling_limit,
        up.amount,
        up.daily_roi,
        up.status,
        up.created_at,
        COALESCE(r.total_roi, 0) AS roi_income,
        COALESCE(i.direct_income, 0) AS direct_income,
        COALESCE(i.level_income, 0) AS level_income
      FROM user_plans up
      JOIN plans p ON p.id = up.plan_id
      LEFT JOIN roi r ON r.user_plan_id = up.id
      LEFT JOIN income i ON i.plan_key = up.id
      WHERE up.user_id = $1
      ORDER BY up.created_at ASC, up.id ASC
      `,
      [userId]
    );

    const data = result.rows.map((plan) => {
      const deposit = Number(plan.amount || 0);
      const roiIncome = Number(plan.roi_income || 0);
      const directIncome = Number(plan.direct_income || 0);
      const levelIncome = Number(plan.level_income || 0);

      const totalEarned = roiIncome + directIncome + levelIncome;
      const maxReturn = deposit * getCeilingMultiplier(plan);
      const cappedEarned = Math.min(totalEarned, maxReturn);

      return {
        ...plan,
        total_earned: totalEarned,
        max_return: maxReturn,
        progress: maxReturn > 0 ? ((cappedEarned / maxReturn) * 100).toFixed(2) : "0.00",
        extra_earned: Math.max(0, totalEarned - maxReturn),
        status: totalEarned >= maxReturn ? "completed" : "active",
      };
    });

    res.json(data);
  } catch (err) {
    console.error("getUserPlans error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ADMIN ALL PURCHASED PLANS */
export const getAllUserPlans = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        up.id,
        u.name || ' ' || COALESCE(u.lastname, '') AS user,
        p.name AS plan_name,
        u.user_code,
        up.amount,
        ROUND((up.amount * COALESCE(CAST(REGEXP_REPLACE(p.roi, '[^0-9.]', '', 'g') AS NUMERIC),0)) / 100, 2) AS daily_roi,
        up.status,
        up.created_at
      FROM user_plans up
JOIN users u ON u.id = up.user_id
JOIN plans p ON p.id = up.plan_id
WHERE up.status <> 'pending'
ORDER BY up.id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ADMIN PLAN REQUESTS */
export const getPendingUserPlanRequests = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        up.id,
        u.name || ' ' || COALESCE(u.lastname, '') AS user,
        u.user_code,
        p.name AS plan_name,
        up.amount,
        up.status,
        up.created_at
      FROM user_plans up
      JOIN users u ON u.id = up.user_id
      JOIN plans p ON p.id = up.plan_id
      WHERE up.status = 'pending'
      ORDER BY up.id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("getPendingUserPlanRequests error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* APPROVE PLAN REQUEST */
export const approveUserPlanRequest = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("BEGIN");

    const requestRes = await pool.query(
  `
  SELECT up.*
  FROM user_plans up
  WHERE up.id = $1
  FOR UPDATE
  `,
  [id]
);

    const request = requestRes.rows[0];

    if (!request) {
      await pool.query("ROLLBACK");
      return res.status(404).json({ message: "Request not found" });
    }

    if (String(request.status).toLowerCase() !== "pending") {
      await pool.query("ROLLBACK");
      return res.status(400).json({ message: "Request is not pending" });
    }

    const updateRes = await pool.query(
      `UPDATE user_plans
       SET status = 'active'
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [id]
    );

    if (!updateRes.rows.length) {
      await pool.query("ROLLBACK");
      return res.status(400).json({ message: "Request could not be approved" });
    }

    const userId = request.user_id;
    const numericAmount = Number(request.amount || 0);

    const currentUserCode = await getUserCode(userId);

    const userRes = await pool.query(
      "SELECT referred_by FROM users WHERE id = $1",
      [userId]
    );

    const directParentCode = userRes.rows[0]?.referred_by;
    const directParentId = await resolveUserId(directParentCode);

    try {
  if (directParentId) {
    await insertEarning({
      receiverUserId: directParentId,
      receiverUserCode: directParentCode,
      fromUserId: userId,
      fromUserCode: currentUserCode,
      sourceUserPlanId: request.id,
      amount: numericAmount * 0.05,
      percentage: 5,
      level: 0,
      incomeType: "direct",
    });
  }

  // 🔥 SAFE LEVEL INCOME
  try {
    await creditLevelIncome({
      buyerId: userId,
      planAmount: numericAmount,
      userPlanId: request.id,
      creditedUserPlanId: request.id,
    });
  } catch (err) {
    console.log("Level income skipped:", err.message);
  }

} catch (err) {
  console.log("Referral skipped:", err.message);
}

    await pool.query("COMMIT");

    res.json({
      message: "Request approved successfully",
      plan: updateRes.rows[0],
    });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("approveUserPlanRequest error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getROIHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT 
        r.id,
        u.name AS to_user,
        u.user_code AS to_id,
        'Admin' AS from_user,
        'SYSTEM' AS from_id,
        r.amount AS amount,
        r.created_at
      FROM roi_transactions r
      JOIN users u ON u.id = r.user_id
      WHERE r.user_id = $1
      ORDER BY r.id DESC
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("ROI history error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getAllROI = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        r.id,
        u.name || ' ' || COALESCE(u.lastname, '') AS to_user,
        u.user_code AS to_id,
        'Admin' AS from_user,
        'SYSTEM' AS from_id,
        r.amount AS amount,
        r.created_at
      FROM roi_transactions r
      JOIN users u ON u.id = r.user_id
      ORDER BY r.id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("getAllROI error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getMyTotalROI = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT COALESCE(SUM(amount),0) AS total_roi
      FROM roi_transactions
      WHERE user_id = $1
    `, [userId]);

    res.json({
      roi: Number(result.rows[0].total_roi)
    });

  } catch (err) {
    console.error("getMyTotalROI error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getMyWallet = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT 
        COALESCE(roi.total,0) AS roi,
        COALESCE(direct.total,0) AS direct,
        COALESCE(level.total,0) AS level

      FROM users u

      LEFT JOIN (
        SELECT user_id, SUM(amount) AS total
        FROM roi_transactions
        GROUP BY user_id
      ) roi ON roi.user_id = u.id

      LEFT JOIN (
        SELECT user_id, SUM(amount) AS total
        FROM level_income
        WHERE income_type IN ('direct','plan_direct')
        GROUP BY user_id
      ) direct ON direct.user_id = u.id

      LEFT JOIN (
        SELECT user_id, SUM(amount) AS total
        FROM level_income
        WHERE income_type = 'level'
        GROUP BY user_id
      ) level ON level.user_id = u.id

      WHERE u.id = $1
    `, [userId]);

    const row = result.rows[0];

    res.json({
      roi: Number(row.roi),
      direct: Number(row.direct),
      level: Number(row.level),
      total: Number(row.roi) + Number(row.direct) + Number(row.level)
    });

  } catch (err) {
    console.error("getMyWallet error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Deposit
export const getUserDeposits = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ logged-in user

    const result = await pool.query(`
      SELECT 
        up.id,
        u.name AS from_user,
        u.user_code AS from_id,
        p.name AS plan_name,
        up.amount,
        up.created_at
      FROM user_plans up
      JOIN users u ON u.id = up.user_id
      JOIN plans p ON p.id = up.plan_id
      WHERE up.user_id = $1   -- ✅ IMPORTANT FILTER
      ORDER BY up.id DESC
    `, [userId]);

    res.json(result.rows);

  } catch (err) {
    console.error("getUserDeposits error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getAllTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    // ✅ ROI TRANSACTIONS
    const roi = await pool.query(`
      SELECT 
        r.id,
        'Admin' AS from_user,
        'SYSTEM' AS from_id,
        u.name AS to_user,
        u.user_code AS to_id,
        'Daily ROI Income' AS type,
        r.amount AS amount,
        r.created_at
      FROM roi_transactions r
      JOIN users u ON u.id = r.user_id
      WHERE r.user_id = $1
    `, [userId]);

    // ✅ DEPOSITS
    const deposits = await pool.query(`
      SELECT 
        up.id,
        u.name AS from_user,
        u.user_code AS from_id,
        'Admin' AS to_user,
        'SYSTEM' AS to_id,
        'Deposit' AS type,
        up.amount,
        up.created_at
      FROM user_plans up
      JOIN users u ON u.id = up.user_id
      WHERE up.user_id = $1
    `, [userId]);

    // ✅ WITHDRAWALS
    const withdraws = await pool.query(`
      SELECT 
        w.id,
        u.name AS from_user,
        u.user_code AS from_id,
        'Admin' AS to_user,
        'SYSTEM' AS to_id,
        'Withdraw' AS type,
        w.amount,
        w.created_at
      FROM withdrawals w
      JOIN users u ON u.id = w.user_id
      WHERE w.user_id = $1
    `, [userId]);

    // ✅ MERGE ALL
    const all = [
      ...roi.rows,
      ...deposits.rows,
      ...withdraws.rows
    ];

    // ✅ SORT BY DATE DESC
    all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(all);

  } catch (err) {
    console.error("getAllTransactions error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getAllTransactionsAdmin = async (req, res) => {
  try {

    // ✅ ROI
    const roi = await pool.query(`
      SELECT 
        r.id,
        'Admin' AS from_user,
        'SYSTEM' AS from_id,
        u.name AS to_user,
        u.user_code AS to_id,
        'ROI Income' AS type,
        r.amount AS amount,
        r.created_at
      FROM roi_transactions r
      JOIN users u ON u.id = r.user_id
    `);

    // ✅ DEPOSIT
    const deposit = await pool.query(`
      SELECT 
        up.id,
        u.name AS from_user,
        u.user_code AS from_id,
        'Admin' AS to_user,
        'SYSTEM' AS to_id,
        'Deposit' AS type,
        up.amount,
        up.created_at
      FROM user_plans up
      JOIN users u ON u.id = up.user_id
    `);

    // ✅ WITHDRAW
    const withdraw = await pool.query(`
      SELECT 
        w.id,
        u.name AS from_user,
        u.user_code AS from_id,
        'Admin' AS to_user,
        'SYSTEM' AS to_id,
        'Withdraw' AS type,
        w.amount,
        w.created_at
      FROM withdrawals w
      JOIN users u ON u.id = w.user_id
    `);

    // ✅ MERGE
    const all = [
      ...roi.rows,
      ...deposit.rows,
      ...withdraw.rows
    ];

    // ✅ SORT
    all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(all);

  } catch (err) {
    console.error("Admin TX error:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE USER PLAN
export const deleteUserPlan = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("BEGIN");

    await pool.query(
      "DELETE FROM roi_transactions WHERE user_plan_id = $1",
      [id]
    );

    await pool.query(
      "DELETE FROM user_plans WHERE id = $1",
      [id]
    );

    await pool.query("COMMIT");

    res.json({ message: "Plan deleted successfully" });
  } catch (err) {
    await pool.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  }
};

// UPDATE STATUS (ACTIVE / INACTIVE)
export const updateUserPlanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await pool.query(
      "UPDATE user_plans SET status = $1 WHERE id = $2",
      [status.toLowerCase(), id]
    );

    res.json({ message: "Status updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};