import { Pool } from "pg";
import xlsx from "xlsx";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ================= UTIL =================

const clean = (val) => {
  if (val === null || val === undefined || val === "") return null;
  return String(val).trim();
};

const parseNumber = (val) => {
  if (val === null || val === undefined || val === "") return 0;
  const num = String(val).replace(/[^\d.]/g, "");
  return parseFloat(num) || 0;
};

// ✅ DATE PARSER (handles your format)
const parseDate = (val) => {
  if (!val) return null;

  try {
    if (typeof val === "number") {
      const d = new Date((val - 25569) * 86400 * 1000);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 50, 0);
    }

    let str = String(val)
      .trim()
      .replace(/\r\n/g, "")
      .replace(/\n/g, "")
      .replace(/-/g, "/");

    const [datePart, timePart] = str.split(",");

    const parts = datePart.split("/");

    if (parts.length !== 3) return null;

    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = parseInt(parts[2]);

    let hours = 23;
    let minutes = 50;
    let seconds = 0;

    if (timePart) {
      const time = timePart.trim().toLowerCase();
      const match = time.match(/(\d+):(\d+):(\d+)\s*(am|pm)?/);

      if (match) {
        hours = parseInt(match[1]);
        minutes = parseInt(match[2]);
        seconds = parseInt(match[3]);

        if (match[4] === "pm" && hours !== 12) hours += 12;
        if (match[4] === "am" && hours === 12) hours = 0;
      }
    }

    return new Date(year, month, day, hours, minutes, seconds);
  } catch {
    return null;
  }
};

// ================= MAIN =================

const importROI = async () => {
  const client = await pool.connect();

  try {
    console.log("🚀 Importing ROI...");
    await client.query("BEGIN");

    // ✅ Load users once
    const usersRes = await client.query(
      "SELECT id, user_code FROM users"
    );

    const userMap = new Map(
      usersRes.rows.map((u) => [u.user_code, u.id])
    );

    // ✅ Read Excel
    const workbook = xlsx.readFile("./roi.xlsx", { cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const data = xlsx.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      defval: null,
      blankrows: true,
    });

    let inserted = 0;
    let skipped = 0;

    for (let i = 1; i < data.length; i++) {
      try {
        const row = data[i];

        if (!row || row.length === 0 || row.every((c) => !c)) {
          continue;
        }

        const userCode = clean(row[0]);
        const planId = Number(row[1]);
        const amount = parseNumber(row[2]);
        const createdAt = parseDate(row[3]);

        if (!userCode || !planId || !amount || !createdAt) {
          console.log(`❌ Invalid row ${i}`);
          skipped++;
          continue;
        }

        const userId = userMap.get(userCode);

        if (!userId) {
          console.log(`❌ User not found: ${userCode}`);
          skipped++;
          continue;
        }

        // 🔥 CORE FIX: LET DB DECIDE CORRECT PLAN
        let planRes = await client.query(
  `
  SELECT id
  FROM user_plans
  WHERE user_id = $1
    AND plan_id = $2
    AND DATE(created_at) <= DATE($3)
  ORDER BY created_at DESC
  LIMIT 1
  `,
  [userId, planId, createdAt]
);

// ✅ FALLBACK (VERY IMPORTANT)
if (!planRes.rows.length) {
  planRes = await client.query(
    `
    SELECT id
    FROM user_plans
    WHERE user_id = $1
      AND plan_id = $2
    ORDER BY created_at ASC
    LIMIT 1
    `,
    [userId, planId]
  );
}

const userPlanId = planRes.rows[0]?.id;

        // ✅ INSERT
        await client.query(
          `
          INSERT INTO roi_transactions
          (user_id, plan_id, amount, type, created_at, total_earned, user_plan_id)
          VALUES ($1,$2,$3,$4,$5,$6,$7)
          `,
          [userId, planId, amount, "roi", createdAt, amount, userPlanId]
        );

        inserted++;

        if (i % 1000 === 0) {
          console.log(`Processed ${i} rows`);
        }

      } catch (err) {
        console.log(`❌ Error row ${i}:`, err.message);
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

importROI();