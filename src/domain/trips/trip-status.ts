import { InvalidTransitionError } from "../shared/errors";

export const TRIP_STATUSES = ["PROGRAMADO", "EN_CURSO", "COMPLETADO"] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

const TRANSITIONS: Record<TripStatus, readonly TripStatus[]> = {
  PROGRAMADO: ["EN_CURSO"],
  EN_CURSO: ["COMPLETADO"],
  COMPLETADO: [],
};

export function canTransition(from: TripStatus, to: TripStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(from: TripStatus, to: TripStatus): void {
  if (!canTransition(from, to)) {
    throw new InvalidTransitionError(`No se puede pasar de ${from} a ${to}`);
  }
}

export const STATUS_LABEL: Record<TripStatus, string> = {
  PROGRAMADO: "Programado",
  EN_CURSO: "En curso",
  COMPLETADO: "Completado",
};
