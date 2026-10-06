import { NextResponse } from "next/server";
import { canWrite, hashPassword, requireUser } from "@/lib/auth";
import { deleteRow, updateRow, type ResourceKey } from "@/lib/crud";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function guard() {
  try {
    return await requireUser();
  } catch {
    return null;
  }
}

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ resource: string; id: string }> },
) {
  const session = await guard();
  if (!session) return fail("Sesi berakhir", 401);
  if (!canWrite(session)) {
    return fail(
      "Peran Relawan hanya dapat membaca catatan. Hubungi administrator untuk mengubah data.",
      403,
    );
  }
  const { resource, id } = await ctx.params;
  if (!isResourceName(resource)) return fail("Sumber data tidak dikenal", 404);
  const payload = (await req.json()) as Record<string, unknown>;
  if (resource === "users") {
    if (typeof payload.password === "string" && payload.password.length > 0) {
      payload.passwordHash = hashPassword(payload.password);
    }
  }
  delete payload.password;
  if (resource !== "users") delete payload.passwordHash;
  try {
    const row = await updateRow(resource as ResourceKey, Number(id), payload);
    if (!row) return fail("Data tidak ditemukan", 404);
    return NextResponse.json({ data: row });
  } catch {
    return fail("Gagal memperbarui data", 400);
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ resource: string; id: string }> },
) {
  const session = await guard();
  if (!session) return fail("Sesi berakhir", 401);
  if (!canWrite(session)) {
    return fail(
      "Peran Relawan hanya dapat membaca catatan. Hubungi administrator untuk mengubah data.",
      403,
    );
  }
  const { resource, id } = await ctx.params;
  if (!isResourceName(resource)) return fail("Sumber data tidak dikenal", 404);
  try {
    const row = await deleteRow(resource as ResourceKey, Number(id));
    if (!row) return fail("Data tidak ditemukan", 404);
    return NextResponse.json({ data: row });
  } catch {
    return fail("Gagal menghapus data", 400);
  }
}

function isResourceName(resource: string) {
  return [
    "users",
    "children",
    "rooms",
    "healthRecords",
    "educationRecords",
    "nutritionLogs",
    "aidDistributions",
    "incidents",
    "visits",
    "documents",
    "donations",
    "staff",
  ].includes(resource);
}
