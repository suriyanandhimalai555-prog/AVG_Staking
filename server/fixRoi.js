import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

const fixROI = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const userCode = "AVG60570";

    // 🎯 TARGETS (latest → oldest)
    const targets = [0.5, 17];

    // 1. Get user
    const userRes = await client.query(
      `SELECT id FROM users WHERE user_code = $1`,
      [userCode]
    );
    const userId = userRes.rows[0].id;

    // 2. Plans (latest first)
    const plansRes = await client.query(
      `SELECT id FROM user_plans WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    const plans = plansRes.rows;

    // 3. ROI rows (latest first)
    const roiRes = await client.query(
      `SELECT id, amount, created_at 
       FROM roi_transactions 
       WHERE user_id = $1 
       ORDER BY created_at DESC, id DESC`,
      [userId]
    );

    const roiRows = roiRes.rows;

    // ❌ DELETE OLD (important)
    await client.query(
      `DELETE FROM roi_transactions WHERE user_id = $1`,
      [userId]
    );

    let planIndex = 0;
    let accumulated = 0;

    for (let i = 0; i < roiRows.length; i++) {
      if (!plans[planIndex]) break;

      let amount = parseFloat(roiRows[i].amount);
      const createdAt = roiRows[i].created_at;

      while (amount > 0 && planIndex < plans.length) {
        const remaining = targets[planIndex] - accumulated;

        if (remaining <= 0) {
          planIndex++;
          accumulated = 0;
          continue;
        }

        if (amount <= remaining) {
          // ✅ full assign
          await client.query(
            `INSERT INTO roi_transactions 
             (user_id, amount, user_plan_id, created_at)
             VALUES ($1, $2, $3, $4)`,
            [userId, amount, plans[planIndex].id, createdAt]
          );

          accumulated += amount;
          amount = 0;
        } else {
          // 🔥 SPLIT
          await client.query(
            `INSERT INTO roi_transactions 
             (user_id, amount, user_plan_id, created_at)
             VALUES ($1, $2, $3, $4)`,
            [userId, remaining, plans[planIndex].id, createdAt]
          );

          amount -= remaining;
          planIndex++;
          accumulated = 0;
        }
      }
    }

    await client.query("COMMIT");

    console.log("✅ PERFECT SPLIT WITH EXACT VALUES DONE");

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ ERROR:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
};

fixROI();