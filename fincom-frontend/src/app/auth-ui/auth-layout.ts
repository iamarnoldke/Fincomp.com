import { Component, ViewEncapsulation, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterLink],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.css',
  encapsulation: ViewEncapsulation.None,
})
export class AuthLayout {
  readonly brandSide = input<'left' | 'right'>('right');
  readonly variant = input<'features' | 'benefits' | 'plain'>('features');
  readonly brandTitle = input.required<string>();
  readonly brandText = input('');

  readonly features = [
    { icon: 'loans', title: 'Compare loans', text: 'Rates and total cost side by side' },
    { icon: 'accounts', title: 'Compare accounts', text: 'Fees and requirements at a glance' },
    { icon: 'insurance', title: 'Compare insurance', text: 'Cover and premiums from each bank' },
  ];

  readonly benefits = [
    { title: 'Compare every bank', text: 'Loans, accounts and insurance in one view.' },
    { title: 'See what a loan really costs', text: 'Fees included, not just the headline rate.' },
    { title: 'Track your credit score', text: 'Your activity on Fincomp, in your dashboard.' },
  ];
}
