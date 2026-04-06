import { Pool } from "pg";
import xlsx from "xlsx";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
});

const clean = (val) => {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  return str.length ? str : null;
};

const importBankDetails = async () => {
  const client = await pool.connect();

  try {
    console.log("🚀 Importing bank details...");
    await client.query("BEGIN");

    const workbook = xlsx.readFile("./bankDetails.xlsx"); // change file name if needed
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      const userCode = clean(row[0]);
      const accountHolderName = clean(row[1]);
      const bankName = clean(row[2]) || "";
      const accountNumber = clean(row[3]);
      const ifscCode = clean(row[4]) || "";
      const branch = clean(row[5]) || "";
      const upiId = clean(row[6]) || "";
      const gpayNumber = clean(row[7]) || "";
      const status = (clean(row[8]) || "Pending").toString();
      const createdAt = row[9] ? new Date(row[9]) : new Date();

      if (!userCode || !accountHolderName || !accountNumber) {
        console.log(`❌ Missing required data at row ${i}`);
        skipped++;
        continue;
      }

      const userRes = await client.query(
        "SELECT id FROM users WHERE user_code = $1 LIMIT 1",
        [userCode]
      );

      if (!userRes.rows.length) {
        console.log(`❌ User not found: ${userCode} at row ${i}`);
        skipped++;
        continue;
      }

      const userId = userRes.rows[0].id;

      const existing = await client.query(
        "SELECT id FROM bank_details WHERE user_id = $1 LIMIT 1",
        [userId]
      );

      if (existing.rows.length > 0) {
        await client.query(
          `
          UPDATE bank_details
          SET account_holder_name = $1,
              bank_name = $2,
              account_number = $3,
              ifsc_code = $4,
              branch = $5,
              upi_id = $6,
              gpay_number = $7,
              status = $8,
              created_at = $9
          WHERE user_id = $10
          `,
          [
            accountHolderName,
            bankName,
            accountNumber,
            ifscCode,
            branch,
            upiId,
            gpayNumber,
            status,
            createdAt,
            userId,
          ]
        );
        updated++;
        console.log(`✏️ Updated: ${userCode}`);
      } else {
        await client.query(
          `
          INSERT INTO bank_details
          (
            user_id,
            account_holder_name,
            bank_name,
            account_number,
            ifsc_code,
            branch,
            upi_id,
            gpay_number,
            status,
            created_at
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
          `,
          [
            userId,
            accountHolderName,
            bankName,
            accountNumber,
            ifscCode,
            branch,
            upiId,
            gpayNumber,
            status,
            createdAt,
          ]
        );
        inserted++;
        console.log(`✅ Inserted: ${userCode}`);
      }
    }

    await client.query("COMMIT");

    console.log("🎉 Bank import done");
    console.log(`✅ Inserted: ${inserted}`);
    console.log(`✏️ Updated: ${updated}`);
    console.log(`⚠️ Skipped: ${skipped}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Import failed:", err);
  } finally {
    client.release();
  }
};

importBankDetails();