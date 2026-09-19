import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { poolOptions } from "./src/db/connection";

const o = poolOptions();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: o.host!,
    port: o.port,
    user: o.user,
    password: o.password,
    database: o.database!,
    ssl: o.ssl ? { rejectUnauthorized: true } : undefined,
  },
});
