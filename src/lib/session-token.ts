import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "swug_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = { uid: number; role: "SUPER_ADMIN" | "EDITOR" };

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set to a random string of at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(p: SessionPayload): Promise<string> {
  return new SignJWT({ role: p.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(p.uid))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(key());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    const uid = Number(payload.sub);
    const role = payload.role;
    if (!uid || (role !== "SUPER_ADMIN" && role !== "EDITOR")) return null;
    return { uid, role };
  } catch {
    return null;
  }
}
