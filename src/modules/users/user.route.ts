import { Router } from "express";
import { userController } from "./user.controller";

const router = Router();

router.post("/signup", userController.registerUser);

export const userRoute = router;
