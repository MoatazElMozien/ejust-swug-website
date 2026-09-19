import "server-only";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";
import { poolOptions } from "./connection";

// Reuse one small pool per server instance (important on serverless + dev hot reload).
const g = globalThis as unknown as { __swugPool?: mysql.Pool };
const pool = g.__swugPool ?? mysql.createPool(poolOptions());
if (process.env.NODE_ENV !== "production") g.__swugPool = pool;

export const db = drizzle(pool, { schema, mode: "default" });
// Avoid db.query.* relational API: it relies on LATERAL joins that TiDB / MariaDB lack.
export * from "./schema";
