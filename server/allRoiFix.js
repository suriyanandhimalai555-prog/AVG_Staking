import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const fixROIProperly = async () => {
  try {
    console.log("🚀 Fixing ROI using real logic...");

    const usersRes = await pool.query(`SELECT id FROM users`);

    for (const user of usersRes.rows) {
      const userId = user.id;

      const plansRes = await pool.query(
        `
        SELECT id, created_at, amount
        FROM user_plans
        WHERE user_id = $1
        ORDER BY created_at ASC
        `,
        [userId]
      );

      const roiRes = await pool.query(
        `
        SELECT id, created_at, amount
        FROM roi_transactions
        WHERE user_id = $1
        ORDER BY created_at ASC
        `,
        [userId]
      );

      const plans = plansRes.rows;
      const roiRows = roiRes.rows;

      if (plans.length === 0 || roiRows.length === 0) continue;

      // reset
      await pool.query(
        `UPDATE roi_transactions SET user_plan_id = NULL WHERE user_id = $1`,
        [userId]
      );

      for (const plan of plans) {
        const planStart = new Date(plan.created_at);
        let earned = 0;
        const maxReturn = plan.amount * 2;

        for (const roi of roiRows) {
          const roiTime = new Date(roi.created_at);

          if (roiTime < planStart) continue;

          if (earned >= maxReturn) break;

          // assign only if not already assigned
          const check = await pool.query(
            `SELECT user_plan_id FROM roi_transactions WHERE id=$1`,
            [roi.id]
          );

          if (check.rows[0].user_plan_id) continue;

          await pool.query(
            `UPDATE roi_transactions SET user_plan_id=$1 WHERE id=$2`,
            [plan.id, roi.id]
          );

          earned += Number(roi.amount);
        }
      }

      console.log(`✅ User ${userId} fixed`);
    }

    console.log("🔥 ROI FIXED CLOSE TO REAL LOGIC");
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
};

fixROIProperly();