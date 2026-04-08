import { Pool } from "pg";
import xlsx from "xlsx";
import bcrypt from "bcrypt";
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

const cleanUserCode = (val) => {
  if (!val) return null;

  return val
    .toString()
    .replace(/\s+/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 20);
};

const importUsers = async () => {
  const client = await pool.connect();

  try {
    console.log("🚀 Import started...");
    await client.query("BEGIN");

    const workbook = xlsx.readFile("./user.xlsx");
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    console.log(`📊 Total rows: ${data.length}`);

    const seen = new Set();

    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      const userCode = cleanUserCode(row[1]);
      if (!userCode) continue;

      if (seen.has(userCode)) continue;
      seen.add(userCode);

      const exists = await client.query(
        "SELECT id FROM users WHERE user_code = $1",
        [userCode]
      );

      if (exists.rows.length > 0) {
        continue;
      }

      const hashedPassword = await bcrypt.hash(
        (row[2] || "123456").toString(),
        10
      );

      let createdAt = new Date();
      if (row[3]) {
        const parsed = moment(row[3], ["D/M/YYYY, h:mm:ss a", moment.ISO_8601], true);
        if (parsed.isValid()) createdAt = parsed.toDate();
      }

      let phone = row[8];
      if (phone) {
        phone =
          typeof phone === "number"
            ? Math.round(phone).toString()
            : phone.toString();

        phone = phone.replace(/\D/g, "").slice(0, 15);
      }

      const email = row[7] ? row[7].toString().trim().slice(0, 100) : null;

      const name = row[5]
        ? row[5].toString().replace(/\n/g, "").trim().slice(0, 50)
        : "User";

      const lastname = row[6]
        ? row[6].toString().replace(/\n/g, "").trim().slice(0, 50)
        : "";

      const status =
        row[11] === true ||
        row[11] === "TRUE" ||
        row[11] === "true";

      // old Excel "reffered_by" column is treated as inviter's user_code
      const referred_by = cleanUserCode(row[10]) || null;

      await client.query(
        `INSERT INTO users 
          (user_code, password, created_at, role, name, lastname, email, phone, referred_by, status, wallet_address)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          userCode,
          hashedPassword,
          createdAt,
          row[4] || "user",
          name,
          lastname,
          email,
          phone,
          referred_by,
          status,
          row[12] || null,
        ]
      );

      console.log(`✅ Inserted: ${userCode}`);
    }

    await client.query("COMMIT");
    console.log("🎉 IMPORT SUCCESS");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Import failed — rolled back");
    console.error(err);
  } finally {
    client.release();
  }
};

importUsers();