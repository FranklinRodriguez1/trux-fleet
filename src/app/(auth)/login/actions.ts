"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { login } from "@/composition/container";
import { InvalidCredentialsError } from "@/domain/shared/errors";
import { HOME_BY_ROLE } from "@/domain/users/role";
import { createSession, deleteSession } from "@/infrastructure/auth/session";

const LoginSchema = z.object({
  email: z.email("Escribe un correo válido"),
  password: z.string().min(1, "Escribe tu contraseña"),
  next: z.string().optional(),
});

export type LoginState = { error?: string; email?: string } | undefined;

export async function loginAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message, email: String(form.get("email") ?? "") };
  }

  let home: string;
  try {
    const actor = await login(parsed.data);
    await createSession(actor);
    home = HOME_BY_ROLE[actor.role];
  } catch (e) {
    if (e instanceof InvalidCredentialsError) return { error: e.message, email: parsed.data.email };
    throw e;
  }

  // Solo se respeta "next" si pertenece al área del rol (evita open redirect).
  const next = parsed.data.next;
  redirect(next && next.startsWith(`${home}/`) ? next : home);
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
