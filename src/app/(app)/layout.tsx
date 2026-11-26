import Link from "next/link";
import { HOME_BY_ROLE } from "@/domain/users/role";
import { requireActor } from "@/infrastructure/auth/session";
import { logoutAction } from "../(auth)/login/actions";

const ROLE_LABEL = { EMPRESA: "Empresa", CONDUCTOR: "Conductor" } as const;

// Depende de la sesión del usuario en cada petición: se renderiza en el servidor sin shell estático.
export const instant = false;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white text-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href={HOME_BY_ROLE[actor.role]} className="text-lg font-bold tracking-tight">
            TRUX
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span>
              {actor.name}{" "}
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                {ROLE_LABEL[actor.role]}
              </span>
            </span>
            <form action={logoutAction}>
              <button className="rounded-md border border-slate-300 px-3 py-1 hover:bg-slate-50">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 p-4">{children}</main>
    </div>
  );
}
