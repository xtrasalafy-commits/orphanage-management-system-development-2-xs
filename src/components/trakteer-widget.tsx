"use client";

import { useState } from "react";
import { Coffee, Download, ExternalLink } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { Modal, cx } from "@/components/ui";
import { rupiah } from "@/lib/format";

const TRAKTEER_URL = "https://trakteer.id/perpus_opera/";
const SOURCE_URL = "/source-code.zip";
const KELIPATAN = 6000;
const NOMINALS = [6000, 12000, 18000, 24000, 36000, 60000];

export function TrakteerWidget() {
  const [open, setOpen] = useState(false);
  const [nominal, setNominal] = useState(KELIPATAN);
  const [custom, setCustom] = useState("");

  const customNum = custom === "" ? NaN : Number(custom);
  const amount =
    Number.isFinite(customNum) && customNum > 0
      ? Math.max(KELIPATAN, Math.round(customNum / KELIPATAN) * KELIPATAN)
      : nominal;

  return (
    <>
      <button
        type="button"
        aria-label="Traktir pengembang"
        onClick={() => setOpen(true)}
        className="group fixed right-4 bottom-4 z-40 flex max-w-[270px] items-center gap-2.5 rounded-2xl bg-gradient-to-br from-[#f6803f] to-[#e0492f] px-3.5 py-2.5 text-left text-white shadow-[0_14px_30px_-12px_rgba(224,73,47,0.75)] ring-1 ring-white/15 transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/15">
          <Coffee className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-[11.5px] font-bold leading-tight">
            Web app ini gratis &amp; bebas iklan
          </span>
          <span className="block text-[10.5px] leading-tight text-white/85">
            Kopi kecil, server tetap jalan
          </span>
        </span>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="md"
        title="Traktir pengembang"
        description="Web app ini gratis & bebas iklan. Dukungan kecilmu membuat server tetap menyala dan fitur terus berkembang."
      >
        <div className="space-y-5">
          {/* pilihan nominal */}
          <div>
            <p className="mb-2 text-[12px] font-semibold text-ink-700">Pilih nominal traktiran</p>
            <div className="grid grid-cols-3 gap-2">
              {NOMINALS.map((n) => {
                const active = custom === "" && nominal === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      setNominal(n);
                      setCustom("");
                    }}
                    className={cx(
                      "rounded-xl border px-2 py-2.5 text-[13px] font-bold tabular transition",
                      active
                        ? "border-brand-400 bg-brand-50 text-brand-700 ring-1 ring-brand-300"
                        : "border-line bg-white text-ink-700 hover:border-ink-300",
                    )}
                  >
                    {rupiah(n)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* nominal custom */}
          <div>
            <label
              htmlFor="trakteer-custom"
              className="mb-1.5 block text-[12.5px] font-semibold text-ink-700"
            >
              Nominal lain
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[13px] font-semibold text-ink-400">
                Rp
              </span>
              <input
                id="trakteer-custom"
                type="number"
                min={KELIPATAN}
                step={KELIPATAN}
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="kelipatan 6.000"
                className="h-10 w-full rounded-lg border border-line bg-white pr-3 pl-9 text-[13.5px] font-semibold tabular text-ink-900 outline-none transition placeholder:text-ink-300 placeholder:font-normal focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
              />
            </div>
            <p className="mt-1 text-[11.5px] text-ink-400">
              Dibulatkan ke kelipatan Rp6.000
              {Number.isFinite(customNum) && customNum > 0 ? ` · menjadi ${rupiah(amount)}` : ""}
            </p>
          </div>

          {/* QR code */}
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-paper px-5 py-5">
            <div className="rounded-xl bg-white p-2.5 ring-1 ring-line">
              <QRCodeCanvas
                value={TRAKTEER_URL}
                size={160}
                fgColor="#14201d"
                bgColor="#ffffff"
                level="M"
                marginSize={2}
              />
            </div>
            <div className="text-center">
              <p className="text-[13.5px] font-bold text-ink-900">Traktiran {rupiah(amount)}</p>
              <p className="mt-0.5 text-[11.5px] text-ink-500">
                Scan QR untuk membuka Trakteer (trakteer.id/perpus_opera) di ponselmu — tanpa pindah halaman.
              </p>
            </div>
          </div>

          <a
            href={TRAKTEER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-[#f6803f] to-[#e0492f] text-[13px] font-semibold text-white shadow-[0_10px_20px_-14px_rgba(224,73,47,0.9)] transition hover:brightness-105"
          >
            <ExternalLink className="size-4" /> Buka halaman Trakteer
          </a>

          {/* source code & lisensi */}
          <div className="flex flex-col gap-2.5 border-t border-line-soft pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[12.5px] font-semibold text-ink-800">Source code lengkap web app ini</p>
              <p className="text-[11.5px] text-ink-500">Open Source oleh MZF - 2026</p>
            </div>
            <a
              href={SOURCE_URL}
              download="source-code.zip"
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[12.5px] font-semibold text-ink-800 transition hover:border-brand-300 hover:text-brand-700"
            >
              <Download className="size-3.5" /> Unduh source
            </a>
          </div>
        </div>
      </Modal>
    </>
  );
}
