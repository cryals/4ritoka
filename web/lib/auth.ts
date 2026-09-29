import { cookies } from "next/headers";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { createSession, deleteSession, findUserBySession, type User } from "./auth-db";

export const SESSION_COOKIE = "fabriq_session";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const days = Number(process.env.FABRIQ_SESSION_DAYS ?? 30);
  const expires = new Date(Date.now() + days * 86_400_000);
  createSession(userId, tokenHash(token), expires.toISOString());
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.FABRIQ_SECURE_COOKIES === "true",
    path: "/",
    expires,
  });
}

export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? findUserBySession(tokenHash(token)) : null;
}

export async function revokeSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) deleteSession(tokenHash(token));
  store.delete(SESSION_COOKIE);
}
