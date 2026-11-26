import type { User } from "./user";

export interface UserWithPassword extends User {
  passwordHash: string;
}

export interface UserRepository {
  /** Busca por email sin sesión previa (solo para el login). */
  findForLogin(email: string): Promise<UserWithPassword | null>;
}
