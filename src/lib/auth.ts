import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export const SESSION_COOKIE = "panti_sesi";
const SECRET = process.env.AUTH_SECRET ?? "panti-asuhan-demo-secret-key";
const MAX_AGE = 60 * 60 * 24 * 7;

export type SessionUser = {
  id: number;
  nama: string;
  username: string;
  role: string;
  jabatan: string | null;
  warna: string | null;
};

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

function sign(payload: string) {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function createSessionToken(user: SessionUser) {
  const payload = Buffer.from(
    JSON.stringify({ ...user, exp: Date.now() + MAX_AGE * 1000 }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token: string | undefined): SessionUser | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (expected.length !== signature.length) return null;
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof data.exp === "number" && data.exp < Date.now()) return null;
    return data as SessionUser;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const session = readSessionToken(token);
  if (!session) return null;
  // make sure the account still exists / is active
  const [row] = await db
    .select({ id: users.id, aktif: users.aktif })
    .from(users)
    .where(eq(users.id, session.id))
    .limit(1);
  if (!row || !row.aktif) return null;
  return session;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

/** Relawan hanya dapat melihat catatan; tulis-menulis dibatasi di sisi server. */
export function canWrite(user: SessionUser | null) {
  if (!user) return false;
  return user.role !== "relawan";
}

export const ROLE_LABEL: Record<string, string> = {
  administrator: "Administrator",
  pengasuh: "Pengasuh",
  tata_usaha: "Tata usaha",
  relawan: "Relawan",
};

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  };
}
