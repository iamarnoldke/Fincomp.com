import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../auth';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  private router = inject(Router);
  private auth = inject(Auth);

  readonly isLoggedIn = this.auth.isLoggedIn;
  readonly user = this.auth.user;

  navItems = signal([
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Compare loans', path: '/compare' },
    { label: 'Open an account', path: '/accounts' },
    { label: 'Credit score', path: '/credit-score' },
    { label: 'Compare insurance', path: '/insurance' },
  ]);

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
