import { pool } from "../config/db.js";

export const createUser = async (
  {
    user_code,
    password,
    role = "user",
    name,
    lastname,
    email,
    phone,
    referred_by = null,
  },
  client = pool
) => {
  const query = `
  INSERT INTO users
  (user_code, password, role, name, lastname, email, phone, referred_by, status, created_at)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8, TRUE, NOW())
  RETURNING *;
`;

  const values = [
    user_code,
    password,
    role,
    name,
    lastname || "",
    email,
    phone,
    referred_by,
  ];

  const result = await client.query(query, values);
  return result.rows[0];
};

export const findUserByEmail = async (email) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );
  return result.rows[0];
};

export const findUserByReferral = async (user_code) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE user_code = $1",
    [user_code]
  );
  return result.rows[0];
};