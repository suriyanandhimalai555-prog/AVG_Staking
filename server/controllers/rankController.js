import { pool } from "../config/db.js";

// GET
export const getRanks = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM rank_config ORDER BY target_amount ASC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CREATE
export const createRank = async (req, res) => {
  try {
    const { target_amount, reward } = req.body;

    if (!target_amount || !reward) {
      return res.status(400).json({ message: "All fields required" });
    }

    const result = await pool.query(
      `INSERT INTO rank_config (target_amount, reward)
       VALUES ($1,$2) RETURNING *`,
      [target_amount, reward]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
export const updateRank = async (req, res) => {
  try {
    const { id } = req.params;
    const { target_amount, reward } = req.body;

    await pool.query(
      `UPDATE rank_config
       SET target_amount=$1, reward=$2
       WHERE id=$3`,
      [target_amount, reward, id]
    );

    res.json({ message: "Updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE
export const deleteRank = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM rank_config WHERE id=$1", [id]);

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// TOGGLE
export const toggleRankStatus = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `UPDATE rank_config
       SET status = NOT status
       WHERE id=$1`,
      [id]
    );

    res.json({ message: "Status toggled" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getRanksUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const userRes = await pool.query(
      "SELECT user_code FROM users WHERE id = $1",
      [userId]
    );
    const userCode = userRes.rows[0]?.user_code;

    const rankRes = await pool.query(`
      SELECT id, target_amount, reward
      FROM rank_config
      WHERE status = true
      ORDER BY target_amount ASC
    `);

    const ranks = rankRes.rows;
    if (ranks.length === 0) return res.json([]);

    const directRes = await pool.query(
      `SELECT id, name, lastname, user_code
       FROM users
       WHERE referred_by = $1`,
      [userCode]
    );

    const getBranchBusiness = async (rootId) => {
      const result = await pool.query(
        `
        WITH RECURSIVE branch AS (
          SELECT id, user_code FROM users WHERE id = $1
          UNION ALL
          SELECT u.id, u.user_code
          FROM users u
          JOIN branch b ON u.referred_by = b.user_code
        )
        SELECT COALESCE(SUM(amount),0) AS total
        FROM user_plans
        WHERE user_id IN (SELECT id FROM branch)
      `,
        [rootId]
      );

      return Number(result.rows[0].total || 0);
    };

    const branches = [];

    for (const user of directRes.rows) {
      const business = await getBranchBusiness(user.id);

      branches.push({
        name: `${user.name} ${user.lastname}`,
        business,
      });
    }

    // 🔥 SORT (VERY IMPORTANT)
    branches.sort((a, b) => b.business - a.business);

    const results = [];

    for (const rank of ranks) {
      const milestones = [
        { percent: 40, amount: rank.target_amount * 0.4 },
        { percent: 30, amount: rank.target_amount * 0.3 },
        { percent: 30, amount: rank.target_amount * 0.3 },
      ];

      const timeline = [];

      // 🥇 40% → Top 1
      const firstLeg = branches[0];
      if (firstLeg && firstLeg.business >= milestones[0].amount) {
        timeline.push({
          percent: 40,
          amount: milestones[0].amount,
          achieved: true,
          by: firstLeg.name,
        });
      } else {
        timeline.push({
          percent: 40,
          amount: milestones[0].amount,
          achieved: false,
          by: null,
        });
      }

      // 🥈 30% → Top 2
      const secondLeg = branches[1];
      if (secondLeg && secondLeg.business >= milestones[1].amount) {
        timeline.push({
          percent: 30,
          amount: milestones[1].amount,
          achieved: true,
          by: secondLeg.name,
        });
      } else {
        timeline.push({
          percent: 30,
          amount: milestones[1].amount,
          achieved: false,
          by: null,
        });
      }

      // 🥉 30% → Remaining combined
      const remainingLegs = branches.slice(2);
      const remainingBusiness = remainingLegs.reduce(
        (sum, b) => sum + b.business,
        0
      );

      if (remainingBusiness >= milestones[2].amount) {
        timeline.push({
          percent: 30,
          amount: milestones[2].amount,
          achieved: true,
          by: "Combined Team",
        });
      } else {
        timeline.push({
          percent: 30,
          amount: milestones[2].amount,
          achieved: false,
          by: null,
        });
      }

      const progress = timeline
        .filter((t) => t.achieved)
        .reduce((sum, t) => sum + t.amount, 0);

      const unlocked = progress >= rank.target_amount;

      const rewardRow = await pool.query(
        `SELECT status
         FROM user_rewards
         WHERE user_id=$1 AND reward=$2 AND target_amount=$3
         LIMIT 1`,
        [userId, rank.reward, rank.target_amount]
      );

      const status = rewardRow.rows[0]?.status || "pending";

      results.push({
        reward: rank.reward,
        target_amount: rank.target_amount,
        progress,
        unlocked,
        status,
        timeline,
      });

      if (status !== "approved") break;
    }

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const getAllUsersRewards = async (req, res) => {
  try {
    const rankRes = await pool.query(`
      SELECT id, target_amount, reward
      FROM rank_config
      WHERE status = true
      ORDER BY target_amount ASC
    `);

    const ranks = rankRes.rows;
    if (ranks.length === 0) return res.json([]);

    const usersRes = await pool.query(`
      SELECT id, name, lastname, phone, user_code
      FROM users
      ORDER BY id DESC
    `);

    const getBranchBusiness = async (rootId) => {
      const result = await pool.query(
        `
        WITH RECURSIVE branch AS (
          SELECT id, user_code FROM users WHERE id = $1
          UNION ALL
          SELECT u.id, u.user_code
          FROM users u
          JOIN branch b ON u.referred_by = b.user_code
        )
        SELECT COALESCE(SUM(amount),0) AS total
        FROM user_plans
        WHERE user_id IN (SELECT id FROM branch)
      `,
        [rootId]
      );

      return Number(result.rows[0].total || 0);
    };

    const finalData = [];

    for (const user of usersRes.rows) {
      const directRes = await pool.query(
        `SELECT id, name, lastname, user_code
         FROM users
         WHERE referred_by = $1`,
        [user.user_code]
      );

      const branches = [];

      for (const d of directRes.rows) {
        const business = await getBranchBusiness(d.id);

        branches.push({
          name: `${d.name} ${d.lastname}`,
          business,
        });
      }

      // 🔥 SORT
      branches.sort((a, b) => b.business - a.business);

      for (const rank of ranks) {
        const milestones = [
          { percent: 40, amount: rank.target_amount * 0.4 },
          { percent: 30, amount: rank.target_amount * 0.3 },
          { percent: 30, amount: rank.target_amount * 0.3 },
        ];

        const timeline = [];

        const firstLeg = branches[0];
        if (firstLeg && firstLeg.business >= milestones[0].amount) {
          timeline.push({
            percent: 40,
            amount: milestones[0].amount,
            achieved: true,
            by: firstLeg.name,
          });
        } else {
          timeline.push({ percent: 40, amount: milestones[0].amount, achieved: false, by: null });
        }

        const secondLeg = branches[1];
        if (secondLeg && secondLeg.business >= milestones[1].amount) {
          timeline.push({
            percent: 30,
            amount: milestones[1].amount,
            achieved: true,
            by: secondLeg.name,
          });
        } else {
          timeline.push({ percent: 30, amount: milestones[1].amount, achieved: false, by: null });
        }

        const remainingLegs = branches.slice(2);
        const remainingBusiness = remainingLegs.reduce(
          (sum, b) => sum + b.business,
          0
        );

        if (remainingBusiness >= milestones[2].amount) {
          timeline.push({
            percent: 30,
            amount: milestones[2].amount,
            achieved: true,
            by: "Combined Team",
          });
        } else {
          timeline.push({ percent: 30, amount: milestones[2].amount, achieved: false, by: null });
        }

        const progress = timeline
          .filter((t) => t.achieved)
          .reduce((sum, t) => sum + t.amount, 0);

        const unlocked = progress >= rank.target_amount;

        const rewardRow = await pool.query(
          `SELECT status
           FROM user_rewards
           WHERE user_id=$1 AND reward=$2 AND target_amount=$3
           LIMIT 1`,
          [user.id, rank.reward, rank.target_amount]
        );

        const status = rewardRow.rows[0]?.status || "pending";

        finalData.push({
          userId: user.id,
          username: `${user.name} ${user.lastname}`,
          phone: user.phone,
          reward: rank.reward,
          target_amount: rank.target_amount,
          progress,
          unlocked,
          status,
          timeline,
        });

        if (status !== "approved") break;
      }
    }

    res.json(finalData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const updateRewardStatus = async (req, res) => {
  try {
    const { userId, reward, target_amount, status, progress } = req.body;

    if (!userId || !reward || !target_amount || !status) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const existing = await pool.query(
      `SELECT id FROM user_rewards
       WHERE user_id=$1 AND reward=$2 AND target_amount=$3`,
      [userId, reward, target_amount]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE user_rewards
         SET status=$1, progress=$2
         WHERE user_id=$3 AND reward=$4 AND target_amount=$5`,
        [status, progress || 0, userId, reward, target_amount]
      );
    } else {
      await pool.query(
        `INSERT INTO user_rewards
        (user_id, reward, target_amount, status, progress)
        VALUES ($1,$2,$3,$4,$5)`,
        [userId, reward, target_amount, status, progress || 0]
      );
    }

    res.json({ message: "Status updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const formatDate = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
};

const buildClaimMonths = (startDate, monthsCount, monthlyAmount) => {
  const months = [];
  const base = new Date(startDate);

  for (let i = 0; i < monthsCount; i++) {
    const monthDate = new Date(base);
    monthDate.setMonth(base.getMonth() + i);

    months.push({
      month_no: i + 1,
      due_date: formatDate(monthDate),
      amount: Number(monthlyAmount || 0),
      transaction_id: null,
      status: "pending",
    });
  }

  return months;
};

const attachMonthsToClaims = async (rows) => {
  for (const row of rows) {
    const monthsRes = await pool.query(
      `
      SELECT id, month_no, due_date, amount, transaction_id, status
      FROM reward_claim_months
      WHERE claim_id = $1
      ORDER BY month_no ASC
      `,
      [row.claim_id]
    );

    row.claim_months = monthsRes.rows.map((m) => ({
      ...m,
      amount: Number(m.amount || 0),
    }));
  }

  return rows;
};

export const getRewardClaimsAdmin = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
  COALESCE(rc.id, 0) AS claim_id,
  ur.user_id,
  u.name,
  u.lastname,
  u.phone,
  u.user_code,
  ur.reward,
  ur.target_amount,
  rc.monthly_amount,
  rc.months_count,
  rc.start_date,
  rc.status AS claim_status,
  ur.status AS reward_status,
  ur.progress
FROM user_rewards ur
INNER JOIN users u ON u.id = ur.user_id
LEFT JOIN reward_claims rc
  ON rc.user_id = ur.user_id
 AND rc.reward = ur.reward
 AND rc.target_amount = ur.target_amount
WHERE ur.status = 'approved'
ORDER BY ur.user_id DESC
    `);

    const rows = await attachMonthsToClaims(result.rows);

    const formatted = rows.map((row) => ({
      ...row,
      monthly_amount: Number(row.monthly_amount || 0),
      target_amount: Number(row.target_amount || 0),
      months_count: Number(row.months_count || 12),
      progress: Number(row.progress || 0),
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const saveRewardClaim = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      userId,
      reward,
      target_amount,
      monthly_amount,
      months_count = 12,
      start_date,
    } = req.body;

    if (!userId || !reward || !target_amount || !monthly_amount) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const claimStartDate = start_date || new Date().toISOString().slice(0, 10);

    await client.query("BEGIN");

    const result = await client.query(
      `
      INSERT INTO reward_claims
        (user_id, reward, target_amount, monthly_amount, months_count, start_date, status, updated_at)
      VALUES
        ($1,$2,$3,$4,$5,$6,'active',NOW())
      ON CONFLICT (user_id, reward, target_amount)
      DO UPDATE SET
        monthly_amount = EXCLUDED.monthly_amount,
        months_count = EXCLUDED.months_count,
        start_date = EXCLUDED.start_date,
        status = 'active',
        updated_at = NOW()
      RETURNING *
      `,
      [
        userId,
        reward,
        target_amount,
        monthly_amount,
        months_count,
        claimStartDate,
      ]
    );

    const claim = result.rows[0];

    await client.query(
      `DELETE FROM reward_claim_months WHERE claim_id = $1`,
      [claim.id]
    );

    const months = buildClaimMonths(claimStartDate, months_count, monthly_amount);

    for (const m of months) {
      await client.query(
        `
        INSERT INTO reward_claim_months
          (claim_id, month_no, due_date, amount, transaction_id, status, updated_at)
        VALUES
          ($1,$2,$3,$4,NULL,'pending',NOW())
        `,
        [claim.id, m.month_no, m.due_date, m.amount]
      );
    }

    await client.query("COMMIT");

    res.json({
      message: "Reward claim saved",
      claim: {
        ...claim,
        monthly_amount: Number(claim.monthly_amount),
        target_amount: Number(claim.target_amount),
        months_count: Number(claim.months_count),
        claim_months: months,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const getUserRewardClaims = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        rc.id AS claim_id,
        rc.user_id,
        rc.reward,
        rc.target_amount,
        rc.monthly_amount,
        rc.months_count,
        rc.start_date,
        rc.status AS claim_status,
        rc.created_at,
        rc.updated_at,
        ur.status AS reward_status,
        ur.progress
      FROM reward_claims rc
      LEFT JOIN user_rewards ur
        ON ur.user_id = rc.user_id
       AND ur.reward = rc.reward
       AND ur.target_amount = rc.target_amount
      WHERE rc.user_id = $1
      ORDER BY rc.created_at DESC
      `,
      [userId]
    );

    const rows = await attachMonthsToClaims(result.rows);

    const formatted = rows.map((row) => ({
      ...row,
      monthly_amount: Number(row.monthly_amount || 0),
      target_amount: Number(row.target_amount || 0),
      months_count: Number(row.months_count || 12),
      progress: Number(row.progress || 0),
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const updateClaimMonthStatus = async (req, res) => {
  try {
    const { monthId, transaction_id, status } = req.body;

    if (!monthId || !status) {
      return res.status(400).json({ message: "Missing fields" });
    }

    await pool.query(
      `
      UPDATE reward_claim_months
      SET transaction_id = $1,
          status = $2,
          updated_at = NOW()
      WHERE id = $3
      `,
      [transaction_id || null, status, monthId]
    );

    res.json({ message: "Month status updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};