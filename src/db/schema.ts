import {
  boolean,
  date,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  nama: varchar("nama", { length: 120 }).notNull(),
  username: varchar("username", { length: 80 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 24 }).notNull().default("pengasuh"),
  jabatan: varchar("jabatan", { length: 120 }),
  telepon: varchar("telepon", { length: 32 }),
  warna: varchar("warna", { length: 24 }).default("teal"),
  aktif: boolean("aktif").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Data Anak                                                           */
/* ------------------------------------------------------------------ */

export const rooms = pgTable("asrama_rooms", {
  id: serial("id").primaryKey(),
  nama: varchar("nama", { length: 80 }).notNull(),
  blok: varchar("blok", { length: 40 }).notNull(),
  lantai: integer("lantai").notNull().default(1),
  jenis: varchar("jenis", { length: 16 }).notNull().default("putra"),
  kapasitas: integer("kapasitas").notNull().default(8),
  kondisi: varchar("kondisi", { length: 24 }).notNull().default("baik"),
  penanggungJawab: varchar("penanggung_jawab", { length: 120 }),
  catatan: text("catatan"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const children = pgTable("children", {
  id: serial("id").primaryKey(),
  nis: varchar("nis", { length: 24 }).notNull().unique(),
  nama: varchar("nama", { length: 120 }).notNull(),
  jenisKelamin: varchar("jenis_kelamin", { length: 8 }).notNull().default("L"),
  tanggalLahir: date("tanggal_lahir"),
  tempatLahir: varchar("tempat_lahir", { length: 80 }),
  asalDaerah: varchar("asal_daerah", { length: 120 }),
  statusAnak: varchar("status_anak", { length: 24 }).notNull().default("yatim"),
  agama: varchar("agama", { length: 24 }).default("Islam"),
  tanggalMasuk: date("tanggal_masuk"),
  status: varchar("status", { length: 24 }).notNull().default("aktif"),
  roomId: integer("room_id"),
  pengasuh: varchar("pengasuh", { length: 120 }),
  waliNama: varchar("wali_nama", { length: 120 }),
  waliKontak: varchar("wali_kontak", { length: 40 }),
  kondisiKesehatan: varchar("kondisi_kesehatan", { length: 60 }).default("Sehat"),
  golonganDarah: varchar("golongan_darah", { length: 6 }),
  beratBadan: numeric("berat_badan", { precision: 6, scale: 1 }),
  tinggiBadan: numeric("tinggi_badan", { precision: 6, scale: 1 }),
  kebutuhanKhusus: varchar("kebutuhan_khusus", { length: 160 }),
  catatan: text("catatan"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Kebutuhan Dasar                                                     */
/* ------------------------------------------------------------------ */

export const healthRecords = pgTable("health_records", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  tanggal: date("tanggal").notNull(),
  jenis: varchar("jenis", { length: 40 }).notNull().default("pemeriksaan"),
  fasilitas: varchar("fasilitas", { length: 120 }),
  petugas: varchar("petugas", { length: 120 }),
  keluhan: text("keluhan"),
  diagnosis: varchar("diagnosis", { length: 160 }),
  tindakan: text("tindakan"),
  biaya: integer("biaya").default(0),
  status: varchar("status", { length: 24 }).notNull().default("selesai"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const educationRecords = pgTable("education_records", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  tahunAjaran: varchar("tahun_ajaran", { length: 24 }).notNull().default("2025/2026"),
  sekolah: varchar("sekolah", { length: 160 }),
  jenjang: varchar("jenjang", { length: 24 }).notNull().default("SMP"),
  kelas: varchar("kelas", { length: 24 }),
  kehadiran: numeric("kehadiran", { precision: 5, scale: 1 }).default("95"),
  nilaiRata: numeric("nilai_rata", { precision: 5, scale: 1 }),
  waliKelas: varchar("wali_kelas", { length: 120 }),
  prestasi: text("prestasi"),
  biayaSpp: integer("biaya_spp").default(0),
  status: varchar("status", { length: 24 }).notNull().default("aktif"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const nutritionLogs = pgTable("nutrition_logs", {
  id: serial("id").primaryKey(),
  tanggal: date("tanggal").notNull(),
  waktu: varchar("waktu", { length: 16 }).notNull().default("pagi"),
  menu: varchar("menu", { length: 160 }).notNull(),
  jumlahAnak: integer("jumlah_anak").notNull().default(0),
  porsiTerpenuhi: integer("porsi_terpenuhi").notNull().default(0),
  anggaran: integer("anggaran").default(0),
  statusGizi: varchar("status_gizi", { length: 24 }).notNull().default("baik"),
  petugas: varchar("petugas", { length: 120 }),
  catatan: text("catatan"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const aidDistributions = pgTable("aid_distributions", {
  id: serial("id").primaryKey(),
  childId: integer("child_id"),
  tanggal: date("tanggal").notNull(),
  item: varchar("item", { length: 160 }).notNull(),
  kategori: varchar("kategori", { length: 40 }).notNull().default("pakaian"),
  jumlah: integer("jumlah").notNull().default(1),
  sumber: varchar("sumber", { length: 120 }),
  status: varchar("status", { length: 24 }).notNull().default("disalurkan"),
  catatan: text("catatan"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Perlindungan                                                        */
/* ------------------------------------------------------------------ */

export const incidents = pgTable("incidents", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  tanggal: date("tanggal").notNull(),
  kategori: varchar("kategori", { length: 40 }).notNull().default("perundungan"),
  tingkat: varchar("tingkat", { length: 16 }).notNull().default("ringan"),
  lokasi: varchar("lokasi", { length: 120 }),
  pelapor: varchar("pelapor", { length: 120 }),
  deskripsi: text("deskripsi"),
  penanganan: text("penanganan"),
  penanggungJawab: varchar("penanggung_jawab", { length: 120 }),
  status: varchar("status", { length: 24 }).notNull().default("baru"),
  tanggalSelesai: date("tanggal_selesai"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const visits = pgTable("visits", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  tanggal: date("tanggal").notNull(),
  jam: varchar("jam", { length: 12 }),
  jenis: varchar("jenis", { length: 32 }).notNull().default("kunjungan"),
  pengunjung: varchar("pengunjung", { length: 120 }).notNull(),
  hubungan: varchar("hubungan", { length: 60 }),
  disetujuiOleh: varchar("disetujui_oleh", { length: 120 }),
  tujuan: text("tujuan"),
  status: varchar("status", { length: 24 }).notNull().default("disetujui"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  jenis: varchar("jenis", { length: 40 }).notNull().default("akta_lahir"),
  nomor: varchar("nomor", { length: 80 }),
  penerbit: varchar("penerbit", { length: 120 }),
  diterbitkan: date("diterbitkan"),
  berlakuSampai: date("berlaku_sampai"),
  status: varchar("status", { length: 32 }).notNull().default("valid"),
  catatan: text("catatan"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Donasi & Stok Bantuan                                               */
/* ------------------------------------------------------------------ */

export const donations = pgTable("donations", {
  id: serial("id").primaryKey(),
  tanggal: date("tanggal").notNull(),
  donor: varchar("donor", { length: 160 }).notNull(),
  kontak: varchar("kontak", { length: 60 }),
  tipe: varchar("tipe", { length: 16 }).notNull().default("barang"),
  deskripsi: varchar("deskripsi", { length: 200 }),
  jumlah: integer("jumlah").default(1),
  nilai: integer("nilai").default(0),
  peruntukan: varchar("peruntukan", { length: 40 }).notNull().default("kebutuhan_dasar"),
  penyaluran: varchar("penyaluran", { length: 24 }).notNull().default("belum"),
  nomorResi: varchar("nomor_resi", { length: 40 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ------------------------------------------------------------------ */
/* SDM Pengasuh                                                        */
/* ------------------------------------------------------------------ */

export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  nama: varchar("nama", { length: 120 }).notNull(),
  nip: varchar("nip", { length: 24 }),
  jabatan: varchar("jabatan", { length: 40 }).notNull().default("pengasuh"),
  shift: varchar("shift", { length: 16 }).notNull().default("pagi"),
  wilayah: varchar("wilayah", { length: 60 }),
  telepon: varchar("telepon", { length: 32 }),
  email: varchar("email", { length: 120 }),
  tanggalMulai: date("tanggal_mulai"),
  sertifikasi: varchar("sertifikasi", { length: 160 }),
  status: varchar("status", { length: 24 }).notNull().default("aktif"),
  catatan: text("catatan"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type DbTable =
  | typeof users
  | typeof children
  | typeof rooms
  | typeof healthRecords
  | typeof educationRecords
  | typeof nutritionLogs
  | typeof aidDistributions
  | typeof incidents
  | typeof visits
  | typeof documents
  | typeof donations
  | typeof staff;
