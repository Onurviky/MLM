import { Router } from "express";
import * as couponController from "../controllers/coupon.controller";
import * as orderController from "../controllers/order.controller";
import * as productController from "../controllers/product.controller";
import * as settingsController from "../controllers/settings.controller";
import * as shippingMethodController from "../controllers/shippingMethod.controller";
import * as uploadController from "../controllers/upload.controller";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { upload } from "../middleware/upload";
import { asyncHandler } from "../utils/asyncHandler";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/products", asyncHandler(productController.adminListProducts));
adminRouter.post("/products", asyncHandler(productController.adminCreateProduct));
adminRouter.patch("/products/:id", asyncHandler(productController.adminUpdateProduct));
adminRouter.delete("/products/:id", asyncHandler(productController.adminDeleteProduct));

adminRouter.post("/categories", asyncHandler(productController.adminCreateCategory));

adminRouter.get("/collections", asyncHandler(productController.adminListCollections));
adminRouter.post("/collections", asyncHandler(productController.adminCreateCollection));
adminRouter.patch("/collections/:id", asyncHandler(productController.adminUpdateCollection));
adminRouter.delete("/collections/:id", asyncHandler(productController.adminDeleteCollection));

adminRouter.post("/upload", upload.single("file"), asyncHandler(uploadController.uploadImage));

adminRouter.get("/orders", asyncHandler(orderController.adminListOrders));
adminRouter.patch("/orders/:id/status", asyncHandler(orderController.adminUpdateOrderStatus));

adminRouter.get("/coupons", asyncHandler(couponController.adminListCoupons));
adminRouter.post("/coupons", asyncHandler(couponController.adminCreateCoupon));
adminRouter.patch("/coupons/:id", asyncHandler(couponController.adminUpdateCoupon));
adminRouter.delete("/coupons/:id", asyncHandler(couponController.adminDeleteCoupon));

adminRouter.get("/settings", asyncHandler(settingsController.adminGetSettings));
adminRouter.patch("/settings", asyncHandler(settingsController.adminUpdateSettings));

adminRouter.get("/shipping-methods", asyncHandler(shippingMethodController.adminListShippingMethods));
adminRouter.post("/shipping-methods", asyncHandler(shippingMethodController.adminCreateShippingMethod));
adminRouter.patch("/shipping-methods/:id", asyncHandler(shippingMethodController.adminUpdateShippingMethod));
adminRouter.delete("/shipping-methods/:id", asyncHandler(shippingMethodController.adminDeleteShippingMethod));
