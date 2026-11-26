import type { TripStatus } from "./trip-status";

export interface Trip {
  id: string;
  companyId: string;
  origin: string;
  destination: string;
  vehicleId: string;
  vehiclePlate: string;
  driverId: string;
  driverName: string;
  status: TripStatus;
  scheduledDeparture: Date;
  expectedArrival: Date;
  startedAt: Date | null;
  completedAt: Date | null;
}

/**
 * "Retrasado" no se guarda: se deriva. Un viaje está retrasado si no se ha
 * completado y su hora prevista de llegada ya pasó.
 */
export function isDelayed(trip: Pick<Trip, "status" | "expectedArrival">, now: Date): boolean {
  return trip.status !== "COMPLETADO" && trip.expectedArrival.getTime() < now.getTime();
}
