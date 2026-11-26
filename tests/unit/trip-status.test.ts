import { describe, expect, it } from "vitest";
import { isDelayed } from "@/domain/trips/trip";
import { assertTransition, canTransition } from "@/domain/trips/trip-status";
import { InvalidTransitionError } from "@/domain/shared/errors";

describe("transiciones de estado", () => {
  it("permite solo programado → en curso → completado", () => {
    expect(canTransition("PROGRAMADO", "EN_CURSO")).toBe(true);
    expect(canTransition("EN_CURSO", "COMPLETADO")).toBe(true);
    expect(canTransition("PROGRAMADO", "COMPLETADO")).toBe(false);
    expect(canTransition("COMPLETADO", "EN_CURSO")).toBe(false);
    expect(() => assertTransition("COMPLETADO", "PROGRAMADO")).toThrow(InvalidTransitionError);
  });
});

describe("isDelayed", () => {
  const now = new Date("2026-11-24T12:00:00Z");
  const past = new Date("2026-11-24T11:00:00Z");
  const future = new Date("2026-11-24T13:00:00Z");

  it("marca retrasado si pasó la llegada prevista y no está completado", () => {
    expect(isDelayed({ status: "EN_CURSO", expectedArrival: past }, now)).toBe(true);
    expect(isDelayed({ status: "PROGRAMADO", expectedArrival: past }, now)).toBe(true);
  });

  it("no marca retrasado si está completado o aún a tiempo", () => {
    expect(isDelayed({ status: "COMPLETADO", expectedArrival: past }, now)).toBe(false);
    expect(isDelayed({ status: "EN_CURSO", expectedArrival: future }, now)).toBe(false);
  });
});
