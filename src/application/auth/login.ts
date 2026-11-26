import { InvalidCredentialsError } from "@/domain/shared/errors";
import type { Actor } from "@/domain/users/user";
import type { UserRepository } from "@/domain/users/user-repository";
import type { PasswordHasher } from "../ports/password-hasher";

export class LoginUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: { email: string; password: string }): Promise<Actor> {
    const user = await this.users.findForLogin(input.email.trim().toLowerCase());
    // Se verifica siempre para no revelar por tiempo si el email existe.
    const ok = await this.hasher.verify(input.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) throw new InvalidCredentialsError();
    return { userId: user.id, companyId: user.companyId, role: user.role, name: user.name };
  }
}

// bcrypt de una cadena aleatoria; solo iguala el tiempo de respuesta.
const DUMMY_HASH = "$2b$10$CwTycUXWue0Thq9StjUM0uJ8.Dz0nF6f6GhC3t1Q8mF7a9u0Zq1yW";
