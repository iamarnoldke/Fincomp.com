import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { FinanceData } from '../finance-data';
import { ErrorHandlerService } from '../core/error-handler.service';
import { LoansApiService, LoanCompareRow } from './loans-api.service';
import { LoanType } from '../models';

@Injectable({ providedIn: 'root' })
export class LoansViewModel {
  private readonly data = inject(FinanceData);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly loansApi = inject(LoansApiService);

  readonly amount = signal(20_000_000);
  readonly term = signal(24);
  readonly loanType = signal<LoanType>('Personal');
  readonly loanQuery = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly rawResults = signal<LoanCompareRow[]>([]);

  readonly loanTypes = signal<LoanType[]>([
    'Personal', 'Salary', 'Home', 'Business',
    'Asset Finance', 'Agriculture', 'Education'
  ]);

  readonly typeInfo: Record<LoanType, string> = {
    Personal: 'Common personal loans in Uganda for school fees, medical costs, weddings, and household needs.',
    Salary: 'Salary-backed loans are popular for salaried workers who want faster approval and smaller paperwork.',
    Home: 'Mortgage-style home financing is widely used to buy, build, or improve a family home.',
    Business: 'SME and trading loans are common for stock, working capital, and business expansion.',
    'Asset Finance': 'Asset financing is popular for vehicles, machinery, and equipment purchases.',
    Agriculture: 'Farmers often use agriculture loans for seeds, inputs, equipment, and seasonal cash flow.',
    Education: 'Education loans are commonly used for tuition, school fees, and study-related expenses.',
  };

  constructor() {
    effect(() => {
      const amount = this.amount();
      const term = this.term();
      const loanType = this.loanType();
      const search = this.loanQuery();
      this.fetchLoans(amount, term, loanType, search);
    });
  }

  private fetchLoans(amount: number, term: number, loanType: LoanType, search: string) {
    this.loading.set(true);
    this.error.set(null);
    this.loansApi.compareLoans(amount, term, loanType, search).subscribe({
      next: (rows) => {
        this.rawResults.set(rows);
        this.loading.set(false);
      },
      error: (err) => {
        const appError = this.errorHandler.handle(err, 'Unable to compare loans right now.');
        this.error.set(appError.message);
        this.loading.set(false);
      }
    });
  }

  readonly results = computed(() => {
    return this.rawResults().map(r => ({
      ...r,
      bank: r.bank ?? this.data.bankName(r.bankId),
      logoUrl: this.data.bankLogo(r.bankId),
      contactUrl: r.contactUrl ?? this.data.bankContactUrl(r.bankId),
      phone: r.phone ?? this.data.bankPhone(r.bankId),
      email: r.email ?? this.data.bankEmail(r.bankId),
    }));
  });

  readonly saving = computed(() => {
    const ranked = this.results();
    return ranked.length < 2 ? 0 : ranked[ranked.length - 1].totalCost - ranked[0].totalCost;
  });

  readonly recommended = computed(() => this.results()[0] ?? null);
}
