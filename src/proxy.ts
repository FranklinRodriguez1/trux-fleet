import { NextResponse, type NextRequest } from "next/server";
import { HOME_BY_ROLE, type Role } from "@/domain/users/role";
import { SESSION_COOKIE, verifySessionToken } from "@/infrastructure/auth/session-token";

/**
 * Protección de rutas, primera capa (optimista): redirige antes de renderizar.
 * La comprobación definitiva está en requireActor() y, en los datos, en RLS.
 */
const ROLE_PREFIXES: Record<string, Role> = {
  "/empresa": "EMPRESA",
  "/conductor": "CONDUCTOR",
};
const PUBLIC_PATHS = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const actor = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!actor) {
    if (isPublic) return NextResponse.next();
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isPublic) return NextResponse.redirect(new URL(HOME_BY_ROLE[actor.role], request.url));

  const required = Object.entries(ROLE_PREFIXES).find(
    ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )?.[1];
  if (required && required !== actor.role) {
    return NextResponse.redirect(new URL("/no-autorizado", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // /api/cron se autentica con CRON_SECRET en su propio handler.
  matcher: ["/((?!api/cron|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico)$).*)"],
};
