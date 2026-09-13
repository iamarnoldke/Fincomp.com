import { Component, computed, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InsuranceViewModel } from './insurance-view-model';
import { BankLogo } from '../core/bank-logo';

@Component({
  selector: 'app-insurance',
  imports: [CurrencyPipe, FormsModule, BankLogo],
  templateUrl: './insurance.html',
  styleUrl: './insurance.css',
})
export class Insurance {
  private readonly viewModel = inject(InsuranceViewModel);

  readonly cover = this.viewModel.cover;
  readonly insuranceType = this.viewModel.insuranceType;
  readonly insuranceQuery = this.viewModel.insuranceQuery;
  readonly insuranceTypes = this.viewModel.insuranceTypes;
  readonly typeInfo = this.viewModel.typeInfo;
  readonly results = this.viewModel.results;
  readonly saving = this.viewModel.saving;
  readonly recommended = this.viewModel.recommended;
  readonly error = this.viewModel.error;

  protected readonly hasError = computed(() => Boolean(this.error()));
}
