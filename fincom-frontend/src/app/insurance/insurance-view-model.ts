import { Injectable, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, debounceTime, switchMap, tap, catchError, of } from 'rxjs';
import { FinanceData } from '../finance-data';
import { ErrorHandlerService } from '../core/error-handler.service';
import { InsuranceType } from '../models';
import { InsuranceApiService, InsuranceRow } from './insurance-api.service';

@Injectable({ providedIn: 'root' })
export class InsuranceViewModel {
  private readonly data = inject(FinanceData);
  private readonly api = inject(InsuranceApiService);
  private readonly errorHandler = inject(ErrorHandlerService);

  readonly cover = signal(20_000_000);
  readonly insuranceType = signal<InsuranceType>('Motor');
  readonly insuranceQuery = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly insuranceTypes = computed(
    () => [...new Set(this.data.insurancePolicies().map((p) => p.type))] as InsuranceType[]
  );

  readonly typeInfo: Record<InsuranceType, string> = {
    Motor: 'Comprehensive and third-party motor cover offered through bank-partnered insurers.',
    Health: 'Medical insurance bundled by banks for inpatient, outpatient, and maternity needs.',
    Life: 'Life and disability cover, often bundled with loans or offered as standalone protection.',
    Home: 'Property and home content cover against fire, burglary, and other perils.',
    Travel: 'Short-term travel cover for medical emergencies, delays, and lost baggage abroad.',
    Agriculture: 'Crop and livestock cover protecting farmers against weather and disease losses.',
  };

  
  readonly results = toSignal(
    combineLatest([
      toObservable(this.cover),
      toObservable(this.insuranceType),
      toObservable(this.insuranceQuery),
    ]).pipe(
      debounceTime(300),
      tap(() => {
        this.loading.set(true);
        this.error.set(null);
      }),
      switchMap(([cover, insuranceType, insuranceQuery]) =>
        this.api.compareInsurance(cover, insuranceType, insuranceQuery).pipe(
          catchError((caught) => {
            const appError = this.errorHandler.handle(
              caught,
              'Unable to compare insurance policies right now.'
            );
            this.error.set(appError.message);
            return of<InsuranceRow[]>([]);
          })
        )
      ),
      tap(() => this.loading.set(false))
    ),
    { initialValue: [] as InsuranceRow[] }
  );

  readonly saving = computed(() => {
    const ranked = this.results();
    return ranked.length < 2 ? 0 : ranked[ranked.length - 1].annualPremium - ranked[0].annualPremium;
  });

  readonly recommended = computed(() => this.results()[0] ?? null);
}