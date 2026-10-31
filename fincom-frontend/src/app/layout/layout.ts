import { Component, HostListener, inject, signal } from '@angular/core';
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

  readonly menuOpen =   signal(false);

  navItems = signal([
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Compare loans', path: '/compare' },
    { label: 'Compare Accounts', path: '/accounts' },
    { label: 'Credit score', path: '/credit-score' },
    { label: 'Compare insurance', path: '/insurance' },
  ]);
  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu():void{
    this.menuOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape():void{
    this.closeMenu();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event):void{
    const target= event.target as Element | null;
    if (this.menuOpen() && !target?.closest('.topbar')){
      this.closeMenu();
    }
}

  logout() {
    this.closeMenu();
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
