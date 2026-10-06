import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import {
  aidDistributions,
  children,
  documents,
  educationRecords,
  healthRecords,
  incidents,
  rooms,
  visits,
} from "@/db/schema";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  BedDouble,
  BookOpen,
  CalendarClock,
  FileText,
  HeartPulse,
  Ruler,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Avatar, Badge, Panel, Progress, type Tone } from "@/components/ui";
import { cx } from "@/lib/cx";
import { formatTanggal, hariMenuju, rupiah, usia } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_DOC: Record<string, { label: string; tone: Tone }> = {
  valid: { label: "Valid", tone: "green" },
  proses: { label: "Sedang diproses", tone: "blue" },
  "perlu-perpanjangan": { label: "Perlu perpanjangan", tone: "amber" },
  hilang: { label: "Hilang", tone: "red" },
  kedaluwarsa: { label: "Kedaluwarsa", tone: "red" },
};

const DOC_LABEL: Record<string, string> = {
  "akta-lahir": "Akta kelahiran",
  kia: "Kartu Identitas Anak",
  kk: "Kartu Keluarga panti",
  ktps: "KTP-el / surat pindah",
  kps: "Kartu Perlindungan Sosial",
  bpjs: "BPJS Kesehatan",
  ijasah: "Ijazah / SKHUN",
  sktm: "Surat Keterangan Tidak Mampu",
};

export default async function ChildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const childId = Number(id);
  if (!Number.isFinite(childId)) notFound();

  const [child] = await db.select().from(children).where(eq(children.id, childId)).limit(1);
  if (!child) notFound();

  const [kesehatan, pendidikan, dokumen, insiden, kunjungan, perlengkapan, kamar] = await Promise.all([
    db.select().from(healthRecords).where(eq(healthRecords.childId, childId)).orderBy(desc(healthRecords.tanggal)),
    db.select().from(educationRecords).where(eq(educationRecords.childId, childId)).orderBy(desc(educationRecords.tahunAjaran)),
    db.select().from(documents).where(eq(documents.childId, childId)),
    db.select().from(incidents).where(eq(incidents.childId, childId)).orderBy(desc(incidents.tanggal)),
    db.select().from(visits).where(eq(visits.childId, childId)).orderBy(desc(visits.tanggal)),
    db.select().from(aidDistributions).where(eq(aidDistributions.childId, childId)).orderBy(desc(aidDistributions.tanggal)),
    child.roomId ? db.select().from(rooms).where(eq(rooms.id, child.roomId)).limit(1) : Promise.resolve([]),
  ]);

  const edu = pendidikan[0];
  const requiredDocs = ["akta-lahir", "kia", "kk", "bpjs"];
  const haveDocs = new Set(dokumen.filter((d) => d.status === "valid").map((d) => d.jenis));
  const docComplete = Math.round((requiredDocs.filter((d) => haveDocs.has(d)).length / requiredDocs.length) * 100);
  const room = kamar[0];
  const openIncidents = insiden.filter((i) => i.status !== "selesai");

  return (
    <div className="space-y-6">
      <Link
        href="/anak"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-500 transition hover:text-brand-700"
      >
        <ArrowLeft className="size-3.5" /> Kembali ke register anak binaan
      </Link>

      {/* profile hero */}
      <section className="card-surface overflow-hidden rounded-2xl">
        <div
          className="grain relative px-5 py-6 sm:px-7"
          style={{
            background:
              "radial-gradient(120% 140% at 0% 0%, rgba(63,159,138,0.20) 0%, transparent 55%), linear-gradient(120deg, #14201d 0%, #103a33 60%, #0e4239 100%)",
          }}
        >
          <div className="relative flex flex-wrap items-start gap-5">
            <Avatar nama={child.nama} size={68} className="ring-4 ring-white/15" />
            <div className="min-w-0 flex-1">
              <p className="text-[11.5px] font-semibold tracking-[0.16em] text-brand-200 uppercase">
                Profil anak binaan · {child.nis}
              </p>
              <h1 className="mt-1.5 font-display text-[30px] leading-none font-bold tracking-[-0.02em] text-white">
                {child.nama}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Pill>{child.statusAnak === "yatim-piatu" ? "Yatim piatu" : child.statusAnak === "fakir-miskin" ? "Fakir miskin" : child.statusAnak === "piatu" ? "Piatu" : "Yatim"}</Pill>
                <Pill>{usia(child.tanggalLahir)} · {child.jenisKelamin === "L" ? "laki-laki" : "perempuan"}</Pill>
                {room ? <Pill><BedDouble className="size-3" /> {room.nama} · Blok {room.blok}</Pill> : <Pill tone="warn"><Sparkles className="size-3" /> Menunggu penempatan kamar</Pill>}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge tone={child.status === "aktif" ? "green" : "neutral"} dot>
                {child.status === "aktif" ? "Menghuni panti" : `Status: ${child.status.replace(/-/g, " ")}`}
              </Badge>
              <Link
                href="/anak"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/20 px-3 text-[12.5px] font-semibold text-white/90 transition hover:bg-white/10"
              >
                Ubah data di register <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
        <dl className="grid grid-cols-2 divide-line-soft border-t border-line-soft sm:grid-cols-4 sm:divide-x">
          <Fact label="Tanggal lahir" value={formatTanggal(child.tanggalLahir, { style: "long" })} sub={`Tempat: ${child.tempatLahir ?? "—"}`} />
          <Fact label="Masuk panti" value={formatTanggal(child.tanggalMasuk, { style: "long" })} sub={`Asal: ${child.asalDaerah ?? "—"}`} />
          <Fact label="Pengukuran terakhir" value={`${child.beratBadan ?? "—"} kg / ${child.tinggiBadan ?? "—"} cm`} sub={`Golongan darah ${child.golonganDarah ?? "belum dicatat"}`} icon={<Ruler className="size-3.5" />} />
          <Fact label="Kondisi kesehatan" value={child.kondisiKesehatan ?? "Sehat"} sub={child.kebutuhanKhusus ? `Kebutuhan khusus: ${child.kebutuhanKhusus}` : "Tidak ada kebutuhan khusus tercatat"} />
        </dl>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Panel
            title="Riwayat kesehatan"
            description={`${kesehatan.length} layanan tercatat · imunisasi, pengobatan, hingga pemantauan tumbuh kembang`}
            actions={
              <Link href="/kesehatan" className="text-[12.5px] font-semibold text-brand-700 hover:underline">
                Kelola catatan
              </Link>
            }
            bodyClassName={kesehatan.length ? "p-0" : undefined}
          >
            {kesehatan.length === 0 ? (
              <Empty title="Belum ada catatan kesehatan" text="Tambahkan layanan pertama pada modul Kesehatan agar riwayat tumbuh kembang anak lengkap." href="/kesehatan" />
            ) : (
              <ul className="divide-y divide-line-soft">
                {kesehatan.slice(0, 6).map((h) => (
                  <li key={h.id} className="flex items-start gap-4 px-5 py-3.5">
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                      <HeartPulse className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-ink-900">
                        {h.diagnosis ?? h.keluhan ?? "Pemeriksaan"}
                      </p>
                      <p className="mt-0.5 text-[12px] text-ink-500">
                        {formatTanggal(h.tanggal, { style: "short" })} · {h.fasilitas ?? "Klinik panti"} · {h.petugas ?? "pengasuh"}
                      </p>
                      {h.tindakan ? <p className="mt-1 text-[12px] text-ink-600">{h.tindakan}</p> : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <Badge tone={h.status === "selesai" ? "green" : h.status === "dirujuk" ? "red" : "amber"}>
                        {h.status.replace(/-/g, " ")}
                      </Badge>
                      <p className="mt-1 text-[11.5px] tabular text-ink-400">{rupiah(h.biaya)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title="Pendidikan & perkembangan"
            description={edu ? `${edu.sekolah ?? "satuan pendidikan"} · kelas ${edu.kelas ?? "—"}` : "Belum ada data sekolah"}
            actions={
              <Link href="/pendidikan" className="text-[12.5px] font-semibold text-brand-700 hover:underline">
                Modul pendidikan
              </Link>
            }
          >
            {edu ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <MiniBlock label="Tahun ajaran" value={edu.tahunAjaran ?? "—"} sub={edu.jenjang ?? ""} icon={<BookOpen className="size-3.5" />} />
                  <MiniBlock label="Kehadiran" value={`${edu.kehadiran ?? 0}%`} sub={`Wali kelas: ${edu.waliKelas ?? "—"}`} progress={Number(edu.kehadiran ?? 0)} />
                  <MiniBlock label="Nilai rata-rata" value={edu.nilaiRata ? Number(edu.nilaiRata).toFixed(1) : "—"} sub={`SPP ${rupiah(edu.biayaSpp)}/bulan`} />
                </div>
                <div className="rounded-xl border border-line bg-paper/70 px-4 py-3">
                  <p className="text-[11.5px] font-semibold tracking-wide text-ink-400 uppercase">Prestasi & catatan guru</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-700">
                    {edu.prestasi ?? "Belum ada catatan prestasi. Tambahkan lewat modul pendidikan untuk apresiasi capaian anak."}
                  </p>
                </div>
                {pendidikan.length > 1 ? (
                  <details className="rounded-xl border border-line px-4 py-3 text-[13px] text-ink-600">
                    <summary className="cursor-pointer font-semibold text-ink-800">
                      Riwayat pendidikan ({pendidikan.length} tahun ajaran)
                    </summary>
                    <ul className="mt-3 space-y-2">
                      {pendidikan.map((p) => (
                        <li key={p.id} className="flex flex-wrap items-center gap-2 border-b border-line-soft pb-2 last:border-0">
                          <span className="font-semibold text-ink-800">{p.tahunAjaran}</span>
                          <span className="text-ink-500">{p.sekolah}</span>
                          <Badge tone="neutral">{p.jenjang}</Badge>
                          <span className="ml-auto tabular text-[12px] text-ink-500">Kehadiran {p.kehadiran}%</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </div>
            ) : (
              <Empty title="Anak belum terdaftar di jalur pendidikan" text="Catatkan sekolah, jenjang, dan kehadiran agar hak pendidikan anak terpantau." href="/pendidikan" />
            )}
          </Panel>

          <Panel
            title="Perlindungan & kunjungan"
            description="Kasus aktif, riwayat kunjungan wali, dan izin keluar masuk panti"
            bodyClassName="p-0"
          >
            <div className="grid gap-0 md:grid-cols-2">
              <div className="border-b border-line-soft p-5 md:border-r md:border-b-0">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 text-[12.5px] font-bold tracking-wide text-ink-500 uppercase">
                    <ShieldAlert className="size-4" /> Laporan perlindungan
                  </p>
                  <Badge tone={openIncidents.length ? "red" : "green"}>{openIncidents.length} terbuka</Badge>
                </div>
                {insiden.length === 0 ? (
                  <p className="mt-4 text-[13px] text-ink-500">
                    Tidak ada laporan insiden untuk anak ini. Kondisi terpantau aman.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {insiden.slice(0, 4).map((i) => (
                      <li key={i.id} className="rounded-xl border border-line px-3.5 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[13px] font-semibold text-ink-900">{i.kategori.replace(/-/g, " ")}</p>
                          <Badge tone={i.status === "selesai" ? "green" : i.tingkat === "berat" ? "red" : "amber"}>
                            {i.status.replace(/-/g, " ")}
                          </Badge>
                        </div>
                        <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-ink-600">{i.deskripsi}</p>
                        <p className="mt-1.5 text-[11.5px] text-ink-400">
                          {formatTanggal(i.tanggal, { style: "short" })} · pelapor {i.pelapor ?? "—"} · PIC {i.penanggungJawab ?? "—"}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="p-5">
                <p className="flex items-center gap-2 text-[12.5px] font-bold tracking-wide text-ink-500 uppercase">
                  <CalendarClock className="size-4" /> Kunjungan & izin
                </p>
                {kunjungan.length === 0 ? (
                  <p className="mt-4 text-[13px] text-ink-500">Belum ada kunjungan keluarga tercatat untuk anak ini.</p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {kunjungan.slice(0, 5).map((v) => (
                      <li key={v.id} className="flex items-center gap-3 rounded-xl bg-paper/70 px-3.5 py-2.5">
                        <Avatar nama={v.pengunjung} warna="amber" size={30} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-ink-900">{v.pengunjung}</p>
                          <p className="truncate text-[11.5px] text-ink-500">
                            {v.hubungan ?? "keluarga"} · {v.jenis.replace(/-/g, " ")} · {formatTanggal(v.tanggal, { style: "short" })} {v.jam ?? ""}
                          </p>
                        </div>
                        <Badge tone={v.status === "selesai" ? "green" : v.status === "diajukan" ? "amber" : v.status === "ditolak" ? "red" : "blue"}>
                          {v.status.replace(/-/g, " ")}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Panel>
        </div>

        {/* side column */}
        <div className="space-y-5">
          <Panel title="Kelengkapan dokumen" description={`${docComplete}% dokumen wajib valid`} actions={<BadgeCheck className="size-4 text-brand-500" />}>
            <Progress value={docComplete} tone={docComplete === 100 ? "brand" : docComplete > 50 ? "amber" : "clay"} />
            <ul className="mt-4 space-y-2.5">
              {requiredDocs.map((key) => {
                const doc = dokumen.find((d) => d.jenis === key);
                const left = doc?.berlakuSampai ? hariMenuju(doc.berlakuSampai) : null;
                const ok = Boolean(doc && doc.status === "valid");
                return (
                  <li key={key} className="flex items-start gap-3">
                    <span
                      className={cx(
                        "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                        ok ? "bg-brand-50 text-brand-600" : doc ? "bg-[#fdf1dc] text-amber-accent" : "bg-[#fbe9e5] text-clay",
                      )}
                    >
                      {ok ? "✓" : doc ? "!" : "—"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-ink-900">{DOC_LABEL[key]}</p>
                      <p className="truncate text-[11.5px] text-ink-500">
                        {doc ? `${STATUS_DOC[doc.status]?.label ?? doc.status} · ${doc.nomor ?? "nomor belum tercatat"}` : "Belum dimiliki"}
                        {left !== null && left < 120 ? ` · ${left < 0 ? "lewat " + Math.abs(left) + " hari" : left + " hari lagi"}` : ""}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <Link
              href="/dokumen"
              className="mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-line bg-white text-[12.5px] font-semibold text-ink-800 transition hover:border-brand-300 hover:text-brand-700"
            >
              <FileText className="size-3.5" /> Kelola dokumen anak
            </Link>
          </Panel>

          <Panel title="Dukungan perlengkapan" description="Barang yang diajukan atau diterima anak">
            {perlengkapan.length === 0 ? (
              <p className="text-[13px] text-ink-500">Belum ada pengajuan perlengkapan untuk anak ini.</p>
            ) : (
              <ul className="space-y-2">
                {perlengkapan.slice(0, 6).map((p) => (
                  <li key={p.id} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink-900">{p.item}</p>
                      <p className="truncate text-[11.5px] text-ink-400">
                        {formatTanggal(p.tanggal, { style: "short" })} · {p.sumber ?? "stok panti"}
                      </p>
                    </div>
                    <Badge tone={p.status === "disalurkan" ? "green" : p.status === "diajukan" ? "amber" : "blue"}>
                      {p.status.replace(/-/g, " ")}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Wali & pendamping" description="Kontak yang dapat dihubungi">
            <dl className="space-y-3 text-[13px]">
              <Row label="Wali / keluarga" value={child.waliNama ?? "Belum ditetapkan"} />
              <Row label="Kontak wali" value={child.waliKontak ?? "—"} />
              <Row label="Pengasuh pendamping" value={child.pengasuh ?? "Belum ditentukan"} />
              <Row label="Agama" value={child.agama ?? "—"} />
              <Row label="Kamar" value={room ? `${room.nama} (blok ${room.blok}, ${room.jenis})` : "Belum ditempatkan"} />
            </dl>
            {child.catatan ? (
              <p className="mt-4 rounded-xl bg-paper/70 px-3.5 py-3 text-[12.5px] leading-relaxed text-ink-600">
                {child.catatan}
              </p>
            ) : null}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Pill({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "warn" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-inset",
        tone === "warn" ? "bg-amber-accent/15 text-[#f7dfb6] ring-amber-accent/30" : "bg-white/10 text-white/85 ring-white/15",
      )}
    >
      {children}
    </span>
  );
}

function Fact({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <div className="px-5 py-3.5">
      <dt className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.1em] text-ink-400 uppercase">
        {icon} {label}
      </dt>
      <dd className="mt-1.5 text-[14px] font-semibold text-ink-900">{value}</dd>
      {sub ? <dd className="mt-0.5 text-[11.5px] text-ink-400">{sub}</dd> : null}
    </div>
  );
}

function MiniBlock({
  label,
  value,
  sub,
  icon,
  progress,
}: {
  label: string;
  value: string;
  sub: string;
  icon?: React.ReactNode;
  progress?: number;
}) {
  return (
    <div className="rounded-xl border border-line bg-paper/60 px-3.5 py-3">
      <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.08em] text-ink-400 uppercase">
        {icon} {label}
      </p>
      <p className="mt-1.5 font-display text-[19px] leading-none font-bold text-ink-900 tabular">{value}</p>
      <p className="mt-1.5 text-[11.5px] text-ink-500">{sub}</p>
      {progress !== undefined ? <div className="mt-2"><Progress value={progress} /></div> : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line-soft pb-2.5 last:border-0">
      <dt className="text-ink-500">{label}</dt>
      <dd className="max-w-[58%] text-right font-semibold text-ink-900">{value}</dd>
    </div>
  );
}

function Empty({ title, text, href }: { title: string; text: string; href: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-paper/50 px-4 py-6 text-center">
      <p className="font-display text-[14px] font-semibold text-ink-900">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-[12.5px] leading-relaxed text-ink-500">{text}</p>
      <Link href={href} className="mt-3 inline-flex text-[12.5px] font-semibold text-brand-700 hover:underline">
        Buka modul terkait →
      </Link>
    </div>
  );
}
