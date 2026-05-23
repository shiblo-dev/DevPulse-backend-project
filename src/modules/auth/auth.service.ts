import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../../db";
import config from "../../config";
import AppError from "../../utils/AppError";

const SALT_ROUNDS = 10;

const registerUserIntoDB = async (payload: {
  name: string;
  email: string;
  password: string;
  role?: "contributor" | "maintainer";
}) => {
  const { name, email, password, role = "contributor" } = payload;

  const isUserExists = await pool.query(`SELECT id FROM users WHERE email=$1`, [
    email,
  ]);

  if (isUserExists.rows.length > 0) {
    throw new AppError("User already exists!", 409);
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at, updated_at`,
    [name, email, hashedPassword, role],
  );

  return result.rows[0];
};

const loginUserIntoDB = async (payload: {
  email: string;
  password: string;
}) => {
  const { email, password } = payload;

  const userData = await pool.query(`SELECT * FROM users WHERE email=$1`, [
    email,
  ]);

  if (userData.rows.length === 0) {
    throw new AppError("User not found", 404);
  }

  const user = userData.rows[0];

  const matchPassword = await bcrypt.compare(password, user.password);

  if (!matchPassword) {
    throw new AppError("Invalid credentials", 401);
  }

  const jwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role,
    email: user.email,
  };

  const token = jwt.sign(jwtPayload, config.secret, { expiresIn: "1d" });

  return {
    token,
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

export const authService = {
  registerUserIntoDB,
  loginUserIntoDB,
};
