import { redirect } from "next/navigation";
import { eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { children as childrenTable, documents, incidents, rooms } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { Shell } from "@/components/shell";
import { AppProviders } from "@/components/app-providers";

export const dynamic = "force-dynamic";

function hitungDokumenPerhatian(rows: { status: string; berlakuSampai: string | null }[]) {
  const soon = Date.now() + 90 * 86400000;
  return rows.filter(
    (d) => d.status !== "valid" || (d.berlakuSampai && new Date(`${d.berlakuSampai}T00:00:00`).getTime() <= soon),
  ).length;
}

export default async function AppLayout({ children: page }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [openIncidents, roomRows, housedKids] = await Promise.all([
    db
      .select({ id: incidents.id })
      .from(incidents)
      .where(ne(incidents.status, "selesai"))
      .then((rows) => rows.length)
      .catch(() => 0),
    db
      .select({ id: rooms.id, kapasitas: rooms.kapasitas, kondisi: rooms.kondisi })
      .from(rooms)
      .catch(() => []),
    db
      .select({ roomId: childrenTable.roomId })
      .from(childrenTable)
      .where(eq(childrenTable.status, "aktif"))
      .catch(() => []),
  ]);

  const docRows = await db
    .select({ status: documents.status, berlakuSampai: documents.berlakuSampai })
    .from(documents)
    .catch(() => []);
  const dokumenPerhatian = hitungDokumenPerhatian(docRows);

  const occupancy = new Map<number, number>();
  for (const row of housedKids) {
    if (row.roomId == null) continue;
    occupancy.set(row.roomId, (occupancy.get(row.roomId) ?? 0) + 1);
  }
  const totalCapacity = roomRows.reduce((a, r) => a + (r.kapasitas ?? 0), 0);
  const totalOccupied = [...occupancy.values()].reduce((a, b) => a + b, 0);
  const fullRooms = roomRows.filter(
    (r) => (occupancy.get(r.id) ?? 0) >= (r.kapasitas ?? 0) || r.kondisi !== "baik",
  ).length;

  return (
    <AppProviders>
      <Shell
        user={user}
        alerts={{
          insidenTerbuka: openIncidents,
          dokumenPerhatian,
          kamarPenuh: fullRooms,
          kapasitasPersen: totalCapacity ? Math.round((totalOccupied / totalCapacity) * 100) : 0,
        }}
      >
        {page}
      </Shell>
    </AppProviders>
  );
}
