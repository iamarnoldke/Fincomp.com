import { Routes } from '@angular/router';

import { authGuard } from './auth.guard';
import { Layout } from './layout/layout';

export const routes: Routes = [
  { path: '', redirectTo: 'welcome', pathMatch: 'full' },
  { path: 'welcome', loadComponent: () => import('./welcome-page').then((m) => m.WelcomePage) },
  { path: 'login', loadComponent: () => import('./login-page').then((m) => m.LoginPage) },
  { path: 'signup', loadComponent: () => import('./signup-page').then((m) => m.SignupPage) },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: 'compare', loadComponent: () => import('./loans/loans').then((m) => m.Loans) },
      { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard').then((m) => m.Dashboard) },
      { path: 'loans', loadComponent: () => import('./loans/loans').then((m) => m.Loans) },
      { path: 'accounts', loadComponent: () => import('./accounts/accounts').then((m) => m.Accounts) },
      { path: 'credit-score', loadComponent: () => import('./credit-score/credit-score').then((m) => m.CreditScore) },
      { path: 'insurance', loadComponent: () => import('./insurance/insurance').then((m) => m.Insurance) },
    ],
  },
  { path: '**', redirectTo: 'welcome' },
];
