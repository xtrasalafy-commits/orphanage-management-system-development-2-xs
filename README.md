# Sistem Manajemen Panti Asuhan — Harapan Bangsa

Web app manajemen panti asuhan yang menyatukan pemenuhan **kebutuhan dasar** dan
**perlindungan anak** yatim piatu dalam satu dasbor — pencatatan terstruktur, dapat
diaudit, dan siap dilaporkan ke yayasan/dinas sosial.

**Open Source oleh MZF - 2026**

---

## Daftar isi

1. [Gambaran umum](#gambaran-umum)
2. [Fitur](#fitur)
3. [Tech stack](#tech-stack)
4. [Prasyarat](#prasyarat)
5. [Instalasi & menjalankan secara lokal](#instalasi--menjalankan-secara-lokal)
6. [Basis data (Neon / PostgreSQL)](#basis-data-neon--postgresql)
7. [Akun demo](#akun-demo)
8. [Struktur proyek](#struktur-proyek)
9. [Skrip npm](#skrip-npm)
10. [Deploy ke Vercel](#deploy-ke-vercel)
11. [Widget Trakteer & unduh source code](#widget-trakteer--unduh-source-code)
12. [Keamanan](#keamanan)
13. [Lisensi](#lisensi)

---

## Gambaran umum

Aplikasi ini mengelola seluruh operasional panti asuhan dalam 12 modul terpusat,
dengan kontrol akses berbasis peran (administrator, pengasuh, tata usaha, relawan)
dan dasbor ringkasan untuk pemantauan harian.

Semua data tersimpan permanen di basis data PostgreSQL (Neon) — bukan localStorage —
sehingga aman, dapat dicadangkan, dan multi-pengguna.

## Fitur

| Modul | Fungsi |
| --- | --- |
| **Dasbor** | Ringkasan: hunian, porsi gizi, insiden aktif, dokumen, donasi 6 bulan, rasio pengasuh, aktivitas terbaru |
| **Anak Binaan** | Register induk: NIS, identitas, wali, kamar, kondisi kesehatan, halaman profil per anak |
| **Kesehatan** | Pemeriksaan, imunisasi, pengobatan, rawat inap/jalan, psikologi, biaya & tindak lanjut |
| **Pendidikan** | Sekolah, jenjang, kehadiran, nilai, SPP, prestasi per tahun ajaran |
| **Pangan & Gizi** | Jurnal dapur harian: menu, porsi dibutuhkan vs terpenuhi, anggaran |
| **Pakaian & Perlengkapan** | Permintaan & penyaluran barang per anak (seragam, sepatu, alat tulis, kasur) |
| **Asrama** | Kamar, kapasitas, keterisian, kondisi fisik |
| **Insiden & Perlindungan** | Laporan kasus: kategori, tingkat, penanganan, status, rujukan |
| **Kunjungan & Izin** | Buku tamu & izin keluar: pengunjung, persetujuan pengasuh, safeguard |
| **Dokumen & Hak Anak** | Kelengkapan kependudukan: akta, KIA, KK, BPJS, masa berlaku |
| **Donasi** | Penerimaan bantuan: donatur, jenis, nilai, peruntukan, status penyaluran |
| **Staf & Pengguna** | Staf, shift, sertifikasi; akun sistem dengan peran & kontrol akses |

Setiap modul mendukung: pencarian, filter, pengurutan, ekspor CSV, ringkasan
statistik, serta tambah/ubah/hapus (kecuali peran Relawan yang hanya bisa membaca).

## Tech stack

- **Next.js 16** (App Router, Server & Client Components)
- **React 19** + **TypeScript 5.9**
- **Tailwind CSS v4** (design system kustom, font Plus Jakarta Sans + Bricolage Grotesque)
- **Drizzle ORM 0.45** + **node-postgres (pg)**
- **PostgreSQL** — diuji dengan **Neon**
- **lucide-react** untuk ikon
- Autentikasi: cookie bertanda tangan HMAC-SHA256 + hashing scrypt (tanpa library auth eksternal)

## Prasyarat

- Node.js 20+ (direkomendasikan 22)
- npm
- Basis data PostgreSQL — Neon (serverless) atau PostgreSQL lokal

## Instalasi & menjalankan secara lokal

```bash
# 1. Clone / ekstrak source code
git clone <repo-url> panti-harapan-bangsa
cd panti-harapan-bangsa

# 2. Instal dependensi
npm install

# 3. Siapkan variabel lingkungan
cp .env.example .env
#   lalu isi .env:
#   DATABASE_URL=postgresql://user:password@host/database?sslmode=require
#   AUTH_SECRET=<string-acak-minimal-32-karakter>

# 4. Buat skema basis data
npm run db:push

# 5. Isi data contoh (users, 76 anak, kamar, kesehatan, donasi, dll.)
npm run db:seed

# 6. Jalankan mode pengembangan
npm run dev
```

Buka <http://localhost:3000> — aplikasi akan mengarahkan ke halaman login.

Untuk produksi:

```bash
npm run build
npm run start
```

## Basis data (Neon / PostgreSQL)

Skema berada di `src/db/schema.ts` (Drizzle ORM). 12 tabel:

`users`, `asrama_rooms`, `children`, `health_records`, `education_records`,
`nutrition_logs`, `aid_distributions`, `incidents`, `visits`, `documents`,
`donations`, `staff`.

Perintah basis data:

```bash
npm run db:push     # sinkronkan skema ke basis data (idempoten)
npm run db:seed     # isi dengan data demo realistis (mengosongkan tabel dulu)
npm run db:studio   # buka Drizzle Studio (GUI penjelajah data)
```

Untuk membuat database Neon baru: daftar di <https://neon.tech>, buat project,
salin connection string (format pooler, `?sslmode=require`), dan jadikan
`DATABASE_URL` di `.env` (lokal) maupun di Vercel (lihat di bawah).

## Akun demo

Setelah `npm run db:seed`, akun berikut tersedia (semua dengan kata sandi `panti123`):

| Username | Peran | Akses |
| --- | --- | --- |
| `administrator` | Administrator | Semua modul, termasuk manajemen pengguna |
| `pengasuh` | Pengasuh | Semua modul data |
| `tatausaha` | Tata Usaha | Semua modul data |
| `relawan` | Relawan | **Hanya baca** — tidak dapat menambah/mengubah/menghapus |

## Struktur proyek

```
.
├── src/
│   ├── app/
│   │   ├── (app)/              # halaman dalam (butuh login): dashboard, anak, kesehatan, …
│   │   ├── api/                # route API: auth (login/logout/session), data/[resource], health
│   │   ├── login/              # halaman masuk
│   │   ├── layout.tsx          # root layout (memasang widget Trakteer)
│   │   └── page.tsx            # redirect ke /dashboard
│   ├── components/
│   │   ├── data/               # ResourcePage, ResourceView (tabel + form CRUD), use-resource
│   │   ├── shell.tsx           # navigasi samping & header
│   │   ├── ui.tsx              # design system: Button, Badge, Modal, Toast, Chart
│   │   └── trakteer-widget.tsx # floating widget Trakteer + QR + unduh source
│   ├── config/resources.tsx    # konfigurasi 12 modul (kolom, field, filter, ringkasan)
│   ├── db/                     # koneksi pool + skema Drizzle
│   └── lib/                    # auth, crud, format (tanggal/rupiah/usia), cx
├── scripts/
│   ├── seed.mjs                # data demo
│   └── pack-source.mjs         # packing source → public/source-code.zip
├── drizzle.config.ts
├── next.config.ts
└── package.json
```

## Skrip npm

| Skrip | Keterangan |
| --- | --- |
| `npm run dev` | Mode pengembangan |
| `npm run build` | Build produksi (otomatis mem-packing source code via `prebuild`) |
| `npm run start` | Jalankan hasil build produksi |
| `npm run lint` | ESLint |
| `npm run typecheck` | pengecekan tipe TypeScript |
| `npm run pack` | Packing source code menjadi `public/source-code.zip` |
| `npm run db:push` | Sinkronkan skema basis data |
| `npm run db:seed` | Isi data demo |
| `npm run db:studio` | Drizzle Studio |

## Deploy ke Vercel

1. Push repo ini ke GitHub/GitLab/Bitbucket.
2. Buat project baru di <https://vercel.com> → import repo.
3. Tambahkan **Environment Variables** (Settings → Environment Variables):
   - `DATABASE_URL` — connection string Neon
     (contoh: `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require`)
   - `AUTH_SECRET` — string acak minimal 32 karakter (rahasia penandatanganan sesi)
4. Deploy. Vercel menjalankan `npm run build`, yang juga membuat
   `public/source-code.zip` lewat `prebuild`, sehingga tombol unduh source
   langsung berfungsi.

> Pastikan database Neon berada di region yang dekat dengan deployment Vercel
> untuk latensi minimum.

## Widget Trakteer & unduh source code

- **Floating widget** di sudut kanan bawah setiap halaman: _"Web app ini gratis &
  bebas iklan. Kopi kecil, server tetap jalan"_. Klik untuk memilih nominal
  traktiran (mulai Rp6.000 dan kelipatannya) dan memindai QR Code Trakteer
  (<https://trakteer.id/perpus_opera/>) langsung di dalam aplikasi.
- **Unduh source code lengkap** tersedia di:
  - dalam modal widget Trakteer (tombol "Unduh source"),
  - footer halaman login,
  - langsung di `/source-code.zip` (di-generate saat build).

Untuk membuat ulang arsip source code: `npm run pack`.

## Keamanan

- `.env` **tidak** di-commit (sudah di-`.gitignore`). Jangan pernah
  memasukkan `DATABASE_URL`/`AUTH_SECRET` ke repo.
- Ganti `AUTH_SECRET` dengan nilai acak yang kuat untuk produksi
  (contoh: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).
- Kata sandi di-hash dengan scrypt + salt acak; sesi ditandatangani dengan
  HMAC-SHA256 (`httpOnly`, `secure` di produksi, `sameSite: lax`).
- Peran Relawan dibatasi hanya-baca di sisi server (API menolak tulis dengan 403).

## Lisensi

Open Source oleh MZF - 2026

Bebas digunakan, dipelajari, dimodifikasi, dan disebarluaskan untuk kepentingan
pengelolaan panti asuhan. Dukung pengembangannya lewat
<https://trakteer.id/perpus_opera/> — kopi kecil, server tetap jalan.
