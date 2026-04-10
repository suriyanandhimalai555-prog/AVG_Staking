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
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  return str.length ? str : null;
};

/* NUMBER */
const parseNumber = (val) => {
  if (!val) return 0;
  return parseFloat(String(val).replace(/[^\d.]/g, "")) || 0;
};

/* ✅ STRONG DATE PARSER */
const parseDate = (val) => {
  if (!val) return new Date();

  try {
    // Excel serial number
    if (typeof val === "number") {
      return new Date((val - 25569) * 86400 * 1000);
    }

    const formats = [
      "DD/MM/YYYY, h:mm:ss a",
      "D/M/YYYY, h:mm:ss a",
      "DD/MM/YYYY h:mm:ss a",
      "D/M/YYYY h:mm:ss a",
      "YYYY-MM-DD",
      "DD-MM-YYYY",
      "DD-MM-YYYY HH:mm:ss",
    ];

    const m = moment(val, formats, true);

    if (!m.isValid()) {
      console.log("⚠️ Invalid date:", val);
      return new Date(); // fallback
    }

    return m.toDate();
  } catch (err) {
    console.log("❌ Date error:", val);
    return new Date();
  }
};

/* USER */
const findUserIdByCode = async (client, userCode) => {
  const res = await client.query(
    `SELECT id FROM users WHERE user_code = $1 LIMIT 1`,
    [userCode]
  );
  return res.rows[0]?.id || null;
};

/* PLAN */
const findLatestPlanId = async (client, userId, createdAt) => {
  if (!userId) return null;

  // fallback if date invalid
  if (!createdAt || isNaN(createdAt.getTime())) {
    const fallback = await client.query(
      `SELECT id FROM user_plans
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );
    return fallback.rows[0]?.id || null;
  }

  const res = await client.query(
    `SELECT id FROM user_plans
     WHERE user_id = $1
     AND created_at <= $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId, createdAt]
  );

  if (res.rows[0]) return res.rows[0].id;

  // fallback if no match
  const fallback = await client.query(
    `SELECT id FROM user_plans
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

  return fallback.rows[0]?.id || null;
};

const importLevelIncome = async () => {
  const client = await pool.connect();

  try {
    console.log("🚀 Importing income...");
    await client.query("BEGIN");

    const workbook = xlsx.readFile("./levelIncome1.xlsx");
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    let inserted = 0;
    let skipped = 0;

    for (let i = 1; i < data.length; i++) {
      try {
        const row = data[i];

        const toCode = clean(row[0]);
        const fromCode = clean(row[1]);
        const level = Number(row[2]) || 0;
        const amount = parseNumber(row[3]);
        const percentage = parseNumber(row[4]);
        const incomeType = (clean(row[5]) || "").toLowerCase();
        const createdAt = parseDate(row[6]);

        if (!toCode || !fromCode || !incomeType) {
          console.log(`❌ Row ${i}: missing required`);
          skipped++;
          continue;
        }

        if (!["direct", "level"].includes(incomeType)) {
          console.log(`❌ Row ${i}: invalid income_type`);
          skipped++;
          continue;
        }

        const toUserId = await findUserIdByCode(client, toCode);
        const fromUserId = await findUserIdByCode(client, fromCode);

        if (!toUserId || !fromUserId) {
          console.log(`❌ Row ${i}: user not found`);
          skipped++;
          continue;
        }

        const creditedPlan = await findLatestPlanId(client, toUserId, createdAt);
        const sourcePlan = await findLatestPlanId(client, fromUserId, createdAt);

        if (!creditedPlan || !sourcePlan) {
          console.log(`⚠️ Row ${i}: no plan found, skipping`);
          skipped++;
          continue;
        }

        await client.query(
          `INSERT INTO level_income
          (user_id, from_user_id, user_plan_id, credited_user_plan_id,
           level, amount, percentage, income_type, created_at,
           from_user_code, to_user_code)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [
            toUserId,
            fromUserId,
            sourcePlan,
            creditedPlan,
            level,
            amount,
            percentage,
            incomeType,
            createdAt,
            fromCode,
            toCode,
          ]
        );

        inserted++;
        console.log(`✅ Row ${i}: ${fromCode} → ${toCode}`);

      } catch (err) {
        console.log(`❌ Row ${i} error:`, err.message);
        skipped++;
      }
    }

    await client.query("COMMIT");

    console.log("\n🎉 DONE");
    console.log(`✅ Inserted: ${inserted}`);
    console.log(`⚠️ Skipped: ${skipped}`);

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Import failed:", err);
  } finally {
    client.release();
  }
};

importLevelIncome();