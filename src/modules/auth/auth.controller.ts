import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../../types";
import { authService } from "./auth.service";

const registerUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await authService.registerUserIntoDB(req.body);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token: result.token,
        user: result.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const authController = {
  registerUser,
  loginUser,
};
