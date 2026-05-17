import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

export const COLLABHUB_SESSION_COOKIE = "collabhub_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type SessionPayload = {
  userId: string;
  email: string;
  expiresAt: number;
};

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function getAuthSecret() {
  const secret =
    process.env.COLLABHUB_AUTH_SECRET ??
    process.env.AUTH_SECRET ??
    process.env.JWT_SECRET;

  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("COLLABHUB_AUTH_SECRET is not configured");
  }
  return "collabhub-dev-secret-change-me";
}

export function getConvexServerSecret() {
  return process.env.COLLABHUB_AUTH_SECRET ?? process.env.AUTH_SECRET ?? getAuthSecret();
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const key = scryptSync(password, salt, 64).toString("base64url");
  return `scrypt$${salt}$${key}`;
}

export function verifyPassword(password: string, storedHash: string | undefined) {
  if (!storedHash) return false;
  const [scheme, salt, key] = storedHash.split("$");
  if (scheme !== "scrypt" || !salt || !key) return false;

  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(key, "base64url");
  return expected.length === candidate.length && timingSafeEqual(candidate, expected);
}

function sign(payload: string) {
  return createHmac("sha256", getAuthSecret()).update(payload).digest("base64url");
}

export function createSessionCookie(user: { _id: string; email: string }) {
  const payload: SessionPayload = {
    userId: user._id,
    email: user.email,
    expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function parseSessionCookie(cookieValue: string | undefined | null): SessionPayload | null {
  if (!cookieValue) return null;
  const [encodedPayload, signature] = cookieValue.split(".");
  if (!encodedPayload || !signature || sign(encodedPayload) !== signature) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;
    if (!payload.userId || !payload.email || payload.expiresAt < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function serializeSessionCookie(value: string) {
  const parts = [
    `${COLLABHUB_SESSION_COOKIE}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

export function serializeExpiredSessionCookie() {
  return `${COLLABHUB_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((part) => part.trim());
  const prefix = `${name}=`;
  const match = cookies.find((cookie) => cookie.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : null;
}
