import { Component, afterNextRender, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Auth } from './auth';
import { AuthLayout } from './auth-ui/auth-layout';
import { PasswordField } from './auth-ui/password-field';

const MIN_PASSWORD_LENGTH = 8;

@Component({
  selector: 'app-reset-password-page',
  imports: [FormsModule, RouterLink, AuthLayout, PasswordField],
  templateUrl: './reset-password-page.html',
})
export class ResetPasswordPage {
  private readonly auth = inject(Auth);
  private readonly route = inject(ActivatedRoute);

  password = '';
  error    = signal('');
  loading  = signal(false);
  done     = signal(false);

  ready = signal(false);
  token = signal('');

  constructor() {
    afterNextRender(() => {
      this.token.set(this.route.snapshot.queryParamMap.get('token') ?? '');
      this.ready.set(true);
    });
  }

  async submit(): Promise<void> {
    this.error.set('');

    if (this.password.length < MIN_PASSWORD_LENGTH) {
      this.error.set(`Your password needs at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    this.loading.set(true);
    try {
      await this.auth.resetPassword(this.token(), this.password);
      this.done.set(true);
    } catch (caught) {
      this.error.set(caught instanceof Error ? caught.message : 'Unable to change your password right now.');
    } finally {
      this.loading.set(false);
    }
  }
}
