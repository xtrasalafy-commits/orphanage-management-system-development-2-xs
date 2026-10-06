/**
 * Seed Panti Asuhan Harapan Bangsa dengan data demo yang realistis.
 * Jalankan: node scripts/seed.mjs
 */
import { createHash, randomBytes, scryptSync } from "node:crypto";
import { readFileSync } from "node:fs";
import { Client } from "pg";

// ---------- env ----------
try {
  const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
} catch {
  /* ignore */
}
const DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

// ---------- deterministic pseudo random ----------
let s = 20260214;
function rnd() {
  s = (s + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const int = (min, max) => min + Math.floor(rnd() * (max - min + 1));
const chance = (p) => rnd() < p;
const iso = (d) => d.toISOString().slice(0, 10);
const shiftDays = (days) => iso(new Date(Date.now() + days * 86400000));

// ---------- name pools ----------
const NAMA_L = ["Muhammad Rizky", "Ade Fauzan", "Ilham Ramadhan", "Yusuf Abdillah", "Umar Basri", "Bima Sakti", "Reza Pratama", "Fajar Siddiq", "Irfan Maulana", "Asep Dedi", "Salman Farizi", "Naufal Hakim", "Galih Prakoso", "Ridwan Kamil", "Zaki Yamani", "Iqbal Nur", "Rendi Saputra", "Wahyudi", "Hendra Gunawan", "Tio Aditya", "Kakang Rizal", "Daud Alfarizi", "Bayu Skak", "Fauzi Hafizh"];
const NAMA_P = ["Siti Aisyah", "Nur Fatimah", "Zahra Amelia", "Alifah Rahma", "Dewi Lestari", "Salma Azzahra", "Hannah Nabila", "Intan Permatasari", "Bilqis Kirana", "Nadia Safitri", "Pipit Eka", "Ratna Dwi", "Tiara Angel", "Umi Kalsum", "Yanti Sumarni", "Maura Salsabila", "Ayu Kartika", "Rizka Amalia", "Putri Handayani", "Vina Melati", "Wulan Sari", "Elsa Fitriani", "Tata Kurnia", "Laila Rahmawati"];
const BELAKANG = ["Putra", "Putri", "Wijaya", "Perkasa", "Anggraini", "Syaputra", "Ningsih", "Larasati", "Ramdhani", "Hidayat", "Firmansyah", "Maulida"];
const DAERAH = ["Kab. Bandung", "Kab. Garut", "Kab. Sumedang", "Kota Bandung", "Kab. Cianjur", "Kab. Tasikmalaya", "Kab. Majalengka", "Kab. Ciamis", "Kab. Bogor", "Kab. Indramayu", "Kab. Subang", "Lombok Timur", "Kab. Bandung Barat", "Kab. Karawang"];
const ASAL_SEKOLAH = ["SDN 1 Ciparay", "SDN 2 Pameungpeuk", "SDN Babakan Peuteuy", "SDIT Al-Hijra", "SMPN 2 Ciparay", "SMPN 5 Baleendah", "MTs Al-Hikmah", "SMAN 1 Baleendah", "MA Darul Falah", "PKBM Harapan (Kejar Paket B)", "LKP Teknologi Informasi Bandung"];
const FASKES = ["Klinik Panti Harapan Bangsa", "Puskesmas Ciparay", "RS Omni Alam Sutra", "Klinik Dewi Sri", "Posyandu Melati", "RSUD Al Ihsan"];
const PETUGAS_KES = ["dr. Anindya Kirana", "Budi Santoso, A.Md.Kep", "Nurhaliza, S.Kep", "dr. H. Dedi Supriadi, Sp.A", "Sari Mutia, A.Md.Farm"];
const PENGASUHS = ["Umar Hasan Basri", "Nia Kurniasih", "Ahmad Fauzi", "Entis Sutisna", "Rina Marlina", "Dedi Hamdani"];
const MENU = {
  pagi: ["Nasi uduk, telur balado, tempe orek, susu kedelai", "Bubur ayam + cakwe, pisang, teh tawar", "Nasi goreng kampung, timun, susu UHT", "Lontong sayur, tahu goreng, jeruk"],
  siang: ["Nasi, ayam kecap, tumis kangkung, tahu, semangka", "Nasi, ikan lele goreng, sambal, sayur asem, pepaya", "Nasi, ayam pop, urap sayur, melon", "Nasi, soto ayam, perkedel, kerupuk, pisang"],
  sore: ["Nasi, ikan kembung bumbu kuning, pecel sayur, jeruk", "Nasi, semur tahu, ayam bakar, cah sawi, alpukat", "Nasi, gulai sayur, telur dadar, tempe mendoan", "Nasi, sayur lodeh, pepes tahu, pisang"],
  snack: ["Pisang goreng + susu vanilla", "Kue putu, buah naga, susu kotak", "Bubur sumsum, kacang hijau rebus", "Roti gandus, agar-agar melon"],
};
const DONATUR = ["Yayasan Baitul Maal", "Komunitas Peduli Yatim Bandung", "Hj. Enung Kurnia", "PT Sinar Pangan Indonesia", "DKM Al-Ikhlas Ciparay", "R. Suhendar & keluarga", "LAZIS Al-Amanah", "Forum CSR Bank BJB", "Ibu Ratna Wijaya", "Himpunan Pengusaha Muda Kab. Bandung", "Relawan Kampus UPI", "Kantor Kemenag Kab. Bandung"];
const KEBUTUHAN = ["pakaian", "seragam", "sepatu", "tas", "mandi", "tidur", "ibadah", "khusus"];
const ITEM = {
  pakaian: ["Baju kaos harian 3 stel", "Sarung & kemeja batik", "Mukena dewasa", "Pakaian dalam 6 pack"],
  seragam: ["Seragam SD putih-abu 2 stel", "Seragam batik sekolah", "Pramuka lengkap", "Jilbab seragam instan"],
  sepatu: ["Sepatu sekolah Black Panther", "Sandal gunung", "Sepatu futsal"],
  tas: ["Tas ransel sekolah", "Set alat tulis & buku tulis 10 pk", "Kalkulator ilmiah"],
  mandi: ["Paket sabun, sampo, pasta gigi (1 bulan)", "Handuk & sikat gigi baru"],
  tidur: ["Sprei & sarung bantal", "Selimut kapas", "Busa kasur baru"],
  ibadah: ["Sajadah & Al-Qur'an", "Peci & kerudung"],
  khusus: ["Kacamata minus (resep dokter)", "Alat bantu dengar baterai", "Tas khusus kaki (orthosis)"],
};

// ---------- schema-safe insert helper ----------
const client = new Client({ connectionString: DATABASE_URL });

async function insertAll(table, rows) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const CHUNK = 120;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const part = rows.slice(i, i + CHUNK);
    const params = [];
    const tuples = part.map((row, ri) => {
      const cells = cols.map((c, ci) => {
        const v = row[c];
        params.push(v === undefined ? null : v);
        return `$${ri * cols.length + ci + 1}`;
      });
      return `(${cells.join(",")})`;
    });
    await client.query(
      `insert into ${table} (${cols.join(",")}) values ${tuples.join(",")}`,
      params,
    );
  }
  console.log(`  ↳ ${table}: ${rows.length} baris`);
}

async function truncateAll() {
  const tables = [
    "users",
    "asrama_rooms",
    "children",
    "health_records",
    "education_records",
    "nutrition_logs",
    "aid_distributions",
    "incidents",
    "visits",
    "documents",
    "donations",
    "staff",
  ];
  await client.query(`truncate table ${tables.map((t) => `"${t}"`).join(", ")} restart identity cascade`);
}

async function main() {
  await client.connect();
  console.log("→ membersihkan tabel demo…");
  await truncateAll();

  /* ---------------- users ---------------- */
  const hash = (pw) => {
    const salt = randomBytes(16).toString("hex");
    return `${salt}:${scryptSync(pw, salt, 64).toString("hex")}`;
  };
  console.log("→ membuat akun pengguna…");
  await insertAll("users", [
    { nama: "Dra. Siti Rahmawati", username: "administrator", password_hash: hash("panti123"), role: "administrator", jabatan: "Kepala Panti Asuhan", telepon: "0812-2134-8890", warna: "clay", aktif: true },
    { nama: "Umar Hasan Basri", username: "pengasuh", password_hash: hash("panti123"), role: "pengasuh", jabatan: "Koordinator Pengasuh Harian", telepon: "0857-2211-0093", warna: "teal", aktif: true },
    { nama: "Aminah Zubaidah", username: "tatausaha", password_hash: hash("panti123"), role: "tata_usaha", jabatan: "Staf Administrasi & Logistik", telepon: "0813-9922-4471", warna: "sky", aktif: true },
    { nama: "Rizal Alfarizi", username: "relawan", password_hash: hash("panti123"), role: "relawan", jabatan: "Relawan Pendamping Belajar", telepon: "0895-3320-1188", warna: "moss", aktif: true },
    { nama: "Nia Kurniasih, S.Sos", username: "nia.kurniasih", password_hash: hash("panti123"), role: "pengasuh", jabatan: "Pengasuh Asrama Putri", telepon: "0821-1245-7788", warna: "plum", aktif: true },
  ]);

  /* ---------------- rooms ---------------- */
  const ROOM_DEFS = [
    ["Melati 01", "A", "putri", 10],
    ["Melati 02", "A", "putri", 10],
    ["Anggrek 01", "A", "putri", 8],
    ["Anggrek 02", "B", "putri", 8],
    ["Cempaka", "B", "putri", 9],
    ["Kenanga", "B", "putri", 7],
    ["Ardhana 01", "C", "putra", 12],
    ["Ardhana 02", "C", "putra", 12],
    ["Nakra 01", "D", "putra", 10],
    ["Nakra 02", "D", "putra", 9],
    ["Brahma", "D", "putra", 8],
    ["Surya (pra-dewasa)", "E", "putra", 8],
  ];
  console.log("→ asrama & kamar…");
  const rooms = [];
  for (const [nama, blok, jenis, kapasitas] of ROOM_DEFS) {
    const rows = await client.query(
      `insert into asrama_rooms (nama, blok, lantai, jenis, kapasitas, kondisi, penanggung_jawab, catatan)
       values ($1,$2,$3,$4,$5,$6,$7,$8) returning id`,
      [
        nama,
        blok,
        int(1, 2),
        jenis,
        kapasitas,
        chance(0.25) ? "perlu-perbaikan" : "baik",
        pick(PENGASUHS),
        chance(0.35) ? "Perlu pengecatan ulang dan perbaikan atap di sisi timur." : null,
      ],
    );
    rooms.push({ id: rows.rows[0].id, nama, blok, jenis, kapasitas, dipakai: 0 });
  }

  /* ---------------- children ---------------- */
  console.log("→ register anak binaan…");
  const TOTAL = 76;
  const kids = [];
  for (let i = 0; i < TOTAL; i += 1) {
    const jenis = i % 2 === 0 ? "L" : "P";
    const umur = int(4, 18);
    const bln = int(0, 11);
    const lahir = new Date(new Date().getFullYear() - umur, bln, int(1, 28));
    const masukYearsBack = Math.min(umur - 3, int(0, 9));
    const masuk = new Date(new Date().getFullYear() - masukYearsBack, int(0, 11), int(1, 28));
    const status = chance(0.06) ? "lulus" : chance(0.05) ? "pulang" : chance(0.04) ? "titip" : "aktif";
    let roomId = null;
    if (status === "aktif") {
      const pool = rooms.filter((r) => (jenis === "L" ? r.jenis === "putra" : r.jenis === "putri") && r.dipakai < r.kapasitas);
      const room = pool.length ? pick(pool) : null;
      if (room) {
        room.dipakai += 1;
        roomId = room.id;
      }
    }
    const nama = `${jenis === "L" ? pick(NAMA_L) : pick(NAMA_P)} ${pick(BELAKANG)}`;
    const nis = `PA-${masuk.getFullYear()}-${String(i + 1).padStart(3, "0")}`;
    const statusAnak = pick(["yatim", "piatu", "yatim-piatu", "yatim-piatu", "fakir-miskin", "yatim", "terlantar"]);
    const bb = (umur * 2.4 + int(40, 130) / 10).toFixed(1);
    const tb = (umur * 5.6 + int(60, 130)).toFixed(1);
    kids.push({
      nis,
      nama: nama,
      jenis_kelamin: jenis,
      tanggal_lahir: iso(lahir),
      tempat_lahir: pick(DAERAH),
      asal_daerah: pick(DAERAH),
      status_anak: statusAnak,
      agama: chance(0.92) ? "Islam" : pick(["Kristen", "Katolik"]),
      tanggal_masuk: iso(masuk),
      status,
      room_id: roomId,
      pengasuh: pick(PENGASUHS),
      wali_nama: `${pick(["Budi", "Sari", "Ahmad", "Endang", "Tuti", "Wahyu", "Cucu", "Iis"])} ${pick(BELAKANG)}`,
      wali_kontak: `08${int(11, 89)}-${int(1000, 9999)}-${int(1000, 9999)}`,
      kondisi_kesehatan: chance(0.72) ? "Sehat" : pick(["Pengobatan rutin", "Pemulihan gizi", "Rujukan RS", "Disabilitas"]),
      golongan_darah: chance(0.6) ? pick(["A", "B", "O", "AB"]) : null,
      berat_badan: bb,
      tinggi_badan: tb,
      kebutuhan_khusus: chance(0.12) ? pick(["Kacamata minus", "Terapi wicara mingguan", "Bantuan dengar", "Pendampingan belajar"]) : null,
      catatan: chance(0.4)
        ? pick([
            "Menunjukkan perkembangan sosial baik, aktif di kegiatan pramuka.",
            "Awal masuk mengalami sulit tidur; kini sudah membaik setelah pendampingan pengasuh.",
            "Sangat suka matematika, perlu dorongan kepercayaan diri saat presentasi.",
            "Ayah wafat akibat kecelakaan kerja; ibu bekerja di luar kota.",
            "Alasan ekonomi keluarga; wali besar masih mengunjungi tiap bulan.",
            "Anak dengan keterbatasan penglihatan, telah dibantu kacamata dari donasi.",
          ])
        : null,
    });
  }
  await insertAll("children", kids);
  const kidIds = (await client.query(`select id, nis, nama, jenis_kelamin, tanggal_lahir from children order by id`)).rows;

  /* ---------------- staff ---------------- */
  console.log("→ staf & pengasuh…");
  const JABATAN = [
    ["kepala", "Dra. Siti Rahmawati"],
    ["pengasuh", "Umar Hasan Basri"],
    ["pengasuh", "Nia Kurniasih, S.Sos"],
    ["pengasuh", "Rina Marlina"],
    ["pengasuh", "Dedi Hamdani"],
    ["pengasuh", "Entis Sutisna"],
    ["pengasuh", "Wati Ernawati"],
    ["bidan", "Sari Mutia, A.Md.Keb"],
    ["bidan", "Ahmad Fauzi, A.Md.Kep"],
    ["psikolog", "Dinda Ayu Permatasari, M.Psi"],
    ["guru", "Rizal Alfarizi, S.Pd"],
    ["guru", "Hendra Gunawan, S.Pd"],
    ["admin", "Aminah Zubaidah"],
    ["dapur", "Ijah Juhariah"],
    ["dapur", "Carlan Suparlan"],
    ["relawan", "Vina Melati"],
  ];
  await insertAll(
    "staff",
    JABATAN.map(([jabatan, nama], i) => ({
      nama,
      nip: `20${int(10, 24)}${String(i + 11).padStart(4, "0")}`,
      jabatan,
      shift: i % 4 === 3 ? "malam" : pick(["pagi", "siang", "penuh"]),
      wilayah: pick(["Asrama putri blok A", "Asrama putra blok C", "Asrama putri blok B", "Klinik panti", "Dapur & gudang", "Kantor tata usaha", "Asrama putra blok D"]),
      telepon: `08${int(11, 89)}-${int(1000, 9999)}-${int(100, 999)}${int(0, 9)}`,
      email: `${nama.split(" ")[0].toLowerCase().replace(/[^a-z]/g, "")}@harapanbangsa.or.id`,
      tanggal_mulai: shiftDays(-int(200, 3400)),
      sertifikasi:
        jabatan === "pengasuh" || jabatan === "kepala"
          ? "Pelatihan Pengasuhan Berbasis Hak Anak (Kemensos RI)"
          : jabatan === "bidan"
            ? "Sertifikat Bantuan Hidup Dasar (BHD)"
            : chance(0.5)
              ? "Pelatihan Manajemen Data Panti (SIMTH)"
              : null,
      status: i === 15 ? "cuti" : "aktif",
      catatan: null,
    })),
  );

  /* ---------------- health ---------------- */
  console.log("→ riwayat kesehatan…");
  const JENIS_KES = ["pemeriksaan", "imunisasi", "pengobatan", "rawat-jalan", "gizi", "kesehatan-gigi", "konsultasi-jiwa"];
  const DIAG = ["Demam thypoid suspek", "ISPA ringan", "Gigi berlubang (karies)", "Maag", "Sampar/cacar air pemulihan", "Gizi kurang (BB menurun)", "Alergi dermatitis", "Anemia ringan", "Pemeriksaan tumbuh kembang normal", "Infeksi saluran kemih"];
  const TINDAKAN = ["Resep paracetamol 3x1 & kompres", "Obat syrup + kontrol 3 hari", "Rujukan ke RS Omni Alam Sutra", "Pemberian vitamin A & penambah darah", "Scaling & tambal gigi", "Edukasi cuci tangan & perbaikan menu", "Konseling 2 sesi bersama psikolog"];
  await insertAll(
    "health_records",
    Array.from({ length: 48 }, () => ({
      child_id: pick(kidIds).id,
      tanggal: shiftDays(-int(0, 240)),
      jenis: pick(JENIS_KES),
      fasilitas: pick(FASKES),
      petugas: pick(PETUGAS_KES),
      keluhan: pick(["Demam 2 hari, batuk pilek", "Sakit gigi kanan bawah", "Nyeri ulu hati setelah makan pedas", "Lemas dan nafsu makan turun", "Gatal-gatal di lengan", "Tidak ada keluhan, kontrol rutin"]),
      diagnosis: pick(DIAG),
      tindakan: pick(TINDAKAN),
      biaya: int(0, 14) * 25000,
      status: chance(0.72) ? "selesai" : pick(["perlu-kontrol", "dirujuk", "dipantau"]),
    })),
  );

  /* ---------------- education ---------------- */
  console.log("→ catatan pendidikan…");
  const eduRows = [];
  for (const k of kidIds) {
    const umur = new Date().getFullYear() - new Date(k.tanggal_lahir).getFullYear();
    const jenjang = umur < 7 ? "KEJAR" : umur <= 12 ? "SD" : umur <= 15 ? "SMP" : umur <= 18 ? "SMA" : "KURSUS";
    const sekolah = jenjang === "SD" ? pick(ASAL_SEKOLAH.slice(0, 4)) : jenjang === "SMP" ? pick(ASAL_SEKOLAH.slice(4, 7)) : jenjang === "SMA" ? pick(ASAL_SEKOLAH.slice(7, 9)) : jenjang === "KEJAR" ? ASAL_SEKOLAH[9] : ASAL_SEKOLAH[10];
    eduRows.push({
      child_id: k.id,
      tahun_ajaran: "2025/2026",
      sekolah,
      jenjang,
      kelas: `${int(jenjang === "SD" ? 1 : jenjang === "SMP" ? 7 : 10, jenjang === "SD" ? 6 : jenjang === "SMP" ? 9 : 12)}${pick(["A", "B", "C"])}`,
      kehadiran: (int(780, 1000) / 10).toFixed(1),
      nilai_rata: (int(680, 940) / 10).toFixed(1),
      wali_kelas: `${pick(["Eni Rohaeni", "Drs. Bambang", "Sri Handayani", "Ade Suryana", "Mimin Mintarsih"])}${chance(0.5) ? ", S.Pd" : ""}`,
      prestasi: chance(0.24)
        ? pick(["Juara 2 Olimpiade Sains Kecamatan", "Lomba Adzan tingkat panti", "Anggota Paskibraka sekolah", "Juara 3 MHQ 5 juz", "Sertifikat pelatihan jurnalistik"])
        : null,
      biaya_spp: jenjang === "SD" ? int(0, 4) * 25000 : jenjang === "SMP" ? int(3, 8) * 25000 : jenjang === "SMA" ? int(5, 12) * 25000 : int(1, 5) * 50000,
      status: "aktif",
    });
  }
  await insertAll("education_records", eduRows);

  /* ---------------- nutrition ---------------- */
  console.log("→ jurnal pangan & gizi…");
  const giziRows = [];
  for (let d = 20; d >= 0; d -= 1) {
    const tanggal = shiftDays(-d);
    for (const waktu of ["pagi", "siang", "sore"]) {
      const need = int(70, 78);
      const shortfall = chance(0.18) ? int(1, 8) : 0;
      giziRows.push({
        tanggal,
        waktu,
        menu: pick(MENU[waktu]),
        jumlah_anak: need,
        porsi_terpenuhi: need - shortfall,
        anggaran: int(280, 640) * 1000,
        status_gizi: shortfall > 4 ? "perlu-perhatian" : shortfall > 0 ? "perlu-perhatian" : "baik",
        petugas: pick(["Ijah Juhariah", "Carlan Suparlan", "Tuti Herwati"]),
        catatan: shortfall > 0 ? `Stok ${pick(["beras", "ayam", "sayuran"])} menipis, sebagian porsi disubsitusi tempe/tahu.` : null,
      });
    }
  }
  await insertAll("nutrition_logs", giziRows);

  /* ---------------- aid distributions ---------------- */
  console.log("→ pakaian & perlengkapan…");
  await insertAll(
    "aid_distributions",
    Array.from({ length: 34 }, () => {
      const kategori = pick(KEBUTUHAN);
      return {
        child_id: chance(0.85) ? pick(kidIds).id : null,
        tanggal: shiftDays(-int(0, 150)),
        item: pick(ITEM[kategori]),
        kategori,
        jumlah: int(1, 6),
        sumber: chance(0.5) ? pick(DONATUR) : "Stok gudang panti",
        status: pick(["disalurkan", "disalurkan", "disetujui", "diajukan", "ditunda"]),
        catatan: chance(0.3) ? "Ukuran disesuaikan hasil pengukuran pengasuh kamar." : null,
      };
    }),
  );

  /* ---------------- incidents ---------------- */
  console.log("→ laporan insiden perlindungan…");
  const INS = [
    ["perundungan", "Dirundung teman sesama penghuni karena status anak panti", "ringan"],
    ["perundungan", "Ejekan melalui grup whatsapp kelas", "sedang"],
    ["kekerasan", "Pukul oleh teman saat antre makan siang", "sedang"],
    ["kecelakaan", "Terpeleset di kamar mandi, pergelangan kaki bengkak", "sedang"],
    ["kecelakaan", "Tertusuk kaca jendela yang retak", "ringan"],
    ["verbal", "Diancam wali besar saat kunjungan sehingga anak menolak dikunjungi", "berat"],
    ["eksploitasi", "Diduga diminta bekerja di warung keluarga pada masa izin pulang", "berat"],
    ["kesehatan-mental", "Menarik diri dan sulit tidur setelah kabar keluarga", "sedang"],
    ["pelanggaran-hak", "Surat izin pulang tidak dikembalikan sekolah", "ringan"],
    ["perundungan", "Barang pribadi diambil tanpa izin", "ringan"],
    ["kekerasan", "Berenyam-rebut ruang TV, dorong-dorongan", "ringan"],
    ["kesehatan-mental", "Cemas menjelang ujian, pendampingan psikolog", "sedang"],
    ["kecelakaan", "Kecelakaan lalu lintas saat diantar ke klinik", "berat"],
    ["pelanggaran-hak", "KTP anak belum diterbitkan sehingga terhambat PPDB", "sedang"],
    ["verbal", "Dibentak pengasuh tamu, telah dilakukan mediasi", "sedang"],
  ];
  await insertAll(
    "incidents",
    INS.map(([kategori, deskripsi, tingkat], i) => {
      const status = i < 4 ? pick(["baru", "ditangani"]) : pick(["selesai", "selesai", "diawasi", "ditangani"]);
      const tanggal = shiftDays(-int(2, 210));
      return {
        child_id: pick(kidIds).id,
        tanggal,
        kategori,
        tingkat,
        lokasi: pick(["Asrama putra blok C", "Kantin panti", "Halaman sekolah", "Aula serbaguna", "Kamar mandi asrama", "Ruang belajar bersama", "Dapur panti"]),
        pelapor: pick(PENGASUHS.concat(["Sari Mutia, A.Md.Keb", "Rizal Alfarizi, S.Pd"])),
        deskripsi,
        penanganan:
          status === "selesai"
            ? "Mediasi kedua pihak, pendampingan psikososial 3 sesi, orang tua/wali dipanggil. Anak kembali aktif belajar."
            : chance(0.6)
              ? "Anak diamankan, dilakukan pendampingan awal, laporan diteruskan ke Kepala Panti."
              : null,
        penanggung_jawab: pick(PENGASUHS),
        status,
        tanggal_selesai: status === "selesai" ? shiftDays(-int(1, 40)) : null,
      };
    }),
  );

  /* ---------------- visits ---------------- */
  console.log("→ kunjungan & izin…");
  await insertAll(
    "visits",
    Array.from({ length: 30 }, () => {
      const jenis = pick(["kunjungan", "kunjungan", "izin-pulang", "penjemputan", "kunjungan-klinik", "asesmen", "donor"]);
      return {
        child_id: pick(kidIds).id,
        tanggal: shiftDays(-int(-10, 120)),
        jam: `${String(int(8, 17)).padStart(2, "0")}.${pick(["00", "30"])} WIB`,
        jenis,
        pengunjung: `${pick(["Budi", "Sari", "Ahmad", "Endang", "Tuti", "Wahyu", "Iis", "H. Asep", "Drs. Hendra"])} ${pick(BELAKANG)}`,
        hubungan: pick(["wali besar", "paman", "bibi", "kakak", "keluarga lain", "mitra", "dinas"]),
        disetujui_oleh: pick(PENGASUHS.concat(["Dra. Siti Rahmawati"])),
        tujuan:
          jenis === "izin-pulang"
            ? "Menginap 2 hari di rumah keluarga besar, kembali sesuai jadwal."
            : jenis === "asesmen"
              ? "Asesmen kelayakan bantuan oleh Dinas Sosial Kab. Bandung."
              : jenis === "donor"
                ? "Kunjungan monitoring penyaluran bantuan bulanan."
                : "Mengunjungi anak dan menyerahkan perlengkapan sekolah.",
        status: pick(["disetujui", "selesai", "selesai", "diajukan", "ditolak"]),
      };
    }),
  );

  /* ---------------- documents ---------------- */
  console.log("→ dokumen kependudukan…");
  const docRows = [];
  const DOC_TYPES = [
    ["akta-lahir", "Disdukcapil Kab. Bandung", null],
    ["kia", "Disdukcapil Kab. Bandung", 14],
    ["kk", "Kelurahan Ciparay", null],
    ["bpjs", "BPJS Kesehatan Cabang Bandung", null],
    ["kps", "Kemensos RI", null],
    ["sktm", "Kantor Desa Asal", 12],
  ];
  for (const k of kidIds) {
    for (const [jenis, penerbit, validYears] of DOC_TYPES) {
      if (chance(jenis === "akta-lahir" ? 0.06 : 0.3)) continue;
      const diterbitkan = shiftDays(-int(120, 2600));
      const expiry = validYears ? shiftDays(int(-240, validYears * 365)) : null;
      const left = expiry ? Math.ceil((new Date(`${expiry}T00:00:00`).getTime() - Date.now()) / 86400000) : 999;
      const statusRoll = rnd();
      let status = statusRoll > 0.88 ? pick(["proses", "hilang"]) : "valid";
      if (status === "valid" && left < 0) status = "kedaluwarsa";
      else if (status === "valid" && left < 120) status = "perlu-perpanjangan";
      docRows.push({
        child_id: k.id,
        jenis,
        nomor:
          jenis === "akta-lahir"
            ? `3204-LT-${new Date().getFullYear() - int(4, 14)}-${String(int(100, 99999)).padStart(6, "0")}`
            : jenis === "kk"
              ? `3204${int(1000000, 9999999)}${int(1000, 9999)}`
              : `${jenis.toUpperCase().replace("-", "")}-${int(100000, 999999)}`,
        penerbit,
        diterbitkan,
        berlaku_sampai: expiry,
        status,
        catatan: status === "proses" ? "Pengajuan ke Disdukcapil melalui layanan jemput bola, no. tiket terlampir." : null,
      });
    }
  }
  await insertAll("documents", docRows);

  /* ---------------- donations ---------------- */
  console.log("→ donasi & bantuan masuk…");
  const donasiRows = [];
  for (let m = 5; m >= 0; m -= 1) {
    const count = int(4, 8);
    for (let i = 0; i < count; i += 1) {
      const tipe = pick(["barang", "barang", "uang", "jasa"]);
      const tanggal = iso(new Date(new Date().getFullYear(), new Date().getMonth() - m, int(1, 27)));
      donasiRows.push({
        tanggal,
        donor: pick(DONATUR),
        kontak: `08${int(11, 89)}-${int(1000, 9999)}-${int(1000, 9999)}`,
        tipe,
        deskripsi:
          tipe === "uang"
            ? `Bantuan tunai untuk ${pick(["operasional dapur", "biaya pendidikan", "obat & vitamin", "perbaikan atap asrama"])}`
            : tipe === "jasa"
              ? pick(["Bakti sosial khitanan massal gratis", "Pemeriksaan gigi keliling", "Pelatihan literasi keuangan staf", "Servis 12 kasur & perbaikan dipan"])
              : pick([
                  "10 karung beras 25 kg",
                  "4 dus minyak goreng 2 L",
                  "30 set alat tulis & buku tulis",
                  "60 stel seragam sekolah bekas layak pakai",
                  "12 dus mi instan",
                  "20 pak sabun mandi & sampo",
                  "8 unit kipas angin",
                  "15 selimut & sprei baru",
                  "6 set alat kebersihan",
                  "40 kg ayam frozen & 10 kg telur",
                ]),
        jumlah: int(1, 30),
        nilai: int(3, 90) * 250000,
        peruntukan: pick(["kebutuhan_dasar", "kebutuhan_dasar", "pendidikan", "kesehatan", "perlindungan", "operasional"]),
        penyaluran: m === 0 ? pick(["belum", "sebagian"]) : pick(["sudah", "sudah", "sebagian"]),
        nomor_resi: `BB-${new Date().getFullYear()}-${String(int(1, 999)).padStart(4, "0")}`,
      });
    }
  }
  await insertAll("donations", donasiRows);

  /* ---------------- summary ---------------- */
  const counts = {};
  for (const t of ["users", "children", "asrama_rooms", "health_records", "education_records", "nutrition_logs", "aid_distributions", "incidents", "visits", "documents", "donations", "staff"]) {
    const r = await client.query(`select count(*)::int n from "${t}"`);
    counts[t] = r.rows[0].n;
  }
  console.log("\n✓ Seed selesai", counts);
  console.log("   Login demo: administrator / panti123");
  await client.end();
}

main().catch(async (err) => {
  console.error("Seed gagal:", err);
  process.exit(1);
});
