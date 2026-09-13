import { Component, computed, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoansViewModel } from './loans-view-model';
import { BankLogo } from '../core/bank-logo';

@Component({
  selector: 'app-loans',
  imports: [CurrencyPipe, FormsModule, BankLogo],
  templateUrl: './loans.html',
  styleUrl: './loans.css',
})
export class Loans {
  private readonly viewModel = inject(LoansViewModel);

  readonly amount = this.viewModel.amount;
  readonly term = this.viewModel.term;
  readonly loanType = this.viewModel.loanType;
  readonly loanQuery = this.viewModel.loanQuery;
  readonly loanTypes = this.viewModel.loanTypes;
  readonly typeInfo = this.viewModel.typeInfo;
  readonly results = this.viewModel.results;
  readonly saving = this.viewModel.saving;
  readonly recommended = this.viewModel.recommended;
  readonly error = this.viewModel.error;

  protected readonly hasError = computed(() => Boolean(this.error()));
}
