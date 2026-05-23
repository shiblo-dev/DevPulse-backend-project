import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import cors from "cors";

import globalErrorHandler from "./middleware/globalErrorHandler";
import { authRoute } from "./modules/auth/auth.route";
import { issueRoutes } from "./modules/issues/issue.route";

const app: Application = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Devpulse server is running!!",
  });
});

app.use("/api/auth", authRoute);
app.use("/api/issues", issueRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

app.use(globalErrorHandler);

export default app;
