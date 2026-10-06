"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Check, Info, Loader2, X, XCircle } from "lucide-react";
import { AVATAR_COLORS, inisial } from "@/lib/format";

export { cx } from "@/lib/cx";
import { cx } from "@/lib/cx";

/* ------------------------------------------------------------------ */
/* Buttons                                                            */
/* ------------------------------------------------------------------ */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "soft";
  size?: "sm" | "md";
  loading?: boolean;
  icon?: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  icon,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 focus-visible:ring-offset-1 disabled:opacity-55 disabled:pointer-events-none active:translate-y-[1px]";
  const sizes = size === "sm" ? "h-8 px-3 text-[13px]" : "h-10 px-4 text-sm";
  const variants: Record<string, string> = {
    primary:
      "bg-brand-700 text-white hover:bg-brand-600 shadow-[0_10px_20px_-14px_rgba(14,66,57,0.9)]",
    secondary: "bg-white text-ink-800 border border-line hover:border-ink-300 hover:bg-paper",
    soft: "bg-brand-50 text-brand-700 border border-brand-100 hover:bg-brand-100",
    ghost: "text-ink-500 hover:text-ink-900 hover:bg-ink-900/[0.05]",
    danger: "bg-clay text-white hover:brightness-110",
  };
  return (
    <button
      className={cx(base, sizes, variants[variant], className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Badges                                                             */
/* ------------------------------------------------------------------ */

export type Tone = "neutral" | "green" | "amber" | "red" | "blue" | "violet";

const TONES: Record<Tone, string> = {
  neutral: "bg-ink-900/[0.05] text-ink-700 ring-ink-900/10",
  green: "bg-brand-50 text-brand-700 ring-brand-200",
  amber: "bg-[#fdf1dc] text-[#8a5514] ring-[#efd9ae]",
  red: "bg-[#fbe9e5] text-[#8d3323] ring-[#f0c9bf]",
  blue: "bg-[#e4eef8] text-[#20527a] ring-[#c5dbef]",
  violet: "bg-[#f0e6f2] text-[#5a2e5e] ring-[#ddc6e2]",
};

export function Badge({
  tone = "neutral",
  children,
  dot,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold ring-1 ring-inset whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current opacity-70" /> : null}
      {children}
    </span>
  );
}

export function Avatar({
  nama,
  warna,
  size = 36,
  className,
}: {
  nama: string | null | undefined;
  warna?: string | null;
  size?: number;
  className?: string;
}) {
  const key = warna ?? "teal";
  const palette = AVATAR_COLORS[key] ?? AVATAR_COLORS.teal;
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold tracking-tight",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: palette.bg,
        color: palette.fg,
        fontSize: size * 0.38,
      }}
    >
      {inisial(nama)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Layout primitives                                                  */
/* ------------------------------------------------------------------ */

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cx("card-surface rounded-2xl", className)}>
      {title || actions ? (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line-soft px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-[17px] leading-tight font-semibold text-ink-900">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-[13px] text-ink-500">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cx("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <div className="mb-2 inline-flex items-center gap-2 text-[12px] font-semibold tracking-[0.14em] text-brand-600 uppercase">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="font-display text-[26px] leading-[1.1] font-bold tracking-[-0.02em] text-ink-900 sm:text-[32px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-500">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Progress({ value, tone = "brand" }: { value: number; tone?: "brand" | "amber" | "clay" }) {
  const pct = Math.max(0, Math.min(100, value));
  const bg = tone === "amber" ? "#c8811f" : tone === "clay" ? "#b1462f" : "#1f8271";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-900/[0.07]">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${pct}%`, background: bg }}
      />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
        {icon ?? <Info className="size-6" />}
      </div>
      <div>
        <p className="font-display text-[16px] font-semibold text-ink-900">{title}</p>
        {description ? (
          <p className="mx-auto mt-1 max-w-sm text-[13px] leading-relaxed text-ink-500">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton rounded-lg", className)} />;
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-line-soft">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="hidden h-4 w-28 sm:block" />
          <Skeleton className="hidden h-4 w-24 md:block" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal                                                             */
/* ------------------------------------------------------------------ */

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;
  const width = size === "sm" ? "max-w-md" : size === "lg" ? "max-w-3xl" : "max-w-xl";
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-ink-900/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cx(
          "animate-pop relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-surface shadow-[0_40px_80px_-30px_rgba(20,32,29,0.5)] sm:rounded-2xl",
          width,
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line-soft px-5 py-4">
          <div>
            <h3 className="font-display text-[17px] font-semibold text-ink-900">{title}</h3>
            {description ? <p className="mt-1 text-[13px] text-ink-500">{description}</p> : null}
          </div>
          <button
            onClick={onClose}
            className="-mt-1 -mr-1 grid size-8 place-items-center rounded-lg text-ink-400 transition hover:bg-ink-900/5 hover:text-ink-900"
            aria-label="Tutup"
          >
            <X className="size-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer ? (
          <footer className="flex items-center justify-end gap-2 border-t border-line-soft bg-paper/60 px-5 py-3.5">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------ */
/* Toasts                                                            */
/* ------------------------------------------------------------------ */

type Toast = {
  id: number;
  title: string;
  message?: string;
  tone: "success" | "error" | "info";
};

const ToastContext = createContext<{ push: (t: Omit<Toast, "id">) => void } | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const seq = useRef(0);

  const push = useCallback((t: Omit<Toast, "id">) => {
    seq.current += 1;
    const id = seq.current;
    setItems((prev) => [...prev, { ...t, id }].slice(-4));
    setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== id)), 4200);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6">
        {items.map((t) => (
          <div
            key={t.id}
            className="animate-toast pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-[0_24px_48px_-24px_rgba(20,32,29,0.45)]"
          >
            <span
              className={cx(
                "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full",
                t.tone === "success" && "bg-brand-50 text-brand-600",
                t.tone === "error" && "bg-[#fbe9e5] text-clay",
                t.tone === "info" && "bg-[#e4eef8] text-sky-accent",
              )}
            >
              {t.tone === "success" ? (
                <Check className="size-3.5" />
              ) : t.tone === "error" ? (
                t.message ? (
                  <AlertTriangle className="size-3.5" />
                ) : (
                  <XCircle className="size-3.5" />
                )
              ) : (
                <Info className="size-3.5" />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold text-ink-900">{t.title}</p>
              {t.message ? (
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-500">{t.message}</p>
              ) : null}
            </div>
            <button
              onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
              className="-mt-0.5 -mr-1 ml-auto grid size-6 place-items-center rounded-md text-ink-300 transition hover:bg-ink-900/5 hover:text-ink-700"
              aria-label="Tutup notifikasi"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* Chart primitives (hand-rolled SVG)                                 */
/* ------------------------------------------------------------------ */

export function BarRow({
  label,
  value,
  max,
  hint,
  tone = "brand",
}: {
  label: string;
  value: number;
  max: number;
  hint?: ReactNode;
  tone?: "brand" | "amber" | "clay";
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-1.5">
      <div className="truncate text-[13px] font-medium text-ink-700">{label}</div>
      <div className="text-[12.5px] tabular font-semibold text-ink-900">{hint ?? value}</div>
      <div className="col-span-2 -mt-0.5">
        <Progress value={pct} tone={tone === "amber" ? "amber" : tone === "clay" ? "clay" : "brand"} />
      </div>
    </div>
  );
}

export function Donut({
  slices,
  size = 132,
  thickness = 16,
  center,
}: {
  slices: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  center?: ReactNode;
}) {
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#eceae3"
          strokeWidth={thickness}
        />
        {slices.map((s) => {
          const len = (s.value / total) * c;
          const el = (
            <circle
              key={s.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${Math.max(len - 1.5, 0)} ${c - Math.max(len - 1.5, 0)}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 700ms cubic-bezier(.16,1,.3,1)" }}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      {center ? (
        <div className="absolute inset-0 grid place-items-center text-center">{center}</div>
      ) : null}
    </div>
  );
}

export function Sparkline({
  points,
  labels,
  height = 76,
}: {
  points: number[];
  labels?: string[];
  height?: number;
}) {
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const span = max - min || 1;
  const w = 100;
  const step = points.length > 1 ? w / (points.length - 1) : w;
  const coords = points.map((p, i) => {
    const x = i * step;
    const y = 100 - ((p - min) / span) * 82 - 9;
    return [x, y] as const;
  });
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${line} L${w},100 L0,100 Z`;
  const id = useRef(`spark-${Math.random().toString(36).slice(2, 8)}`).current;
  return (
    <div>
      <svg viewBox={`0 0 ${w} 100`} preserveAspectRatio="none" style={{ height, width: "100%" }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1f8271" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#1f8271" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${id})`} />
        <path d={line} fill="none" stroke="#1f8271" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {coords.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i === coords.length - 1 ? 3 : 1.8} fill="#14685b" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      {labels ? (
        <div className="mt-2 flex justify-between text-[11px] font-medium text-ink-400">
          {labels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
