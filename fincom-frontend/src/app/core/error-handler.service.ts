import { Injectable, signal } from '@angular/core';
import { AppError } from './app-error';

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
  readonly lastError = signal<AppError | null>(null);
  readonly uiMessage = signal<string | null>(null);

  handle(error: unknown, fallbackMessage = 'Something went wrong.'): AppError {
    const appError = AppError.from(error, fallbackMessage);

    this.lastError.set(appError);
    this.uiMessage.set(appError.message);

    return appError;
  }

  clear(): void {
    this.lastError.set(null);
    this.uiMessage.set(null);
  }
}
