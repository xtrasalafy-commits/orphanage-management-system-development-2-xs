import { Suspense } from "react";
import Link from "next/link";
import { sql, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  aidDistributions,
  children,
  documents,
  donations,
  educationRecords,
  healthRecords,
  incidents,
  nutritionLogs,
  rooms,
  staff,
  visits,
} from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BedDouble,
  CalendarClock,
  ChefHat,
  FileWarning,
  HandHeart,
  HeartPulse,
  Plus,
  ShieldAlert,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { Avatar, Badge, BarRow, Button, Donut, EmptyState, Panel, PageHeader, Progress, Skeleton, Sparkline } from "@/components/ui";
import { formatTanggal, hariMenuju, rupiah, usia } from "@/lib/format";

export const dynamic = "force-dynamic";

const USIA_GROUP: { label: string; min: number; max: number }[] = [
  { label: "0 – 6 tahun (dini)", min: 0, max: 6 },
  { label: "7 – 12 tahun (SD)", min: 7, max: 12 },
  { label: "13 – 15 tahun (SMP)", min: 13, max: 15 },
  { label: "16 – 18 tahun (SMA)", min: 16, max: 18 },
  { label: "Di atas 18 tahun", min: 19, max: 200 },
];

const TONE_COLOR: Record<string, string> = {
  teal: "#1f8271",
  amber: "#c8811f",
  clay: "#b1462f",
  sky: "#2f6f9e",
  plum: "#6b3f6e",
};

function ageNum(value: unknown) {
  const n = Number(String(usia(value as string)).replace(/[^0-9]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

async function DashboardContent() {
  const [kids, inc, docs, roomRows, donasi, gizi, pengasuh, kesehatan, pendidikan, kunjungan, perlengkapan] =
    await Promise.all([
      db.select().from(children).orderBy(desc(children.id)),
      db.select().from(incidents).orderBy(desc(incidents.tanggal)),
      db.select().from(documents),
      db.select().from(rooms),
      db.select().from(donations).orderBy(desc(donations.tanggal)),
      db.select().from(nutritionLogs).orderBy(desc(nutritionLogs.tanggal)),
      db.select().from(staff),
      db.select().from(healthRecords).orderBy(desc(healthRecords.tanggal)),
      db.select().from(educationRecords),
      db.select().from(visits).orderBy(desc(visits.tanggal)),
      db.select().from(aidDistributions).orderBy(desc(aidDistributions.tanggal)),
    ]);

  const user = await getSessionUser();
  const aktif = kids.filter((k) => k.status === "aktif");
  const todayStr = new Date().toISOString().slice(0, 10);
  const giziHariIni = gizi.filter((g) => g.tanggal === todayStr);
  const giziTerakhir = giziHariIni.length ? giziHariIni : gizi.slice(0, 4);
  const lastDate = giziHariIni.length ? todayStr : (gizi[0]?.tanggal ?? "belum ada jurnal");

  const porsiNeed = giziTerakhir.reduce((a, g) => a + Number(g.jumlahAnak ?? 0), 0);
  const porsiDone = giziTerakhir.reduce((a, g) => a + Number(g.porsiTerpenuhi ?? 0), 0);
  const porsiPct = porsiNeed ? Math.round((porsiDone / porsiNeed) * 100) : 0;

  const totalCapacity = roomRows.reduce((a, r) => a + (r.kapasitas ?? 0), 0);
  const perRoom = roomRows
    .map((r) => ({
      id: r.id,
      nama: r.nama,
      blok: r.blok,
      kapasitas: r.kapasitas ?? 0,
      terisi: aktif.filter((k) => k.roomId === r.id).length,
    }))
    .sort((a, b) => b.terisi / Math.max(b.kapasitas, 1) - a.terisi / Math.max(a.kapasitas, 1));
  const hunian = perRoom.reduce((a, r) => a + r.terisi, 0);
  const hunianPct = totalCapacity ? Math.round((hunian / totalCapacity) * 100) : 0;

  const anakTanpaKamar = aktif.filter((k) => !k.roomId).length;
  const insidenTerbuka = inc.filter((i) => i.status !== "selesai");
  const dokumenPerhatian = docs.filter(
    (d) =>
      d.status !== "valid" ||
      (d.berlakuSampai && (hariMenuju(d.berlakuSampai) ?? 999) < 90),
  );
  const perluKontrol = kesehatan.filter((h) => h.status !== "selesai");
  const kehadiranRendah = pendidikan.filter((e) => Number(e.kehadiran ?? 100) < 90);
  const perlengkapanTunggu = perlengkapan.filter((p) => p.status === "diajukan");

  const donasiByMonth = (() => {
    const map = new Map<string, number>();
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      map.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, 0);
    }
    for (const row of donasi) {
      const key = String(row.tanggal ?? "").slice(0, 7);
      if (map.has(key)) map.set(key, (map.get(key) ?? 0) + Number(row.nilai ?? 0));
    }
    return [...map.entries()];
  })();
  const donasiPoints = donasiByMonth.map(([, v]) => v);
  const donasiLabels = donasiByMonth.map(([k]) => {
    const [, m] = k.split("-");
    return ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][Number(m) - 1];
  });
  const donasiTotal6Bulan = donasiPoints.reduce((a, b) => a + b, 0);

  const statusCounts = ["yatim", "piatu", "yatim-piatu", "fakir-miskin", "terlantar"].map((key, i) => ({
    label: key,
    value: aktif.filter((k) => k.statusAnak === key).length,
    color: [TONE_COLOR.teal, TONE_COLOR.sky, TONE_COLOR.clay, TONE_COLOR.amber, TONE_COLOR.plum][i],
  }));

  const usiaGroups = USIA_GROUP.map((g) => ({
    label: g.label,
    value: aktif.filter((k) => {
      const a = ageNum(k.tanggalLahir);
      return a >= g.min && a <= g.max;
    }).length,
  }));

  const pengasuhAktif = pengasuh.filter((s) => s.status === "aktif" && s.jabatan === "pengasuh").length;
  const rasio = pengasuhAktif ? (aktif.length / pengasuhAktif).toFixed(1) : "—";

  const recent = [
    ...inc.map((r) => ({ at: r.createdAt, judul: "Laporan insiden", teks: `${r.kategori} · ${tingkatLabel(r.tingkat)}`, href: "/insiden", tone: "red" as const, nama: kidName(kids, r.childId) })),
    ...kesehatan.slice(0, 14).map((r) => ({ at: r.createdAt, judul: "Layanan kesehatan", teks: `${jenisLabel(r.jenis)} · ${r.fasilitas ?? "panti"}`, href: "/kesehatan", tone: "green" as const, nama: kidName(kids, r.childId) })),
    ...kunjungan.slice(0, 14).map((r) => ({ at: r.createdAt, judul: "Kunjungan / izin", teks: `${r.jenis} · ${r.pengunjung}`, href: "/kunjungan", tone: "blue" as const, nama: kidName(kids, r.childId) })),
    ...donasi.slice(0, 14).map((r) => ({ at: r.createdAt, judul: "Donasi masuk", teks: `${r.donor} · ${rupiah(r.nilai, true)}`, href: "/donasi", tone: "amber" as const, nama: r.deskripsi ?? "" })),
    ...kids.slice(0, 10).map((r) => ({ at: r.createdAt, judul: "Anak terdaftar", teks: `${r.nis} · ${usia(r.tanggalLahir)}`, href: `/anak/${r.id}`, tone: "violet" as const, nama: r.nama })),
    ...perlengkapan.slice(0, 10).map((r) => ({ at: r.createdAt, judul: "Perlengkapan", teks: `${r.item} · ${r.jumlah} unit`, href: "/perlengkapan", tone: "neutral" as const, nama: kidName(kids, r.childId ?? 0) })),
  ]
    .sort((a, b) => new Date(b.at ?? 0).getTime() - new Date(a.at ?? 0).getTime())
    .slice(0, 9);

  const jam = new Date().getHours();
  const sapaan = jam < 11 ? "Selamat pagi" : jam < 15 ? "Selamat siang" : jam < 19 ? "Selamat sore" : "Selamat malam";

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        eyebrow={
          <>
            <Activity className="size-3.5" /> Dasbor operasional
          </>
        }
        title={`${sapaan}, ${user?.nama?.split(" ")[0] ?? "Pengasuh"}`}
        description={
          <>
            Ringkasan pemenuhan kebutuhan dasar dan perlindungan anak yatim piatu per{" "}
            {formatTanggal(new Date(), { style: "day" })}. Data diambil langsung dari register panti.
          </>
        }
        actions={
          <>
            <Link href="/gizi">
              <Button variant="secondary" size="sm" icon={<ChefHat className="size-4" />}>
                Jurnal dapur
              </Button>
            </Link>
            <Link href="/insiden">
              <Button variant="secondary" size="sm" icon={<ShieldAlert className="size-4" />}>
                Laporan insiden
              </Button>
            </Link>
            <Link href="/anak">
              <Button size="sm" icon={<Plus className="size-4" />}>
                Daftarkan anak
              </Button>
            </Link>
          </>
        }
      />

      {/* headline stats */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Anak binaan menghuni panti"
          value={aktif.length}
          unit="anak"
          hint={`${kids.length} total dalam register · ${anakTanpaKamar} menunggu kamar`}
          icon={<Users className="size-4" />}
          href="/anak"
        />
        <StatCard
          label="Insiden perlindungan aktif"
          value={insidenTerbuka.length}
          unit="kasus"
          hint={`${inc.filter((i) => i.tingkat === "berat").length} kategori berat perlu penanganan lintas pihak`}
          icon={<ShieldAlert className="size-4" />}
          tone={insidenTerbuka.length ? "clay" : "brand"}
          href="/insiden"
        />
        <StatCard
          label="Pemenuhan porsi hari ini"
          value={`${porsiPct}%`}
          unit=""
          hint={`${porsiDone}/${porsiNeed} porsi · ${formatTanggal(lastDate, { style: "short" })}`}
          icon={<ChefHat className="size-4" />}
          tone={porsiPct < 100 ? "amber" : "brand"}
          href="/gizi"
        />
        <StatCard
          label="Dokumen perlu diurus"
          value={dokumenPerhatian.length}
          unit="berkas"
          hint={`Dari ${docs.length} dokumen kependudukan tercatat`}
          icon={<FileWarning className="size-4" />}
          tone={dokumenPerhatian.length ? "amber" : "brand"}
          href="/dokumen"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {/* left 2 columns */}
        <div className="space-y-5 xl:col-span-2">
          <Panel
            title="Pemenuhan kebutuhan dasar"
            description={`Capaian harian dibanding target standar pelayanan panti · ${formatTanggal(lastDate, { style: "short" })}`}
            actions={
              <Link href="/asrama" className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand-700 hover:underline">
                detail hunian <ArrowRight className="size-3.5" />
              </Link>
            }
          >
            <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              <Metric label="Pangan & gizi" value={`${porsiPct}%`} pct={porsiPct} note={`${giziTerakhir.length} jurnal makan`} />
              <Metric
                label="Hunian asrama"
                value={`${hunianPct}%`}
                pct={hunianPct}
                note={`${hunian} dari ${totalCapacity} tempat tidur`}
                tone={hunianPct >= 95 ? "clay" : "brand"}
              />
              <Metric
                label="Kesehatan terlayani"
                value={`${Math.round(((kesehatan.length - perluKontrol.length) / Math.max(kesehatan.length, 1)) * 100)}%`}
                pct={Math.round(((kesehatan.length - perluKontrol.length) / Math.max(kesehatan.length, 1)) * 100)}
                note={`${perluKontrol.length} layanan menunggu kontrol`}
                tone={perluKontrol.length ? "amber" : "brand"}
              />
              <Metric
                label="Perlengkapan anak"
                value={`${Math.round(((perlengkapan.length - perlengkapanTunggu.length) / Math.max(perlengkapan.length, 1)) * 100)}%`}
                pct={Math.round(((perlengkapan.length - perlengkapanTunggu.length) / Math.max(perlengkapan.length, 1)) * 100)}
                note={`${perlengkapanTunggu.length} pengajuan menunggu persetujuan`}
                tone={perlengkapanTunggu.length ? "amber" : "brand"}
              />
            </div>

            <div className="mt-6 grid gap-6 border-t border-line-soft pt-5 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-[12px] font-semibold tracking-[0.1em] text-ink-400 uppercase">
                  Sebaran kelompok usia
                </p>
                {usiaGroups.map((g) => (
                  <BarRow key={g.label} label={g.label} value={g.value} max={Math.max(...usiaGroups.map((x) => x.value), 1)} />
                ))}
              </div>
              <div>
                <p className="mb-2 text-[12px] font-semibold tracking-[0.1em] text-ink-400 uppercase">
                  Keterisian kamar terpadat
                </p>
                {perRoom.slice(0, 5).map((r) => (
                  <BarRow
                    key={r.id}
                    label={`${r.nama} · Blok ${r.blok}`}
                    value={r.terisi}
                    hint={`${r.terisi}/${r.kapasitas}`}
                    max={Math.max(r.kapasitas, r.terisi, 1)}
                    tone={r.terisi >= r.kapasitas ? "clay" : "brand"}
                  />
                ))}
              </div>
            </div>
          </Panel>

          <div className="grid gap-5 md:grid-cols-2">
            <Panel title="Donasi 6 bulan terakhir" description="Nilai bantuan masuk yang telah diterima" actions={<TrendingUp className="size-4 text-brand-500" />}>
              <p className="font-display text-[26px] leading-none font-bold tracking-tight text-ink-900 tabular">
                {rupiah(donasiTotal6Bulan)}
              </p>
              <p className="mt-1.5 text-[12.5px] text-ink-500">{donasi.filter((d) => d.penyaluran === "sudah").length} donasi telah tersalurkan penuh</p>
              <div className="mt-4">
                <Sparkline points={donasiPoints.length ? donasiPoints : [0]} labels={donasiLabels} />
              </div>
            </Panel>

            <Panel title="Komposisi status anak" description="Register hunian aktif" actions={<Badge tone="neutral">{aktif.length} anak</Badge>}>
              <div className="flex items-center gap-5">
                <Donut
                  slices={statusCounts}
                  center={
                    <div>
                      <p className="font-display text-[20px] leading-none font-bold text-ink-900 tabular">
                        {statusCounts.reduce((a, s) => a + s.value, 0)}
                      </p>
                      <p className="text-[10.5px] tracking-wide text-ink-400 uppercase">anak</p>
                    </div>
                  }
                />
                <ul className="min-w-0 flex-1 space-y-1.5">
                  {statusCounts.map((s) => (
                    <li key={s.label} className="flex items-center gap-2 text-[12.5px]">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                      <span className="truncate text-ink-600">{statusLabel(s.label)}</span>
                      <span className="ml-auto tabular font-semibold text-ink-900">{s.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Panel>
          </div>
        </div>

        {/* right column */}
        <div className="space-y-5">
          <Panel
            title="Perlu perhatian hari ini"
            description="Antrian kerja pengasuh berdasarkan data terbaru"
            actions={<Badge tone={insidenTerbuka.length ? "red" : "green"}>{insidenTerbuka.length + dokumenPerhatian.length} item</Badge>}
            bodyClassName="p-3"
          >
            <ul className="space-y-1.5">
              {insidenTerbuka.slice(0, 3).map((i) => (
                <Alert
                  key={`inc-${i.id}`}
                  href="/insiden"
                  tone="red"
                  icon={<ShieldAlert className="size-3.5" />}
                  title={`Insiden ${tingkatLabel(i.tingkat).toLowerCase()} — ${kidName(kids, i.childId)}`}
                  meta={`${i.status === "baru" ? "belum ditangani" : "dalam penanganan"} · ${formatTanggal(i.tanggal, { style: "short" })}`}
                />
              ))}
              {dokumenPerhatian.slice(0, 3).map((d) => (
                <Alert
                  key={`doc-${d.id}`}
                  href="/dokumen"
                  tone="amber"
                  icon={<FileWarning className="size-3.5" />}
                  title={`Dokumen ${docLabel(d.jenis)} — ${kidName(kids, d.childId)}`}
                  meta={d.berlakuSampai ? ` berlaku s.d. ${formatTanggal(d.berlakuSampai, { style: "short" })}` : ` status ${d.status.replace(/-/g, " ")}`}
                />
              ))}
              {perluKontrol.slice(0, 2).map((h) => (
                <Alert
                  key={`hea-${h.id}`}
                  href="/kesehatan"
                  tone="blue"
                  icon={<HeartPulse className="size-3.5" />}
                  title={`${kidName(kids, h.childId)} perlu kontrol ulang`}
                  meta={`${h.diagnosis ?? "kontrol"} · ${h.fasilitas ?? "faskes"}`}
                />
              ))}
              {anakTanpaKamar > 0 ? (
                <Alert
                  href="/asrama"
                  tone="violet"
                  icon={<BedDouble className="size-3.5" />}
                  title={`${anakTanpaKamar} anak belum ditempatkan ke kamar`}
                  meta="Penempatan hunian menunggu keputusan kepala panti"
                />
              ) : null}
              {kehadiranRendah.length > 0 ? (
                <Alert
                  href="/pendidikan"
                  tone="amber"
                  icon={<CalendarClock className="size-3.5" />}
                  title={`${kehadiranRendah.length} anak kehadiran di bawah 90%`}
                  meta="Perlu pendampingan belajar & konfirmasi sekolah"
                />
              ) : null}
              {insidenTerbuka.length === 0 && dokumenPerhatian.length === 0 && perluKontrol.length === 0 ? (
                <EmptyState
                  icon={<BadgeCheck className="size-6" />}
                  title="Semua terpantau rapi"
                  description="Tidak ada insiden terbuka maupun dokumen kedaluwarsa pada saat ini."
                />
              ) : null}
            </ul>
          </Panel>

          <Panel title="Aktivitas terbaru" description="Jejak pencatatan lintas modul" bodyClassName="p-0">
            {recent.length === 0 ? (
              <EmptyState title="Belum ada aktivitas" description="Catatan pertama Anda akan muncul di sini." />
            ) : (
              <ol className="divide-y divide-line-soft">
                {recent.map((r, idx) => (
                  <li key={idx}>
                    <Link href={r.href} className="flex items-start gap-3 px-5 py-3 transition hover:bg-brand-50/40">
                      <Avatar nama={r.nama} size={28} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-ink-900">{r.judul}</p>
                        <p className="truncate text-[12px] text-ink-500">{r.teks}</p>
                      </div>
                      <span className="shrink-0 text-[11px] whitespace-nowrap text-ink-300">
                        {waktuRelatifSafe(r.at)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          <Panel title="Kesiapsiagaan pengasuhan" description="Rasio & cakupan layanan 24 jam">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[12.5px] text-ink-500">Rasio pengasuh : anak</p>
                  <p className="font-display text-[22px] leading-tight font-bold text-ink-900 tabular">1 : {rasio}</p>
                </div>
                <Badge tone={Number(rasio) > 10 ? "amber" : "green"}>
                  {Number(rasio) > 10 ? "di atas standar" : "sesuai standar"}
                </Badge>
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-[12.5px]">
                  <span className="text-ink-600">Staf bertugas hari ini</span>
                  <span className="tabular font-semibold text-ink-900">
                    {pengasuh.filter((s) => s.status === "aktif").length}/{pengasuh.length}
                  </span>
                </div>
                <Progress value={(pengasuh.filter((s) => s.status === "aktif").length / Math.max(pengasuh.length, 1)) * 100} />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <MiniStat icon={<HandHeart className="size-3.5" />} label="Donasi menunggu salur" value={donasi.filter((d) => d.penyaluran === "belum").length} href="/donasi" />
                <MiniStat icon={<UserPlus className="size-3.5" />} label="Anak masuk tahun ini" value={kids.filter((k) => String(k.tanggalMasuk ?? "").startsWith(todayStr.slice(0, 4))).length} href="/anak" />
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function waktuRelatifSafe(value: unknown) {
  try {
    const d = value instanceof Date ? value : new Date(String(value));
    const diff = Date.now() - d.getTime();
    const hari = Math.floor(diff / 86400000);
    if (hari <= 0) {
      const jam = Math.floor(diff / 3600000);
      return jam <= 0 ? "baru saja" : `${jam} jam lalu`;
    }
    if (hari < 30) return `${hari} hari lalu`;
    return `${Math.floor(hari / 30)} bln lalu`;
  } catch {
    return "";
  }
}

function kidName(kids: { id: number; nama: string }[], id: number | null) {
  if (!id) return "Umum";
  return kids.find((k) => k.id === id)?.nama ?? `Anak #${id}`;
}

function tingkatLabel(v: string | null) {
  return ({ ringan: "Ringan", sedang: "Sedang", berat: "Berat" } as Record<string, string>)[v ?? ""] ?? v ?? "—";
}
function jenisLabel(v: string | null) {
  return (
    {
      pemeriksaan: "Pemeriksaan rutin",
      imunisasi: "Imunisasi",
      pengobatan: "Pengobatan",
      "rawat-jalan": "Rawat jalan",
      "rawat-inap": "Rawat inap",
      "konsultasi-jiwa": "Dukungan psikologi",
      gizi: "Pemantauan gizi",
      "kesehatan-gigi": "Kesehatan gigi",
    } as Record<string, string>
  )[v ?? ""] ?? String(v ?? "Layanan");
}
function statusLabel(v: string) {
  return ({ yatim: "Yatim", piatu: "Piatu", "yatim-piatu": "Yatim piatu", "fakir-miskin": "Fakir miskin", terlantar: "Terlantar" } as Record<string, string>)[v] ?? v;
}
function docLabel(v: string | null) {
  return (
    {
      "akta-lahir": "akta kelahiran",
      kia: "KIA",
      kk: "kartu keluarga",
      ktps: "KTP-el",
      kps: "Kartu Perlindungan Sosial",
      bpjs: "BPJS Kesehatan",
      ijasah: "ijazah",
      sktm: "SKTM",
    } as Record<string, string>
  )[v ?? ""] ?? String(v ?? "dokumen");
}

function Metric({
  label,
  value,
  pct,
  note,
  tone = "brand",
}: {
  label: string;
  value: string;
  pct: number;
  note: string;
  tone?: "brand" | "amber" | "clay";
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[13px] font-semibold text-ink-800">{label}</p>
        <p className="font-display text-[19px] leading-none font-bold text-ink-900 tabular">{value}</p>
      </div>
      <div className="mt-2">
        <Progress value={pct} tone={tone} />
      </div>
      <p className="mt-1.5 text-[11.5px] text-ink-400">{note}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  hint,
  icon,
  href,
  tone = "brand",
}: {
  label: string;
  value: string | number;
  unit: string;
  hint: string;
  icon: React.ReactNode;
  href: string;
  tone?: "brand" | "amber" | "clay";
}) {
  const palette =
    tone === "clay"
      ? { bg: "#fbe9e5", fg: "#b1462f" }
      : tone === "amber"
        ? { bg: "#fdf1dc", fg: "#c8811f" }
        : { bg: "#eaf5f2", fg: "#14685b" };
  return (
    <Link
      href={href}
      className="card-surface group block rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-28px_rgba(20,32,29,0.5)]"
    >
      <div className="flex items-center justify-between">
        <span className="grid size-8 place-items-center rounded-lg" style={{ background: palette.bg, color: palette.fg }}>
          {icon}
        </span>
        <ArrowRight className="size-4 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
      </div>
      <p className="mt-3 font-display text-[27px] leading-none font-bold tracking-tight text-ink-900 tabular">
        {value}
        {unit ? <span className="ml-1 text-[13px] font-semibold text-ink-400">{unit}</span> : null}
      </p>
      <p className="mt-1.5 text-[12.5px] font-semibold text-ink-700">{label}</p>
      <p className="mt-1 text-[11.5px] leading-relaxed text-ink-400">{hint}</p>
    </Link>
  );
}

function Alert({
  href,
  icon,
  title,
  meta,
  tone,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  meta: string;
  tone: "red" | "amber" | "blue" | "violet";
}) {
  const ring: Record<string, string> = {
    red: "bg-[#fbe9e5] text-clay",
    amber: "bg-[#fdf1dc] text-amber-accent",
    blue: "bg-[#e4eef8] text-sky-accent",
    violet: "bg-[#f0e6f2] text-plum",
  };
  return (
    <li>
      <Link href={href} className="flex items-start gap-3 rounded-xl px-2.5 py-2.5 transition hover:bg-paper">
        <span className={cxIcon(ring[tone])}>{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] leading-snug font-semibold text-ink-900">{title}</span>
          <span className="mt-0.5 block truncate text-[11.5px] text-ink-400">{meta}</span>
        </span>
        <ArrowRight className="mt-1 size-3.5 shrink-0 text-ink-300 transition group-hover:translate-x-0.5" />
      </Link>
    </li>
  );
}

function cxIcon(base: string) {
  return `mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg ${base}`;
}

function MiniStat({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: number; href: string }) {
  return (
    <Link href={href} className="rounded-xl border border-line bg-paper/60 px-3 py-2.5 transition hover:border-brand-200 hover:bg-brand-50/60">
      <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-ink-500 uppercase">
        {icon} {label}
      </span>
      <p className="mt-1 font-display text-[18px] leading-none font-bold text-ink-900 tabular">{value}</p>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-16 w-2/3" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[136px] rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <Skeleton className="h-[420px] rounded-2xl xl:col-span-2" />
        <Skeleton className="h-[420px] rounded-2xl" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  void sql;
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
