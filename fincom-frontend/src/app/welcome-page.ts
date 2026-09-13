import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { Auth } from './auth';

@Component({
  selector: 'app-welcome-page',
  imports: [RouterLink],
  templateUrl: './welcome-page.html',
  styleUrl: './welcome-page.css',
})
export class WelcomePage {
  private readonly router = inject(Router);
  private readonly auth = inject(Auth);

  readonly isLoggedIn = this.auth.isLoggedIn;

  continueToApp(): void {
    this.router.navigate([this.isLoggedIn() ? '/dashboard' : '/login']);
  }
}
