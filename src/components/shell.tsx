"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  Building2,
  CalendarClock,
  ChevronDown,
  ClipboardList,
  FileText,
  Gem,
  HandHeart,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldAlert,
  ShieldCheck,
  Users,
  Utensils,
  X,
} from "lucide-react";
import { Avatar, Badge, cx, Progress } from "@/components/ui";
import type { SessionUser } from "@/lib/auth";

export type ShellAlerts = {
  insidenTerbuka: number;
  dokumenPerhatian: number;
  kamarPenuh: number;
  kapasitasPersen: number;
};

type NavItem = { href: string; label: string; icon: React.ReactNode; badge?: number };
type NavGroup = { title: string; items: NavItem[] };

export function Shell({
  user,
  alerts,
  children,
}: {
  user: SessionUser;
  alerts: ShellAlerts;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const groups: NavGroup[] = useMemo(
    () => [
      {
        title: "Utama",
        items: [{ href: "/dashboard", label: "Dasbor", icon: <LayoutDashboard className="size-4" /> }],
      },
      {
        title: "Kebutuhan Dasar",
        items: [
          { href: "/anak", label: "Anak Binaan", icon: <Users className="size-4" /> },
          { href: "/kesehatan", label: "Kesehatan & Gizi Klinis", icon: <HeartPulse className="size-4" /> },
          { href: "/pendidikan", label: "Pendidikan", icon: <BookOpen className="size-4" /> },
          { href: "/gizi", label: "Pangan & Gizi Harian", icon: <Utensils className="size-4" /> },
          { href: "/perlengkapan", label: "Pakaian & Perlengkapan", icon: <Gem className="size-4" /> },
          { href: "/asrama", label: "Asrama & Kamar", icon: <Building2 className="size-4" /> },
        ],
      },
      {
        title: "Perlindungan",
        items: [
          {
            href: "/insiden",
            label: "Laporan Insiden",
            icon: <ShieldAlert className="size-4" />,
            badge: alerts.insidenTerbuka,
          },
          { href: "/kunjungan", label: "Kunjungan & Izin", icon: <CalendarClock className="size-4" /> },
          {
            href: "/dokumen",
            label: "Dokumen & Hak Anak",
            icon: <FileText className="size-4" />,
            badge: alerts.dokumenPerhatian,
          },
        ],
      },
      {
        title: "Logistik & SDM",
        items: [
          { href: "/donasi", label: "Donasi & Bantuan", icon: <HandHeart className="size-4" /> },
          { href: "/staf", label: "Staf & Pengasuh", icon: <BadgeCheck className="size-4" /> },
          { href: "/pengguna", label: "Pengguna Sistem", icon: <ClipboardList className="size-4" /> },
        ],
      },
    ],
    [alerts],
  );

  const initialsLabel = "Panti Asuhan Harapan Bangsa";

  return (
    <div className="min-h-screen lg:flex">
      {/* mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-brand-900/40 bg-ink-900 px-4 py-3 text-white lg:hidden">
        <button
          onClick={() => setOpen(true)}
          className="grid size-9 place-items-center rounded-lg bg-white/10 transition hover:bg-white/20"
          aria-label="Buka menu"
        >
          <Menu className="size-5" />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Logo className="size-7" />
          <span className="font-display text-[15px] font-bold">Harapan Bangsa</span>
        </Link>
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
            router.refresh();
          }}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-[12px] font-semibold text-white/85 transition hover:bg-white/20"
        >
          <LogOut className="size-3.5" /> Keluar
        </button>
        <Avatar nama={user.nama} warna={user.warna} size={30} />
      </header>

      {/* sidebar */}
      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-50 flex w-[272px] shrink-0 flex-col bg-ink-900 text-white/80 transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="grain flex h-full flex-col">
          <div className="flex items-center gap-3 px-5 pt-6 pb-5">
            <Logo className="size-10 shrink-0" />
            <div className="min-w-0">
              <p className="font-display truncate text-[15px] leading-tight font-bold text-white">
                Harapan Bangsa
              </p>
              <p className="truncate text-[11.5px] text-white/45">Sistem Manajemen Panti</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="ml-auto grid size-8 place-items-center rounded-lg text-white/60 hover:bg-white/10 lg:hidden"
              aria-label="Tutup menu"
            >
              <X className="size-4" />
            </button>
          </div>

          <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 pb-6">
            {groups.map((group) => (
              <div key={group.title}>
                <p className="px-2 pb-2 text-[10.5px] font-bold tracking-[0.16em] text-white/35 uppercase">
                  {group.title}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cx(
                            "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition-all",
                            active
                              ? "bg-white/[0.11] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                              : "text-white/62 hover:bg-white/[0.06] hover:text-white",
                          )}
                        >
                          {active ? (
                            <span className="absolute top-1/2 -left-3 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-300" />
                          ) : null}
                          <span className={cx("transition", active ? "text-brand-200" : "text-white/45 group-hover:text-brand-200")}>
                            {item.icon}
                          </span>
                          <span className="truncate">{item.label}</span>
                          {item.badge ? (
                            <span className="ml-auto rounded-full bg-clay px-1.5 py-0.5 text-[10.5px] font-bold text-white tabular">
                              {item.badge}
                            </span>
                          ) : (
                            <ArrowUpRight
                              className={cx(
                                "ml-auto size-3.5 shrink-0 text-white/25 transition group-hover:text-white/60",
                                !active && "opacity-0",
                              )}
                            />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="border-t border-white/10 px-4 py-4">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-white/45 uppercase">
              <Activity className="size-3.5" /> Kapasitas hunian
            </p>
            <Progress value={alerts.kapasitasPersen} tone={alerts.kamarPenuh > 0 ? "amber" : "brand"} />
            <p className="mt-2 text-[11.5px] text-white/45">
              {alerts.kapasitasPersen}% terpakai · {alerts.kamarPenuh} kamar perlu perhatian
            </p>
          </div>
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 bg-ink-900/50 backdrop-blur-[1px] lg:hidden" onClick={() => setOpen(false)} />
      ) : null}

      {/* main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 hidden items-center gap-4 border-b border-line bg-paper/85 px-6 py-3 backdrop-blur-md lg:flex">
          <div className="hidden items-center gap-2 text-[12.5px] text-ink-500 xl:flex">
            <ShieldCheck className="size-4 text-brand-500" />
            <span className="font-semibold text-ink-700">{initialsLabel}</span>
            <span className="text-ink-300">·</span>
            <span>Kab. Bandung, Jawa Barat</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/insiden"
              className="flex h-9 items-center gap-2 rounded-lg border border-line bg-white px-3 text-[12.5px] font-semibold text-ink-700 transition hover:border-clay/40 hover:text-clay"
            >
              <ShieldAlert className="size-4" />
              {alerts.insidenTerbuka > 0 ? (
                <span>{alerts.insidenTerbuka} insiden aktif</span>
              ) : (
                <span>Tidak ada insiden</span>
              )}
            </Link>
            <Link
              href="/dokumen"
              className="flex h-9 items-center gap-2 rounded-lg border border-line bg-white px-3 text-[12.5px] font-semibold text-ink-700 transition hover:border-amber-accent/40 hover:text-amber-accent"
            >
              <FileText className="size-4" />
              {alerts.dokumenPerhatian > 0 ? `${alerts.dokumenPerhatian} dokumen` : "Dokumen rapi"}
            </Link>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenu((m) => !m)}
                className="flex h-9 items-center gap-2 rounded-lg border border-line bg-white pl-1.5 pr-2.5 transition hover:border-ink-300"
              >
                <Avatar nama={user.nama} warna={user.warna} size={26} />
                <span className="max-w-[130px] truncate text-[13px] font-semibold text-ink-800">{user.nama}</span>
                <ChevronDown className={cx("size-3.5 text-ink-400 transition", menu && "rotate-180")} />
              </button>
              {menu ? (
                <div className="animate-pop absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-xl border border-line bg-white shadow-[0_24px_48px_-24px_rgba(20,32,29,0.35)]">
                  <div className="border-b border-line-soft px-4 py-3">
                    <p className="text-[13.5px] font-semibold text-ink-900">{user.nama}</p>
                    <p className="mt-0.5 text-[12px] text-ink-500">@{user.username}</p>
                    <Badge tone="green" className="mt-2">
                      {ROLE_LABEL[user.role] ?? user.role}
                    </Badge>
                  </div>
                  <button
                    onClick={async () => {
                      await fetch("/api/auth/logout", { method: "POST" });
                      router.push("/login");
                      router.refresh();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-[13px] font-semibold text-clay transition hover:bg-[#fbe9e5]"
                  >
                    <LogOut className="size-4" /> Keluar dari sesi
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1240px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

export const ROLE_LABEL: Record<string, string> = {
  administrator: "Administrator",
  pengasuh: "Pengasuh",
  tata_usaha: "Tata Usaha",
  relawan: "Relawan",
};

function Logo({ className }: { className?: string }) {
  return (
    <span className={cx("grid place-items-center rounded-xl bg-brand-500/90 text-white", className)}>
      <svg viewBox="0 0 24 24" fill="none" className="size-[62%]" aria-hidden>
        <path
          d="M12 20.5S3.8 15.3 3.8 9.6A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 8.2 2.4c0 5.7-8.2 10.9-8.2 10.9Z"
          fill="currentColor"
          opacity=".92"
        />
        <path d="M8.6 4.4h6.8M12 2.2v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </span>
  );
}
