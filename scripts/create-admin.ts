/**
 * Create (or reset) an admin account from the command line.
 *   npm run create-admin -- you@ejust.edu.eg "Your Name" "StrongPassword" [SUPER_ADMIN|EDITOR]
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { poolOptions } from "../src/db/connection";
import { users } from "../src/db/schema";

async function main() {
  const [email, name, password, roleArg] = process.argv.slice(2);
  if (!email || !name || !password) {
    console.error('Usage: npm run create-admin -- <email> "<name>" "<password>" [SUPER_ADMIN|EDITOR]');
    process.exit(1);
  }
  if (password.length < 8) throw new Error("Password must be at least 8 characters");
  const role = roleArg === "EDITOR" ? "EDITOR" : "SUPER_ADMIN";
  const conn = await mysql.createConnection(poolOptions());
  const db = drizzle(conn);
  const passwordHash = await bcrypt.hash(password, 12);
  const e = email.toLowerCase();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, e));
  if (existing) await db.update(users).set({ name, passwordHash, role, active: true }).where(eq(users.id, existing.id));
  else await db.insert(users).values({ email: e, name, passwordHash, role });
  console.log(`• ${existing ? "Updated" : "Created"} ${role} ${e}`);
  await conn.end();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
