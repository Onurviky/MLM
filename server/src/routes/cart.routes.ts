import { Router } from "express";
import * as cartController from "../controllers/cart.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const cartRouter = Router();

cartRouter.use(requireAuth);
cartRouter.get("/", asyncHandler(cartController.getCart));
cartRouter.post("/", asyncHandler(cartController.addToCart));
cartRouter.patch("/:itemId", asyncHandler(cartController.updateCartItem));
cartRouter.delete("/:itemId", asyncHandler(cartController.removeCartItem));
