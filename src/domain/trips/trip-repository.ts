import type { Trip } from "./trip";
import type { TripStatus } from "./trip-status";

export interface StatusChangeRecord {
  tripId: string;
  changedById: string;
  from: TripStatus;
  to: TripStatus;
  at: Date;
  note?: string;
}

export interface TripRepository {
  /** Lista lo que la sesión puede ver (RLS filtra por empresa y conductor). */
  listVisible(filter?: { status?: TripStatus }): Promise<Trip[]>;
  findById(id: string): Promise<Trip | null>;
  /** Cambia el estado y registra la auditoría de forma atómica. */
  changeStatus(change: StatusChangeRecord): Promise<void>;
}
