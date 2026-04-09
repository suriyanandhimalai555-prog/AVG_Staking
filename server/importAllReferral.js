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

/* DATE PARSER */
const parseDate = (val) => {
  if (!val) return new Date();

  try {
    if (typeof val === "number") {
      return new Date((val - 25569) * 86400 * 1000);
    }

    const formats = [
      "DD-MM-YYYY",
      "DD/MM/YYYY",
      "YYYY-MM-DD",
      "DD-MM-YYYY HH:mm:ss",
      "DD/MM/YYYY HH:mm:ss",
      "DD-MM-YYYY h:mm a",
      "DD/MM/YYYY h:mm a",
    ];

    const m = moment(val, formats, true);

    if (!m.isValid()) {
      console.log("⚠️ Invalid date:", val);
      return new Date();
    }

    return m.toDate();
  } catch {
    return new Date();
  }
};

/* USER FIND */
const findUserId = async (client, code) => {
  const res = await client.query(
    `SELECT id FROM users WHERE user_code=$1 LIMIT 1`,
    [code]
  );
  return res.rows[0]?.id || null;
};

const importReferrals = async () => {
  const client = await pool.connect();

  try {
    console.log("🚀 Importing referrals...");
    await client.query("BEGIN");

    const workbook = xlsx.readFile("./referral.xlsx");
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    let inserted = 0;
    let skipped = 0;

    for (let i = 1; i < data.length; i++) {
      try {
        const row = data[i];

        const referrerCode = clean(row[1]);
        const referredCode = clean(row[2]);
        const level = Number(row[3]) || 1;
        const createdAt = parseDate(row[4]);

        /* VALIDATION */
        if (!referrerCode || !referredCode) {
          console.log(`❌ Row ${i}: missing codes`);
          skipped++;
          continue;
        }

        if (referrerCode === referredCode) {
          console.log(`❌ Row ${i}: self referral`);
          skipped++;
          continue;
        }

        const referrerId = await findUserId(client, referrerCode);
        const referredId = await findUserId(client, referredCode);

        if (!referrerId || !referredId) {
          console.log(`❌ Row ${i}: user not found`);
          skipped++;
          continue;
        }

        /* DUPLICATE CHECK */
        const exists = await client.query(
          `SELECT id FROM referrals 
           WHERE referrer_user_id=$1 AND referred_user_id=$2`,
          [referrerId, referredId]
        );

        if (exists.rows.length) {
          console.log(`⚠️ Row ${i}: already exists`);
          skipped++;
          continue;
        }

        /* INSERT */
        await client.query(
          `INSERT INTO referrals
          (referrer_user_id, referred_user_id, level, created_at)
          VALUES ($1,$2,$3,$4)`,
          [referrerId, referredId, level, createdAt]
        );

        inserted++;
        console.log(`✅ Row ${i}: ${referrerCode} → ${referredCode}`);

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
    process.exit();
  }
};

importReferrals();