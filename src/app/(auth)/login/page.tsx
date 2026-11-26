import { LoginForm } from "./login-form";

const DEMO_USERS = [
  { role: "Empresa", email: "empresa@trux.demo" },
  { role: "Conductor", email: "conductor@trux.demo" },
];

// Depende de la sesión del usuario en cada petición: se renderiza en el servidor sin shell estático.
export const instant = false;

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">TRUX</h1>
        <p className="mb-6 text-sm text-slate-600">Seguimiento y auditoría de viajes de flota</p>
        <LoginForm next={typeof next === "string" ? next : undefined} />
        <div className="mt-6 rounded-md bg-slate-50 p-3 text-xs text-slate-600">
          <p className="mb-1 font-medium">Usuarios de demo (contraseña: trux1234)</p>
          <ul>
            {DEMO_USERS.map((u) => (
              <li key={u.email}>
                {u.role}: <code>{u.email}</code>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
