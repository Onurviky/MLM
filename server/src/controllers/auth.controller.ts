import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { prisma } from "../db";
import { upsertAddress } from "../lib/address";
import { sendPasswordResetEmail } from "../lib/mailer";
import { ApiError } from "../utils/ApiError";
import { COOKIE_MAX_AGE_MS, COOKIE_NAME, signToken } from "../utils/jwt";
import {
  addressSchema,
  forgotPasswordSchema,
  loginSchema,
  passwordChangeSchema,
  profileUpdateSchema,
  registerSchema,
  resetPasswordSchema,
} from "../validation";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function isProd() {
  return process.env.NODE_ENV === "production";
}

function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd(),
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_MS,
    path: "/",
  });
}

type UserWithAddress = {
  id: string;
  email: string;
  name: string;
  role: string;
  addresses: { fullName: string; line1: string; city: string; province: string; postalCode: string; phone: string }[];
};

function toPublicUser(user: UserWithAddress) {
  const address = user.addresses[0] ?? null;
  return { id: user.id, email: user.email, name: user.name, role: user.role, address };
}

export async function register(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ApiError(409, "Ya existe una cuenta con ese email");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash, role: "CUSTOMER" },
  });

  const token = signToken({ userId: user.id, role: user.role });
  setAuthCookie(res, token);
  res.status(201).json({ user: toPublicUser({ ...user, addresses: [] }) });
}

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { addresses: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!user) {
    throw new ApiError(401, "Credenciales invalidas");
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new ApiError(401, "Credenciales invalidas");
  }

  const token = signToken({ userId: user.id, role: user.role });
  setAuthCookie(res, token);
  res.json({ user: toPublicUser(user) });
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.status(204).send();
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { addresses: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!user) {
    throw new ApiError(401, "No autenticado");
  }
  res.json({ user: toPublicUser(user) });
}

export async function updateProfile(req: Request, res: Response) {
  const input = profileUpdateSchema.parse(req.body);
  const userId = req.user!.userId;

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing && existing.id !== userId) {
    throw new ApiError(409, "Ya existe una cuenta con ese email");
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { name: input.name, email: input.email },
    include: { addresses: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  res.json({ user: toPublicUser(user) });
}

export async function changePassword(req: Request, res: Response) {
  const input = passwordChangeSchema.parse(req.body);
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(401, "No autenticado");
  }

  const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!valid) {
    throw new ApiError(401, "La contrasena actual no es correcta");
  }

  const passwordHash = await bcrypt.hash(input.newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  res.status(204).send();
}

export async function updateAddress(req: Request, res: Response) {
  const input = addressSchema.parse(req.body);
  const userId = req.user!.userId;

  await upsertAddress(userId, input);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { addresses: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!user) {
    throw new ApiError(401, "No autenticado");
  }
  res.json({ user: toPublicUser(user) });
}

export async function forgotPassword(req: Request, res: Response) {
  const input = forgotPasswordSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (user) {
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await prisma.user.update({ where: { id: user.id }, data: { resetToken, resetTokenExpiresAt } });

    const clientUrl = process.env.CLIENT_URL ?? "http://localhost:5173";
    const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;
    try {
      await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });
    } catch (error) {
      console.error("Error enviando email de reset de contrasena:", error);
    }
  }

  res.json({ message: "Si el email existe, te enviamos instrucciones para restablecer la contrasena" });
}

export async function resetPassword(req: Request, res: Response) {
  const input = resetPasswordSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { resetToken: input.token } });
  if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
    throw new ApiError(400, "El link para restablecer la contrasena es invalido o expiro");
  }

  const passwordHash = await bcrypt.hash(input.newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpiresAt: null },
  });
  res.status(204).send();
}
