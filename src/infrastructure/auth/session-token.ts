import { jwtVerify, SignJWT } from "jose";
import { isRole } from "@/domain/users/role";
import type { Actor } from "@/domain/users/user";

// Sin "server-only": proxy.ts también lo usa para la comprobación optimista.

export const SESSION_COOKIE = "trux_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 horas

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET debe tener al menos 32 caracteres");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(actor: Actor): Promise<string> {
  return new SignJWT({ cid: actor.companyId, role: actor.role, name: actor.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(actor.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(key());
}

export async function verifySessionToken(token: string | undefined): Promise<Actor | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (!payload.sub || typeof payload.cid !== "string" || !isRole(payload.role)) return null;
    return {
      userId: payload.sub,
      companyId: payload.cid,
      role: payload.role,
      name: typeof payload.name === "string" ? payload.name : "",
    };
  } catch {
    return null;
  }
}
