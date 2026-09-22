import { Router } from "express";
import * as couponController from "../controllers/coupon.controller";
import { asyncHandler } from "../utils/asyncHandler";

export const couponRouter = Router();

couponRouter.post("/validate", asyncHandler(couponController.validateCoupon));
