import type { Request, Response } from "express";

import sendResponse from "../../utils/sendResponse";
import { userService } from "./user.service";

const registerUser = async (req: Request, res: Response) => {
  try {
    const result = await userService.createUserIntoDB(req.body);

    sendResponse(res, {
      success: true,
      message: "User registered successfully",
      data: result,
    });
  } catch (error: unknown) {
    sendResponse(res, {
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
      errors: error,
    });
  }
};

export const userController = {
  registerUser,
};
