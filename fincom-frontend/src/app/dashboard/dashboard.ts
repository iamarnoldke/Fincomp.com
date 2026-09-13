import { Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardViewModel } from './dashboard-view-model';
import { BankLogo } from '../core/bank-logo';

@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe, RouterLink, BankLogo],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly viewModel = inject(DashboardViewModel);

  readonly today = this.viewModel.today;
  readonly creditScore = this.viewModel.creditScore;
  readonly potentialSavings = this.viewModel.potentialSavings;
  readonly productsCompared = this.viewModel.productsCompared;
  readonly bankCount = this.viewModel.bankCount;
  readonly scoreRating = this.viewModel.scoreRating;
  readonly circ = this.viewModel.circ;
  readonly scoreDash = this.viewModel.scoreDash;
  readonly rateBars = this.viewModel.rateBars;
  readonly bestLoan = this.viewModel.bestLoan;
  readonly recommended = this.viewModel.recommended;
  readonly activity = this.viewModel.activity;
  readonly popularLoans = this.viewModel.popularLoans;
  readonly popularInsurance = this.viewModel.popularInsurance;
  readonly error = this.viewModel.error;
}
