import { Pool } from "pg";
import xlsx from "xlsx";
import dotenv from "dotenv";

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

const IST_OFFSET_MINUTES = 330; // +05:30
const DEFAULT_DATE_ORDER = "DMY"; // change to "MDY" if your Excel uses month/day

const clean = (val) => {
  if (val === null || val === undefined || val === "") return null;
  return String(val).trim();
};

const parseNumber = (val) => {
  if (val === null || val === undefined || val === "") return 0;
  const num = String(val).replace(/[^\d.]/g, "");
  return parseFloat(num) || 0;
};

const excelSerialToUtcDate = (serial) => {
  if (!Number.isFinite(serial)) return null;

  // Excel serial date base: 1899-12-30
  const wholeDays = Math.floor(serial);
  const fraction = serial - wholeDays;

  const utcMillis =
    Date.UTC(1899, 11, 30) +
    wholeDays * 86400 * 1000 +
    Math.round(fraction * 86400 * 1000);

  // Treat the Excel value as IST wall time, then convert to UTC
  return new Date(utcMillis - IST_OFFSET_MINUTES * 60 * 1000);
};

const parseExcelDate = (val) => {
  if (val === null || val === undefined || val === "") return null;

  // Already a JS Date
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    return new Date(val.getTime());
  }

  // Excel serial number
  if (typeof val === "number" && Number.isFinite(val)) {
    return excelSerialToUtcDate(val);
  }

  const str = String(val).trim();
  if (!str) return null;

  // If it is a numeric string, treat it like an Excel serial
  if (/^\d+(\.\d+)?$/.test(str)) {
    const serial = Number(str);
    if (Number.isFinite(serial)) return excelSerialToUtcDate(serial);
  }

  // ISO formats
  const iso = new Date(str);
  if (!Number.isNaN(iso.getTime()) && /T|^\d{4}-\d{2}-\d{2}/.test(str)) {
    return iso;
  }

  // Handles: 6/4/2026, 11:50:10 pm  OR 06-04-2026 11:50:10 PM
  const match = str.match(
    /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:,\s*|\s+)?(\d{1,2}):(\d{2}):(\d{2})(?:\s*([ap]m))?$/i
  );

  if (!match) return null;

  let [, p1, p2, yyyy, hh, mm, ss, meridian] = match;
  let month;
  let day;

  const n1 = Number(p1);
  const n2 = Number(p2);

  if (n1 > 12 && n2 <= 12) {
    day = n1;
    month = n2;
  } else if (n2 > 12 && n1 <= 12) {
    month = n1;
    day = n2;
  } else if (DEFAULT_DATE_ORDER === "DMY") {
    day = n1;
    month = n2;
  } else {
    month = n1;
    day = n2;
  }

  let hour = Number(hh);
  const minute = Number(mm);
  const second = Number(ss);

  if (meridian) {
    const m = meridian.toLowerCase();
    if (m === "pm" && hour !== 12) hour += 12;
    if (m === "am" && hour === 12) hour = 0;
  }

  // Convert IST wall time to UTC instant
  return new Date(
    Date.UTC(Number(yyyy), month - 1, day, hour, minute, second) -
      IST_OFFSET_MINUTES * 60 * 1000
  );
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
      cap: Number(p.amount) * 2,
      earned: usageMap.get(Number(p.id)) || 0,
      createdAt: new Date(p.created_at),
    }));

    planCache.set(key, plans);
  }

  const plans = planCache.get(key);
  const target = plans.find((p) => p.earned + amount <= p.cap);

  if (!target) return null;

  target.earned += amount;
  return target.id;
}

const importROI = async () => {
  const client = await pool.connect();

  try {
    console.log("Importing ROI transactions...");
    await client.query("BEGIN");

    const workbook = xlsx.readFile("./roinew.xlsx", {
      cellDates: true,
    });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      defval: "",
    });

    let inserted = 0;
    let skipped = 0;

    for (let i = 1; i < data.length; i++) {
      try {
        const row = data[i];

        const userCode = clean(row[0]);
        const planId = Number(row[1]);
        const amount = parseNumber(row[2]);
        const createdAt = parseExcelDate(row[3]);

        if (!userCode || !planId || !amount || !createdAt) {
          console.log(`Row ${i}: invalid data`);
          skipped++;
          continue;
        }

        const userRes = await client.query(
          "SELECT id FROM users WHERE user_code = $1",
          [userCode]
        );

        if (!userRes.rows.length) {
          console.log(`Row ${i}: user not found (${userCode})`);
          skipped++;
          continue;
        }

        const userId = userRes.rows[0].id;
        const userPlanId = await getNextUserPlan(client, userId, planId, amount);

        if (!userPlanId) {
          console.log(
            `Row ${i}: no available user_plan for (${userCode}, plan ${planId})`
          );
          skipped++;
          continue;
        }

        await client.query(
          `
          INSERT INTO roi_transactions
          (user_id, plan_id, amount, type, created_at, total_earned, user_plan_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          `,
          [userId, planId, amount, "roi", createdAt, amount, userPlanId]
        );

        inserted++;
        console.log(`Row ${i}: ${userCode} -> user_plan_id ${userPlanId}`);
      } catch (err) {
        console.log(`Row ${i} error:`, err.message);
        skipped++;
      }
    }

    await client.query("COMMIT");

    console.log("Import completed");
    console.log(`Inserted: ${inserted}`);
    console.log(`Skipped: ${skipped}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Import failed:", err);
  } finally {
    client.release();
  }
};

importROI();