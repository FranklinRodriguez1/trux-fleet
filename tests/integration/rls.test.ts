/**
 * Prueba RLS contra un PostgreSQL real con el seed aplicado.
 * Ejecutar con: npm run test:db
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@/generated/prisma/client";
import { withActorContext, withLoginContext } from "@/infrastructure/db/rls-context";
import type { Actor } from "@/domain/users/user";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
afterAll(() => prisma.$disconnect());

const COMPANY = "00000000-0000-4000-8000-000000000001";
const empresa: Actor = { userId: "00000000-0000-4000-8000-000000000101", companyId: COMPANY, role: "EMPRESA", name: "E" };

async function driver(): Promise<Actor> {
  const u = await withLoginContext(prisma, "conductor@trux.demo", (db) =>
    db.user.findUniqueOrThrow({ where: { email: "conductor@trux.demo" } }),
  );
  return { userId: u.id, companyId: u.companyId, role: "CONDUCTOR", name: u.name };
}

describe("RLS", () => {
  it("sin contexto no se ve nada", async () => {
    expect(await prisma.trip.count()).toBe(0);
    expect(await prisma.user.count()).toBe(0);
  });

  it("el login solo puede leer el usuario de ese email", async () => {
    const n = await withLoginContext(prisma, "conductor@trux.demo", (db) => db.user.count());
    expect(n).toBe(1);
  });

  it("la empresa ve todos los viajes; el conductor solo los suyos", async () => {
    const all = await withActorContext(prisma, empresa, (db) => db.trip.count());
    const d = await driver();
    const mine = await withActorContext(prisma, d, (db) => db.trip.findMany());
    expect(all).toBeGreaterThan(mine.length);
    expect(mine.length).toBeGreaterThan(0);
    expect(mine.every((t) => t.driverId === d.userId)).toBe(true);
  });

  it("otra empresa no ve datos ajenos", async () => {
    const other: Actor = { ...empresa, companyId: "00000000-0000-4000-8000-000000000999" };
    expect(await withActorContext(prisma, other, (db) => db.trip.count())).toBe(0);
  });

  it("el conductor no puede crear viajes ni cambiar la ruta", async () => {
    const d = await driver();
    await expect(
      withActorContext(prisma, d, async (db) => {
        const t = await db.trip.findFirstOrThrow();
        await db.trip.update({ where: { id: t.id }, data: { destination: "Otro lugar" } });
      }),
    ).rejects.toThrow();
    await expect(
      withActorContext(prisma, d, async (db) => {
        const t = await db.trip.findFirstOrThrow();
        await db.trip.create({
          data: { ...t, id: undefined, createdAt: undefined, status: "PROGRAMADO" },
        });
      }),
    ).rejects.toThrow();
  });

  it("el historial de auditoría no se puede borrar", async () => {
    const deleted = await withActorContext(prisma, empresa, (db) => db.tripStatusChange.deleteMany());
    expect(deleted.count).toBe(0);
  });
});
