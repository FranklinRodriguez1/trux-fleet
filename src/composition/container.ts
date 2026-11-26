import "server-only";
import { LoginUseCase } from "@/application/auth/login";
import { ChangeTripStatusUseCase } from "@/application/trips/change-trip-status";
import { ListTripsUseCase } from "@/application/trips/list-trips";
import type { Actor } from "@/domain/users/user";
import { prisma } from "@/infrastructure/db/prisma";
import { withActorContext, withLoginContext } from "@/infrastructure/db/rls-context";
import { PrismaTripRepository } from "@/infrastructure/repositories/prisma-trip-repository";
import { PrismaUserRepository } from "@/infrastructure/repositories/prisma-user-repository";
import { BcryptPasswordHasher } from "@/infrastructure/security/bcrypt-password-hasher";

/**
 * Raíz de composición: el único lugar que conoce las implementaciones
 * concretas. La capa de interfaz (src/app) solo llama a estas funciones.
 */
export function login(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  return withLoginContext(prisma, email, (db) =>
    new LoginUseCase(new PrismaUserRepository(db), new BcryptPasswordHasher()).execute(input),
  );
}

export function servicesFor(actor: Actor) {
  const run = <T>(fn: (trips: PrismaTripRepository) => Promise<T>) =>
    withActorContext(prisma, actor, (db) => fn(new PrismaTripRepository(db)));

  return {
    listTrips: (filter?: Parameters<ListTripsUseCase["execute"]>[1]) =>
      run((trips) => new ListTripsUseCase(trips).execute(actor, filter)),
    changeTripStatus: (input: Parameters<ChangeTripStatusUseCase["execute"]>[1]) =>
      run((trips) => new ChangeTripStatusUseCase(trips).execute(actor, input)),
  };
}
