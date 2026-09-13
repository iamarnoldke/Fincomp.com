import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Auth } from './auth';

@Component({
  selector: 'app-signup-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './signup-page.html',
  styleUrl: './signup-page.css',
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
  error    = '';
  loading  = signal(false);

  async submit(): Promise<void> {
    this.error = '';

    const trimmedName  = this.name.trim();
    const trimmedEmail = this.email.trim();
    if (!trimmedName || !trimmedEmail || !this.password.trim()) {
      this.error = 'Please complete all fields to create your account.';
      return;
    }

    this.loading.set(true);
    try {
      await this.auth.registerAccount(trimmedName, trimmedEmail, this.password);
      this.router.navigate(['/dashboard']);
    } catch (caught) {
      this.error = caught instanceof Error ? caught.message : 'Unable to create your account.';
    } finally {
      this.loading.set(false);
    }
  }
}