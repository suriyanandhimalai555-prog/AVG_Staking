import { pool } from "../config/db.js";

const getActiveLevelConfigs = async (client) => {
  const result = await client.query(`
    SELECT level, percentage
    FROM level_config
    WHERE status = true
    ORDER BY level ASC
  `);

  return result.rows.map((row) => ({
    level: Number(row.level),
    percentage: Number(row.percentage),
  }));
};

const getLevelUnlockRequirement = async (client, level) => {
  if (level <= 1) return 0;

  const result = await client.query(
    `
    SELECT direct_staking
    FROM level_unlock_config
    WHERE level = $1 AND status = true
    LIMIT 1
    `,
    [level]
  );

  return Number(result.rows[0]?.direct_staking || 0);
};

const getUplineUserId = async (client, userId) => {
  const result = await client.query(
    `SELECT referred_by FROM users WHERE id = $1::integer`,
    [userId]
  );

  const ref = result.rows[0]?.referred_by;
  if (!ref) return null;

  const numericRef = Number(ref);
  if (Number.isFinite(numericRef) && String(ref).trim() !== "") {
    return numericRef;
  }

  const parent = await client.query(
    `SELECT id FROM users WHERE user_code = $1 LIMIT 1`,
    [String(ref).trim()]
  );

  return parent.rows[0]?.id ?? null;
};

/**
 * Calculates total active deposits made strictly by direct referrals (Level 1) of the receiver.
 */
const getDirectReferralTotalDeposit = async (client, receiverUserId) => {
  if (!receiverUserId) return 0;

  // 1. Fetch the user's string-based user_code separately
  const userRes = await client.query(
    `SELECT user_code FROM users WHERE id = $1::integer LIMIT 1`,
    [receiverUserId]
  );

  const receiverCode = userRes.rows[0]?.user_code || "";

  // 2. Safely match referred_by against either ID or user_code
  const result = await client.query(
    `
    SELECT COALESCE(SUM(up.amount), 0) AS total
    FROM users u
    JOIN user_plans up ON up.user_id = u.id
    WHERE (
      u.referred_by::text = $1::text 
      OR ($2::text <> '' AND u.referred_by::text = $2::text)
    )
    AND up.status = 'active'
    `,
    [String(receiverUserId), String(receiverCode)]
  );

  return Number(result.rows[0]?.total || 0);
};

export const creditLevelIncome = async ({
  client,
  buyerId,
  planAmount,
  userPlanId,
}) => {
  try {
    const amount = Number(planAmount);

    if (!buyerId || !Number.isFinite(amount) || amount <= 0) {
      throw new Error("Invalid data");
    }

    const levelConfigs = await getActiveLevelConfigs(client);
    if (!levelConfigs.length) return;

    // Build upline chain: buyer -> parent (Level 1) -> grandparent (Level 2) -> ...
    const uplineChain = [];
    let current = buyerId;

    while (true) {
      const parentId = await getUplineUserId(client, current);
      if (!parentId) break;

      if (uplineChain.includes(parentId)) break;
      uplineChain.push(parentId);
      current = parentId;
    }

    for (let i = 0; i < uplineChain.length; i++) {
      const receiverId = uplineChain[i];
      const level = i + 1;

      const config = levelConfigs.find((l) => Number(l.level) === level);
      if (!config) continue;

      // Level 1 = Direct Income (Always eligible)
      if (level > 1) {
        const requiredDirectStaking = await getLevelUnlockRequirement(client, level);

        // Check total active direct deposit of receiver's Level 1 team
        const currentDirectStaking = await getDirectReferralTotalDeposit(client, receiverId);

        // If direct referrals haven't met the required threshold, skip payout
        if (currentDirectStaking < requiredDirectStaking) {
          continue;
        }
      }

      const totalIncome = Number(
        ((amount * Number(config.percentage)) / 100).toFixed(2)
      );

      if (totalIncome <= 0) continue;

      let remainingIncome = totalIncome;

      // Get active plans of the receiver to credit income within ceiling limits
      const plansRes = await client.query(
        `
        SELECT 
          up.id,
          up.amount,
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
        WHERE up.user_id = $1::integer
          AND up.status = 'active'
        ORDER BY up.created_at ASC, up.id ASC
        `,
        [receiverId]
      );

      for (const plan of plansRes.rows) {
        if (remainingIncome <= 0) break;

        const deposit = Number(plan.amount || 0);
        const multiplier = Number(
          (String(plan.ceiling_limit || "2").match(/[\d.]+/) || [2])[0]
        );

        const maxReturn = deposit * multiplier;
        const used =
          Number(plan.roi_income || 0) +
          Number(plan.referral_income || 0);

        const capacity = Math.max(0, maxReturn - used);
        if (capacity <= 0) continue;

        const toInsert = Math.min(capacity, remainingIncome);
        if (toInsert <= 0) continue;

        await client.query(
          `
          INSERT INTO level_income
          (user_id, from_user_id, user_plan_id, credited_user_plan_id, level, amount, percentage, income_type, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'level', NOW())
          `,
          [
            receiverId,
            buyerId,
            userPlanId,
            plan.id,
            level,
            Number(toInsert.toFixed(2)),
            Number(config.percentage),
          ]
        );

        remainingIncome = Number((remainingIncome - toInsert).toFixed(2));
      }
    }
  } catch (err) {
    console.error("LEVEL INCOME ERROR:", err);
    throw err;
  }
};

/* ================= LEVEL CRUD ================= */
export const getLevels = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM level_config ORDER BY level ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getLevels error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const createLevel = async (req, res) => {
  try {
    const { level, percentage } = req.body;

    if (level === undefined || percentage === undefined) {
      return res.status(400).json({ message: "All fields required" });
    }

    const result = await pool.query(
      `INSERT INTO level_config (level, percentage)
       VALUES ($1, $2)
       RETURNING *`,
      [Number(level), Number(percentage)]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("createLevel error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const updateLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const { level, percentage } = req.body;

    const result = await pool.query(
      `UPDATE level_config
       SET level = $1, percentage = $2
       WHERE id = $3
       RETURNING *`,
      [Number(level), Number(percentage), id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("updateLevel error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteLevel = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM level_config WHERE id = $1", [id]);

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("deleteLevel error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const toggleLevelStatus = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `UPDATE level_config SET status = NOT status WHERE id = $1`,
      [id]
    );

    res.json({ message: "Toggled" });
  } catch (err) {
    console.error("toggleLevelStatus error:", err);
    res.status(500).json({ error: err.message });
  }
};