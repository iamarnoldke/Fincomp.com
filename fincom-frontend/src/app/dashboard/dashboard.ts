import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardViewModel } from './dashboard-view-model';
import { BankLogo } from '../core/bank-logo';

@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe, RouterLink, BankLogo],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly viewModel = inject(DashboardViewModel);
  private readonly platformId = inject(PLATFORM_ID);

  readonly today = this.viewModel.today;
  readonly ratesUpdated = this.viewModel.ratesUpdated;
  readonly creditScore = this.viewModel.creditScore;
  readonly potentialSavings = this.viewModel.potentialSavings;
  readonly productsCompared = this.viewModel.productsCompared;
  readonly bankCount = this.viewModel.bankCount;
  readonly activityCount = this.viewModel.activityCount;
  readonly scoreRating = this.viewModel.scoreRating;
  readonly scoreStanding = this.viewModel.scoreStanding;
  readonly circ = this.viewModel.circ;
  readonly scoreDash = this.viewModel.scoreDash;
  readonly rateBars = this.viewModel.rateBars;
  readonly bestLoan = this.viewModel.bestLoan;
  readonly recommended = this.viewModel.recommended;
  readonly activity = this.viewModel.activity;
  readonly popularLoans = this.viewModel.popularLoans;
  readonly popularInsurance = this.viewModel.popularInsurance;
  readonly loading = this.viewModel.loading;
  readonly hasData = this.viewModel.hasData;
  readonly error = this.viewModel.error;

  ngOnInit(): void {

    if (isPlatformBrowser(this.platformId)) {
      this.viewModel.load();
    }
  }

  reload(): void {
    this.viewModel.load();
  }
}
