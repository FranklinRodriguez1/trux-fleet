import { describe, expect, it, vi } from "vitest";
import { ChangeTripStatusUseCase } from "@/application/trips/change-trip-status";
import { ForbiddenError, InvalidTransitionError, NotFoundError } from "@/domain/shared/errors";
import type { Trip } from "@/domain/trips/trip";
import type { TripRepository } from "@/domain/trips/trip-repository";
import type { Actor } from "@/domain/users/user";

const trip: Trip = {
  id: "t1",
  companyId: "c1",
  origin: "A",
  destination: "B",
  vehicleId: "v1",
  vehiclePlate: "A000001",
  driverId: "d1",
  driverName: "Conductor",
  status: "EN_CURSO",
  scheduledDeparture: new Date(),
  expectedArrival: new Date(),
  startedAt: new Date(),
  completedAt: null,
};

const repo = (found: Trip | null): TripRepository => ({
  listVisible: vi.fn(),
  findById: vi.fn().mockResolvedValue(found),
  changeStatus: vi.fn().mockResolvedValue(undefined),
});

const driver: Actor = { userId: "d1", companyId: "c1", role: "CONDUCTOR", name: "C" };
const otherDriver: Actor = { ...driver, userId: "d2" };
const empresa: Actor = { userId: "e1", companyId: "c1", role: "EMPRESA", name: "E" };
const now = new Date("2026-11-24T12:00:00Z");

describe("ChangeTripStatusUseCase", () => {
  it("el conductor completa su propio viaje y queda auditado", async () => {
    const r = repo(trip);
    await new ChangeTripStatusUseCase(r, () => now).execute(driver, { tripId: "t1", to: "COMPLETADO" });
    expect(r.changeStatus).toHaveBeenCalledWith({
      tripId: "t1",
      changedById: "d1",
      from: "EN_CURSO",
      to: "COMPLETADO",
      at: now,
      note: undefined,
    });
  });

  it("la empresa puede cambiar cualquier viaje", async () => {
    const r = repo(trip);
    await new ChangeTripStatusUseCase(r).execute(empresa, { tripId: "t1", to: "COMPLETADO" });
    expect(r.changeStatus).toHaveBeenCalled();
  });

  it("un conductor no puede tocar el viaje de otro", async () => {
    await expect(
      new ChangeTripStatusUseCase(repo(trip)).execute(otherDriver, { tripId: "t1", to: "COMPLETADO" }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("rechaza transiciones inválidas y viajes inexistentes", async () => {
    await expect(
      new ChangeTripStatusUseCase(repo(trip)).execute(driver, { tripId: "t1", to: "PROGRAMADO" }),
    ).rejects.toThrow(InvalidTransitionError);
    await expect(
      new ChangeTripStatusUseCase(repo(null)).execute(driver, { tripId: "x", to: "EN_CURSO" }),
    ).rejects.toThrow(NotFoundError);
  });
});
