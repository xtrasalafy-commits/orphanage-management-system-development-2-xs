import Link from "next/link";
import { Compass } from "lucide-react";
import { Button, EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="card-surface mx-auto my-16 max-w-xl rounded-2xl">
      <EmptyState
        icon={<Compass className="size-6" />}
        title="Halaman tidak ditemukan"
        description="Data atau modul yang Anda cari mungkin telah dihapus atau tautannya salah."
        action={
          <Link href="/dashboard">
            <Button size="sm">Kembali ke dasbor</Button>
          </Link>
        }
      />
    </div>
  );
}
