import { Injectable, computed, inject, signal } from '@angular/core';
import { FinanceData } from '../finance-data';
import { ErrorHandlerService } from '../core/error-handler.service';

@Injectable({ providedIn: 'root' })
export class DashboardViewModel {
  private readonly data = inject(FinanceData);
  private readonly errorHandler = inject(ErrorHandlerService);

  readonly today = 'Today';
  readonly creditScore = signal(712);
  readonly error = signal<string | null>(null);

  private readonly sampleAmount = 20_000_000;
  private readonly sampleTerm = 24;

  private totalCost(rate: number): number {
    const r = rate / 100 / 12;
    const n = this.sampleTerm;
    const p = this.sampleAmount;
    const m = r === 0 ? p / n : (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return m * n;
  }

  readonly potentialSavings = computed(() => {
    try {
      const costs = this.data.loans().map((l) => this.totalCost(l.annualRate));
      return Math.max(...costs) - Math.min(...costs);
    } catch (caught) {
      const appError = this.errorHandler.handle(caught, 'Unable to calculate dashboard savings.');
      this.error.set(appError.message);
      return 0;
    }
  });

  readonly productsCompared = computed(() => this.data.loans().length + this.data.accounts().length);
  readonly bankCount = computed(() => this.data.banks().length);

  readonly scoreRating = computed(() => {
    const s = this.creditScore();
    if (s >= 750) return 'Excellent';
    if (s >= 670) return 'Good';
    if (s >= 580) return 'Fair';
    return 'Poor';
  });

  readonly circ = 2 * Math.PI * 52;
  readonly scoreDash = computed(() => ((this.creditScore() - 300) / 550) * this.circ);

  readonly rateBars = computed(() => {
    try {
      const loans = [...this.data.loans()].sort((a, b) => a.annualRate - b.annualRate);
      const max = Math.max(...loans.map((l) => l.annualRate));
      return loans.map((l, i) => ({
        bankId: l.bankId,
        bank: this.data.bankName(l.bankId),
        rate: l.annualRate,
        pct: (l.annualRate / max) * 100,
        best: i === 0,
      }));
    } catch (caught) {
      const appError = this.errorHandler.handle(caught, 'Unable to load rate comparison.');
      this.error.set(appError.message);
      return [];
    }
  });

  readonly bestLoan = computed(() => this.rateBars()[0] ?? { bankId: '', bank: 'No data', rate: 0, pct: 0, best: false });

  readonly recommended = computed(() =>
    [...this.data.loans()]
      .sort((a, b) => a.annualRate - b.annualRate)
      .slice(0, 4)
      .map((l) => ({ bankId: l.bankId, bank: this.data.bankName(l.bankId), name: l.name, rate: l.annualRate }))
  );

  readonly activity = signal([
    { text: 'Compared 8 personal loans', when: '2h ago', kind: 'compare' },
    { text: 'Credit score updated to 712', when: '1d ago', kind: 'score' },
    { text: 'Saved dfcu Smart Plan account', when: '2d ago', kind: 'save' },
    { text: 'Applied for Stanchart Personal Loan', when: '4d ago', kind: 'apply' },
  ]);

  readonly popularLoans = computed(() =>
    [...this.data.loans()]
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 5)
      .map((l) => ({
        bank: this.data.bankName(l.bankId),
        name: l.name,
        type: l.type,
        rate: l.annualRate,
        popularity: l.popularity,
      }))
  );

  readonly popularInsurance = computed(() =>
    [...this.data.insurancePolicies()]
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 5)
      .map((p) => ({
        bank: this.data.bankName(p.bankId),
        name: p.name,
        type: p.type,
        insurer: p.insurer,
        popularity: p.popularity,
      }))
  );
}
