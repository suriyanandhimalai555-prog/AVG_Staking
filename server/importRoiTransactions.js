import { Pool } from "pg";
import xlsx from "xlsx";
import dotenv from "dotenv";
import moment from "moment";

dotenv.config();

// const pool = new Pool({
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   host: process.env.DB_HOST,
//   port: process.env.DB_PORT,
// });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const clean = (val) => {
  if (val === null || val === undefined || val === "") return null;
  return val.toString().trim();
};

const parseNumber = (val) => {
  if (val === null || val === undefined || val === "") return 0;
  const num = String(val).replace(/[^\d.]/g, "");
  return parseFloat(num) || 0;
};

const parseDate = (val) => {
  if (!val) return null;

  try {
    if (typeof val === "number") {
      return new Date((val - 25569) * 86400 * 1000);
    }

    const formats = [
      "M/D/YYYY, h:mm:ss a",
      "MM/DD/YYYY, h:mm:ss a",
      "D/M/YYYY, h:mm:ss a",
      "DD/MM/YYYY, h:mm:ss a",
      "YYYY-MM-DD HH:mm:ss",
      "DD-MM-YYYY HH:mm:ss",
    ];

    const m = moment(val, formats, true);
    if (!m.isValid()) return null;
    return m.toDate();
  } catch {
    return null;
  }
};

const planCache = new Map();

async function getNextUserPlan(client, userId, planId, amount) {
  const key = `${userId}-${planId}`;

  if (!planCache.has(key)) {
    const plansRes = await client.query(
      `
      SELECT id, amount, created_at
      FROM user_plans
      WHERE user_id = $1 AND plan_id = $2
      ORDER BY created_at ASC, id ASC
      `,
      [userId, planId]
    );

    const usageRes = await client.query(
      `
      SELECT user_plan_id, COALESCE(SUM(amount), 0) AS earned
      FROM roi_transactions
      WHERE user_id = $1 AND plan_id = $2
      GROUP BY user_plan_id
      `,
      [userId, planId]
    );

    const usageMap = new Map(
      usageRes.rows.map((r) => [Number(r.user_plan_id), Number(r.earned)])
    );

    const plans = plansRes.rows.map((p) => ({
      id: Number(p.id),
      cap: Number(p.amount) * 2,   // change this if your real cap rule is different
      earned: usageMap.get(Number(p.id)) || 0,
      createdAt: new Date(p.created_at),
    }));

    planCache.set(key, plans);
  }

  const plans = planCache.get(key);

  // FIFO: oldest plan first
  const target = plans.find((p) => p.earned + amount <= p.cap);

  if (!target) return null;

  target.earned += amount;
  return target.id;
}

const importROI = async () => {
  const client = await pool.connect();

  try {
    console.log("🚀 Importing ROI transactions...");
    await client.query("BEGIN");

    const workbook = xlsx.readFile("./roi1.xlsx");
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    let inserted = 0;
    let skipped = 0;

    for (let i = 1; i < data.length; i++) {
      try {
        const row = data[i];

        const userCode = clean(row[0]);
        const planId = Number(row[1]);
        const amount = parseNumber(row[2]);
        const createdAt = parseDate(row[3]);

        if (!userCode || !planId || !amount || !createdAt) {
          console.log(`❌ Row ${i}: invalid data`);
          skipped++;
          continue;
        }

        const userRes = await client.query(
          "SELECT id FROM users WHERE user_code = $1",
          [userCode]
        );

        if (!userRes.rows.length) {
          console.log(`❌ Row ${i}: user not found (${userCode})`);
          skipped++;
          continue;
        }

        const userId = userRes.rows[0].id;

        const userPlanId = await getNextUserPlan(client, userId, planId, amount);

        if (!userPlanId) {
          console.log(`❌ Row ${i}: no available user_plan for (${userCode}, plan ${planId})`);
          skipped++;
          continue;
        }

        await client.query(
          `
          INSERT INTO roi_transactions
          (user_id, plan_id, amount, type, created_at, total_earned, user_plan_id)
          VALUES ($1,$2,$3,$4,$5,$6,$7)
          `,
          [userId, planId, amount, "roi", createdAt, amount, userPlanId]
        );

        inserted++;
        console.log(`✅ Row ${i}: ${userCode} -> user_plan_id ${userPlanId}`);
      } catch (err) {
        console.log(`❌ Row ${i} error:`, err.message);
        skipped++;
      }
    }

    await client.query("COMMIT");

    console.log("\n🎉 IMPORT COMPLETED");
    console.log(`✅ Inserted: ${inserted}`);
    console.log(`⚠️ Skipped: ${skipped}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Import failed:", err);
  } finally {
    client.release();
  }
};

importROI();