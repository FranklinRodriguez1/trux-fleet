import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import type { Actor } from "@/domain/users/user";

export type Db = Prisma.TransactionClient;

/**
 * Ejecuta `fn` en una transacción con el contexto RLS del actor.
 * set_config(..., true) es local a la transacción, así que el contexto
 * nunca se filtra a otra petición que reutilice la conexión del pool.
 */
export function withActorContext<T>(
  client: PrismaClient,
  actor: Actor,
  fn: (db: Db) => Promise<T>,
): Promise<T> {
  return client.$transaction(async (tx) => {
    await tx.$executeRaw`
      SELECT set_config('app.company_id', ${actor.companyId}, true),
             set_config('app.user_id', ${actor.userId}, true),
             set_config('app.role', ${actor.role}, true)`;
    return fn(tx);
  });
}

/** Contexto mínimo para el login: solo deja leer el usuario con ese email. */
export function withLoginContext<T>(
  client: PrismaClient,
  email: string,
  fn: (db: Db) => Promise<T>,
): Promise<T> {
  return client.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.login_email', ${email}, true)`;
    return fn(tx);
  });
}
