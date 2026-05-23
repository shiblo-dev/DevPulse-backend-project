import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import { authRoute } from "./modules/auth/auth.route";

import globalErrorHandler from "./middleware/globalErrorHandler";

const app: Application = express();

// ✅ middleware order (important)
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());

// ✅ test route
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Devpulse server is running!!",
    author: "Next Level",
  });
});

// ✅ routes (FIXED STRUCTURE)

app.use("/api/auth", authRoute);

// error handler
app.use(globalErrorHandler);

export default app;
