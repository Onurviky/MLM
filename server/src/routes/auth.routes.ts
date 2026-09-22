import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const authRouter = Router();

authRouter.post("/register", asyncHandler(authController.register));
authRouter.post("/login", asyncHandler(authController.login));
authRouter.post("/logout", asyncHandler(authController.logout));
authRouter.get("/me", requireAuth, asyncHandler(authController.me));
authRouter.patch("/me", requireAuth, asyncHandler(authController.updateProfile));
authRouter.post("/password", requireAuth, asyncHandler(authController.changePassword));
authRouter.put("/address", requireAuth, asyncHandler(authController.updateAddress));
authRouter.post("/forgot-password", asyncHandler(authController.forgotPassword));
authRouter.post("/reset-password", asyncHandler(authController.resetPassword));
