"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type Row = Record<string, unknown> & { id?: number };

export type Pending = { pending?: boolean };

type Options = {
  resource: string;
  auto?: boolean;
};

async function jsonFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error(body?.error ?? `Permintaan gagal (${res.status})`);
  }
  return body;
}

export function useResource({ resource, auto = true }: Options) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(auto);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const mounted = useRef(true);
  const tempId = useRef(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    setSyncing(true);
    try {
      const body = await jsonFetch(`/api/data/${resource}`);
      if (mounted.current) {
        setRows((body?.data ?? []) as Row[]);
        setError(null);
      }
    } catch (err) {
      if (mounted.current) {
        setError(err instanceof Error ? err.message : "Gagal memuat data");
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
        setSyncing(false);
      }
    }
  }, [resource]);

  useEffect(() => {
    if (auto) void reload();
  }, [auto, reload]);

  const create = useCallback(
    async (values: Row) => {
      tempId.current -= 1;
      const optimistic: Row = { ...values, id: tempId.current, pending: true };
      setRows((prev) => [optimistic, ...prev]);
      try {
        const body = await jsonFetch(`/api/data/${resource}`, {
          method: "POST",
          body: JSON.stringify(values),
        });
        setRows((prev) =>
          prev.map((r) => (r.id === tempId.current ? ({ ...(body.data as Row), pending: false }) : r)),
        );
        return body.data as Row;
      } catch (err) {
        setRows((prev) => prev.filter((r) => r.id !== tempId.current));
        throw err;
      }
    },
    [resource],
  );

  const update = useCallback(
    async (id: number, values: Row) => {
      let snapshot: Row[] = [];
      setRows((prev) => {
        snapshot = prev;
        return prev.map((r) => (r.id === id ? { ...r, ...values, pending: true } : r));
      });
      try {
        const body = await jsonFetch(`/api/data/${resource}/${id}`, {
          method: "PATCH",
          body: JSON.stringify(values),
        });
        setRows((prev) =>
          prev.map((r) => (r.id === id ? { ...(body.data as Row), pending: false } : r)),
        );
        return body.data as Row;
      } catch (err) {
        setRows(snapshot);
        throw err;
      }
    },
    [resource],
  );

  const remove = useCallback(
    async (id: number) => {
      let snapshot: Row[] = [];
      setRows((prev) => {
        snapshot = prev;
        return prev.filter((r) => r.id !== id);
      });
      try {
        await jsonFetch(`/api/data/${resource}/${id}`, { method: "DELETE" });
        return true;
      } catch (err) {
        setRows(snapshot);
        throw err;
      }
    },
    [resource],
  );

  return { rows, loading, error, syncing, reload, create, update, remove };
}

export async function fetchResource(resource: string): Promise<Row[]> {
  const res = await fetch(`/api/data/${resource}`, { cache: "no-store" });
  if (!res.ok) return [];
  const body = await res.json();
  return (body?.data ?? []) as Row[];
}
