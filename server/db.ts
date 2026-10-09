import { Pool as PgPool } from "pg";
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { DIPLOY_BRAND } from "@diploy/core";
import * as schema from "@shared/schema";
import "dotenv/config";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const isNeon = Boolean(
  process.env.DATABASE_URL.includes("neon.tech") ||
  process.env.USE_NEON === "true" ||
  process.env.VERCEL === "1"
);

if (isNeon) {
  neonConfig.webSocketConstructor = ws;
  console.log(`[${DIPLOY_BRAND}] Database initialized using Neon Serverless driver`);
} else {
  console.log(`[${DIPLOY_BRAND}] Database initialized using Node-Postgres driver`);
}

export const pool = isNeon
  ? new NeonPool({
      connectionString: process.env.DATABASE_URL,
      max: parseInt(process.env.DB_POOL_MAX || "20", 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || "15000", 10),
    })
  : new PgPool({
      connectionString: process.env.DATABASE_URL,
      max: parseInt(process.env.DB_POOL_MAX || "25", 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || "15000", 10),
      allowExitOnIdle: true,
    });

pool.on("error", (err: Error) => {
  console.error(`[${DIPLOY_BRAND}] Unexpected database pool error:`, err.message);
});

export const db = (isNeon
  ? drizzleNeon(pool as NeonPool, { schema })
  : drizzlePg(pool as PgPool, { schema })) as unknown as ReturnType<typeof drizzleNeon<typeof schema>>;

const readPool = process.env.DATABASE_READ_URL
  ? (isNeon || process.env.DATABASE_READ_URL.includes("neon.tech")
      ? new NeonPool({
          connectionString: process.env.DATABASE_READ_URL,
          max: parseInt(process.env.DB_POOL_MAX || "20", 10),
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || "15000", 10),
        })
      : new PgPool({
          connectionString: process.env.DATABASE_READ_URL,
          max: parseInt(process.env.DB_POOL_MAX || "25", 10),
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || "15000", 10),
          allowExitOnIdle: true,
        }))
  : pool;

if (process.env.DATABASE_READ_URL) {
  readPool.on("error", (err: Error) => {
    console.error(`[${DIPLOY_BRAND}] Unexpected read replica pool error:`, err.message);
  });
  console.log(`[${DIPLOY_BRAND}] Read replica database configured`);
}

export const dbRead = process.env.DATABASE_READ_URL
  ? ((isNeon || process.env.DATABASE_READ_URL.includes("neon.tech")
      ? drizzleNeon(readPool as NeonPool, { schema })
      : drizzlePg(readPool as PgPool, { schema })) as unknown as ReturnType<typeof drizzleNeon<typeof schema>>)
  : db;