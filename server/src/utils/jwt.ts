import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

export type TokenPayload = {
  userId: string;
  role: string;
};

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL_SECONDS });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export const COOKIE_NAME = "mlm_token";
export const COOKIE_MAX_AGE_MS = TOKEN_TTL_SECONDS * 1000;
