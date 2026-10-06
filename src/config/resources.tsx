import type { ReactNode } from "react";
import {
  BadgeAlert,
  BedDouble,
  BookOpen,
  Building2,
  CalendarClock,
  FileWarning,
  HandHeart,
  HeartPulse,
  ShieldAlert,
  UserCog,
  Users,
  Utensils,
} from "lucide-react";
import { Avatar, Badge, Progress, type Tone } from "@/components/ui";
import type { Ctx, Option, ResourceConfig } from "@/components/data/resource-view";
import { StatusBadge } from "@/components/data/resource-view";
import { formatTanggal, hariMenuju, rupiah, usia } from "@/lib/format";

/* ------------------------------------------------------------------ */
/* shared option sets                                                  */
/* ------------------------------------------------------------------ */

const opt = (pairs: [string, string][]): Option[] => pairs.map(([value, label]) => ({ value, label }));

export const STATUS_ANAK = opt([
  ["yatim", "Yatim"],
  ["piatu", "Piatu"],
  ["yatim-piatu", "Yatim Piatu"],
  ["fakir-miskin", "Fakir Miskin"],
  ["terlantar", "Terlantar"],
]);

export const STATUS_PENEMPATAN = opt([
  ["aktif", "Huni aktif"],
  ["titip", "Titip sementara"],
  ["pulang", "Pulang ke keluarga"],
  ["lulus", "Lulus / mandiri"],
  ["dipindahkan", "Dipindahkan"],
]);

export const KONDISI_KESEHATAN = opt([
  ["Sehat", "Sehat"],
  ["Pengobatan rutin", "Pengobatan rutin"],
  ["Rujukan RS", "Rujukan rumah sakit"],
  ["Pemulihan gizi", "Pemulihan gizi"],
  ["Disabilitas", "Disabilitas / kebutuhan khusus"],
]);

const yesNo = (map: Record<string, { label: string; tone: Tone }>) => map;

export const STATUS_CHILD = yesNo({
  aktif: { label: "Huni aktif", tone: "green" },
  titip: { label: "Titip sementara", tone: "blue" },
  pulang: { label: "Pulang", tone: "neutral" },
  lulus: { label: "Lulus / mandiri", tone: "violet" },
  dipindahkan: { label: "Dipindahkan", tone: "amber" },
});

const STATUS_ANAK_KIND = yesNo({
  yatim: { label: "Yatim", tone: "blue" },
  piatu: { label: "Piatu", tone: "violet" },
  "yatim-piatu": { label: "Yatim Piatu", tone: "red" },
  "fakir-miskin": { label: "Fakir Miskin", tone: "amber" },
  terlantar: { label: "Terlantar", tone: "neutral" },
});

/* ------------------------------------------------------------------ */
/* helpers                                                            */
/* ------------------------------------------------------------------ */

function childCell(childId: unknown, ctx: Ctx, extra?: ReactNode) {
  const child = ctx.lookup("children")[Number(childId)];
  if (!child) return <span className="text-[13px] text-ink-400">Tanpa anak binaan</span>;
  return (
    <div className="flex items-center gap-2.5">
      <Avatar nama={String(child.nama ?? "")} warna={(child.warna as string) ?? "teal"} size={30} />
      <div className="min-w-0">
        <p className="truncate text-[13.5px] font-semibold text-ink-900">{String(child.nama)}</p>
        <p className="truncate text-[11.5px] text-ink-400">
          {String(child.nis ?? "—")}
          {extra ? ` · ${extra}` : ""}
        </p>
      </div>
    </div>
  );
}

function tanggalCell(value: unknown) {
  return <span className="text-[13px] tabular text-ink-600">{formatTanggal(value as string, { style: "short" })}</span>;
}

function moneyCell(value: unknown) {
  const n = Number(value ?? 0);
  return <span className="text-[13px] tabular font-semibold text-ink-800">{rupiah(n)}</span>;
}

function occupancyOf(ctx: Ctx, roomId: number) {
  return (ctx.data.children ?? []).filter(
    (c) => Number(c.roomId) === roomId && c.status === "aktif",
  ).length;
}

/* ------------------------------------------------------------------ */
/* Anak binaan                                                         */
/* ------------------------------------------------------------------ */

export const childrenConfig: ResourceConfig = {
  resource: "children",
  title: "Data Anak Binaan",
  eyebrow: "Kebutuhan Dasar",
  icon: <Users className="size-3.5" />,
  description:
    "Register induk anak yatim dan piatu: identitas, asal keluarga, kondisi kesehatan awal, kamar, dan pendamping pengasuh.",
  createLabel: "Daftarkan anak",
  editLabel: "Ubah data",
  rowHref: (row) => `/anak/${row.id}`,
  relations: ["rooms", "children"],
  searchKeys: ["nama", "nis", "asalDaerah", "waliNama", "pengasuh"],
  filters: [
    { key: "statusAnak", label: "Status", options: STATUS_ANAK },
    { key: "status", label: "Penempatan", options: STATUS_PENEMPATAN },
    { key: "jenisKelamin", label: "LK/PR", options: opt([["L", "Laki-laki"], ["P", "Perempuan"]]) },
  ],
  columns: [
    {
      key: "nama",
      header: "Nama & NIS",
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar nama={String(row.nama)} size={34} />
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-ink-900">{String(row.nama)}</p>
            <p className="truncate text-[11.5px] text-ink-400">
              {String(row.nis)} · {row.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "tanggalLahir",
      header: "Usia",
      render: (row) => (
        <div>
          <p className="text-[13px] font-semibold tabular text-ink-800">{usia(row.tanggalLahir as string)}</p>
          <p className="text-[11.5px] text-ink-400">{formatTanggal(row.tanggalLahir as string, { style: "short" })}</p>
        </div>
      ),
      sortValue: (row) => String(row.tanggalLahir ?? ""),
    },
    {
      key: "statusAnak",
      header: "Status anak",
      render: (row) => <StatusBadge value={row.statusAnak as string} map={STATUS_ANAK_KIND} />,
    },
    {
      key: "roomId",
      header: "Kamar",
      hideOnMobile: false,
      render: (row, ctx) => {
        const room = ctx.lookup("rooms")[Number(row.roomId)];
        if (!room) return <span className="text-[13px] text-amber-accent">Belum ditempatkan</span>;
        return (
          <div>
            <p className="text-[13px] font-semibold text-ink-800">{String(room.nama)}</p>
            <p className="text-[11.5px] text-ink-400">Blok {String(room.blok)}</p>
          </div>
        );
      },
    },
    {
      key: "asalDaerah",
      header: "Asal daerah",
      render: (row) => <span className="text-[13px] text-ink-600">{String(row.asalDaerah ?? "—")}</span>,
    },
    {
      key: "kondisiKesehatan",
      header: "Kondisi",
      render: (row) => (
        <span className="text-[13px] text-ink-700">{String(row.kondisiKesehatan ?? "Sehat")}</span>
      ),
    },
    {
      key: "status",
      header: "Penempatan",
      align: "right",
      render: (row) => <StatusBadge value={row.status as string} map={STATUS_CHILD} />,
    },
  ],
  fields: [
    { key: "nis", label: "NIS / Nomor induk", type: "text", required: true, placeholder: "PA-2026-041" },
    { key: "nama", label: "Nama lengkap", type: "text", required: true, placeholder: "Nama anak" },
    {
      key: "jenisKelamin",
      label: "Jenis kelamin",
      type: "select",
      required: true,
      options: opt([["L", "Laki-laki"], ["P", "Perempuan"]]),
      defaultValue: "L",
    },
    { key: "tanggalLahir", label: "Tanggal lahir", type: "date", required: true },
    { key: "tempatLahir", label: "Tempat lahir", type: "text", placeholder: "Kab. Bandung" },
    { key: "asalDaerah", label: "Asal daerah / kota", type: "text", placeholder: "Ciparay, Bandung" },
    {
      key: "statusAnak",
      label: "Status anak",
      type: "select",
      required: true,
      options: STATUS_ANAK,
      defaultValue: "yatim",
    },
    {
      key: "agama",
      label: "Agama",
      type: "select",
      options: opt([["Islam", "Islam"], ["Kristen", "Kristen"], ["Katolik", "Katolik"], ["Hindu", "Hindu"], ["Buddha", "Buddha"], ["Konghucu", "Konghucu"]]),
      defaultValue: "Islam",
    },
    { key: "tanggalMasuk", label: "Tanggal masuk panti", type: "date", required: true },
    {
      key: "status",
      label: "Status penempatan",
      type: "select",
      required: true,
      options: STATUS_PENEMPATAN,
      defaultValue: "aktif",
    },
    { key: "roomId", label: "Kamar / asrama", type: "relation", relation: { resource: "rooms" }, help: "Kosongkan bila belum ditempatkan" },
    { key: "pengasuh", label: "Pengasuh pendamping", type: "text", placeholder: "Nama pengasuh" },
    { key: "waliNama", label: "Nama wali / keluarga", type: "text" },
    { key: "waliKontak", label: "Kontak wali", type: "text", placeholder: "0812xxxxxxx" },
    { key: "kondisiKesehatan", label: "Kondisi kesehatan", type: "select", options: KONDISI_KESEHATAN, defaultValue: "Sehat" },
    { key: "golonganDarah", label: "Golongan darah", type: "select", options: opt([["A", "A"], ["B", "B"], ["AB", "AB"], ["O", "O"], ["-", "Belum tahu"]]) },
    { key: "beratBadan", label: "Berat badan", type: "number", suffix: "kg", min: 5, max: 160, step: 1 },
    { key: "tinggiBadan", label: "Tinggi badan", type: "number", suffix: "cm", min: 50, max: 220 },
    { key: "kebutuhanKhusus", label: "Kebutuhan khusus", type: "text", placeholder: "Kacamata, terapi wicara, dll." },
    { key: "catatan", label: "Catatan perkembangan", type: "textarea", span: 2, placeholder: "Riwayat penerimaan, kondisi keluarga, catatan asesmen awal…" },
  ],
  newDefaults: () => ({ jenisKelamin: "L", statusAnak: "yatim", status: "aktif", agama: "Islam", kondisiKesehatan: "Sehat", tanggalMasuk: new Date().toISOString().slice(0, 10) }),
  summary: (rows) => {
    const aktif = rows.filter((r) => r.status === "aktif");
    const yatimPiatu = rows.filter((r) => r.statusAnak === "yatim-piatu");
    const tanpaKamar = aktif.filter((r) => !r.roomId);
    const avgAge = Math.round(
      aktif.reduce((a, r) => a + (Number(String(usia(r.tanggalLahir as string)).replace(" th", "")) || 0), 0) /
        Math.max(aktif.length, 1),
    );
    return [
      { label: "Anak terdaftar", value: rows.length, hint: `${aktif.length} menghuni panti` },
      { label: "Yatim piatu", value: yatimPiatu.length, hint: `${Math.round((yatimPiatu.length / Math.max(rows.length, 1)) * 100)}% dari register` },
      { label: "Rata-rata usia", value: `${avgAge} th`, hint: "Berdasarkan anak huni aktif" },
      { label: "Belum punya kamar", value: tanpaKamar.length, hint: "Perlu penempatan asrama" },
    ];
  },
};

/* ------------------------------------------------------------------ */
/* Kesehatan                                                           */
/* ------------------------------------------------------------------ */

const JENIS_KESEHATAN = opt([
  ["pemeriksaan", "Pemeriksaan rutin"],
  ["imunisasi", "Imunisasi"],
  ["pengobatan", "Pengobatan / obat"],
  ["rawat-jalan", "Rawat jalan"],
  ["rawat-inap", "Rawat inap"],
  ["konsultasi-jiwa", "Dukungan psikologi"],
  ["gizi", "Pemantauan gizi"],
  ["kesehatan-gigi", "Kesehatan gigi"],
]);

const STATUS_KESEHATAN = yesNo({
  selesai: { label: "Selesai", tone: "green" },
  "perlu-kontrol": { label: "Perlu kontrol", tone: "amber" },
  dirujuk: { label: "Dirujuk", tone: "red" },
  dipantau: { label: "Dipantau", tone: "blue" },
});

export const healthConfig: ResourceConfig = {
  resource: "healthRecords",
  title: "Layanan Kesehatan Anak",
  eyebrow: "Kebutuhan Dasar",
  icon: <HeartPulse className="size-3.5" />,
  description:
    "Setiap kunjungan klinik, pengobatan, imunisasi, dan dukungan kesehatan jiwa tercatat per anak lengkap dengan biaya serta tindak lanjut.",
  createLabel: "Catat layanan",
  relations: ["children"],
  searchKeys: ["petugas", "fasilitas", "diagnosis", "keluhan"],
  extraSearch: (row, ctx) => String(ctx.lookup("children")[Number(row.childId)]?.nama ?? ""),
  filters: [
    { key: "jenis", label: "Jenis", options: JENIS_KESEHATAN },
    { key: "status", label: "Tindak lanjut", options: opt(Object.entries(STATUS_KESEHATAN).map(([k, v]) => [k, v.label])) },
  ],
  columns: [
    { key: "childId", header: "Anak", render: (row, ctx) => childCell(row.childId, ctx) },
    { key: "tanggal", header: "Tanggal", render: (row) => tanggalCell(row.tanggal) },
    {
      key: "jenis",
      header: "Jenis layanan",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Badge tone="neutral">{JENIS_KESEHATAN.find((o) => o.value === row.jenis)?.label ?? String(row.jenis)}</Badge>
        </div>
      ),
    },
    {
      key: "diagnosis",
      header: "Diagnosis & tindakan",
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-ink-800">{String(row.diagnosis ?? "—")}</p>
          <p className="truncate text-[11.5px] text-ink-400">{String(row.tindakan ?? row.keluhan ?? "—")}</p>
        </div>
      ),
    },
    { key: "fasilitas", header: "Fasilitas / petugas", render: (row) => (
      <div className="min-w-0">
        <p className="truncate text-[13px] text-ink-700">{String(row.fasilitas ?? "—")}</p>
        <p className="truncate text-[11.5px] text-ink-400">{String(row.petugas ?? "—")}</p>
      </div>
    ) },
    { key: "biaya", header: "Biaya", align: "right", render: (row) => moneyCell(row.biaya) },
    { key: "status", header: "Status", align: "right", render: (row) => <StatusBadge value={row.status as string} map={STATUS_KESEHATAN} /> },
  ],
  fields: [
    { key: "childId", label: "Anak binaan", type: "relation", relation: { resource: "children" }, required: true, span: 2 },
    { key: "tanggal", label: "Tanggal layanan", type: "date", required: true },
    { key: "jenis", label: "Jenis layanan", type: "select", options: JENIS_KESEHATAN, required: true, defaultValue: "pemeriksaan" },
    { key: "fasilitas", label: "Fasilitas kesehatan", type: "text", placeholder: "Puskesmas Ciparay / Klinik Panti" },
    { key: "petugas", label: "Petugas / dokter", type: "text" },
    { key: "keluhan", label: "Keluhan", type: "textarea" },
    { key: "diagnosis", label: "Diagnosis", type: "text" },
    { key: "tindakan", label: "Tindakan / resep", type: "textarea" },
    { key: "biaya", label: "Biaya layanan", type: "number", money: true, min: 0, defaultValue: 0 },
    { key: "status", label: "Tindak lanjut", type: "select", required: true, options: opt(Object.entries(STATUS_KESEHATAN).map(([k, v]) => [k, v.label])), defaultValue: "selesai" },
  ],
  newDefaults: () => ({ tanggal: new Date().toISOString().slice(0, 10), jenis: "pemeriksaan", status: "selesai", biaya: 0 }),
  summary: (rows) => {
    const biaya = rows.reduce((a, r) => a + Number(r.biaya ?? 0), 0);
    const perlu = rows.filter((r) => r.status !== "selesai").length;
    const rutin = rows.filter((r) => r.jenis === "pemeriksaan" || r.jenis === "imunisasi").length;
    return [
      { label: "Layanan tercatat", value: rows.length, hint: "Sepanjang periode berjalan" },
      { label: "Perlu tindak lanjut", value: perlu, hint: "Kontrol ulang / rujukan" },
      { label: "Pencegahan", value: rutin, hint: "Pemeriksaan & imunisasi" },
      { label: "Total biaya", value: rupiah(biaya, true), hint: "Dibayar dari kas panti" },
    ];
  },
};

/* ------------------------------------------------------------------ */
/* Pendidikan                                                          */
/* ------------------------------------------------------------------ */

const JENJANG = opt([["SD", "SD / Ibtidaiah"], ["SMP", "SMP / Tsanawiyah"], ["SMA", "SMA / Aliyah"], ["KEJAR", "Kejar Paket"], ["PESANTREN", "Pesantren"], ["KURSUS", "Kursus / vokasi"]]);
const STATUS_PENDIDIKAN = yesNo({
  aktif: { label: "Aktif", tone: "green" },
  lulus: { label: "Lulus", tone: "violet" },
  pindah: { label: "Pindah sekolah", tone: "amber" },
  putus: { label: "Putus sekolah", tone: "red" },
});

export const educationConfig: ResourceConfig = {
  resource: "educationRecords",
  title: "Pendidikan & Akademik",
  eyebrow: "Kebutuhan Dasar",
  icon: <BookOpen className="size-3.5" />,
  description:
    "Pemantauan sekolah, kehadiran, capaian nilai, biaya SPP, serta prestasi setiap anak binaan di jalur formal maupun non-formal.",
  createLabel: "Tambah rapor",
  relations: ["children"],
  searchKeys: ["sekolah", "kelas", "waliKelas", "prestasi"],
  extraSearch: (row, ctx) => String(ctx.lookup("children")[Number(row.childId)]?.nama ?? ""),
  filters: [
    { key: "jenjang", label: "Jenjang", options: JENJANG },
    { key: "status", label: "Status", options: opt(Object.entries(STATUS_PENDIDIKAN).map(([k, v]) => [k, v.label])) },
  ],
  columns: [
    { key: "childId", header: "Anak", render: (row, ctx) => childCell(row.childId, ctx, row.kelas ? `Kelas ${row.kelas}` : undefined) },
    {
      key: "sekolah",
      header: "Satuan pendidikan",
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-ink-800">{String(row.sekolah ?? "—")}</p>
          <p className="truncate text-[11.5px] text-ink-400">
            {JENJANG.find((o) => o.value === row.jenjang)?.label ?? String(row.jenjang)} · {String(row.tahunAjaran ?? "")}
          </p>
        </div>
      ),
    },
    {
      key: "kehadiran",
      header: "Kehadiran",
      render: (row) => {
        const v = Number(row.kehadiran ?? 0);
        return (
          <div className="w-28">
            <div className="mb-1 flex justify-between text-[11.5px]">
              <span className="tabular font-semibold text-ink-800">{v}%</span>
              <span className={v < 90 ? "text-clay" : "text-ink-300"}>{v < 90 ? "rendah" : "baik"}</span>
            </div>
            <Progress value={v} tone={v < 90 ? "clay" : v < 95 ? "amber" : "brand"} />
          </div>
        );
      },
    },
    { key: "nilaiRata", header: "Nilai", align: "right", render: (row) => <span className="text-[13px] tabular font-semibold text-ink-800">{row.nilaiRata ? Number(row.nilaiRata).toFixed(1) : "—"}</span> },
    { key: "prestasi", header: "Prestasi / catatan", render: (row) => <span className="line-clamp-2 text-[12.5px] text-ink-600">{String(row.prestasi ?? "—")}</span> },
    { key: "biayaSpp", header: "SPP / bulan", align: "right", render: (row) => moneyCell(row.biayaSpp) },
    { key: "status", header: "Status", align: "right", render: (row) => <StatusBadge value={row.status as string} map={STATUS_PENDIDIKAN} /> },
  ],
  fields: [
    { key: "childId", label: "Anak binaan", type: "relation", relation: { resource: "children" }, required: true, span: 2 },
    { key: "tahunAjaran", label: "Tahun ajaran", type: "text", defaultValue: "2025/2026", required: true },
    { key: "jenjang", label: "Jenjang", type: "select", options: JENJANG, required: true, defaultValue: "SD" },
    { key: "sekolah", label: "Nama sekolah", type: "text", required: true, placeholder: "SD Negeri 1 Ciparay" },
    { key: "kelas", label: "Kelas", type: "text", placeholder: "5B" },
    { key: "kehadiran", label: "Kehadiran", type: "number", suffix: "%", min: 0, max: 100, defaultValue: 95 },
    { key: "nilaiRata", label: "Nilai rata-rata", type: "number", min: 0, max: 100 },
    { key: "waliKelas", label: "Wali kelas", type: "text" },
    { key: "biayaSpp", label: "Biaya SPP / bulan", type: "number", money: true, min: 0, defaultValue: 0 },
    { key: "prestasi", label: "Prestasi / catatan guru", type: "textarea", span: 2 },
    { key: "status", label: "Status pendidikan", type: "select", options: opt(Object.entries(STATUS_PENDIDIKAN).map(([k, v]) => [k, v.label])), required: true, defaultValue: "aktif" },
  ],
  newDefaults: () => ({ tahunAjaran: "2025/2026", jenjang: "SD", status: "aktif", kehadiran: 95, biayaSpp: 0 }),
  summary: (rows) => {
    const aktif = rows.filter((r) => r.status === "aktif");
    const rataKehadiran = aktif.length ? aktif.reduce((a, r) => a + Number(r.kehadiran ?? 0), 0) / aktif.length : 0;
    const spp = rows.reduce((a, r) => a + Number(r.biayaSpp ?? 0), 0);
    const rendah = rows.filter((r) => Number(r.kehadiran ?? 100) < 90).length;
    return [
      { label: "Rapor aktif", value: aktif.length, hint: "Tahun ajaran 2025/2026" },
      { label: "Rata-rata kehadiran", value: `${rataKehadiran.toFixed(1)}%`, hint: "Target panti 95%" },
      { label: "Perlu pendampingan", value: rendah, hint: "Kehadiran di bawah 90%" },
      { label: "Beban SPP / bulan", value: rupiah(spp, true), hint: "Anggaran pendidikan" },
    ];
  },
};

/* ------------------------------------------------------------------ */
/* Pangan & gizi harian                                                 */
/* ------------------------------------------------------------------ */

const WAKTU = opt([["pagi", "Sarapan"], ["siang", "Makan siang"], ["sore", "Makan malam"], ["snack", "Pangan tambahan"]]);
const STATUS_GIZI = yesNo({
  baik: { label: "Baik", tone: "green" },
  "perlu-perhatian": { label: "Perlu perhatian", tone: "amber" },
  buruk: { label: "Kurang", tone: "red" },
});

export const nutritionConfig: ResourceConfig = {
  resource: "nutritionLogs",
  title: "Pangan & Gizi Harian",
  eyebrow: "Kebutuhan Dasar",
  icon: <Utensils className="size-3.5" />,
  description:
    "Jurnal dapur panti: menu, jumlah porsi yang terpenuhi dibanding kebutuhan, anggaran belanja harian, dan status gizi kelompok.",
  createLabel: "Catat konsumsi",
  searchKeys: ["menu", "petugas", "catatan"],
  filters: [
    { key: "waktu", label: "Waktu", options: WAKTU },
    { key: "statusGizi", label: "Status gizi", options: opt(Object.entries(STATUS_GIZI).map(([k, v]) => [k, v.label])) },
  ],
  columns: [
    { key: "tanggal", header: "Tanggal", render: (row) => (
      <div>
        <p className="text-[13px] font-semibold text-ink-800">{formatTanggal(row.tanggal as string, { style: "short" })}</p>
        <p className="text-[11.5px] text-ink-400">{formatTanggal(row.tanggal as string, { style: "day" }).split(",")[0]}</p>
      </div>
    ) },
    { key: "waktu", header: "Waktu", render: (row) => <Badge tone="neutral">{WAKTU.find((o) => o.value === row.waktu)?.label ?? String(row.waktu)}</Badge> },
    { key: "menu", header: "Menu", render: (row) => <span className="text-[13.5px] font-medium text-ink-900">{String(row.menu)}</span> },
    {
      key: "porsiTerpenuhi",
      header: "Porsi terpenuhi",
      render: (row) => {
        const need = Number(row.jumlahAnak ?? 0) || 1;
        const done = Number(row.porsiTerpenuhi ?? 0);
        const pct = Math.round((done / need) * 100);
        return (
          <div className="w-32">
            <div className="mb-1 flex justify-between text-[11.5px]">
              <span className="tabular font-semibold text-ink-800">{done}/{need}</span>
              <span className={pct < 100 ? "text-clay" : "text-brand-600"}>{pct}%</span>
            </div>
            <Progress value={Math.min(pct, 100)} tone={pct < 90 ? "clay" : pct < 100 ? "amber" : "brand"} />
          </div>
        );
      },
    },
    { key: "petugas", header: "Penanggung jawab", render: (row) => <span className="text-[13px] text-ink-600">{String(row.petugas ?? "—")}</span> },
    { key: "anggaran", header: "Anggaran", align: "right", render: (row) => moneyCell(row.anggaran) },
    { key: "statusGizi", header: "Status gizi", align: "right", render: (row) => <StatusBadge value={row.statusGizi as string} map={STATUS_GIZI} /> },
  ],
  fields: [
    { key: "tanggal", label: "Tanggal", type: "date", required: true },
    { key: "waktu", label: "Waktu makan", type: "select", options: WAKTU, required: true, defaultValue: "pagi" },
    { key: "menu", label: "Menu", type: "text", required: true, placeholder: "Nasi uduk, telur balado, tumis kangkung" },
    { key: "jumlahAnak", label: "Anak membutuhkan porsi", type: "number", min: 0, required: true, defaultValue: 76 },
    { key: "porsiTerpenuhi", label: "Porsi tersaji", type: "number", min: 0, required: true, defaultValue: 76 },
    { key: "anggaran", label: "Anggaran belanja", type: "number", money: true, min: 0, defaultValue: 0 },
    { key: "statusGizi", label: "Status gizi kelompok", type: "select", required: true, options: opt(Object.entries(STATUS_GIZI).map(([k, v]) => [k, v.label])), defaultValue: "baik" },
    { key: "petugas", label: "Petugas dapur", type: "text" },
    { key: "catatan", label: "Catatan dapur", type: "textarea", span: 2, placeholder: "Menu favorit, pantangan, catatan bahan makanan…" },
  ],
  newDefaults: () => ({ tanggal: new Date().toISOString().slice(0, 10), waktu: "pagi", statusGizi: "baik", jumlahAnak: 76, porsiTerpenuhi: 76 }),
  summary: (rows) => {
    const gap = rows.reduce((a, r) => a + Math.max(0, Number(r.jumlahAnak ?? 0) - Number(r.porsiTerpenuhi ?? 0)), 0);
    const belanja = rows.reduce((a, r) => a + Number(r.anggaran ?? 0), 0);
    const penuh = rows.filter((r) => Number(r.porsiTerpenuhi ?? 0) >= Number(r.jumlahAnak ?? 0)).length;
    return [
      { label: "Jurnal makan", value: rows.length, hint: "Entri konsumsi tercatat" },
      { label: "Porsi penuh", value: `${Math.round((penuh / Math.max(rows.length, 1)) * 100)}%`, hint: "Menu terpenuhi seluruhnya" },
      { label: "Kekurangan porsi", value: gap, hint: "Akumulasi porsi belum terpenuhi" },
      { label: "Belanja dapur", value: rupiah(belanja, true), hint: "Total tercatat" },
    ];
  },
};

/* ------------------------------------------------------------------ */
/* Pakaian & perlengkapan                                              */
/* ------------------------------------------------------------------ */

const KATEGORI_BANTUAN = opt([
  ["pakaian", "Pakaian harian"],
  ["seragam", "Seragam sekolah"],
  ["sepatu", "Sepatu & sandal"],
  ["tas", "Tas & alat tulis"],
  ["mandi", "Perlengkapan mandi"],
  ["tidur", "Kasur & selimut"],
  ["ibadah", "Perlengkapan ibadah"],
  ["khusus", "Kebutuhan khusus"],
]);
const STATUS_BANTUAN = yesNo({
  diajukan: { label: "Diajukan", tone: "amber" },
  disetujui: { label: "Disetujui", tone: "blue" },
  disalurkan: { label: "Disalurkan", tone: "green" },
  ditunda: { label: "Ditunda", tone: "neutral" },
});

export const aidConfig: ResourceConfig = {
  resource: "aidDistributions",
  title: "Pakaian & Perlengkapan",
  eyebrow: "Kebutuhan Dasar",
  icon: <BadgeAlert className="size-3.5" />,
  description:
    "Permintaan dan penyaluran barang kebutuhan pribadi anak — dari seragam, alat tulis, hingga kasur — lengkap dengan sumber stok atau donasi.",
  createLabel: "Catat perlengkapan",
  relations: ["children"],
  searchKeys: ["item", "sumber", "catatan"],
  extraSearch: (row, ctx) => String(ctx.lookup("children")[Number(row.childId)]?.nama ?? ""),
  filters: [
    { key: "kategori", label: "Kategori", options: KATEGORI_BANTUAN },
    { key: "status", label: "Status", options: opt(Object.entries(STATUS_BANTUAN).map(([k, v]) => [k, v.label])) },
  ],
  columns: [
    { key: "item", header: "Barang", render: (row) => (
      <div className="min-w-0">
        <p className="truncate text-[13.5px] font-semibold text-ink-900">{String(row.item)}</p>
        <p className="truncate text-[11.5px] text-ink-400">{KATEGORI_BANTUAN.find((o) => o.value === row.kategori)?.label ?? "Umum"}</p>
      </div>
    ) },
    { key: "childId", header: "Penerima", render: (row, ctx) => childCell(row.childId, ctx) },
    { key: "jumlah", header: "Jumlah", align: "right", render: (row) => <span className="tabular font-semibold text-ink-800">{Number(row.jumlah ?? 0)}</span> },
    { key: "tanggal", header: "Tanggal", render: (row) => tanggalCell(row.tanggal) },
    { key: "sumber", header: "Sumber", render: (row) => <span className="text-[13px] text-ink-600">{String(row.sumber ?? "Stok panti")}</span> },
    { key: "status", header: "Status", align: "right", render: (row) => <StatusBadge value={row.status as string} map={STATUS_BANTUAN} /> },
  ],
  fields: [
    { key: "item", label: "Nama barang", type: "text", required: true, placeholder: "Seragam batik 2 stel" },
    { key: "kategori", label: "Kategori", type: "select", options: KATEGORI_BANTUAN, required: true, defaultValue: "pakaian" },
    { key: "childId", label: "Penerima (anak)", type: "relation", relation: { resource: "children" }, help: "Kosongkan untuk pembagian kelompok" },
    { key: "jumlah", label: "Jumlah", type: "number", min: 1, required: true, defaultValue: 1 },
    { key: "tanggal", label: "Tanggal", type: "date", required: true },
    { key: "sumber", label: "Sumber barang", type: "text", placeholder: "Stok gudang / Donasi Yayasan Al-Ikhlas" },
    { key: "status", label: "Status", type: "select", options: opt(Object.entries(STATUS_BANTUAN).map(([k, v]) => [k, v.label])), required: true, defaultValue: "diajukan" },
    { key: "catatan", label: "Catatan", type: "textarea", span: 2 },
  ],
  newDefaults: () => ({ tanggal: new Date().toISOString().slice(0, 10), kategori: "pakaian", status: "diajukan", jumlah: 1 }),
  summary: (rows) => {
    const diajukan = rows.filter((r) => r.status === "diajukan").length;
    const unit = rows.reduce((a, r) => a + Number(r.jumlah ?? 0), 0);
    const disalurkan = rows.filter((r) => r.status === "disalurkan").length;
    return [
      { label: "Entri perlengkapan", value: rows.length, hint: `${unit} unit tercatat` },
      { label: "Menunggu persetujuan", value: diajukan, hint: "Perlu keputusan pengasuh" },
      { label: "Sudah disalurkan", value: disalurkan, hint: "Terkirim ke anak" },
      { label: "Kelengkapan kategori", value: new Set(rows.map((r) => r.kategori)).size, hint: "Dari 8 kategori standar" },
    ];
  },
};

/* ------------------------------------------------------------------ */
/* Asrama                                                              */
/* ------------------------------------------------------------------ */

const KONDISI = yesNo({
  baik: { label: "Baik", tone: "green" },
  "perlu-perbaikan": { label: "Perlu perbaikan", tone: "amber" },
  rusak: { label: "Rusak", tone: "red" },
});

export const roomsConfig: ResourceConfig = {
  resource: "rooms",
  title: "Asrama & Kamar",
  eyebrow: "Kebutuhan Dasar",
  icon: <Building2 className="size-3.5" />,
  description:
    "Tata hunian panti: kapasitas, kondisi fisik kamar, dan tingkat keterisian untuk memastikan jarak aman serta rasio penghuni yang layak.",
  createLabel: "Tambah kamar",
  relations: ["children"],
  searchKeys: ["nama", "blok", "penanggungJawab"],
  filters: [
    { key: "jenis", label: "Tipe", options: opt([["putra", "Putra"], ["putri", "Putri"]]) },
    { key: "kondisi", label: "Kondisi", options: opt(Object.entries(KONDISI).map(([k, v]) => [k, v.label])) },
  ],
  columns: [
    { key: "nama", header: "Kamar", render: (row) => (
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-100">
          <BedDouble className="size-4" />
        </span>
        <div>
          <p className="text-[13.5px] font-semibold text-ink-900">{String(row.nama)}</p>
          <p className="text-[11.5px] text-ink-400">Blok {String(row.blok)} · Lantai {String(row.lantai)} · {String(row.jenis)}</p>
        </div>
      </div>
    ) },
    { key: "kapasitas", header: "Kapasitas", align: "right", render: (row) => <span className="tabular text-[13px] text-ink-700">{Number(row.kapasitas)} tempat tidur</span> },
    {
      key: "occupancy",
      header: "Keterisian",
      sortValue: (row, ctx) => occupancyOf(ctx, Number(row.id)),
      render: (row, ctx) => {
        const occ = occupancyOf(ctx, Number(row.id));
        const cap = Number(row.kapasitas ?? 0) || 1;
        const pct = Math.round((occ / cap) * 100);
        return (
          <div className="w-36">
            <div className="mb-1 flex justify-between text-[11.5px]">
              <span className="tabular font-semibold text-ink-800">{occ}/{cap} anak</span>
              <span className={pct >= 100 ? "text-clay" : pct > 85 ? "text-amber-accent" : "text-ink-300"}>
                {pct >= 100 ? "penuh" : `${pct}%`}
              </span>
            </div>
            <Progress value={Math.min(pct, 100)} tone={pct >= 100 ? "clay" : pct > 85 ? "amber" : "brand"} />
          </div>
        );
      },
    },
    { key: "penanggungJawab", header: "Penanggung jawab", render: (row) => <span className="text-[13px] text-ink-600">{String(row.penanggungJawab ?? "—")}</span> },
    { key: "kondisi", header: "Kondisi", align: "right", render: (row) => <StatusBadge value={row.kondisi as string} map={KONDISI} /> },
  ],
  fields: [
    { key: "nama", label: "Nama kamar", type: "text", required: true, placeholder: "Kamar Melati 01" },
    { key: "blok", label: "Blok / gedung", type: "text", required: true, placeholder: "A" },
    { key: "lantai", label: "Lantai", type: "number", min: 0, max: 5, defaultValue: 1 },
    { key: "jenis", label: "Tipe hunian", type: "select", options: opt([["putra", "Putra"], ["putri", "Putri"]]), required: true, defaultValue: "putra" },
    { key: "kapasitas", label: "Kapasitas", type: "number", min: 1, max: 40, required: true, defaultValue: 8 },
    { key: "kondisi", label: "Kondisi fisik", type: "select", options: opt(Object.entries(KONDISI).map(([k, v]) => [k, v.label])), required: true, defaultValue: "baik" },
    { key: "penanggungJawab", label: "Penanggung jawab", type: "text", span: 2 },
    { key: "catatan", label: "Catatan", type: "textarea", span: 2, placeholder: "Kebutuhan perbaikan, inventaris kamar, dsb." },
  ],
  newDefaults: () => ({ kondisi: "baik", kapasitas: 8, lantai: 1, jenis: "putra" }),
  summary: (rows, ctx) => {
    const kids = (ctx.data.children ?? []).filter((c) => c.status === "aktif" && c.roomId);
    const cap = rows.reduce((a, r) => a + Number(r.kapasitas ?? 0), 0);
    const perlu = rows.filter((r) => r.kondisi !== "baik").length;
    return [
      { label: "Kamar terdata", value: rows.length, hint: "Total unit hunian" },
      { label: "Tempat tidur", value: cap, hint: "Kapasitas resmi panti" },
      { label: "Anak berpenghuni", value: kids.length, hint: cap ? `${Math.round((kids.length / cap) * 100)}% terisi` : "—" },
      { label: "Perlu perbaikan", value: perlu, hint: "Kamar kondisi tidak baik" },
    ];
  },
};

/* ------------------------------------------------------------------ */
/* Insiden perlindungan                                                */
/* ------------------------------------------------------------------ */

const KATEGORI_INSIDEN = opt([
  ["perundungan", "Perundungan / bullying"],
  ["kekerasan", "Kekerasan fisik"],
  ["verbal", "Kekerasan verbal / psikis"],
  ["kecelakaan", "Kecelakaan"],
  ["eksploitasi", "Eksploitasi / pekerjaan anak"],
  ["seksual", "Tindak kekerasan seksual"],
  ["kesehatan-mental", "Kesehatan mental"],
  ["pelanggaran-hak", "Pelanggaran hak anak"],
  ["lainnya", "Lainnya"],
]);
const TINGKAT = yesNo({
  ringan: { label: "Ringan", tone: "blue" },
  sedang: { label: "Sedang", tone: "amber" },
  berat: { label: "Berat", tone: "red" },
});
const STATUS_INSIDEN = yesNo({
  baru: { label: "Baru dilaporkan", tone: "red" },
  ditangani: { label: "Dalam penanganan", tone: "amber" },
  diawasi: { label: "Pemantauan", tone: "blue" },
  selesai: { label: "Selesai", tone: "green" },
});

export const incidentConfig: ResourceConfig = {
  resource: "incidents",
  title: "Laporan Insiden & Perlindungan",
  eyebrow: "Perlindungan Anak",
  icon: <ShieldAlert className="size-3.5" />,
  description:
    "Catatan resmi setiap risiko pada anak — perundungan, kekerasan, kecelakaan, pelanggaran hak — beserta penanganan, penanggung jawab, dan status penyelesaiannya.",
  createLabel: "Laporkan insiden",
  deleteWarning: "Laporan perlindungan yang dihapus tidak akan muncul lagi pada audit penanganan kasus.",
  relations: ["children"],
  searchKeys: ["lokasi", "pelapor", "deskripsi", "penanganan", "penanggungJawab"],
  extraSearch: (row, ctx) => String(ctx.lookup("children")[Number(row.childId)]?.nama ?? ""),
  filters: [
    { key: "kategori", label: "Kategori", options: KATEGORI_INSIDEN },
    { key: "tingkat", label: "Tingkat", options: opt(Object.entries(TINGKAT).map(([k, v]) => [k, v.label])) },
    { key: "status", label: "Status", options: opt(Object.entries(STATUS_INSIDEN).map(([k, v]) => [k, v.label])) },
  ],
  columns: [
    { key: "childId", header: "Anak terdampak", render: (row, ctx) => childCell(row.childId, ctx) },
    { key: "tanggal", header: "Tanggal", render: (row) => tanggalCell(row.tanggal) },
    {
      key: "kategori",
      header: "Kategori",
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-ink-900">
            {KATEGORI_INSIDEN.find((o) => o.value === row.kategori)?.label ?? String(row.kategori)}
          </p>
          <p className="truncate text-[11.5px] text-ink-400">{String(row.lokasi ?? "—")}</p>
        </div>
      ),
    },
    { key: "deskripsi", header: "Ringkasan", render: (row) => <span className="line-clamp-2 max-w-[320px] text-[12.5px] text-ink-600">{String(row.deskripsi ?? "—")}</span> },
    { key: "tingkat", header: "Tingkat", align: "right", render: (row) => <StatusBadge value={row.tingkat as string} map={TINGKAT} /> },
    { key: "status", header: "Status", align: "right", render: (row) => <StatusBadge value={row.status as string} map={STATUS_INSIDEN} /> },
  ],
  fields: [
    { key: "childId", label: "Anak terdampak", type: "relation", relation: { resource: "children" }, required: true, span: 2 },
    { key: "tanggal", label: "Tanggal kejadian", type: "date", required: true },
    { key: "kategori", label: "Kategori", type: "select", options: KATEGORI_INSIDEN, required: true, defaultValue: "perundungan" },
    { key: "tingkat", label: "Tingkat keparahan", type: "select", options: opt(Object.entries(TINGKAT).map(([k, v]) => [k, v.label])), required: true, defaultValue: "ringan" },
    { key: "lokasi", label: "Lokasi kejadian", type: "text", placeholder: "Asrama putra blok B" },
    { key: "pelapor", label: "Pelapor", type: "text", required: true },
    { key: "penanggungJawab", label: "Penanggung jawab penanganan", type: "text" },
    { key: "deskripsi", label: "Deskripsi kejadian", type: "textarea", required: true, span: 2 },
    { key: "penanganan", label: "Penanganan yang diberikan", type: "textarea", span: 2 },
    { key: "status", label: "Status penanganan", type: "select", options: opt(Object.entries(STATUS_INSIDEN).map(([k, v]) => [k, v.label])), required: true, defaultValue: "baru" },
    { key: "tanggalSelesai", label: "Tanggal selesai", type: "date", help: "Isi bila kasus telah ditutup" },
  ],
  newDefaults: () => ({ tanggal: new Date().toISOString().slice(0, 10), kategori: "perundungan", tingkat: "ringan", status: "baru" }),
  summary: (rows) => {
    const terbuka = rows.filter((r) => r.status !== "selesai");
    const berat = rows.filter((r) => r.tingkat === "berat");
    const tanpaPenanganan = rows.filter((r) => !r.penanganan || String(r.penanganan).length < 3);
    return [
      { label: "Laporan tercatat", value: rows.length, hint: "Semua status" },
      { label: "Masih terbuka", value: terbuka.length, hint: "Perlu tindak lanjut" },
      { label: "Tingkat berat", value: berat.length, hint: "Rujukan ke dinas / P2TP2A" },
      { label: "Belum ada rincian", value: tanpaPenanganan.length, hint: "Penanganan wajib dilengkapi" },
    ];
  },
};

/* ------------------------------------------------------------------ */
/* Kunjungan & izin                                                     */
/* ------------------------------------------------------------------ */

const JENIS_KUNJUNGAN = opt([
  ["kunjungan", "Kunjungan keluarga"],
  ["izin-pulang", "Izin pulang"],
  ["penjemputan", "Penjemputan wali"],
  ["kunjungan-klinik", "Pendampingan klinik"],
  ["asesmen", "Asesmen / kunjungan dinas"],
  ["donor", "Kunjungan donor / mitra"],
]);
const STATUS_KUNJUNGAN = yesNo({
  diajukan: { label: "Diajukan", tone: "amber" },
  disetujui: { label: "Disetujui", tone: "blue" },
  selesai: { label: "Selesai", tone: "green" },
  ditolak: { label: "Ditolak", tone: "red" },
});

export const visitConfig: ResourceConfig = {
  resource: "visits",
  title: "Kunjungan & Izin Keluar",
  eyebrow: "Perlindungan Anak",
  icon: <CalendarClock className="size-3.5" />,
  description:
    "Buku tamu dan izin: siapa yang menemui anak, untuk keperluan apa, dan siapa pengasuh yang menyetujui — safeguards agar tidak ada penjemputan tak berwenang.",
  createLabel: "Catat kunjungan",
  relations: ["children"],
  searchKeys: ["pengunjung", "hubungan", "disetujuiOleh", "tujuan"],
  extraSearch: (row, ctx) => String(ctx.lookup("children")[Number(row.childId)]?.nama ?? ""),
  filters: [
    { key: "jenis", label: "Jenis", options: JENIS_KUNJUNGAN },
    { key: "status", label: "Status", options: opt(Object.entries(STATUS_KUNJUNGAN).map(([k, v]) => [k, v.label])) },
  ],
  columns: [
    { key: "childId", header: "Anak", render: (row, ctx) => childCell(row.childId, ctx) },
    { key: "tanggal", header: "Waktu", render: (row) => (
      <div>
        <p className="text-[13px] font-semibold tabular text-ink-800">{formatTanggal(row.tanggal as string, { style: "short" })}</p>
        <p className="text-[11.5px] text-ink-400">{String(row.jam ?? "—" )}</p>
      </div>
    ) },
    { key: "jenis", header: "Keperluan", render: (row) => <Badge tone="neutral">{JENIS_KUNJUNGAN.find((o) => o.value === row.jenis)?.label ?? String(row.jenis)}</Badge> },
    { key: "pengunjung", header: "Pengunjung", render: (row) => (
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-ink-900">{String(row.pengunjung)}</p>
        <p className="truncate text-[11.5px] text-ink-400">{String(row.hubungan ?? "—")}</p>
      </div>
    ) },
    { key: "tujuan", header: "Catatan", render: (row) => <span className="line-clamp-2 max-w-[260px] text-[12.5px] text-ink-600">{String(row.tujuan ?? "—")}</span> },
    { key: "disetujuiOleh", header: "Persetujuan", render: (row) => <span className="text-[13px] text-ink-600">{String(row.disetujuiOleh ?? "—")}</span> },
    { key: "status", header: "Status", align: "right", render: (row) => <StatusBadge value={row.status as string} map={STATUS_KUNJUNGAN} /> },
  ],
  fields: [
    { key: "childId", label: "Anak yang ditemui", type: "relation", relation: { resource: "children" }, required: true, span: 2 },
    { key: "tanggal", label: "Tanggal", type: "date", required: true },
    { key: "jam", label: "Jam", type: "text", placeholder: "10.30 WIB" },
    { key: "jenis", label: "Jenis kunjungan", type: "select", options: JENIS_KUNJUNGAN, required: true, defaultValue: "kunjungan" },
    { key: "pengunjung", label: "Nama pengunjung", type: "text", required: true },
    { key: "hubungan", label: "Hubungan dengan anak", type: "select", options: opt([["wali besar", "Wali besar"], ["paman", "Paman"], ["bibi", "Bibi"], ["kakak", "Kakak"], ["keluarga lain", "Keluarga lain"], ["mitra", "Mitra / donor"], ["dinas", "Petugas dinas"], ["lain", "Lainnya"]]), required: true, defaultValue: "keluarga lain" },
    { key: "disetujuiOleh", label: "Disetujui oleh", type: "text", required: true },
    { key: "tujuan", label: "Keperluan / catatan", type: "textarea", span: 2 },
    { key: "status", label: "Status", type: "select", options: opt(Object.entries(STATUS_KUNJUNGAN).map(([k, v]) => [k, v.label])), required: true, defaultValue: "disetujui" },
  ],
  newDefaults: () => ({ tanggal: new Date().toISOString().slice(0, 10), jam: "10.00 WIB", jenis: "kunjungan", status: "disetujui" }),
  summary: (rows) => {
    const bulanIni = rows.filter((r) => String(r.tanggal ?? "").slice(0, 7) === new Date().toISOString().slice(0, 7)).length;
    const diajukan = rows.filter((r) => r.status === "diajukan").length;
    const ditolak = rows.filter((r) => r.status === "ditolak").length;
    return [
      { label: "Total kunjungan", value: rows.length, hint: "Buku tamu digital" },
      { label: "Bulan berjalan", value: bulanIni, hint: "Tercatat pada bulan ini" },
      { label: "Menunggu persetujuan", value: diajukan, hint: "Butuh tanda tangan pengasuh" },
      { label: "Ditolak", value: ditolak, hint: "Penjemputan tidak diizinkan" },
    ];
  },
};

/* ------------------------------------------------------------------ */
/* Dokumen & hak anak                                                   */
/* ------------------------------------------------------------------ */

const JENIS_DOKUMEN = opt([
  ["akta-lahir", "Akta kelahiran"],
  ["kia", "Kartu Identitas Anak (KIA)"],
  ["kk", "Kartu Keluarga panti"],
  ["ktps", "KTP-el / surat pindah"],
  ["kps", "Kartu Perlindungan Sosial"],
  ["bpjs", "Kartu BPJS Kesehatan"],
  ["ijasah", "Ijazah / SKHUN"],
  ["sktm", "Surat Keterangan Tidak Mampu"],
]);
const STATUS_DOKUMEN = yesNo({
  valid: { label: "Valid", tone: "green" },
  proses: { label: "Sedang diproses", tone: "blue" },
  "perlu-perpanjangan": { label: "Perlu perpanjangan", tone: "amber" },
  hilang: { label: "Hilang", tone: "red" },
  kedaluwarsa: { label: "Kedaluwarsa", tone: "red" },
});

export const documentConfig: ResourceConfig = {
  resource: "documents",
  title: "Dokumen & Hak Administrasi Anak",
  eyebrow: "Perlindungan Anak",
  icon: <FileWarning className="size-3.5" />,
  description:
    "Kelengkapan dokumen kependudukan sebagai syarat layanan kesehatan, pendidikan, dan bantuan sosial — dipantau sampai masa berlakunya.",
  createLabel: "Tambah dokumen",
  relations: ["children"],
  searchKeys: ["nomor", "penerbit", "catatan"],
  extraSearch: (row, ctx) => String(ctx.lookup("children")[Number(row.childId)]?.nama ?? ""),
  filters: [
    { key: "jenis", label: "Jenis", options: JENIS_DOKUMEN },
    { key: "status", label: "Status", options: opt(Object.entries(STATUS_DOKUMEN).map(([k, v]) => [k, v.label])) },
  ],
  columns: [
    { key: "childId", header: "Anak", render: (row, ctx) => childCell(row.childId, ctx) },
    {
      key: "jenis",
      header: "Dokumen",
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-ink-900">
            {JENIS_DOKUMEN.find((o) => o.value === row.jenis)?.label ?? String(row.jenis)}
          </p>
          <p className="truncate text-[11.5px] tabular text-ink-400">{String(row.nomor ?? "nomor belum tercatat")}</p>
        </div>
      ),
    },
    { key: "penerbit", header: "Penerbit", render: (row) => <span className="text-[13px] text-ink-600">{String(row.penerbit ?? "—")}</span> },
    { key: "berlakuSampai", header: "Berlaku sampai", render: (row) => {
      const s = String(row.berlakuSampai ?? "");
      const left = hariMenuju(s || null);
      return (
        <div>
          <p className="text-[13px] tabular text-ink-700">{s ? formatTanggal(s, { style: "short" }) : "Seumur hidup"}</p>
          {left !== null && left < 120 ? (
            <p className={cxText(left < 0 ? "text-clay" : "text-amber-accent")}>
              {left < 0 ? `lewat ${Math.abs(left)} hari` : `${left} hari lagi`}
            </p>
          ) : null}
        </div>
      );
    } },
    { key: "status", header: "Status", align: "right", render: (row) => <StatusBadge value={row.status as string} map={STATUS_DOKUMEN} /> },
  ],
  fields: [
    { key: "childId", label: "Anak binaan", type: "relation", relation: { resource: "children" }, required: true, span: 2 },
    { key: "jenis", label: "Jenis dokumen", type: "select", options: JENIS_DOKUMEN, required: true, defaultValue: "akta-lahir" },
    { key: "nomor", label: "Nomor dokumen", type: "text", placeholder: "3204-LT-2013-00124" },
    { key: "penerbit", label: "Penerbit", type: "text", placeholder: "Disdukcapil Kab. Bandung" },
    { key: "diterbitkan", label: "Tanggal diterbitkan", type: "date" },
    { key: "berlakuSampai", label: "Berlaku sampai", type: "date", help: "Kosongkan untuk dokumen berlaku seumur hidup" },
    { key: "status", label: "Status", type: "select", options: opt(Object.entries(STATUS_DOKUMEN).map(([k, v]) => [k, v.label])), required: true, defaultValue: "valid" },
    { key: "catatan", label: "Catatan pengurusan", type: "textarea", span: 2 },
  ],
  newDefaults: () => ({ jenis: "akta-lahir", status: "proses", diterbitkan: new Date().toISOString().slice(0, 10) }),
  summary: (rows, ctx) => {
    const perlu = rows.filter((r) => r.status !== "valid").length;
    const expiring = rows.filter((r) => {
      const left = hariMenuju(String(r.berlakuSampai ?? "") || null);
      return left !== null && left < 90;
    }).length;
    const perAnak = new Set(rows.map((r) => r.childId)).size;
    return [
      { label: "Dokumen terdata", value: rows.length, hint: `Dipegang ${perAnak} anak` },
      { label: "Perlu pengurusan", value: perlu, hint: "Status belum valid" },
      { label: "Habis ≤ 90 hari", value: expiring, hint: "Perpanjangan segera" },
      {
        label: "Anak tanpa dokumen",
        value: Math.max(
          0,
          (ctx.data.children ?? []).filter((c) => c.status === "aktif").length -
            new Set(rows.map((r) => r.childId)).size,
        ),
        hint: "Perlu didata lewat program adminduk",
      },
    ];
  },
};

function cxText(cls: string) {
  return `text-[11.5px] font-semibold ${cls}`;
}

/* ------------------------------------------------------------------ */
/* Donasi & bantuan                                                     */
/* ------------------------------------------------------------------ */

const TIPE_DONASI = opt([["barang", "Barang"], ["uang", "Uang tunai"], ["jasa", "Jasa / layanan"]]);
const PERUNTUKAN = opt([
  ["kebutuhan_dasar", "Kebutuhan dasar"],
  ["perlindungan", "Program perlindungan"],
  ["pendidikan", "Pendidikan"],
  ["kesehatan", "Kesehatan"],
  ["operasional", "Operasional panti"],
]);
const STATUS_SALUR = yesNo({
  belum: { label: "Belum disalurkan", tone: "amber" },
  sebagian: { label: "Sebagian", tone: "blue" },
  sudah: { label: "Tersalurkan", tone: "green" },
});

export const donationConfig: ResourceConfig = {
  resource: "donations",
  title: "Donasi & Bantuan Masuk",
  eyebrow: "Logistik",
  icon: <HandHeart className="size-3.5" />,
  description:
    "Penerimaan bantuan dari donatur dan mitra: jenis, nilai, peruntukan, dan status penyaluran agar setiap rupiah dapat dipertanggungjawabkan.",
  createLabel: "Catat donasi",
  searchKeys: ["donor", "deskripsi", "nomorResi", "kontak"],
  filters: [
    { key: "tipe", label: "Tipe", options: TIPE_DONASI },
    { key: "penyaluran", label: "Penyaluran", options: opt(Object.entries(STATUS_SALUR).map(([k, v]) => [k, v.label])) },
    { key: "peruntukan", label: "Peruntukan", options: PERUNTUKAN },
  ],
  columns: [
    { key: "donor", header: "Donatur", render: (row) => (
      <div className="flex items-center gap-2.5">
        <Avatar nama={String(row.donor)} warna="amber" size={30} />
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-semibold text-ink-900">{String(row.donor)}</p>
          <p className="truncate text-[11.5px] text-ink-400">{TIPE_DONASI.find((o) => o.value === row.tipe)?.label} · {formatTanggal(row.tanggal as string, { style: "short" })}</p>
        </div>
      </div>
    ) },
    { key: "deskripsi", header: "Bantuan", render: (row) => (
      <div className="min-w-0">
        <p className="truncate text-[13px] text-ink-800">{String(row.deskripsi ?? "—")}</p>
        <p className="truncate text-[11.5px] text-ink-400">Resi {String(row.nomorResi ?? "—")}</p>
      </div>
    ) },
    { key: "jumlah", header: "Jumlah", align: "right", render: (row) => <span className="tabular text-[13px] text-ink-700">{Number(row.jumlah ?? 0)}</span> },
    { key: "nilai", header: "Nilai", align: "right", render: (row) => moneyCell(row.nilai) },
    { key: "peruntukan", header: "Peruntukan", render: (row) => <Badge tone="neutral">{PERUNTUKAN.find((o) => o.value === row.peruntukan)?.label ?? String(row.peruntukan)}</Badge> },
    { key: "penyaluran", header: "Penyaluran", align: "right", render: (row) => <StatusBadge value={row.penyaluran as string} map={STATUS_SALUR} /> },
  ],
  fields: [
    { key: "donor", label: "Nama donatur", type: "text", required: true, placeholder: "Yasaraya / H. Endang Suryana" },
    { key: "tanggal", label: "Tanggal penerimaan", type: "date", required: true },
    { key: "tipe", label: "Bentuk bantuan", type: "select", options: TIPE_DONASI, required: true, defaultValue: "barang" },
    { key: "kontak", label: "Kontak donatur", type: "text" },
    { key: "deskripsi", label: "Uraian bantuan", type: "text", required: true, placeholder: "4 karung beras 25 kg, 12 dus mi instan", span: 2 },
    { key: "jumlah", label: "Jumlah unit", type: "number", min: 1, defaultValue: 1, required: true },
    { key: "nilai", label: "Nilai setara", type: "number", money: true, min: 0, defaultValue: 0 },
    { key: "peruntukan", label: "Peruntukan", type: "select", options: PERUNTUKAN, required: true, defaultValue: "kebutuhan_dasar" },
    { key: "penyaluran", label: "Status penyaluran", type: "select", options: opt(Object.entries(STATUS_SALUR).map(([k, v]) => [k, v.label])), required: true, defaultValue: "belum" },
    { key: "nomorResi", label: "No. resi / tanda terima", type: "text", placeholder: "BB-2026-0148" },
  ],
  newDefaults: () => ({ tanggal: new Date().toISOString().slice(0, 10), tipe: "barang", peruntukan: "kebutuhan_dasar", penyaluran: "belum", jumlah: 1, nilai: 0 }),
  summary: (rows) => {
    const total = rows.reduce((a, r) => a + Number(r.nilai ?? 0), 0);
    const belum = rows.filter((r) => r.penyaluran === "belum").length;
    const bulanIni = rows.filter((r) => String(r.tanggal ?? "").slice(0, 7) === new Date().toISOString().slice(0, 7));
    return [
      { label: "Donasi tercatat", value: rows.length, hint: "Semua periode berjalan" },
      { label: "Nilai diterima", value: rupiah(total, true), hint: "Setara rupiah" },
      { label: "Bulan ini", value: rupiah(bulanIni.reduce((a, r) => a + Number(r.nilai ?? 0), 0), true), hint: `${bulanIni.length} donatur` },
      { label: "Menunggu salur", value: belum, hint: "Belum didistribusikan" },
    ];
  },
};

/* ------------------------------------------------------------------ */
/* Staf                                                               */
/* ------------------------------------------------------------------ */

const JABATAN = opt([
  ["kepala", "Kepala panti"],
  ["pengasuh", "Pengasuh anak"],
  ["bidan", "Tenaga kesehatan"],
  ["guru", "Guru / tutor"],
  ["admin", "Tata usaha"],
  ["dapur", "Petugas dapur"],
  ["relawan", "Relawan"],
  ["psikolog", "Pendamping psikososial"],
]);
const STATUS_STAF = yesNo({
  aktif: { label: "Aktif", tone: "green" },
  cuti: { label: "Cuti", tone: "amber" },
  nonaktif: { label: "Nonaktif", tone: "neutral" },
});

export const staffConfig: ResourceConfig = {
  resource: "staff",
  title: "Staf & Pengasuh",
  eyebrow: "SDM",
  icon: <UserCog className="size-3.5" />,
  description:
    "Penanda layanan 24 jam: siapa bertugas di shift mana, kualifikasi perlindungan anak, serta rasio pengasuh terhadap anak binaan.",
  createLabel: "Tambah staf",
  searchKeys: ["nama", "nip", "telepon", "email", "wilayah", "sertifikasi"],
  filters: [
    { key: "jabatan", label: "Jabatan", options: JABATAN },
    { key: "shift", label: "Shift", options: opt([["pagi", "Pagi"], ["siang", "Siang"], ["malam", "Malam"], ["penuh", "Penuh waktu"]]) },
    { key: "status", label: "Status", options: opt(Object.entries(STATUS_STAF).map(([k, v]) => [k, v.label])) },
  ],
  columns: [
    { key: "nama", header: "Nama", render: (row) => (
      <div className="flex items-center gap-2.5">
        <Avatar nama={String(row.nama)} warna={(row.warna as string) ?? "moss"} size={32} />
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-semibold text-ink-900">{String(row.nama)}</p>
          <p className="truncate text-[11.5px] text-ink-400">NIP {String(row.nip ?? "—")}</p>
        </div>
      </div>
    ) },
    { key: "jabatan", header: "Jabatan", render: (row) => <span className="text-[13px] font-medium text-ink-800">{JABATAN.find((o) => o.value === row.jabatan)?.label ?? String(row.jabatan)}</span> },
    { key: "wilayah", header: "Wilayah tugas", render: (row) => <span className="text-[13px] text-ink-600">{String(row.wilayah ?? "—")}</span> },
    { key: "shift", header: "Shift", render: (row) => <Badge tone="neutral">{String(row.shift ?? "—").replace(/^./, (c) => c.toUpperCase())}</Badge> },
    { key: "telepon", header: "Kontak", render: (row) => <span className="text-[12.5px] tabular text-ink-600">{String(row.telepon ?? "—")}</span> },
    { key: "sertifikasi", header: "Sertifikasi", render: (row) => <span className="line-clamp-1 max-w-[190px] text-[12.5px] text-ink-500">{String(row.sertifikasi ?? "—")}</span> },
    { key: "status", header: "Status", align: "right", render: (row) => <StatusBadge value={row.status as string} map={STATUS_STAF} /> },
  ],
  fields: [
    { key: "nama", label: "Nama lengkap", type: "text", required: true, span: 2 },
    { key: "nip", label: "NIP / ID staf", type: "text" },
    { key: "jabatan", label: "Jabatan", type: "select", options: JABATAN, required: true, defaultValue: "pengasuh" },
    { key: "shift", label: "Shift", type: "select", options: opt([["pagi", "Pagi (05.00–13.00)"], ["siang", "Siang (13.00–21.00)"], ["malam", "Malam (21.00–05.00)"], ["penuh", "Penuh waktu"]]), required: true, defaultValue: "pagi" },
    { key: "wilayah", label: "Wilayah tugas", type: "text", placeholder: "Asrama putri blok A" },
    { key: "telepon", label: "Telepon", type: "text" },
    { key: "email", label: "Email", type: "text" },
    { key: "tanggalMulai", label: "Mulai bertugas", type: "date" },
    { key: "sertifikasi", label: "Sertifikasi / pelatihan", type: "text", span: 2, placeholder: "Pelatihan Pengasuhan Berbasis Hak Anak (Kemensos)" },
    { key: "status", label: "Status", type: "select", options: opt(Object.entries(STATUS_STAF).map(([k, v]) => [k, v.label])), required: true, defaultValue: "aktif" },
    { key: "catatan", label: "Catatan", type: "textarea", span: 2 },
  ],
  newDefaults: () => ({ jabatan: "pengasuh", shift: "pagi", status: "aktif", tanggalMulai: new Date().toISOString().slice(0, 10) }),
  summary: (rows) => {
    const aktif = rows.filter((r) => r.status === "aktif");
    const pengasuh = aktif.filter((r) => r.jabatan === "pengasuh").length;
    const malam = aktif.filter((r) => r.shift === "malam").length;
    const tersertifikasi = rows.filter((r) => r.sertifikasi && String(r.sertifikasi).length > 3).length;
    return [
      { label: "Staf terdaftar", value: rows.length, hint: `${aktif.length} sedang aktif` },
      { label: "Pengasuh anak", value: pengasuh, hint: "Rasio target 1 : 8" },
      { label: "Jaga malam", value: malam, hint: "Penunggu 24 jam" },
      { label: "Bersertifikasi", value: tersertifikasi, hint: "Pelatihan perlindungan anak" },
    ];
  },
};

/* ------------------------------------------------------------------ */
/* Pengguna sistem                                                     */
/* ------------------------------------------------------------------ */

const ROLE = opt([
  ["administrator", "Administrator"],
  ["pengasuh", "Pengasuh"],
  ["tata_usaha", "Tata usaha"],
  ["relawan", "Relawan"],
]);
const ROLE_TONE = yesNo({
  administrator: { label: "Administrator", tone: "red" },
  pengasuh: { label: "Pengasuh", tone: "green" },
  tata_usaha: { label: "Tata usaha", tone: "blue" },
  relawan: { label: "Relawan", tone: "amber" },
});

export const userConfig: ResourceConfig = {
  resource: "users",
  title: "Pengguna Sistem",
  eyebrow: "Tata Usaha",
  icon: <Users className="size-3.5" />,
  description:
    "Akun yang dapat mengakses sistem. Administrator memegang hak penuh termasuk menghapus data; pengasuh dan relawan mencatat pada modulnya masing-masing.",
  createLabel: "Buat akun",
  deleteWarning: "Menghapus akun membuat pengguna tidak dapat masuk, namun data yang pernah dicatat tetap tersimpan.",
  searchKeys: ["nama", "username", "jabatan", "telepon"],
  filters: [{ key: "role", label: "Peran", options: ROLE }],
  columns: [
    { key: "nama", header: "Pengguna", render: (row) => (
      <div className="flex items-center gap-2.5">
        <Avatar nama={String(row.nama)} warna={(row.warna as string) ?? "plum"} size={32} />
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-semibold text-ink-900">{String(row.nama)}</p>
          <p className="truncate text-[11.5px] text-ink-400">@{String(row.username)}</p>
        </div>
      </div>
    ) },
    { key: "role", header: "Peran", render: (row) => <StatusBadge value={row.role as string} map={ROLE_TONE} /> },
    { key: "jabatan", header: "Jabatan struktural", render: (row) => <span className="text-[13px] text-ink-600">{String(row.jabatan ?? "—")}</span> },
    { key: "telepon", header: "Kontak", render: (row) => <span className="text-[12.5px] tabular text-ink-600">{String(row.telepon ?? "—")}</span> },
    {
      key: "aktif",
      header: "Akses",
      align: "right",
      render: (row) =>
        row.aktif ? <Badge tone="green" dot>Akun aktif</Badge> : <Badge tone="neutral" dot>Dinonaktifkan</Badge>,
    },
  ],
  fields: [
    { key: "nama", label: "Nama lengkap", type: "text", required: true, span: 2 },
    { key: "username", label: "Nama pengguna", type: "text", required: true, placeholder: "pengasuh2", help: "Akan dipakai untuk masuk ke sistem" },
    { key: "password", label: "Kata sandi", type: "text", placeholder: "panti123", help: "Biarkan kosong untuk mempertahankan kata sandi lama" },
    { key: "role", label: "Peran", type: "select", options: ROLE, required: true, defaultValue: "pengasuh" },
    { key: "jabatan", label: "Jabatan struktural", type: "text" },
    { key: "telepon", label: "Telepon", type: "text" },
    { key: "warna", label: "Warna profil", type: "select", options: opt([["teal", "Teal"], ["amber", "Amber"], ["clay", "Terrakota"], ["sky", "Biru"], ["plum", "Plum"], ["moss", "Lumut"]]), defaultValue: "teal" },
    { key: "aktif", label: "Akun aktif", type: "toggle", help: "Nonaktifkan untuk mencabut akses masuk", span: 2 },
  ],
  newDefaults: () => ({ role: "pengasuh", aktif: true, warna: "teal", password: "panti123" }),
  summary: (rows) => [
    { label: "Akun terdaftar", value: rows.length, hint: "Pengguna sistem panti" },
    { label: "Administrator", value: rows.filter((r) => r.role === "administrator").length, hint: "Hak penuh" },
    { label: "Pengasuh", value: rows.filter((r) => r.role === "pengasuh").length, hint: "Catatan harian" },
    { label: "Nonaktif", value: rows.filter((r) => !r.aktif).length, hint: "Akses dicabut" },
  ],
};

export const CONFIGS: Record<string, ResourceConfig> = {
  children: childrenConfig,
  healthRecords: healthConfig,
  educationRecords: educationConfig,
  nutritionLogs: nutritionConfig,
  aidDistributions: aidConfig,
  rooms: roomsConfig,
  incidents: incidentConfig,
  visits: visitConfig,
  documents: documentConfig,
  donations: donationConfig,
  staff: staffConfig,
  users: userConfig,
};


