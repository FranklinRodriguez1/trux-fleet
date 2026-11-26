import type { UserRepository, UserWithPassword } from "@/domain/users/user-repository";
import type { Db } from "../db/rls-context";

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly db: Db) {}

  async findForLogin(email: string): Promise<UserWithPassword | null> {
    const u = await this.db.user.findUnique({ where: { email } });
    if (!u) return null;
    return {
      id: u.id,
      companyId: u.companyId,
      name: u.name,
      email: u.email,
      role: u.role,
      passwordHash: u.passwordHash,
    };
  }
}
