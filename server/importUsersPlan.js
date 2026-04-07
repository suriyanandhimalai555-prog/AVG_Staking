import { Pool } from "pg";
import xlsx from "xlsx";
import dotenv from "dotenv";
import moment from "moment";

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
});

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: {
//     rejectUnauthorized: false,
//   },
// });

// 🔥 CLEAN TEXT
const clean = (val) => {
  if (!val) return null;
  return val.toString().replace(/\s+/g, "").trim();
};

// 🔥 EXTRACT NUMBER FROM "$300"
const parseNumber = (val) => {
  if (!val) return 0;
  const num = String(val).replace(/[^\d.]/g, "");
  return parseFloat(num) || 0;
};

// 🔥 ROBUST DATE PARSER (FIXED BUG)
const parseDate = (val) => {
  if (!val) return new Date();

  try {
    // ✅ Case 1: Excel serial number
    if (typeof val === "number") {
      return new Date((val - 25569) * 86400 * 1000);
    }

    // ✅ Case 2: String formats
    const formats = [
      "DD-MM-YYYY",
      "D-M-YYYY",
      "DD/MM/YYYY",
      "D/M/YYYY",
      "YYYY-MM-DD",
      "DD-MM-YYYY HH:mm:ss",
      "DD/MM/YYYY HH:mm:ss",
    ];

    const m = moment(val, formats, true);

    if (!m.isValid()) {
      console.log("⚠️ Invalid date format:", val);
      return new Date(); // fallback
    }

    return m.toDate();
  } catch (err) {
    console.log("❌ Date parse error:", val);
    return new Date();
  }
};

const importUserPlans = async () => {
  const client = await pool.connect();

  try {
    console.log("🚀 Importing user plans...");
    await client.query("BEGIN");

    const workbook = xlsx.readFile("./userPlan.xlsx");
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    console.log(`📊 Rows: ${data.length}`);

    let inserted = 0;
    let skipped = 0;

    for (let i = 1; i < data.length; i++) {
      try {
        const row = data[i];

        const userCode = clean(row[1]);
        const planId = Number(row[2]);
        const amount = parseNumber(row[3]);
        const dailyROI = parseNumber(row[4]);
        const status = (row[5] || "active").toString().toLowerCase();

        const createdAt = parseDate(row[6]);

        // ❌ VALIDATIONS
        if (!userCode) {
          console.log(`❌ No user_code at row ${i}`);
          skipped++;
          continue;
        }

        if (!planId || !amount) {
          console.log(`❌ Invalid plan/amount at row ${i}`);
          skipped++;
          continue;
        }

        if (isNaN(createdAt.getTime())) {
          console.log(`❌ Invalid date at row ${i}:`, row[6]);
          skipped++;
          continue;
        }

        // 🔍 GET USER ID
        const userRes = await client.query(
          "SELECT id FROM users WHERE user_code = $1",
          [userCode]
        );

        if (!userRes.rows.length) {
          console.log(`❌ User not found: ${userCode}`);
          skipped++;
          continue;
        }

        const userId = userRes.rows[0].id;

        // ✅ INSERT
        await client.query(
          `INSERT INTO user_plans 
          (user_id, plan_id, amount, daily_roi, status, created_at)
          VALUES ($1,$2,$3,$4,$5,$6)`,
          [userId, planId, amount, dailyROI, status, createdAt]
        );

        inserted++;
        console.log(`✅ Inserted: ${userCode}`);

      } catch (rowError) {
        console.log(`❌ Error at row ${i}:`, rowError.message);
        skipped++;
      }
    }

    await client.query("COMMIT");

    console.log("\n🎉 IMPORT COMPLETED");
    console.log(`✅ Inserted: ${inserted}`);
    console.log(`⚠️ Skipped: ${skipped}`);

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("\n❌ Import failed (rolled back)");
    console.error(err);
  } finally {
    client.release();
    process.exit();
  }
};

importUserPlans();