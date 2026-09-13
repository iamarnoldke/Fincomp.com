import { Injectable, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap, tap, catchError, of } from 'rxjs';
import { FinanceData } from '../finance-data';
import { ErrorHandlerService } from '../core/error-handler.service';
import { AccountType } from '../models';
import { AccountsApiService, AccountRow } from './accounts-api.service';

@Injectable({ providedIn: 'root' })
export class AccountsViewModel {
  private readonly data = inject(FinanceData);
  private readonly api = inject(AccountsApiService);
  private readonly errorHandler = inject(ErrorHandlerService);

  readonly selectedType = signal<AccountType | 'All'>('All');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  
  readonly accountTypes = computed(
    () => ['All', ...new Set(this.data.accounts().map((a) => a.type))] as (AccountType | 'All')[]
  );

  
  readonly results = toSignal(
    toObservable(this.selectedType).pipe(
      tap(() => {
        this.loading.set(true);
        this.error.set(null);
      }),
      switchMap((selectedType) =>
        this.api.listAccounts(selectedType).pipe(
          catchError((caught) => {
            const appError = this.errorHandler.handle(caught, 'Unable to load account offers.');
            this.error.set(appError.message);
            return of<AccountRow[]>([]);
          })
        )
      ),
      tap(() => this.loading.set(false))
    ),
    { initialValue: [] as AccountRow[] }
  );

  readonly recommended = computed(() => this.results()[0] ?? null);
}