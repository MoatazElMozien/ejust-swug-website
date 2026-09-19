import type { PoolOptions } from "mysql2";

/**
 * Builds mysql2 options from DATABASE_URL.
 * TLS is enabled automatically for TiDB Cloud / when the URL asks for it
 * (?ssl=true or ?sslaccept=strict), since cloud MySQL providers require it.
 */
export function poolOptions(): PoolOptions {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is not set");
  const url = new URL(raw);
  const wantsSsl =
    url.hostname.endsWith("tidbcloud.com") ||
    url.searchParams.get("ssl") === "true" ||
    url.searchParams.has("sslaccept") ||
    url.searchParams.get("sslmode") === "require";

  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    ssl: wantsSsl ? { minVersion: "TLSv1.2", rejectUnauthorized: true } : undefined,
    connectionLimit: 5,
    maxIdle: 5,
    idleTimeout: 60_000,
    enableKeepAlive: true,
  };
}
