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
    `SELECT referred_by FROM users WHERE id = $1`,
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

const getReceiverPlanId = async (client, receiverUserId) => {
  let result = await client.query(
    `
    SELECT id
    FROM user_plans
    WHERE user_id = $1 AND status = 'active'
    ORDER BY id DESC
    LIMIT 1
    `,
    [receiverUserId]
  );

  if (!result.rows.length) {
    result = await client.query(
      `
      SELECT id
      FROM user_plans
      WHERE user_id = $1
      ORDER BY id DESC
      LIMIT 1
      `,
      [receiverUserId]
    );
  }

  return result.rows[0]?.id ?? null;
};

/**
 * Exact-depth business total.
 * depth = 1 => direct referrals
 * depth = 2 => referrals of direct referrals
 * depth = 3 => referrals of level-2 users
 *
 * excludeUserPlanId is used only to ignore the CURRENT purchase record,
 * so the purchase that crosses the threshold does not get paid.
 */
const getExactDepthBusinessTotal = async (
  client,
  rootUserId,
  depth,
  excludeUserPlanId = null
) => {
  if (!rootUserId || !depth || depth < 1) return 0;

  const rootRes = await client.query(
    `
    SELECT id, user_code
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [rootUserId]
  );

  const root = rootRes.rows[0];
  if (!root) return 0;

  const params = [String(root.id), String(root.user_code), Number(depth)];
  let excludeSql = "";

  if (excludeUserPlanId !== null && excludeUserPlanId !== undefined) {
    excludeSql = `AND up.id <> $4`;
    params.push(excludeUserPlanId);
  }

  const result = await client.query(
    `
    WITH RECURSIVE downline AS (
      SELECT
        u.id,
        u.user_code,
        1 AS depth
      FROM users u
      WHERE u.referred_by::text = $1
         OR u.referred_by::text = $2

      UNION ALL

      SELECT
        c.id,
        c.user_code,
        d.depth + 1 AS depth
      FROM users c
      JOIN downline d
        ON c.referred_by::text = d.id::text
        OR c.referred_by::text = d.user_code
      WHERE d.depth < $3
    )
    SELECT COALESCE(SUM(up.amount), 0) AS total
    FROM downline d
    JOIN user_plans up ON up.user_id = d.id
    WHERE d.depth = $3
    ${excludeSql}
    `,
    params
  );

  return Number(result.rows[0]?.total || 0);
};

const hasLevelUnlocked = async (client, userId, level) => {
  if (level <= 1) return true;

  const result = await client.query(
    `
    SELECT 1
    FROM user_level_unlocks
    WHERE user_id = $1 AND level = $2
    LIMIT 1
    `,
    [userId, level]
  );

  return result.rowCount > 0;
};

const syncUnlockedLevels = async (client, receiverUserId) => {
  const levelConfigs = await getActiveLevelConfigs(client);

  for (const config of levelConfigs) {
    if (config.level <= 1) continue;

    const required = await getLevelUnlockRequirement(client, config.level);
    if (!required) continue;

    const businessTotal = await getExactDepthBusinessTotal(
      client,
      receiverUserId,
      config.level
    );

    if (businessTotal >= required) {
      await client.query(
        `
        INSERT INTO user_level_unlocks (user_id, level, unlocked_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id, level) DO NOTHING
        `,
        [receiverUserId, config.level]
      );
    }
  }
};

export const creditLevelIncome = async ({
  buyerId,
  planAmount,
  userPlanId,
}) => {
  const client = await pool.connect();

  try {
    const amount = Number(planAmount);

    if (!buyerId || !Number.isFinite(amount) || amount <= 0) {
      throw new Error("Invalid data");
    }

    await client.query("BEGIN");

    const levelConfigs = await getActiveLevelConfigs(client);

    if (!levelConfigs.length) {
      await client.query("COMMIT");
      return;
    }

    // Build upline chain: buyer -> parent -> grandparent -> ...
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

      const receiverPlanId = await getReceiverPlanId(client, receiverId);
      if (!receiverPlanId) continue;

      let payableAmount = amount;

      if (level > 1) {
        const required = await getLevelUnlockRequirement(client, level);
        if (!required) continue;

        const qualifyingRootId = uplineChain[i - 1];
        if (!qualifyingRootId) continue;

        // IMPORTANT:
        // For Level 2, use depth 1 business of the branch below the receiver.
        // For Level 3, use depth 2 business, and so on.
        const depthToCheck = Math.max(1, level - 1);

        const businessBefore = await getExactDepthBusinessTotal(
          client,
          qualifyingRootId,
          depthToCheck,
          userPlanId
        );

        const businessAfter = businessBefore + amount;

        // Not unlocked yet
        if (businessAfter <= required) {
          continue;
        }

        // Crossing case:
        // only the amount above the unlock threshold should count
        if (businessBefore < required) {
          payableAmount = businessAfter - required;
        }
      }

      if (payableAmount <= 0) continue;

      const percentage = Number(config.percentage);
      const incomeAmount = Number(((payableAmount * percentage) / 100).toFixed(2));

      if (incomeAmount <= 0) continue;

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
          receiverPlanId,
          level,
          incomeAmount,
          percentage,
        ]
      );
    }

    // Update unlock rows after the income calculation
    for (let i = 0; i < uplineChain.length; i++) {
      const receiverId = uplineChain[i];
      const level = i + 1;
      if (level <= 1) continue;

      const required = await getLevelUnlockRequirement(client, level);
      if (!required) continue;

      const qualifyingRootId = uplineChain[i - 1];
      if (!qualifyingRootId) continue;

      const depthToCheck = Math.max(1, level - 1);

      const businessTotal = await getExactDepthBusinessTotal(
        client,
        qualifyingRootId,
        depthToCheck
      );

      if (businessTotal >= required) {
        await client.query(
          `
          INSERT INTO user_level_unlocks (user_id, level, unlocked_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (user_id, level) DO NOTHING
          `,
          [receiverId, level]
        );
      }
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("LEVEL INCOME ERROR:", err);
    throw err;
  } finally {
    client.release();
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