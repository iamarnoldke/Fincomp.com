import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { ErrorHandlerService } from '../core/error-handler.service';
import { DashboardApiService, DashboardSummary } from './dashboard-api.service';


export function timeAgo(when: Date, now: Date = new Date()): string {
  const minutes = Math.floor((now.getTime() - when.getTime()) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return when.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

@Injectable({ providedIn: 'root' })
export class DashboardViewModel {
  private readonly api = inject(DashboardApiService);
  private readonly errorHandler = inject(ErrorHandlerService);


  readonly summary = signal<DashboardSummary | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly hasData = computed(() => this.summary() !== null);


  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getSummary().subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.loading.set(false);
      },
      error: (caught) => {
        const message =
          caught instanceof HttpErrorResponse && caught.status === 401
            ? 'Your session has expired. Please log out and log in again.'
            : this.errorHandler.handle(caught, 'Unable to load live dashboard data.').message;
        this.error.set(message);
        this.loading.set(false);
      },
    });
  }


  readonly today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  readonly ratesUpdated = computed(() => {
    const when = this.summary()?.ratesLastUpdated;
    return when
      ? when.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : '';
  });


  readonly creditScore = computed<number | null>(() => this.summary()?.creditScore ?? null);
  readonly potentialSavings = computed(() => this.summary()?.potentialSavings ?? 0);
  readonly productsCompared = computed(() => this.summary()?.productsCompared ?? 0);
  readonly bankCount = computed(() => this.summary()?.bankCount ?? 0);
  readonly activityCount = computed(() => this.summary()?.activityCount30d ?? 0);

  readonly scoreRating = computed(() => {
    const s = this.creditScore();
    if (s === null) return 'No score yet';
    if (s >= 750) return 'Excellent';
    if (s >= 670) return 'Good';
    if (s >= 580) return 'Fair';
    return 'Poor';
  });

  readonly scoreStanding = computed(() =>
    this.creditScore() === null ? 'Not checked yet' : `${this.scoreRating()} standing`
  );

  readonly circ = 2 * Math.PI * 52;
  readonly scoreDash = computed(() => {
    const s = this.creditScore();
    return s === null ? 0 : ((s - 300) / 550) * this.circ;
  });


  readonly rateBars = computed(() => {
    const rates = this.summary()?.rates ?? [];
    const max = Math.max(...rates.map((r) => r.rate), 0);
    return rates.map((r, i) => ({
      id: r.id,
      bankId: r.bankId,
      bank: r.bank,
      name: r.name,
      rate: r.rate,
      pct: max > 0 ? (r.rate / max) * 100 : 0,
      best: i === 0,
    }));
  });

  readonly bestLoan = computed(
    () => this.rateBars()[0] ?? { id: '', bankId: '', bank: 'No data', name: '', rate: 0, pct: 0, best: false }
  );

  readonly recommended = computed(() =>
    (this.summary()?.rates ?? []).slice(0, 4).map((r) => ({
      id: r.id,
      bankId: r.bankId,
      bank: r.bank,
      name: r.name,
      rate: r.rate,
    }))
  );


  readonly popularLoans = computed(() =>
    (this.summary()?.popularLoans ?? []).map((p) => ({
      id: p.id,
      bank: p.bank,
      name: p.name,
      type: p.category,
      rate: p.rate,
      popularity: p.popularity,
    }))
  );

  readonly popularInsurance = computed(() =>
    (this.summary()?.popularInsurance ?? []).map((p) => ({
      id: p.id,
      bank: p.bank,
      name: p.name,
      type: p.category,
      insurer: p.insurer,
      popularity: p.popularity,
    }))
  );


  readonly activity = computed(() =>
    (this.summary()?.activity ?? []).map((a) => ({
      kind: a.kind,
      text: a.text,
      when: timeAgo(a.occurredAt),
    }))
  );
}
