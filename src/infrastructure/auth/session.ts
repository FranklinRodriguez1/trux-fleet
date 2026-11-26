import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Role } from "@/domain/users/role";
import type { Actor } from "@/domain/users/user";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  signSession,
  verifySessionToken,
} from "./session-token";

export async function createSession(actor: Actor) {
  const store = await cookies();
  store.set(SESSION_COOKIE, await signSession(actor), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export const getSession = cache(async (): Promise<Actor | null> => {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
});

/**
 * Comprobación de seguridad real (el proxy solo es optimista). Úsala en cada
 * página, Server Action y Route Handler protegido.
 */
export async function requireActor(...roles: Role[]): Promise<Actor> {
  const actor = await getSession();
  if (!actor) redirect("/login");
  if (roles.length > 0 && !roles.includes(actor.role)) redirect("/no-autorizado");
  return actor;
}
