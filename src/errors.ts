// ============================================================
// Agent Imprint SDK — Typed Errors
// ============================================================

export class ImprintApiError extends Error {
  public readonly status: number;
  public readonly code: string | undefined;
  public readonly body: unknown;

  constructor(
    message: string,
    status: number,
    body?: unknown,
    code?: string,
  ) {
    super(message);
    this.name = 'ImprintApiError';
    this.status = status;
    this.code = code;
    this.body = body;
    Object.setPrototypeOf(this, ImprintApiError.prototype);
  }
}

export class ImprintValidationError extends ImprintApiError {
  public readonly errors: Record<string, string[]>;

  constructor(
    message: string,
    errors: Record<string, string[]>,
    body?: unknown,
  ) {
    super(message, 422, body, 'VALIDATION_ERROR');
    this.name = 'ImprintValidationError';
    this.errors = errors;
    Object.setPrototypeOf(this, ImprintValidationError.prototype);
  }
}

export class ImprintAuthError extends ImprintApiError {
  constructor(message: string = 'Unauthorized — check your API key', body?: unknown) {
    super(message, 401, body, 'AUTH_ERROR');
    this.name = 'ImprintAuthError';
    Object.setPrototypeOf(this, ImprintAuthError.prototype);
  }
}

export class ImprintNotFoundError extends ImprintApiError {
  constructor(message: string = 'Resource not found', body?: unknown) {
    super(message, 404, body, 'NOT_FOUND');
    this.name = 'ImprintNotFoundError';
    Object.setPrototypeOf(this, ImprintNotFoundError.prototype);
  }
}
