import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSessionToken, sessionCookieOptions, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, string>;
  const username = (body.username ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!username || !password) {
    return NextResponse.json(
      { error: "Masukkan nama pengguna dan kata sandi Anda" },
      { status: 400 },
    );
  }

  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Nama pengguna atau kata sandi salah" }, { status: 401 });
  }
  if (!user.aktif) {
    return NextResponse.json({ error: "Akun ini dinonaktifkan" }, { status: 403 });
  }

  const token = createSessionToken({
    id: user.id,
    nama: user.nama,
    username: user.username,
    role: user.role,
    jabatan: user.jabatan,
    warna: user.warna,
  });

  const store = await cookies();
  store.set("panti_sesi", token, sessionCookieOptions());
  return NextResponse.json({
    user: {
      id: user.id,
      nama: user.nama,
      username: user.username,
      role: user.role,
      jabatan: user.jabatan,
      warna: user.warna,
    },
  });
}
