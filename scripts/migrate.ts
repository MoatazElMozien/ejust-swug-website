/** Applies SQL migrations in ./drizzle to DATABASE_URL.  Run: npm run db:migrate */
import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import { poolOptions } from "../src/db/connection";

async function main() {
  const conn = await mysql.createConnection({ ...poolOptions(), multipleStatements: true });
  await migrate(drizzle(conn), { migrationsFolder: "./drizzle" });
  console.log("• Migrations applied");
  await conn.end();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
