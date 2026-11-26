import type { Trip } from "@/domain/trips/trip";
import type { StatusChangeRecord, TripRepository } from "@/domain/trips/trip-repository";
import type { TripStatus } from "@/domain/trips/trip-status";
import type { Db } from "../db/rls-context";

const include = {
  vehicle: { select: { plate: true } },
  driver: { select: { name: true } },
} as const;

type Row = Awaited<ReturnType<Db["trip"]["findFirstOrThrow"]>> & {
  vehicle: { plate: string };
  driver: { name: string };
};

function toDomain(r: Row): Trip {
  return {
    id: r.id,
    companyId: r.companyId,
    origin: r.origin,
    destination: r.destination,
    vehicleId: r.vehicleId,
    vehiclePlate: r.vehicle.plate,
    driverId: r.driverId,
    driverName: r.driver.name,
    status: r.status,
    scheduledDeparture: r.scheduledDeparture,
    expectedArrival: r.expectedArrival,
    startedAt: r.startedAt,
    completedAt: r.completedAt,
  };
}

/** Debe recibir un `Db` creado con withActorContext: RLS hace el filtrado. */
export class PrismaTripRepository implements TripRepository {
  constructor(private readonly db: Db) {}

  async listVisible(filter?: { status?: TripStatus }): Promise<Trip[]> {
    const rows = await this.db.trip.findMany({
      where: filter?.status ? { status: filter.status } : undefined,
      include,
      orderBy: { expectedArrival: "asc" },
    });
    return rows.map(toDomain);
  }

  async findById(id: string): Promise<Trip | null> {
    const row = await this.db.trip.findUnique({ where: { id }, include });
    return row ? toDomain(row) : null;
  }

  async changeStatus(c: StatusChangeRecord): Promise<void> {
    // Ya estamos dentro de la transacción de withActorContext: el cambio y
    // su registro de auditoría se confirman o se revierten juntos.
    const trip = await this.db.trip.update({
      where: { id: c.tripId, status: c.from }, // bloqueo optimista
      data: {
        status: c.to,
        ...(c.to === "EN_CURSO" ? { startedAt: c.at } : {}),
        ...(c.to === "COMPLETADO" ? { completedAt: c.at } : {}),
      },
      select: { companyId: true },
    });
    await this.db.tripStatusChange.create({
      data: {
        companyId: trip.companyId,
        tripId: c.tripId,
        changedById: c.changedById,
        fromStatus: c.from,
        toStatus: c.to,
        note: c.note,
        createdAt: c.at,
      },
    });
  }
}
