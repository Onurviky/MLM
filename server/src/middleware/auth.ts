import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { COOKIE_NAME, verifyToken, type TokenPayload } from "../utils/jwt";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    throw new ApiError(401, "No autenticado");
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    throw new ApiError(401, "Sesion invalida o expirada");
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    throw new ApiError(401, "No autenticado");
  }
  if (req.user.role !== "ADMIN") {
    throw new ApiError(403, "Acceso restringido a administradores");
  }
  next();
}
