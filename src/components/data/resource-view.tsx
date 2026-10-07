"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  Download,
  Inbox,
  Layers,
  Loader2,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  SearchX,
  Sparkles,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  EmptyState,
  Modal,
  Panel,
  PageHeader,
  TableSkeleton,
  cx,
  useToast,
  type Tone,
} from "@/components/ui";
import { fetchResource, useResource, type Row } from "@/components/data/use-resource";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type Option = { value: string | number; label: string; tone?: Tone; hint?: string };

export type Ctx = {
  lookup: (resource: string) => Record<number, Row>;
  data: Record<string, Row[]>;
};

export type FieldConfig = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "select" | "textarea" | "relation" | "toggle";
  options?: Option[] | ((ctx: Ctx) => Option[]);
  relation?: { resource: string; labelKey?: string; label?: (row: Row) => string };
  required?: boolean;
  placeholder?: string;
  help?: string;
  span?: 1 | 2;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  defaultValue?: unknown;
  money?: boolean;
};

export type ColumnConfig = {
  key: string;
  header: string;
  render?: (row: Row, ctx: Ctx) => ReactNode;
  sortValue?: (row: Row, ctx: Ctx) => string | number | null;
  align?: "left" | "right" | "center";
  width?: string;
  className?: string;
  hideOnMobile?: boolean;
  sortable?: boolean;
};

export type FilterConfig = { key: string; label: string; options: Option[] };

export type ResourceConfig = {
  resource: string;
  title: string;
  eyebrow?: string;
  description?: string;
  icon?: ReactNode;
  accent?: string;
  searchKeys?: string[];
  extraSearch?: (row: Row, ctx: Ctx) => string;
  columns: ColumnConfig[];
  fields: FieldConfig[];
  filters?: FilterConfig[];
  relations?: string[];
  createLabel?: string;
  editLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  newDefaults?: () => Row;
  summary?: (rows: Row[], ctx: Ctx) => {
    label: string;
    value: ReactNode;
    hint?: ReactNode;
    tone?: Tone;
    icon?: ReactNode;
  }[];
  rowHref?: (row: Row) => string;
  deleteWarning?: string;
};

/* ------------------------------------------------------------------ */
/* Context for cell helpers                                           */
/* ------------------------------------------------------------------ */

const CtxContext = createContext<Ctx>({ lookup: () => ({}), data: {} });
export const useDataCtx = () => useContext(CtxContext);

/* ------------------------------------------------------------------ */
/* Resource view                                                      */
/* ------------------------------------------------------------------ */

function normalize(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value);
}

export function ResourceView({
  config,
  initialFilter,
}: {
  config: ResourceConfig;
  initialFilter?: Record<string, string>;
}) {
  const router = useRouter();
  const toast = useToast();
  const { rows, loading, error, syncing, reload, create, update, remove } = useResource({
    resource: config.resource,
  });
  const [data, setData] = useState<Record<string, Row[]>>({});
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>(initialFilter ?? {});
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [values, setValues] = useState<Row>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmRow, setConfirmRow] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [canWrite, setCanWrite] = useState(true);
  const [roleLabel, setRoleLabel] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : { canWrite: true }))
      .then((body) => {
        if (!alive) return;
        setCanWrite(body?.canWrite !== false);
        setRoleLabel((body?.user?.roleLabel as string) ?? null);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const loadRelations = useCallback(async () => {
    const list = config.relations ?? [];
    if (list.length === 0) return {};
    const entries = await Promise.all(
      list.map(async (r) => [r, await fetchResource(r)] as const),
    );
    return Object.fromEntries(entries);
  }, [config.relations]);

  useEffect(() => {
    let active = true;
    void loadRelations().then((next) => {
      if (active && Object.keys(next).length > 0) setData(next);
    });
    return () => {
      active = false;
    };
  }, [loadRelations]);

  const ctx: Ctx = useMemo(() => {
    const maps: Record<string, Record<number, Row>> = {};
    for (const [key, list] of Object.entries(data)) {
      maps[key] = Object.fromEntries(list.map((r) => [Number(r.id), r]));
    }
    return {
      data,
      lookup: (resource: string) => maps[resource] ?? {},
    };
  }, [data]);

  const optionsFor = (field: FieldConfig): Option[] => {
    if (typeof field.options === "function") return field.options(ctx);
    if (field.options) return field.options;
    if (field.relation) {
      const list = data[field.relation.resource] ?? [];
      return [...list]
        .sort((a, b) => normalize(a[field.relation!.labelKey ?? "nama"]).localeCompare(normalize(b[field.relation!.labelKey ?? "nama"]), "id"))
        .map((r) => ({
          value: Number(r.id),
          label: field.relation!.label
            ? field.relation!.label(r)
            : `${normalize(r[field.relation!.labelKey ?? "nama"])}${r["nis"] ? ` · ${r["nis"]}` : ""}`,
        }));
    }
    return [];
  };

  const visible = useMemo(() => {
    let list = rows;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((row) => {
        const haystack = (config.searchKeys ?? ["nama"])
          .map((k) => normalize(row[k]))
          .concat(config.extraSearch ? config.extraSearch(row, ctx) : "")
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue;
      list = list.filter((row) => {
        if (value === "__open")
          return !["selesai", "ditolak", "valid", "disalurkan", "lulus"].includes(normalize(row[key]));
        return normalize(row[key]) === value;
      });
    }
    if (sort) {
      const col = config.columns.find((c) => c.key === sort.key);
      const get = (row: Row) => {
        if (col?.sortValue) return col.sortValue(row, ctx);
        const raw = row[sort.key];
        if (typeof raw === "number") return raw;
        const asNum = Number(raw);
        if (raw !== null && raw !== "" && !Number.isNaN(asNum)) return asNum;
        return normalize(raw).toLowerCase();
      };
      list = [...list].sort((a, b) => {
        const va = get(a);
        const vb = get(b);
        if (va === vb) return 0;
        if (va === null || va === "") return 1;
        if (vb === null || vb === "") return -1;
        const res = va < vb ? -1 : 1;
        return sort.dir === "asc" ? res : -res;
      });
    }
    return list;
  }, [rows, search, filters, sort, ctx, config]);

  const openCreate = () => {
    const base: Row = { ...(config.newDefaults?.() ?? {}) };
    for (const f of config.fields) {
      if (base[f.key] === undefined) {
        if (f.defaultValue !== undefined) base[f.key] = f.defaultValue;
        else if (f.type === "select" && Array.isArray(f.options) && f.options.length) {
          base[f.key] = (f.options as Option[])[0].value;
        } else if (f.type === "toggle") base[f.key] = true;
      }
    }
    setValues(base);
    setEditing(null);
    setFormErrors({});
    setFormOpen(true);
  };

  const openEdit = (row: Row) => {
    const base: Row = {};
    for (const f of config.fields) {
      const raw = row[f.key];
      base[f.key] = f.type === "toggle" ? Boolean(raw) : f.type === "number" && raw !== null && raw !== undefined ? Number(raw) : raw ?? "";
    }
    setValues(base);
    setEditing(row);
    setFormErrors({});
    setFormOpen(true);
  };

  const submit = async () => {
    const errs: Record<string, string> = {};
    for (const f of config.fields) {
      const v = values[f.key];
      if (f.required && (v === "" || v === null || v === undefined)) {
        errs[f.key] = `${f.label} wajib diisi`;
        continue;
      }
      if (f.type === "number" && v !== "" && v !== null && v !== undefined) {
        const n = Number(v);
        if (Number.isNaN(n)) errs[f.key] = `${f.label} harus berupa angka`;
        else if (f.min !== undefined && n < f.min) errs[f.key] = `${f.label} minimal ${f.min}`;
        else if (f.max !== undefined && n > f.max) errs[f.key] = `${f.label} maksimal ${f.max}`;
      }
    }
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const payload: Row = {};
    for (const f of config.fields) {
      let v = values[f.key];
      if (f.type === "number" && v !== "" && v !== null && v !== undefined) v = Number(v);
      if (f.type === "relation" || f.relation) v = v === "" ? null : Number(v);
      payload[f.key] = v;
    }

    setSaving(true);
    try {
      if (editing) {
        await update(Number(editing.id), payload);
        toast.push({ tone: "success", title: "Perubahan tersimpan", message: `${config.title} berhasil diperbarui.` });
      } else {
        await create(payload);
        toast.push({ tone: "success", title: "Data baru ditambahkan", message: `${config.title} tersimpan ke basis data.` });
      }
      setFormOpen(false);
      void loadRelations();
    } catch (err) {
      toast.push({
        tone: "error",
        title: "Gagal menyimpan",
        message: err instanceof Error ? err.message : "Terjadi kesalahan pada server",
      });
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async (row: Row) => {
    setDeleting(true);
    try {
      await remove(Number(row.id));
      toast.push({ tone: "info", title: "Data dihapus", message: "Entri telah dihapus dari basis data." });
      setConfirmRow(null);
      void loadRelations();
    } catch (err) {
      toast.push({
        tone: "error",
        title: "Gagal menghapus",
        message: err instanceof Error ? err.message : "Terjadi kesalahan pada server",
      });
    } finally {
      setDeleting(false);
    }
  };

  const exportCsv = () => {
    const header = ["id", ...config.columns.map((c) => c.key)];
    const lines = [header.join(",")];
    for (const row of visible) {
      const cells = [String(row.id ?? ""), ...config.columns.map((c) => csvCell(row[c.key]))];
      lines.push(cells.join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.resource}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.push({ tone: "info", title: "CSV diunduh", message: `${visible.length} baris diekspor.` });
  };

  const summary = config.summary?.(rows, ctx) ?? [];
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <CtxContext.Provider value={ctx}>
      <div className="animate-rise space-y-6">
        <PageHeader
          eyebrow={
            <>
              {config.icon}
              {config.eyebrow ?? "Data"}
            </>
          }
          title={config.title}
          description={config.description}
          actions={
            <>
              <Button variant="secondary" size="sm" icon={<Download className="size-4" />} onClick={exportCsv}>
                Ekspor CSV
              </Button>
              <Button variant="secondary" size="sm" icon={<RefreshCw className={cx("size-4", syncing && "animate-spin")} />} onClick={() => void reload()}>
                Muat ulang
              </Button>
              {canWrite ? (
                <Button size="sm" icon={<Plus className="size-4" />} onClick={openCreate}>
                  {config.createLabel ?? "Tambah data"}
                </Button>
              ) : (
                <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#efd9ae] bg-[#fdf1dc] px-2.5 text-[12px] font-semibold text-[#8a5514]">
                  <Lock className="size-3.5" /> Mode baca · {roleLabel ?? "Relawan"}
                </span>
              )}
            </>
          }
        />

        {summary.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {summary.map((s) => (
              <div key={s.label} className="card-surface rounded-xl px-4 py-3.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] font-semibold tracking-wide text-ink-500 uppercase">{s.label}</p>
                  {s.icon ? <span className="text-ink-300">{s.icon}</span> : null}
                </div>
                <p className="mt-1.5 font-display text-[22px] leading-none font-bold tracking-tight text-ink-900 tabular">
                  {s.value}
                </p>
                {s.hint ? <p className="mt-1.5 text-[12px] text-ink-400">{s.hint}</p> : null}
              </div>
            ))}
          </div>
        ) : null}

        <Panel
          bodyClassName="p-0"
          title={
            <span className="flex items-center gap-2">
              {loading ? (
                <Loader2 className="size-4 animate-spin text-brand-500" />
              ) : (
                <Layers className="size-4 text-brand-500" />
              )}
              <span>Daftar data</span>
              <span className="rounded-full bg-ink-900/[0.05] px-2 py-0.5 text-[12px] font-semibold text-ink-500 tabular">
                {visible.length}
                {visible.length !== rows.length ? ` / ${rows.length}` : ""}
              </span>
            </span>
          }
          actions={
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <label className="relative flex-1 sm:w-64 sm:flex-none">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama, NIS, catatan…"
                  className="h-9 w-full rounded-lg border border-line bg-white pr-8 pl-9 text-[13px] text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
                />
                {search ? (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute top-1/2 right-2 grid size-5 -translate-y-1/2 place-items-center rounded text-ink-300 hover:text-ink-700"
                    aria-label="Bersihkan pencarian"
                  >
                    ×
                  </button>
                ) : null}
              </label>
              {(config.filters ?? []).map((f) => (
                <select
                  key={f.key}
                  value={filters[f.key] ?? ""}
                  onChange={(e) => setFilters((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  className={cx(
                    "h-9 rounded-lg border bg-white px-2.5 text-[13px] font-medium outline-none transition focus:border-brand-400",
                    filters[f.key] ? "border-brand-300 text-brand-700 bg-brand-50" : "border-line text-ink-600",
                  )}
                >
                  <option value="">{f.label}: semua</option>
                  {f.options.map((o) => (
                    <option key={String(o.value)} value={String(o.value)}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ))}
              {activeFilterCount > 0 ? (
                <button
                  onClick={() => setFilters({})}
                  className="h-9 rounded-lg px-2.5 text-[13px] font-semibold text-clay hover:bg-[#fbe9e5]"
                >
                  Reset filter
                </button>
              ) : null}
            </div>
          }
        >
          {error ? (
            <div className="px-5 py-12">
              <EmptyState
                icon={<TriangleAlert className="size-6" />}
                title="Data gagal dimuat"
                description={error}
                action={
                  <Button variant="secondary" size="sm" onClick={() => void reload()}>
                    Coba lagi
                  </Button>
                }
              />
            </div>
          ) : loading ? (
            <TableSkeleton rows={8} />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={<Inbox className="size-6" />}
              title={config.emptyTitle ?? "Belum ada data"}
              description={
                config.emptyDescription ??
                "Mulai dengan menambahkan entri pertama — data tersimpan permanen di basis data dan langsung tampil di dasbor."
              }
              action={
                <Button size="sm" icon={<Sparkles className="size-4" />} onClick={openCreate}>
                  {config.createLabel ?? "Tambah data"}
                </Button>
              }
            />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={<SearchX className="size-6" />}
              title="Tidak ada hasil"
              description="Kombinasi kata kunci dan filter ini tidak cocok dengan data mana pun. Coba ubah pencariannya."
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setFilters({});
                  }}
                >
                  Hapus pencarian & filter
                </Button>
              }
            />
          ) : (
            <>
              {/* desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-line bg-paper/60">
                      {config.columns.map((c) => {
                        const isSorted = sort?.key === c.key;
                        return (
                          <th
                            key={c.key}
                            style={c.width ? { width: c.width } : undefined}
                            className={cx(
                              "px-4 py-2.5 text-[11.5px] font-semibold tracking-wider text-ink-500 uppercase select-none",
                              c.align === "right" && "text-right",
                              c.align === "center" && "text-center",
                            )}
                          >
                            {c.sortable === false ? (
                              c.header
                            ) : (
                              <button
                                onClick={() =>
                                  setSort((prev) =>
                                    prev?.key === c.key
                                      ? { key: c.key, dir: prev.dir === "asc" ? "desc" : "asc" }
                                      : { key: c.key, dir: "asc" },
                                  )
                                }
                                className={cx(
                                  "inline-flex items-center gap-1 rounded transition hover:text-ink-900",
                                  isSorted && "text-brand-700",
                                )}
                              >
                                {c.header}
                                {isSorted ? (
                                  sort?.dir === "asc" ? (
                                    <ArrowUp className="size-3" />
                                  ) : (
                                    <ArrowDown className="size-3" />
                                  )
                                ) : (
                                  <ArrowUpDown className="size-3 opacity-35" />
                                )}
                              </button>
                            )}
                          </th>
                        );
                      })}
                      {canWrite ? <th className="w-24 px-4 py-2.5" /> : null}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-soft">
                    {visible.map((row) => (
                      <tr
                        key={String(row.id)}
                        onClick={() => {
                          if (!config.rowHref || row.pending || Number(row.id) < 0) return;
                          router.push(config.rowHref(row));
                        }}
                        className={cx(
                          "group border-b border-line-soft/70 transition-colors last:border-0 hover:bg-brand-50/45",
                          config.rowHref && "cursor-pointer",
                          Boolean(row.pending) && "opacity-60",
                        )}
                      >
                        {config.columns.map((c) => (
                          <td
                            key={c.key}
                            className={cx(
                              "px-4 py-3 align-middle text-[13.5px] text-ink-700",
                              c.align === "right" && "text-right",
                              c.align === "center" && "text-center",
                              c.className,
                            )}
                          >
                            {c.render ? c.render(row, ctx) : formatCell(row[c.key])}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right" style={canWrite ? undefined : { display: "none" }}>
                          <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                            {row.pending ? (
                              <Loader2 className="size-3.5 animate-spin text-brand-500" />
                            ) : (
                              <span className="hidden size-1.5 rounded-full bg-brand-300 lg:block" title="Tersinkron" />
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEdit(row);
                              }}
                              className="grid size-7 place-items-center rounded-md text-ink-400 transition hover:bg-white hover:text-brand-700 hover:shadow-sm"
                              aria-label="Ubah"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmRow(row);
                              }}
                              className="grid size-7 place-items-center rounded-md text-ink-400 transition hover:bg-[#fbe9e5] hover:text-clay"
                              aria-label="Hapus"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* mobile cards */}
              <ul className="divide-y divide-line-soft md:hidden">
                {visible.map((row) => {
                  const [first, ...rest] = config.columns;
                  return (
                    <li key={String(row.id)} className="px-4 py-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <button
                          className="min-w-0 text-left"
                          onClick={() =>
                            config.rowHref && !row.pending && Number(row.id) > 0
                              ? router.push(config.rowHref(row))
                              : openEdit(row)
                          }
                        >
                          <div className="text-[14px] font-semibold text-ink-900">
                            {first.render ? first.render(row, ctx) : formatCell(row[first.key])}
                          </div>
                        </button>
                        <div className="flex gap-1">
                          {canWrite ? (
                            <>
                              <button
                                onClick={() => openEdit(row)}
                                className="grid size-8 place-items-center rounded-md border border-line text-ink-500"
                                aria-label="Ubah"
                              >
                                <Pencil className="size-3.5" />
                              </button>
                              <button
                                onClick={() => setConfirmRow(row)}
                                className="grid size-8 place-items-center rounded-md border border-line text-clay"
                                aria-label="Hapus"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
                        {rest
                          .filter((c) => c.hideOnMobile !== false)
                          .map((c) => (
                            <div key={c.key} className="min-w-0">
                              <p className="text-[10.5px] font-semibold tracking-wide text-ink-400 uppercase">
                                {c.header}
                              </p>
                              <div className="truncate text-[13px] text-ink-700">
                                {c.render ? c.render(row, ctx) : formatCell(row[c.key])}
                              </div>
                            </div>
                          ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </Panel>

        <Modal
          open={formOpen}
          onClose={() => (saving ? null : setFormOpen(false))}
          size="lg"
          title={editing ? `${config.editLabel ?? "Ubah"} — ${config.title}` : config.createLabel ?? "Tambah data"}
          description={
            editing
              ? "Perubahan disimpan langsung ke basis data. Bidang bertanda * wajib diisi."
              : "Entri baru langsung muncul di tabel sebelum server mengonfirmasi penyimpanan."
          }
          footer={
            <>
              <span className="mr-auto hidden items-center gap-1.5 text-[12px] text-ink-400 sm:flex">
                <Check className="size-3.5 text-brand-500" />
                Pembaruan optimistis aktif
              </span>
              <Button variant="secondary" size="sm" onClick={() => setFormOpen(false)} disabled={saving}>
                Batal
              </Button>
              <Button size="sm" loading={saving} onClick={submit}>
                {editing ? "Simpan perubahan" : "Simpan data baru"}
              </Button>
            </>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {config.fields.map((f) => (
              <FormRow
                key={f.key}
                field={f}
                options={optionsFor(f)}
                value={values[f.key]}
                error={formErrors[f.key]}
                onChange={(v) => setValues((prev) => ({ ...prev, [f.key]: v }))}
              />
            ))}
          </div>
        </Modal>

        <Modal
          open={Boolean(confirmRow)}
          onClose={() => setConfirmRow(null)}
          size="sm"
          title="Hapus data ini?"
          description={config.deleteWarning ?? "Tindakan ini bersifat permanen dan tidak dapat dibatalkan."}
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setConfirmRow(null)} disabled={deleting}>
                Batal
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={deleting}
                onClick={() => confirmRow && void doDelete(confirmRow)}
              >
                Ya, hapus
              </Button>
            </>
          }
        >
          <div className="rounded-xl border border-line bg-paper px-4 py-3 text-[13px] text-ink-600">
            <p className="font-semibold text-ink-900">{titleOfRow(confirmRow ?? {})}</p>
            <p className="mt-1">
              {config.columns
                .slice(1, 3)
                .map((c) => `${c.header}: ${formatCell((confirmRow as Row)?.[c.key])}`)
                .join(" · ")}
            </p>
          </div>
        </Modal>
      </div>
    </CtxContext.Provider>
  );
}

function titleOfRow(row: Row) {
  const v = row["nama"] ?? row["deskripsi"] ?? row["item"] ?? row["menu"] ?? row["pengunjung"] ?? row["donor"];
  const child = row["childNama"];
  return `${v ?? "Entri"}${child ? ` · ${child}` : ""}`;
}

function formatCell(value: unknown) {
  if (value === null || value === undefined || value === "") return <span className="text-ink-300">—</span>;
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  return <span className="text-ink-800">{String(value)}</span>;
}

function csvCell(value: unknown) {
  const raw = value === null || value === undefined ? "" : String(value);
  return `"${raw.replace(/"/g, '""')}"`;
}

/* ------------------------------------------------------------------ */
/* Form controls                                                      */
/* ------------------------------------------------------------------ */

function FormRow({
  field,
  options,
  value,
  error,
  onChange,
}: {
  field: FieldConfig;
  options: Option[];
  value: unknown;
  error?: string;
  onChange: (v: unknown) => void;
}) {
  const id = `f-${field.key}`;
  if (field.type === "toggle") {
    return (
      <div className={cx("sm:col-span-2", field.span === 1 && "sm:col-span-1")}>
        <label
          htmlFor={id}
          className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-line bg-paper/60 px-4 py-3"
        >
          <span>
            <span className="block text-[13px] font-semibold text-ink-900">{field.label}</span>
            {field.help ? <span className="mt-0.5 block text-[12px] text-ink-500">{field.help}</span> : null}
          </span>
          <span className="relative inline-flex">
            <input
              id={id}
              type="checkbox"
              className="peer sr-only"
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
            />
            <span className="h-6 w-11 rounded-full bg-ink-300 transition peer-checked:bg-brand-500" />
            <span className="absolute top-1 left-1 size-4 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
          </span>
        </label>
      </div>
    );
  }

  const control = () => {
    if (field.type === "textarea") {
      return (
        <textarea
          id={id}
          rows={3}
          value={normalize(value)}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full resize-y rounded-lg border bg-white px-3 py-2 text-[13.5px] text-ink-900 outline-none transition placeholder:text-ink-300 focus:ring-2 focus:ring-brand-400/20"
          style={{ borderColor: error ? "#b1462f" : "#e4e0d7" }}
        />
      );
    }
    if (field.type === "select" || field.type === "relation") {
      return (
        <select
          id={id}
          value={value === null || value === undefined ? "" : String(value)}
          onChange={(e) => onChange(e.target.value === "" ? "" : coerce(e.target.value, field))}
          className="w-full rounded-lg border bg-white px-3 py-2 text-[13.5px] text-ink-900 outline-none transition focus:ring-2 focus:ring-brand-400/20"
          style={{ borderColor: error ? "#b1462f" : "#e4e0d7" }}
        >
          <option value="">
            {field.type === "relation" ? "— pilih —" : field.placeholder ?? "— belum ditentukan —"}
          </option>
          {options.map((o) => (
            <option key={String(o.value)} value={String(o.value)}>
              {o.label}
            </option>
          ))}
        </select>
      );
    }
    return (
      <div className="relative">
        <input
          id={id}
          type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
          inputMode={field.type === "number" ? "numeric" : undefined}
          min={field.min}
          max={field.max}
          value={value === null || value === undefined ? "" : normalize(value)}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cx(
            "w-full rounded-lg border bg-white py-2 text-[13.5px] text-ink-900 outline-none transition placeholder:text-ink-300 focus:ring-2 focus:ring-brand-400/20",
            field.money ? "pr-14 tabular" : "px-3",
          )}
          style={{ borderColor: error ? "#b1462f" : "#e4e0d7" }}
        />
        {field.money ? (
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[12px] font-semibold text-ink-400">
            Rp
          </span>
        ) : field.suffix ? (
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[12px] font-semibold text-ink-400">
            {field.suffix}
          </span>
        ) : null}
      </div>
    );
  };

  return (
    <div className={cx(field.span === 2 ? "sm:col-span-2" : "sm:col-span-1")}>
      <label htmlFor={id} className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-700">
        {field.label}
        {field.required ? <span className="text-clay">*</span> : null}
      </label>
      {control()}
      {error ? (
        <p className="mt-1.5 flex items-center gap-1 text-[12px] font-medium text-clay">
          <TriangleAlert className="size-3.5" /> {error}
        </p>
      ) : field.help ? (
        <p className="mt-1.5 text-[12px] text-ink-400">{field.help}</p>
      ) : null}
    </div>
  );
}

function coerce(raw: string, field: FieldConfig) {
  if (field.type === "relation" || field.relation) return Number(raw);
  if (field.type === "number") return Number(raw);
  const list = Array.isArray(field.options) ? field.options : [];
  const opt = list.find((o) => String(o.value) === raw);
  if (opt && typeof opt.value === "number") return opt.value;
  return raw;
}

export function StatusBadge({
  value,
  map,
}: {
  value: string | null | undefined;
  map: Record<string, { label: string; tone: Tone }>;
}) {
  if (!value) return <span className="text-ink-300">—</span>;
  const meta = map[value] ?? { label: String(value).replace(/_/g, " "), tone: "neutral" as Tone };
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}
