import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Auth } from './auth';
import { AuthLayout } from './auth-ui/auth-layout';
import { PasswordField } from './auth-ui/password-field';

const MIN_PASSWORD_LENGTH = 8;

@Component({
  selector: 'app-signup-page',
  imports: [FormsModule, RouterLink, AuthLayout, PasswordField],
  templateUrl: './signup-page.html',
})
export class SignupPage {
  private readonly router = inject(Router);
  private readonly auth = inject(Auth);

  constructor() {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  name     = '';
  email    = '';
  password = '';
  error    = signal('');
  loading  = signal(false);

  async submit(): Promise<void> {
    this.error.set('');

    const trimmedName  = this.name.trim();
    const trimmedEmail = this.email.trim();
    if (!trimmedName || !trimmedEmail || !this.password.trim()) {
      this.error.set('Please complete all fields to create your account.');
      return;
    }
    if (this.password.length < MIN_PASSWORD_LENGTH) {
      this.error.set(`Your password needs at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    this.loading.set(true);
    try {
      await this.auth.registerAccount(trimmedName, trimmedEmail, this.password);
      this.router.navigate(['/dashboard']);
    } catch (caught) {
      this.error.set(caught instanceof Error ? caught.message : 'Unable to create your account.');
    } finally {
      this.loading.set(false);
    }
  }
}
