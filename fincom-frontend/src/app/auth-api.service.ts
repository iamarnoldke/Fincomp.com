import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { API_BASE_URL } from './core/api-config';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

export interface UserOut {
  id: string;
  email: string;
  full_name: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserOut;
}

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);

  login(payload: LoginRequest) {
    return this.http
      .post<TokenResponse>(`${API_BASE_URL}/auth/login`, payload)
      .pipe(catchError(this.handleError));
  }

  register(payload: RegisterRequest) {
    return this.http
      .post<TokenResponse>(`${API_BASE_URL}/auth/register`, payload)
      .pipe(catchError(this.handleError));
  }

  private handleError(err: HttpErrorResponse) {
    if (err.status === 0) {
      return throwError(() => new Error('Cannot reach the server. Please try again later.'));
    }
    const detail = err.error?.detail;
    if (typeof detail === 'string') {
      return throwError(() => new Error(detail));
    }
    if (Array.isArray(detail) && detail.length > 0) {

      const msg = detail[0]?.msg ?? 'Validation error';
      return throwError(() => new Error(msg));
    }
    return throwError(() => new Error(`Unexpected error (${err.status}). Please try again.`));
  }
}
