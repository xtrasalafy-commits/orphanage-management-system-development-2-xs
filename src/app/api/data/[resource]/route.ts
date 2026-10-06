import { NextResponse } from "next/server";
import { canWrite, hashPassword, requireUser } from "@/lib/auth";
import { insertRow, isResource, listRows, type ResourceKey } from "@/lib/crud";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ resource: string }> },
) {
  let session;
  try {
    session = await requireUser();
  } catch {
    return NextResponse.json({ error: "Sesi berakhir" }, { status: 401 });
  }
  const { resource } = await ctx.params;
  if (!isResource(resource)) {
    return NextResponse.json({ error: "Sumber data tidak dikenal" }, { status: 404 });
  }
  const rows = (await listRows(resource)) as Record<string, unknown>[];
  const data = rows.map((row) => {
    if (resource !== "users") return row;
    const clone = { ...row };
    delete clone.passwordHash;
    return clone;
  });
  void session;
  return NextResponse.json({ data });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ resource: string }> },
) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Sesi berakhir" }, { status: 401 });
  }
  if (!canWrite(user)) {
    return NextResponse.json(
      { error: "Peran Relawan hanya dapat membaca catatan. Hubungi administrator untuk mengubah data." },
      { status: 403 },
    );
  }
  const { resource } = await ctx.params;
  if (!isResource(resource)) {
    return NextResponse.json({ error: "Sumber data tidak dikenal" }, { status: 404 });
  }
  const payload = (await req.json()) as Record<string, unknown>;
  if (resource === "users") {
    const password = typeof payload.password === "string" && payload.password.length > 0 ? payload.password : "panti123";
    payload.passwordHash = hashPassword(password);
  }
  delete payload.password;
  if (resource !== "users") delete payload.passwordHash;
  try {
    const row = await insertRow(resource as ResourceKey, payload);
    const safe = { ...(row as Record<string, unknown>) };
    delete safe.passwordHash;
    return NextResponse.json({ data: safe }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/duplicate|unique/i.test(message)) {
      return NextResponse.json(
        { error: "Data dengan nomor/ID tersebut sudah terdaftar" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Data tidak dapat disimpan" }, { status: 400 });
  }
}
