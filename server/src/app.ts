import path from "node:path";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { adminRouter } from "./routes/admin.routes";
import { authRouter } from "./routes/auth.routes";
import { cartRouter } from "./routes/cart.routes";
import { couponRouter } from "./routes/coupon.routes";
import { orderRouter } from "./routes/order.routes";
import { paymentRouter } from "./routes/payment.routes";
import { productRouter } from "./routes/product.routes";
import { settingsRouter } from "./routes/settings.routes";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_URL ?? "http://localhost:5173",
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/auth", authRouter);
  app.use("/api", productRouter);
  app.use("/api/cart", cartRouter);
  app.use("/api/orders", orderRouter);
  app.use("/api/coupons", couponRouter);
  app.use("/api/settings", settingsRouter);
  app.use("/api/payments", paymentRouter);
  app.use("/api/admin", adminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
