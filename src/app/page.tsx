import { redirect } from "next/navigation";
import { HOME_BY_ROLE } from "@/domain/users/role";
import { getSession } from "@/infrastructure/auth/session";

// Depende de la sesión del usuario en cada petición: se renderiza en el servidor sin shell estático.
export const instant = false;

export default async function Home() {
  const actor = await getSession();
  redirect(actor ? HOME_BY_ROLE[actor.role] : "/login");
}
