import { ForbiddenError } from "@/domain/shared/errors";
import { isDelayed, type Trip } from "@/domain/trips/trip";
import type { TripRepository } from "@/domain/trips/trip-repository";
import type { TripStatus } from "@/domain/trips/trip-status";
import { can } from "@/domain/users/role";
import type { Actor } from "@/domain/users/user";

export interface TripView extends Trip {
  delayed: boolean;
}

export class ListTripsUseCase {
  constructor(
    private readonly trips: TripRepository,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async execute(actor: Actor, filter?: { status?: TripStatus }): Promise<TripView[]> {
    if (!can(actor.role, "trips:read:all") && !can(actor.role, "trips:read:own")) {
      throw new ForbiddenError("Sin permiso para ver viajes");
    }
    const now = this.clock();
    const trips = await this.trips.listVisible(filter);
    // RLS ya filtra; esta comprobación es defensa en profundidad.
    const visible = can(actor.role, "trips:read:all")
      ? trips
      : trips.filter((t) => t.driverId === actor.userId);
    return visible.map((t) => ({ ...t, delayed: isDelayed(t, now) }));
  }
}
