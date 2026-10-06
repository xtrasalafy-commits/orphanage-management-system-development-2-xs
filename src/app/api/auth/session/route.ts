import { NextResponse } from "next/server";
import { canWrite, getSessionUser, ROLE_LABEL } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ user: null, canWrite: false }, { status: 200 });
  return NextResponse.json({
    user: { ...user, roleLabel: ROLE_LABEL[user.role] ?? user.role },
    canWrite: canWrite(user),
  });
}
