import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
  });

// Cache pool di globalThis (termasuk production) agar tidak membuat koneksi
// baru pada setiap warm invocation serverless di Vercel.
globalForDb.__arenaNextJsPostgresqlPool = pool;

export const db = drizzle(pool);
