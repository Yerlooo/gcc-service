export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string = 'APP_ERROR',
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Permintaan tidak valid.', details?: unknown) {
    super(400, message, 'BAD_REQUEST', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Sesi tidak valid. Silakan masuk kembali.') {
    super(401, message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Anda tidak memiliki akses ke tindakan ini.') {
    super(403, message, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Data tidak ditemukan.') {
    super(404, message, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Data bertentangan dengan yang sudah ada.', details?: unknown) {
    super(409, message, 'CONFLICT', details);
  }
}

export class UnprocessableError extends AppError {
  constructor(message = 'Data tidak dapat diproses.', details?: unknown) {
    super(422, message, 'UNPROCESSABLE', details);
  }

  static fromZod(error: { issues: unknown }) {
    return new UnprocessableError('Validasi gagal.', error.issues);
  }
}
