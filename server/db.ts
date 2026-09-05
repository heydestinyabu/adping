// import { Pool, neonConfig } from '@neondatabase/serverless';
// import { drizzle } from 'drizzle-orm/neon-serverless';
// import ws from "ws";
// import * as schema from "@shared/schema";
// import 'dotenv/config';

// neonConfig.webSocketConstructor = ws;


import { Pool } from "pg";
import { DIPLOY_BRAND } from "@diploy/core";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import "dotenv/config";


if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: parseInt(process.env.DB_POOL_MAX || '25', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || '15000', 10),
    allowExitOnIdle: true,
    // Retry a failed connection after a short delay instead of immediately rejecting
    retryDelayMillis: parseInt(process.env.DB_RETRY_DELAY_MS || '500', 10),
  });

  pool.on('error', (err) => {
    console.error(`[${DIPLOY_BRAND}] Unexpected database pool error:`, err.message);
  });
  
  export const db = drizzle(pool, { schema });

  const readPool = process.env.DATABASE_READ_URL
    ? new Pool({
        connectionString: process.env.DATABASE_READ_URL,
        max: parseInt(process.env.DB_POOL_MAX || '25', 10),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || '15000', 10),
        allowExitOnIdle: true,
        retryDelayMillis: parseInt(process.env.DB_RETRY_DELAY_MS || '500', 10),
      })
    : pool;

  if (process.env.DATABASE_READ_URL) {
    readPool.on('error', (err) => {
      console.error(`[${DIPLOY_BRAND}] Unexpected read replica pool error:`, err.message);
    });
    console.log(`[${DIPLOY_BRAND}] Read replica database configured`);
  }

  export const dbRead = process.env.DATABASE_READ_URL
    ? drizzle(readPool, { schema })
    : db;

// export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// export const db = drizzle({ client: pool, schema });