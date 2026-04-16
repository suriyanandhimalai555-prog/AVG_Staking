import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function runFix() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(`
      UPDATE users u
      SET referred_by = ref.user_code
      FROM referrals r
      JOIN users ref ON ref.id = r.referrer_user_id
      WHERE u.id = r.referred_user_id
        AND (u.referred_by IS NULL OR u.referred_by = '');
    `);

    await client.query("COMMIT");
    console.log("✅ referred_by fixed");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ error:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

runFix();