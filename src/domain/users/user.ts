import type { Role } from "./role";

export interface User {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: Role;
}

/** Identidad de quien hace la petición; viaja a cada caso de uso. */
export interface Actor {
  userId: string;
  companyId: string;
  role: Role;
  name: string;
}
