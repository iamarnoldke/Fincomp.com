import { Injectable, signal, computed, inject, type WritableSignal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthApiService, type TokenResponse } from './auth-api.service';

export interface User {
  id: string;
  email: string;
  name: string;
}

const TOKEN_KEY = 'fincom.auth.token';
const USER_KEY  = 'fincom.auth.user';

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly api = inject(AuthApiService);

  private currentUser: WritableSignal<User | null> = signal<User | null>(null);

  user = this.currentUser.asReadonly();

  isLoggedIn = computed(() => this.currentUser() !== null);

  constructor() {
    this.hydrate();
  }

  async login(email: string, password: string): Promise<User> {
    const response = await firstValueFrom(
      this.api.login({ email: email.trim().toLowerCase(), password })
    );
    return this.applySession(response);
  }


  async registerAccount(name: string, email: string, password: string): Promise<User> {
    const response = await firstValueFrom(
      this.api.register({
        full_name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      })
    );
    return this.applySession(response);
  }


  /** Asks the server to email a reset link. Returns its (always generic) message. */
  async requestPasswordReset(email: string): Promise<string> {
    const response = await firstValueFrom(
      this.api.forgotPassword({ email: email.trim().toLowerCase() })
    );
    return response.message;
  }

  async resetPassword(token: string, newPassword: string): Promise<string> {
    const response = await firstValueFrom(
      this.api.resetPassword({ token, new_password: newPassword })
    );
    return response.message;
  }

  logout(): void {
    this.currentUser.set(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      // Storage unavailable — nothing else to do.
    }
  }

  /** Retrieve the stored JWT (used by HTTP interceptors / auth guard). */
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private applySession(response: TokenResponse): User {
    const user: User = {
      id:    response.user.id,
      email: response.user.email,
      name:  response.user.full_name,
    };
    this.currentUser.set(user);
    this.persist(response.access_token, user);
    return user;
  }

  private hydrate(): void {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const raw   = localStorage.getItem(USER_KEY);
      if (token && raw) {
        this.currentUser.set(JSON.parse(raw) as User);
      }
    } catch {
      this.currentUser.set(null);
    }
  }

  private persist(token: string, user: User): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {

    }
  }
}
