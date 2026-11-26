import bcrypt from "bcryptjs";
import type { PasswordHasher } from "@/application/ports/password-hasher";

export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly rounds = 10) {}

  hash(plain: string) {
    return bcrypt.hash(plain, this.rounds);
  }

  verify(plain: string, hash: string) {
    return bcrypt.compare(plain, hash);
  }
}
