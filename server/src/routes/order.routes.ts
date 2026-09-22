import { Router } from "express";
import * as orderController from "../controllers/order.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const orderRouter = Router();

orderRouter.use(requireAuth);
orderRouter.post("/", asyncHandler(orderController.checkout));
orderRouter.get("/", asyncHandler(orderController.listMyOrders));
orderRouter.get("/:id", asyncHandler(orderController.getMyOrder));
