import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Auth } from './auth';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {
  private readonly router = inject(Router);
  private readonly auth = inject(Auth);

  constructor() {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  email    = '';
  password = '';
  error    = '';
  loading  = signal(false);

  async submit(): Promise<void> {
    this.error = '';

    const trimmedEmail = this.email.trim();
    if (!trimmedEmail || !this.password.trim()) {
      this.error = 'Please enter both your email and password.';
      return;
    }

    this.loading.set(true);
    try {
      await this.auth.login(trimmedEmail, this.password);
      this.router.navigate(['/dashboard']);
    } catch (caught) {
      this.error = caught instanceof Error ? caught.message : 'Unable to sign you in right now.';
    } finally {
      this.loading.set(false);
    }
  }
}