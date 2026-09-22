import { Router } from "express";
import * as productController from "../controllers/product.controller";
import * as shippingMethodController from "../controllers/shippingMethod.controller";
import { asyncHandler } from "../utils/asyncHandler";

export const productRouter = Router();

productRouter.get("/products/featured", asyncHandler(productController.getFeaturedProducts));
productRouter.get("/products/:slug", asyncHandler(productController.getProductBySlug));
productRouter.get("/products", asyncHandler(productController.listProducts));
productRouter.get("/categories", asyncHandler(productController.listCategories));
productRouter.get("/collections", asyncHandler(productController.listCollections));
productRouter.get("/shipping-methods", asyncHandler(shippingMethodController.listShippingMethods));
