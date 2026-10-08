/**
 * Packing source code web app menjadi public/source-code.zip (untuk tombol unduh).
 * Dijalankan otomatis pada `prebuild`, atau manual: npm run pack
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import AdmZip from "adm-zip";

const root = process.cwd();
const outDir = path.join(root, "public");
const outFile = path.join(outDir, "source-code.zip");

// Hanya path berikut yang dimasukkan — .env (rahasia) TIDAK pernah diikutsertakan.
const ENTRIES = [
  "src",
  "scripts",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "next.config.ts",
  "drizzle.config.ts",
  "postcss.config.mjs",
  "eslint.config.mjs",
  "README.md",
  ".env.example",
  ".gitignore",
];
// Folder/file yang dikecualikan di dalam direktori yang dipacking.
const EXCLUDED = /(^|[/\\])(node_modules|\.next|\.git|\.kilo|dist|build|out)([/\\]|$)|\.log$|source-code\.zip$/;

async function main() {
  const zip = new AdmZip();
  for (const entry of ENTRIES) {
    const abs = path.join(root, entry);
    if (!existsSync(abs)) {
      console.warn(`  ↳ lewati (tidak ada): ${entry}`);
      continue;
    }
    if (statSync(abs).isDirectory()) {
      zip.addLocalFolder(abs, entry, (name) => !EXCLUDED.test(name));
    } else {
      if (EXCLUDED.test(entry)) continue;
      // addLocalFile menambahkan nama folder ganda; addFile memberi kontrol penuh.
      zip.addFile(entry, readFileSync(abs));
    }
  }
  await mkdir(outDir, { recursive: true });
  zip.writeZip(outFile);
  const kb = (statSync(outFile).size / 1024).toFixed(0);
  console.log(`✓ source-code.zip dibuat (${kb} KB, ${zip.getEntries().length} berkas)`);
}

main().catch((err) => {
  // Jangan gagalkan build bila packing bermasalah; tombol unduh hanya akan nonaktif.
  console.warn("⚠ packing source code dilewati:", err?.message ?? err);
});
