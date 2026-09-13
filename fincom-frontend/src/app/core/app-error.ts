export type AppErrorLevel = 'info' | 'warning' | 'error';

export interface AppErrorPayload {
  message: string;
  code?: string;
  level?: AppErrorLevel;
  recoverable?: boolean;
  retryable?: boolean;
  technical?: string;
}

export class AppError extends Error {
  readonly code: string;
  readonly level: AppErrorLevel;
  readonly recoverable: boolean;
  readonly retryable: boolean;
  readonly technical?: string;

  constructor(payload: AppErrorPayload) {
    super(payload.message);
    this.name = 'AppError';
    this.code = payload.code ?? 'APP_ERROR';
    this.level = payload.level ?? 'error';
    this.recoverable = payload.recoverable ?? false;
    this.retryable = payload.retryable ?? false;
    this.technical = payload.technical;
  }

  static from(error: unknown, fallbackMessage = 'Something went wrong.'): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      return new AppError({
        message: error.message || fallbackMessage,
        code: 'RUNTIME_ERROR',
        level: 'error',
        recoverable: false,
        retryable: false,
        technical: error.stack,
      });
    }

    return new AppError({
      message: fallbackMessage,
      code: 'UNKNOWN_ERROR',
      level: 'error',
      recoverable: false,
      retryable: false,
      technical: typeof error === 'string' ? error : JSON.stringify(error),
    });
  }
}
