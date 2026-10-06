"use client";

import { CONFIGS } from "@/config/resources";
import { ResourceView } from "@/components/data/resource-view";

export function ResourcePage({
  configKey,
  initialFilter,
}: {
  configKey: string;
  initialFilter?: Record<string, string>;
}) {
  const config = CONFIGS[configKey];
  if (!config) {
    return <p className="text-[14px] text-clay">Konfigurasi modul “{configKey}” tidak ditemukan.</p>;
  }
  return <ResourceView config={config} initialFilter={initialFilter} />;
}
