import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/bricolage-grotesque";
import "./globals.css";
import { TrakteerWidget } from "@/components/trakteer-widget";

export const metadata: Metadata = {
  title: "Sistem Manajemen Panti Asuhan — Harapan Bangsa",
  description:
    "Pencatatan kebutuhan dasar dan perlindungan anak yatim piatu: data anak, kesehatan, gizi, pendidikan, asrama, insiden perlindungan, kunjungan, dokumen, dan donasi.",
};

export const viewport: Viewport = {
  themeColor: "#14201d",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-paper text-ink-900 antialiased">
        {children}
        <TrakteerWidget />
      </body>
    </html>
  );
}
