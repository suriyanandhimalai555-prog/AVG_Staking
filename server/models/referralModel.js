import { pool } from "../config/db.js";

export const createReferralChain = async (client, newUserCode, sponsorUserCode) => {
  // Get sponsor's ancestors
  const ancestorsRes = await client.query(
    `
    SELECT ancestor_user_code, level
    FROM referral_tree
    WHERE descendant_user_code = $1
    ORDER BY level ASC
    `,
    [sponsorUserCode]
  );

  // Level 1: direct sponsor
  await client.query(
    `
    INSERT INTO referral_tree (ancestor_user_code, descendant_user_code, level)
    VALUES ($1, $2, 1)
    ON CONFLICT (ancestor_user_code, descendant_user_code) DO NOTHING
    `,
    [sponsorUserCode, newUserCode]
  );

  // Level 2, 3, 4... indirect uplines
  for (const row of ancestorsRes.rows) {
    await client.query(
      `
      INSERT INTO referral_tree (ancestor_user_code, descendant_user_code, level)
      VALUES ($1, $2, $3)
      ON CONFLICT (ancestor_user_code, descendant_user_code) DO NOTHING
      `,
      [row.ancestor_user_code, newUserCode, Number(row.level) + 1]
    );
  }
};