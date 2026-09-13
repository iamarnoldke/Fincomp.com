
import { Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AccountsViewModel } from './accounts-view-model';
import { BankLogo } from '../core/bank-logo';

@Component({
  selector: 'app-accounts',
  imports: [CurrencyPipe, RouterLink, BankLogo],
  templateUrl: './accounts.html',
  styleUrl: './accounts.css',
})
export class Accounts {
  private readonly viewModel = inject(AccountsViewModel);

  readonly selectedType = this.viewModel.selectedType;
  readonly accountTypes = this.viewModel.accountTypes;
  readonly results = this.viewModel.results;
  readonly recommended = this.viewModel.recommended;
  readonly error = this.viewModel.error;
}
