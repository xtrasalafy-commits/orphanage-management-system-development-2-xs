export const HARI = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

export const BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = value instanceof Date ? value : new Date(`${value}`.length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatTanggal(
  value: string | Date | null | undefined,
  opts: { style?: "short" | "long" | "day" } = {},
) {
  const d = toDate(value);
  if (!d) return "—";
  if (opts.style === "day") return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
  if (opts.style === "short") return `${d.getDate()} ${BULAN[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

export function waktuRelatif(value: string | Date | null | undefined) {
  const d = toDate(value);
  if (!d) return "—";
  const diff = Date.now() - d.getTime();
  const menit = Math.round(diff / 60000);
  if (menit < 1) return "baru saja";
  if (menit < 60) return `${menit} menit lalu`;
  const jam = Math.round(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.round(jam / 24);
  if (hari < 30) return `${hari} hari lalu`;
  const bulan = Math.round(hari / 30);
  if (bulan < 12) return `${bulan} bulan lalu`;
  return `${Math.round(bulan / 12)} tahun lalu`;
}

export function hariMenuju(value: string | Date | null | undefined) {
  const d = toDate(value);
  if (!d) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

export function rupiah(value: number | null | undefined, compact = false) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  const n = Number(value);
  if (compact) {
    if (n >= 1_000_000_000) return `Rp${(n / 1_000_000_000).toFixed(1).replace(".0", "")} M`;
    if (n >= 1_000_000) return `Rp${(n / 1_000_000).toFixed(1).replace(".0", "")} jt`;
    if (n >= 1_000) return `Rp${Math.round(n / 1_000)} rb`;
    return `Rp${n}`;
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function angka(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return new Intl.NumberFormat("id-ID").format(n);
}

export function usia(tanggalLahir: string | Date | null | undefined) {
  const d = toDate(tanggalLahir);
  if (!d) return "—";
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) years -= 1;
  if (years < 0) return "—";
  return `${years} th`;
}

export function inisial(nama: string | null | undefined) {
  if (!nama) return "??";
  const parts = nama.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? parts[parts.length - 1][0] : parts[0]?.[1] ?? "";
  return `${first}${second}`.toUpperCase();
}

export function tanggalHariIni(offsetHari = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetHari);
  return d.toISOString().slice(0, 10);
}

export const AVATAR_COLORS: Record<string, { bg: string; fg: string }> = {
  teal: { bg: "#d6ebe5", fg: "#0e4239" },
  amber: { bg: "#f7e8cf", fg: "#8a5514" },
  clay: { bg: "#f6ddd6", fg: "#8d3323" },
  sky: { bg: "#d9e7f3", fg: "#20527a" },
  plum: { bg: "#e9dcec", fg: "#5a2e5e" },
  moss: { bg: "#e0ead4", fg: "#3f5a2a" },
};
