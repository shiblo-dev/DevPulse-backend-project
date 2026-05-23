import type { NextFunction, Response } from "express";
import type { AuthRequest, ROLES } from "../types";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../config";

const auth = (...roles: ROLES[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized access!",
        });
      }

      const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader;

      const decoded = jwt.verify(token, config.secret) as JwtPayload;

      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden! No access",
        });
      }

      req.user = {
        id: decoded.id,
        name: decoded.name,
        role: decoded.role,
      };

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  };
};

export default auth;
