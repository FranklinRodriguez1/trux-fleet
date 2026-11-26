/**
 * Roles y permisos de TRUX.
 * - EMPRESA: gestiona vehículos y viajes, ve toda la operación.
 * - CONDUCTOR: ve solo sus viajes y actualiza su estado.
 */
export const ROLES = ["EMPRESA", "CONDUCTOR"] as const;
export type Role = (typeof ROLES)[number];

export type Permission =
  | "trips:read:all"
  | "trips:read:own"
  | "trips:create"
  | "trips:update-status:any"
  | "trips:update-status:own"
  | "vehicles:manage";

const PERMISSIONS: Record<Role, readonly Permission[]> = {
  EMPRESA: [
    "trips:read:all",
    "trips:create",
    "trips:update-status:any",
    "vehicles:manage",
  ],
  CONDUCTOR: ["trips:read:own", "trips:update-status:own"],
};

export function can(role: Role, permission: Permission): boolean {
  return PERMISSIONS[role].includes(permission);
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** Página de inicio de cada rol tras iniciar sesión. */
export const HOME_BY_ROLE: Record<Role, string> = {
  EMPRESA: "/empresa",
  CONDUCTOR: "/conductor",
};
