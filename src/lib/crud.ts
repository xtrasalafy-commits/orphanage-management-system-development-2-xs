import { desc, eq } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { getTableColumns } from "drizzle-orm";
import { db } from "@/db";
import {
  aidDistributions,
  children,
  documents,
  donations,
  educationRecords,
  healthRecords,
  incidents,
  nutritionLogs,
  rooms,
  staff,
  users,
  visits,
} from "@/db/schema";

export const RESOURCES = {
  users,
  children,
  rooms,
  healthRecords,
  educationRecords,
  nutritionLogs,
  aidDistributions,
  incidents,
  visits,
  documents,
  donations,
  staff,
} as const;

export type ResourceKey = keyof typeof RESOURCES;

export const RESOURCE_KEYS = Object.keys(RESOURCES) as ResourceKey[];

export function isResource(resource: string): resource is ResourceKey {
  return Object.prototype.hasOwnProperty.call(RESOURCES, resource);
}

function columnsOf(resource: ResourceKey) {
  return getTableColumns(RESOURCES[resource]) as Record<string, PgColumn>;
}

function column(resource: ResourceKey, name: string) {
  const col = columnsOf(resource)[name];
  if (!col) throw new Error(`UNKNOWN_COLUMN:${name}`);
  return col;
}

function pickColumns(resource: ResourceKey, payload: Record<string, unknown>) {
  const columns = columnsOf(resource);
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload ?? {})) {
    if (!(key in columns)) continue;
    if (key === "id" || key === "createdAt") continue;
    if (resource !== "users" && key === "passwordHash") continue;
    clean[key] = value === "" ? null : value;
  }
  return clean;
}

export async function listRows(resource: ResourceKey) {
  const table = RESOURCES[resource];
  return db.select().from(table).orderBy(desc(column(resource, "id")));
}

export async function insertRow(resource: ResourceKey, payload: Record<string, unknown>) {
  const values = pickColumns(resource, payload);
  const [row] = await db.insert(RESOURCES[resource]).values(values).returning();
  return row;
}

export async function updateRow(
  resource: ResourceKey,
  id: number,
  payload: Record<string, unknown>,
) {
  const values = pickColumns(resource, payload);
  const [row] = await db
    .update(RESOURCES[resource])
    .set(values)
    .where(eq(column(resource, "id"), id))
    .returning();
  return row;
}

export async function deleteRow(resource: ResourceKey, id: number) {
  const [row] = await db
    .delete(RESOURCES[resource])
    .where(eq(column(resource, "id"), id))
    .returning();
  return row;
}

export async function updateUserPassword(userId: number, passwordHash: string) {
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

export const CHILD_RESOURCE: ResourceKey = "children";
