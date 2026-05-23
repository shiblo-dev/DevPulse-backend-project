 import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { pool } from "../db";
import type { ROLES } from "../types";
import config from "../config";

const auth = (...roles: ROLES[]) => {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      // ✅ FIX 1: proper token extraction
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized access!!",
        });
      }

      const token = authHeader.split(" ")[1]; // 👈 FIX

      const decoded = jwt.verify(
        token,
        config.secret as string
      ) as JwtPayload;

      const userData = await pool.query(
        `SELECT * FROM users WHERE email=$1`,
        [decoded.email]
      );

      if (userData.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found!",
        });
      }

      const user = userData.rows[0];

      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: "Forbidden!!",
        });
      }

      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden!! No access",
        });
      }

      // ✅ BEST PRACTICE: attach DB user
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
  };
};

export default auth;