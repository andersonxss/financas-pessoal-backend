export interface ErrorWithStatus extends Error {
  status: number;
}

export class AppError {
  public readonly message: string;
  public readonly status: number;

  constructor(error: unknown) {
    this.message = 'Erro interno do servidor';
    this.status = 500;

    if (typeof error !== 'object' || error === null) {
      return;
    }

    if ('message' in error && typeof error.message === 'string' && error.message.trim()) {
      this.message = error.message;
    }

    if (
      'status' in error &&
      typeof error.status === 'number' &&
      Number.isInteger(error.status) &&
      error.status >= 400 &&
      error.status <= 599
    ) {
      this.status = error.status;
    }
  }
}
