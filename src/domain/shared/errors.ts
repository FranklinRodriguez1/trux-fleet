export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ForbiddenError extends DomainError {}
export class NotFoundError extends DomainError {}
export class InvalidTransitionError extends DomainError {}
export class InvalidCredentialsError extends DomainError {
  constructor() {
    super("Correo o contraseña incorrectos");
  }
}
