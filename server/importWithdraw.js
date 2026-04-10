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
  if (!val || val === "-") return null;
  return val.toString().trim();
};

/* NUMBER */
const parseNumber = (val) => {
  if (!val) return 0;
  return parseFloat(String(val).replace(/[^\d.]/g, "")) || 0;
};

/* DATE */
const parseDate = (val) => {
  if (!val) return new Date();

  try {
    if (typeof val === "number") {
      return new Date((val - 25569) * 86400 * 1000);
    }

    const formats = [
      "D/M/YYYY, h:mm:ss a",
      "DD/MM/YYYY, h:mm:ss a",
      "M/D/YYYY, h:mm:ss a",
      "MM/DD/YYYY, h:mm:ss a",
    ];

    const m = moment(val, formats, true);

    return m.isValid() ? m.toDate() : new Date();
  } catch {
    return new Date();
  }
};

const importWithdrawals = async () => {
  const client = await pool.connect();

  try {
    console.log("🚀 Importing Withdrawals...");
    await client.query("BEGIN");

    const workbook = xlsx.readFile("./withdraw1.xlsx");
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    let inserted = 0;
    let skipped = 0;

    for (let i = 1; i < data.length; i++) {
      try {
        const row = data[i];

        const userCode = clean(row[1]);
        const walletType = clean(row[2]);
        const amountUSD = parseNumber(row[3]); // 💵 USD
        const currency = "USD"; // user input
        const status = (clean(row[5]) || "pending").toLowerCase();
        const createdAt = parseDate(row[6]);
        const proof = clean(row[7]);

        if (!userCode || !walletType || !amountUSD) {
          console.log(`❌ Row ${i}: invalid`);
          skipped++;
          continue;
        }

        /* 🔥 CONVERSION LOGIC */
        const amountINR = amountUSD * 95;
        const fee = amountINR * 0.10;

        let approvedAmount = 0;

        if (status === "approved") {
          approvedAmount = Number((amountINR - fee).toFixed(2));
        }

        /* USER */
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

        /* INSERT */
        await client.query(
          `INSERT INTO withdrawals
          (user_id, wallet_type, amount, currency_type, status, created_at, transaction_proof, approved_amount)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            userId,
            walletType,
            amountUSD,     // 💵 stored as USD request
            currency,
            status,
            createdAt,
            proof,
            approvedAmount // ₹ stored
          ]
        );

        inserted++;
        console.log(
          `✅ ${userCode} | $${amountUSD} → ₹${approvedAmount}`
        );

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

importWithdrawals();