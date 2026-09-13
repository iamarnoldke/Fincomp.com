import { Component, computed, inject, signal } from '@angular/core';

import { CreditScoreDataService } from './credit-score-data.service';

@Component({
  selector: 'app-credit-score',
  imports: [],
  templateUrl: './credit-score.html',
  styleUrl: './credit-score.css',
})
export class CreditScore {
  private readonly dataService = inject(CreditScoreDataService);

  readonly loading = this.dataService.loading;
  readonly error = this.dataService.error;
  readonly profile = this.dataService.profile;
  readonly score = computed(() => this.profile()?.score ?? this.dataService.score());

  constructor() {
    void this.dataService.loadProfile();
  }

  readonly fraction = computed(() => (this.score() - 300) / (850 - 300));

  readonly rating = computed(() => {
    const s = this.score();
    if (s >= 750) return { label: 'Excellent', color: 'var(--success)' };
    if (s >= 670) return { label: 'Good', color: 'var(--brand)' };
    if (s >= 580) return { label: 'Fair', color: 'var(--warning)' };
    return { label: 'Poor', color: 'var(--danger)' };
  });

  readonly factors = computed(() => this.profile()?.factors ?? []);
  readonly eligible = computed(() => this.profile()?.eligible ?? []);
  readonly summary = computed(() => this.profile()?.summary ?? null);

  readonly circ = 2 * Math.PI * 80;
  readonly dash = computed(() => this.fraction() * this.circ);

  refresh(): void {
    void this.dataService.refresh();
  }
}
