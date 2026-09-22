import { Router } from "express";
import * as orderController from "../controllers/order.controller";
import { asyncHandler } from "../utils/asyncHandler";

export const paymentRouter = Router();

paymentRouter.post("/webhook", asyncHandler(orderController.paymentWebhook));
