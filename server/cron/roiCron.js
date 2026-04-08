import cron from "node-cron";
import { pool } from "../config/db.js";

// ✅ Runs Monday - Friday at 11:50 PM
cron.schedule("50 23 * * 1-5", async () => {
  console.log("Running ROI cron at 11:50 PM...");

  try {
    const plans = await pool.query(`
      SELECT 
        up.id,
        up.user_id,
        up.plan_id,
        up.amount,
        p.roi
      FROM user_plans up
      JOIN plans p ON p.id = up.plan_id
      WHERE up.status = 'active'
    `);

    for (const plan of plans.rows) {
      const amount = Number(plan.amount || 0);
      const roiPercent = parseFloat(plan.roi) || 0;
      const dailyROI = (amount * roiPercent) / 100;

      if (dailyROI <= 0) continue;

      const maxReturn = amount * 2;

      const totalRes = await pool.query(
        `
        SELECT 
          COALESCE(r.total,0) AS roi,
          COALESCE(d.total,0) AS direct,
          COALESCE(l.total,0) AS level
        FROM user_plans up

        LEFT JOIN (
          SELECT user_plan_id, SUM(amount) AS total
          FROM roi_transactions
          GROUP BY user_plan_id
        ) r ON r.user_plan_id = up.id

        LEFT JOIN (
          SELECT credited_user_plan_id, SUM(amount) AS total
          FROM level_income
          WHERE income_type IN ('direct','plan_direct')
          GROUP BY credited_user_plan_id
        ) d ON d.credited_user_plan_id = up.id

        LEFT JOIN (
          SELECT credited_user_plan_id, SUM(amount) AS total
          FROM level_income
          WHERE income_type = 'level'
          GROUP BY credited_user_plan_id
        ) l ON l.credited_user_plan_id = up.id

        WHERE up.id = $1
        `,
        [plan.id]
      );

      const row = totalRes.rows[0];

      const currentTotal =
        Number(row.roi) +
        Number(row.direct) +
        Number(row.level);

      if (currentTotal >= maxReturn) {
        await pool.query(
          `UPDATE user_plans SET status='completed' WHERE id=$1`,
          [plan.id]
        );
        continue;
      }

      let todayROI = dailyROI;

      // ✅ FINAL DAY
      if (currentTotal + todayROI >= maxReturn) {
        todayROI = maxReturn - currentTotal;

        if (todayROI <= 0) {
          await pool.query(
            `UPDATE user_plans SET status='completed' WHERE id=$1`,
            [plan.id]
          );
          continue;
        }

        // ✅ FIX APPLIED HERE
        await pool.query(
          `
          INSERT INTO roi_transactions
          (user_id, plan_id, user_plan_id, amount, total_earned, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
          `,
          [
            plan.user_id,
            plan.plan_id,
            plan.id,
            todayROI,
            maxReturn,
          ]
        );

        await pool.query(
          `UPDATE user_plans SET status='completed' WHERE id=$1`,
          [plan.id]
        );

        continue;
      }

      // ✅ NORMAL DAILY ROI
      await pool.query(
        `
        INSERT INTO roi_transactions
        (user_id, plan_id, user_plan_id, amount, total_earned, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        `,
        [
          plan.user_id,
          plan.plan_id,
          plan.id,
          todayROI,
          currentTotal + todayROI,
        ]
      );
    }

    console.log("ROI cron completed");
  } catch (err) {
    console.error("ROI CRON ERROR:", err);
  }
});