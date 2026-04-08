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
  ssl: {
    rejectUnauthorized: false,
  },
});

/* CLEAN */
const clean = (val) => {
  if (!val) return null;
  return val.toString().trim();
};

/* NUMBER */
const parseNumber = (val) => {
  if (!val) return 0;
  const num = String(val).replace(/[^\d.]/g, "");
  return parseFloat(num) || 0;
};

/* ✅ STRONG DATE PARSER */
const parseDate = (val) => {
  if (!val) return null;

  try {
    // Excel numeric date
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

    if (!m.isValid()) {
      console.log("❌ Invalid date format:", val);
      return null; // ❗ reject instead of fallback
    }

    return m.toDate();
  } catch {
    return null;
  }
};

const importROI = async () => {
  const client = await pool.connect();

  try {
    console.log("🚀 Importing ROI transactions...");
    await client.query("BEGIN");

    const workbook = xlsx.readFile("./roi.xlsx");
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    let inserted = 0;
    let skipped = 0;

    for (let i = 1; i < data.length; i++) {
      try {
        const row = data[i];

        // ✅ CORRECT COLUMN MAPPING
        const userCode = clean(row[0]);
        const planId = Number(row[1]);
        const amount = parseNumber(row[2]);
        const createdAt = parseDate(row[3]); // ✅ FIXED

        const type = "roi";
        const totalEarned = amount;

        /* VALIDATION */
        if (!userCode || !planId || !amount) {
          console.log(`❌ Row ${i}: missing required fields`);
          skipped++;
          continue;
        }

        if (!createdAt) {
          console.log(`❌ Row ${i}: invalid date`);
          skipped++;
          continue;
        }

        /* USER */
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

        /* USER PLAN */
        const planRes = await client.query(
          `SELECT id FROM user_plans 
           WHERE user_id = $1 AND plan_id = $2
           ORDER BY created_at DESC LIMIT 1`,
          [userId, planId]
        );

        if (!planRes.rows.length) {
          console.log(`❌ Row ${i}: no user_plan (${userCode})`);
          skipped++;
          continue;
        }

        const userPlanId = planRes.rows[0].id;

        /* INSERT */
        await client.query(
          `INSERT INTO roi_transactions
          (user_id, plan_id, amount, type, created_at, total_earned, user_plan_id)
          VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            userId,
            planId,
            amount,
            type,
            createdAt,
            totalEarned,
            userPlanId,
          ]
        );

        inserted++;
        console.log(`✅ Row ${i}: ${userCode}`);

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