import type { Response } from "express";
type TResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
};
const sendResponse = <T>(res: Response, data: TResponse<T>) => {
  return res.json({
    success: data.success,
    message: data.message,
    data: data.data,
    errors: data.errors,
  });
};
export default sendResponse;
