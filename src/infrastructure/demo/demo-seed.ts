/**
 * Datos de demo ilustrativos. Borra y recrea la empresa demo con horas
 * relativas al momento actual, para que siempre haya un viaje retrasado.
 * Lo usan `npm run db:seed` y el cron diario /api/cron/reset-demo.
 *
 * Corre bajo RLS igual que la app: fija el contexto de la empresa demo.
 */
import bcrypt from "bcryptjs";
import type { PrismaClient, TripStatus } from "@/generated/prisma/client";

export const DEMO_PASSWORD = "trux1234";

const COMPANY_ID = "00000000-0000-4000-8000-000000000001";
const EMPRESA_ID = "00000000-0000-4000-8000-000000000101";

const min = (m: number) => new Date(Date.now() + m * 60_000);

export async function seedDemo(prisma: PrismaClient): Promise<void> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      SELECT set_config('app.company_id', ${COMPANY_ID}, true),
             set_config('app.user_id', ${EMPRESA_ID}, true),
             set_config('app.role', 'EMPRESA', true)`;

    // Limpieza de la empresa demo (el historial se borra en cascada con los viajes).
    await tx.trip.deleteMany({});
    await tx.vehicle.deleteMany({});
    await tx.user.deleteMany({});
    await tx.company.upsert({
      where: { id: COMPANY_ID },
      update: { name: "Transportes Demo" },
      create: { id: COMPANY_ID, name: "Transportes Demo" },
    });

    await tx.user.create({
      data: {
        id: EMPRESA_ID,
        companyId: COMPANY_ID,
        name: "Laura Méndez",
        email: "empresa@trux.demo",
        passwordHash,
        role: "EMPRESA",
      },
    });

    const drivers = await Promise.all(
      [
        ["Carlos Peña", "conductor@trux.demo"],
        ["Ana Rosario", "ana@trux.demo"],
        ["Miguel Santos", "miguel@trux.demo"],
      ].map(([name, email]) =>
        tx.user.create({
          data: { companyId: COMPANY_ID, name, email, passwordHash, role: "CONDUCTOR" },
        }),
      ),
    );

    const vehicles = await Promise.all(
      [
        ["A123456", "Isuzu NPR", 4500],
        ["A234567", "Hino 300", 5000],
        ["L345678", "Toyota Hilux", 1000],
        ["A456789", "Mitsubishi Canter", 3500],
      ].map(([plate, model, capacityKg]) =>
        tx.vehicle.create({
          data: { companyId: COMPANY_ID, plate: String(plate), model: String(model), capacityKg: Number(capacityKg) },
        }),
      ),
    );

    const [carlos, ana, miguel] = drivers;
    const trips = [
      // El viaje de la demo: en curso y 30 min tarde.
      { origin: "Santo Domingo", destination: "Santiago", v: 0, d: carlos, status: "EN_CURSO", dep: -210, arr: -30 },
      { origin: "Santo Domingo", destination: "La Romana", v: 2, d: carlos, status: "PROGRAMADO", dep: 120, arr: 240 },
      { origin: "Santiago", destination: "Puerto Plata", v: 1, d: ana, status: "EN_CURSO", dep: -40, arr: 50 },
      { origin: "San Pedro de Macorís", destination: "Higüey", v: 3, d: miguel, status: "PROGRAMADO", dep: 60, arr: 150 },
      { origin: "La Vega", destination: "Santo Domingo", v: 1, d: ana, status: "COMPLETADO", dep: -480, arr: -330 },
      { origin: "Baní", destination: "Azua", v: 3, d: miguel, status: "COMPLETADO", dep: -300, arr: -240 },
    ] as const;

    for (const t of trips) {
      const trip = await tx.trip.create({
        data: {
          companyId: COMPANY_ID,
          origin: t.origin,
          destination: t.destination,
          vehicleId: vehicles[t.v].id,
          driverId: t.d.id,
          status: t.status,
          scheduledDeparture: min(t.dep),
          expectedArrival: min(t.arr),
          startedAt: t.status === "PROGRAMADO" ? null : min(t.dep + 5),
          completedAt: t.status === "COMPLETADO" ? min(t.arr - 10) : null,
        },
      });
      // Historial coherente con el estado sembrado (registrado por la empresa).
      const history: [TripStatus | null, TripStatus, number][] = [[null, "PROGRAMADO", t.dep - 1440]];
      if (t.status !== "PROGRAMADO") history.push(["PROGRAMADO", "EN_CURSO", t.dep + 5]);
      if (t.status === "COMPLETADO") history.push(["EN_CURSO", "COMPLETADO", t.arr - 10]);
      for (const [from, to, at] of history) {
        await tx.tripStatusChange.create({
          data: {
            companyId: COMPANY_ID,
            tripId: trip.id,
            changedById: EMPRESA_ID,
            fromStatus: from,
            toStatus: to,
            createdAt: min(at),
          },
        });
      }
    }
  });
}
