"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button, EmptyState } from "@/components/ui";

export default function AppError({ error, reset }: { error: Error & { message?: string }; reset: () => void }) {
  return (
    <div className="card-surface mx-auto my-16 max-w-xl rounded-2xl">
      <EmptyState
        icon={<TriangleAlert className="size-6 text-clay" />}
        title="Modul gagal dimuat"
        description={
          error?.message
            ? `${error.message}. Periksa kembali koneksi basis data atau muat ulang halaman.`
            : "Terjadi kesalahan tak terduga saat mengambil data panti."
        }
        action={
          <Button size="sm" icon={<RotateCcw className="size-4" />} onClick={reset}>
            Coba muat ulang
          </Button>
        }
      />
    </div>
  );
}
