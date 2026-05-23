import bcrypt from "bcryptjs";

import { pool } from "../../db";
import type { IUser } from "./user.interface";

const createUserIntoDB = async (payload: IUser) => {
  const { name, email, password, role } = payload;

  // check existing user
  const isUserExists = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email],
  );

  if (isUserExists.rows.length > 0) {
    throw new Error("User already exists");
  }

  // hash password
  const hashPassword = await bcrypt.hash(password, 10);

  // insert user
  const result = await pool.query(
    `
    INSERT INTO users(name,email,password,role)
    VALUES($1,$2,$3,COALESCE($4,'contributor'))

    RETURNING
    id,
    name,
    email,
    role,
    created_at,
    updated_at
    `,
    [name, email, hashPassword, role],
  );

  return result.rows[0];
};

export const userService = {
  createUserIntoDB,
};
