import { ForbiddenError, NotFoundError } from "@/domain/shared/errors";
import type { TripRepository } from "@/domain/trips/trip-repository";
import { assertTransition, type TripStatus } from "@/domain/trips/trip-status";
import { can } from "@/domain/users/role";
import type { Actor } from "@/domain/users/user";

export class ChangeTripStatusUseCase {
  constructor(
    private readonly trips: TripRepository,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async execute(actor: Actor, input: { tripId: string; to: TripStatus; note?: string }) {
    const trip = await this.trips.findById(input.tripId);
    if (!trip) throw new NotFoundError("Viaje no encontrado");

    const allowed =
      can(actor.role, "trips:update-status:any") ||
      (can(actor.role, "trips:update-status:own") && trip.driverId === actor.userId);
    if (!allowed) throw new ForbiddenError("No puedes cambiar el estado de este viaje");

    assertTransition(trip.status, input.to);

    await this.trips.changeStatus({
      tripId: trip.id,
      changedById: actor.userId,
      from: trip.status,
      to: input.to,
      at: this.clock(),
      note: input.note,
    });
  }
}
