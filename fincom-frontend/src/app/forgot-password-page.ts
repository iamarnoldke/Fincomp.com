import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Auth } from './auth';
import { AuthLayout } from './auth-ui/auth-layout';

@Component({
  selector: 'app-forgot-password-page',
  imports: [FormsModule, RouterLink, AuthLayout],
  templateUrl: './forgot-password-page.html',
})
export class ForgotPasswordPage {
  private readonly auth = inject(Auth);

  email   = '';
  error   = signal('');
  loading = signal(false);

  sentTo  = signal('');

  async submit(): Promise<void> {
    this.error.set('');

    const trimmed = this.email.trim();
    if (!trimmed) {
      this.error.set('Please enter your email address.');
      return;
    }

    this.loading.set(true);
    try {
      await this.auth.requestPasswordReset(trimmed);
      this.sentTo.set(trimmed);
    } catch (caught) {
      this.error.set(caught instanceof Error ? caught.message : 'Unable to send the link right now.');
    } finally {
      this.loading.set(false);
    }
  }

  tryAgain(): void {
    this.sentTo.set('');
  }
}
