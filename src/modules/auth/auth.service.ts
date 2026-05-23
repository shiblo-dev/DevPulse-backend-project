import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";

import { pool } from "../../db";
import config from "../../config";

// ================= REGISTER =================

const registerUserIntoDB = async (payload: any) => {
  const { name, email, password, role } = payload;

  // check existing user
  const isUserExists = await pool.query(`SELECT * FROM users WHERE email=$1`, [
    email,
  ]);

  if (isUserExists.rows.length > 0) {
    throw new Error("User already exists!");
  }

  // hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // insert user
  const result = await pool.query(
    `
    INSERT INTO users (
      name,
      email,
      password,
      role,
      is_active,
      created_at,
      updated_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING
      id,
      name,
      email,
      role,
      created_at,
      updated_at
    `,
    [name, email, hashedPassword, role, true, new Date(), new Date()],
  );

  return result.rows[0];
};

// ================= LOGIN =================

const loginUserIntoDB = async (payload: {
  email: string;
  password: string;
}) => {
  const { email, password } = payload;

  // check user exists
  const userData = await pool.query(`SELECT * FROM users WHERE email=$1`, [
    email,
  ]);

  if (userData.rows.length === 0) {
    throw new Error("User not found!!");
  }

  const user = userData.rows[0];

  // compare password
  const matchPassword = await bcrypt.compare(password, user.password);

  if (!matchPassword) {
    throw new Error("Invalid Credentials!");
  }

  // jwt payload
  const jwtpayload = {
    id: user.id,
    name: user.name,
    role: user.role,
    email: user.email,
  };

  // access token
  const token = jwt.sign(jwtpayload, config.secret as string, {
    expiresIn: "1d",
  });

  // refresh token
  const refreshToken = jwt.sign(jwtpayload, config.refresh_secret as string, {
    expiresIn: "10d",
  });

  return {
    token,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
  };
};

// ================= REFRESH TOKEN =================

const generateFreshToken = async (token: string) => {
  if (!token) {
    throw new Error("Unauthorized");
  }

  const decoded = jwt.verify(
    token,
    config.refresh_secret as string,
  ) as JwtPayload;

  const userData = await pool.query(`SELECT * FROM users WHERE email=$1`, [
    decoded.email,
  ]);

  if (userData.rows.length === 0) {
    throw new Error("User not found!!");
  }

  const user = userData.rows[0];

  const jwtpayload = {
    id: user.id,
    name: user.name,
    role: user.role,
    email: user.email,
  };

  const accessToken = jwt.sign(jwtpayload, config.secret as string, {
    expiresIn: "1d",
  });

  return {
    accessToken,
  };
};

export const authService = {
  registerUserIntoDB,
  loginUserIntoDB,
  generateFreshToken,
};
