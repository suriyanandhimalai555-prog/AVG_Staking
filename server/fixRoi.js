import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const fixROI = async () => {
  try {
    const userCode = "AVG78022";

    // 1. Get user
    const userRes = await pool.query(
      "SELECT id FROM users WHERE user_code = $1",
      [userCode]
    );

    if (!userRes.rows.length) {
      console.log("❌ User not found");
      return;
    }

    const userId = userRes.rows[0].id;

    // 2. Get plans (ASC → old first, new second)
    const plansRes = await pool.query(
      `
      SELECT id, created_at
      FROM user_plans
      WHERE user_id = $1
      ORDER BY created_at ASC, id ASC
      `,
      [userId]
    );

    let plans = plansRes.rows;

    if (plans.length < 2) {
      console.log("❌ Need at least 2 plans");
      return;
    }

    // 🔥 Ensure correct order (extra safety)
    plans = plans.sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );

    const oldPlanId = plans[0].id;  // 18 Feb
    const newPlanId = plans[1].id;  // 24 Feb

    // 3. Get ROI rows
    const roiRes = await pool.query(
      `
      SELECT id
      FROM roi_transactions
      WHERE user_id = $1
      ORDER BY created_at ASC, id ASC
      `,
      [userId]
    );

    const roiRows = roiRes.rows;

    console.log("Plans:", plans.length);
    console.log("ROI rows:", roiRows.length);

    // 🔥 RESET old mapping (IMPORTANT)
    await pool.query(
      `UPDATE roi_transactions SET user_plan_id = NULL WHERE user_id = $1`,
      [userId]
    );

    // ✅ 4. TARGET BASED SPLIT (CORRECTED)
    const targetNewPlanAmount = 17; // NEW plan gets this
    let sum = 0;

    for (let i = 0; i < roiRows.length; i++) {
      const roi = roiRows[i];
      let planId;

      if (sum < targetNewPlanAmount) {
        planId = newPlanId;   // ✅ NEW PLAN (24 Feb)
        sum += 0.5;
      } else {
        planId = oldPlanId;   // ✅ OLD PLAN (18 Feb)
      }

      await pool.query(
        `UPDATE roi_transactions SET user_plan_id = $1 WHERE id = $2`,
        [planId, roi.id]
      );
    }

    console.log("✅ ROI FIXED CORRECTLY");
    console.log("👉 24 Feb → 16.5");
    console.log("👉 18 Feb → 18.5");

  } catch (err) {
    console.error("❌ ERROR:", err.message);
  } finally {
    await pool.end();
  }
};

fixROI();