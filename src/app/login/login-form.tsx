"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  FileText,
  HeartPulse,
  ShieldCheck,
  TriangleAlert,
  Users,
  Utensils,
} from "lucide-react";
import { Button, cx } from "@/components/ui";

const DEMO = [
  { username: "administrator", password: "panti123", label: "Administrator", nama: "Dra. Siti Rahmawati" },
  { username: "pengasuh", password: "panti123", label: "Pengasuh Harian", nama: "Umar Hasan Basri" },
  { username: "tatausaha", password: "panti123", label: "Tata Usaha", nama: "Aminah Zubaidah" },
];

const MODULES = [
  { icon: Users, title: "Data anak yatim & piatu", text: "Identitas, wali, status penempatan, tumbuh kembang." },
  { icon: HeartPulse, title: "Kebutuhan dasar", text: "Kesehatan, pangan & gizi, pakaian, asrama." },
  { icon: ShieldCheck, title: "Perlindungan anak", text: "Insiden, kunjungan, izin, hak dokumen." },
  { icon: Utensils, title: "Logistics & donasi", text: "Penerimaan bantuan, penyaluran, anggaran." },
];

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("administrator");
  const [password, setPassword] = useState("panti123");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error ?? "Tidak dapat masuk ke sistem");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Koneksi ke server terputus. Silakan coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* brand side */}
      <div className="grain relative hidden flex-col justify-between overflow-hidden bg-ink-900 px-12 py-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(70% 55% at 12% 8%, rgba(63,159,138,0.34) 0%, transparent 60%), radial-gradient(60% 50% at 95% 95%, rgba(200,129,31,0.22) 0%, transparent 60%)",
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-brand-500 text-white">
              <svg viewBox="0 0 24 24" fill="none" className="size-6" aria-hidden>
                <path
                  d="M12 20.5S3.8 15.3 3.8 9.6A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 8.2 2.4c0 5.7-8.2 10.9-8.2 10.9Z"
                  fill="currentColor"
                />
                <path d="M8.6 4.4h6.8M12 2.2v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
            <div>
              <p className="font-display text-[17px] leading-tight font-bold">Panti Asuhan Harapan Bangsa</p>
              <p className="text-[12.5px] text-white/50">Kab. Bandung · Jawa Barat · Est. 1998</p>
            </div>
          </div>

          <h1 className="mt-14 max-w-xl font-display text-[42px] leading-[1.05] font-bold tracking-[-0.03em]">
            Satu catatan rapi untuk setiap hak anak.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/60">
            Sistem manajemen panti asuhan yang menyatukan pemenuhan kebutuhan dasar dan perlindungan anak yatim
            piatu dalam satu dasbor — dapat diaudit, mudah dilaporkan, siap untuk pemeriksaan yayasan.
          </p>

          <ul className="mt-10 grid max-w-lg gap-3 sm:grid-cols-2">
            {MODULES.map((m) => (
              <li key={m.title} className="rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
                <m.icon className="size-4 text-brand-200" />
                <p className="mt-2 text-[13px] font-semibold text-white">{m.title}</p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-white/45">{m.text}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-end justify-between gap-6">
          <div className="flex gap-8">
            {[
              { k: "76", l: "anak binaan" },
              { k: "12", l: "pengasuh tetap" },
              { k: "100%", l: "ber-KIA" },
            ].map((s) => (
              <div key={s.l}>
                <p className="font-display text-[26px] leading-none font-bold tabular">{s.k}</p>
                <p className="mt-1 text-[11.5px] tracking-wide text-white/45 uppercase">{s.l}</p>
              </div>
            ))}
          </div>
          <p className="max-w-[190px] text-right text-[11px] leading-relaxed text-white/35">
            Standar Pelayanan Mengacu pada PMKS No. 30 Tahun 2011 tentang Standar Nasional Penyantunan Anak
          </p>
        </div>
      </div>

      {/* form side */}
      <div className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-700 text-white">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <p className="font-display text-[15px] leading-tight font-bold">Panti Asuhan Harapan Bangsa</p>
              <p className="text-[12px] text-ink-500">Sistem Manajemen Panti</p>
            </div>
          </div>

          <h2 className="font-display text-[27px] leading-tight font-bold tracking-[-0.02em]">Masuk ke dasbor</h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-500">
            Gunakan akun yayasan Anda. Semua aktivitas pencatatan tercatat atas nama akun yang masuk.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-[12.5px] font-semibold text-ink-700">
                Nama pengguna
              </label>
              <input
                id="username"
                value={username}
                autoComplete="username"
                onChange={(e) => setUsername(e.target.value)}
                className="h-11 w-full rounded-xl border border-line bg-white px-3.5 text-[14px] outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
                placeholder="administrator"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-[12.5px] font-semibold text-ink-700">
                Kata sandi
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={show ? "text" : "password"}
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-line bg-white px-3.5 pr-11 text-[14px] outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-ink-400 transition hover:bg-ink-900/5 hover:text-ink-800"
                  aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error ? (
              <div className="flex items-start gap-2 rounded-xl border border-[#f0c9bf] bg-[#fbe9e5] px-3.5 py-2.5 text-[12.5px] font-medium text-clay">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <Button type="submit" loading={busy} className="h-11 w-full" icon={!busy ? <ArrowRight className="size-4" /> : undefined}>
              {busy ? "Memverifikasi…" : "Masuk ke sistem"}
            </Button>
          </form>

          <div className="mt-7 rounded-2xl border border-line bg-white p-4">
            <p className="text-[11.5px] font-bold tracking-[0.12em] text-ink-400 uppercase">Akun demo</p>
            <div className="mt-3 space-y-2">
              {DEMO.map((d) => (
                <button
                  key={d.username}
                  onClick={() => {
                    setUsername(d.username);
                    setPassword(d.password);
                    setError(null);
                  }}
                  className={cx(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition",
                    username === d.username
                      ? "border-brand-300 bg-brand-50"
                      : "border-line hover:border-ink-300 hover:bg-paper",
                  )}
                >
                  <BookOpen className="size-4 shrink-0 text-brand-600" />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-ink-900">{d.label}</span>
                    <span className="block truncate text-[11.5px] text-ink-500">
                      {d.username} / {d.password}
                    </span>
                  </span>
                  <FileText className="ml-auto size-3.5 shrink-0 text-ink-300" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
