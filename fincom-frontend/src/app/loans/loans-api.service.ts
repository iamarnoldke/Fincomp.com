import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { API_BASE_URL } from '../core/api-config';
import { LoanType } from '../models';


interface BankOutDto {
  id: string;
  name: string;
  short_code: string;
  logo_url: string | null;
}

interface LoanProductOutDto {
  id: string;
  name: string;
  category_slug: string;
  annual_rate_pct: number;
  max_amount: number;
  min_term_months: number;
  max_term_months: number;
  processing_fee_pct: number;
  min_credit_score: number | null;
  requires_collateral: boolean;
  popularity: number;
  bank: BankOutDto;
}

interface LoanCompareResultDto {
  product: LoanProductOutDto;
  monthly_payment: number;
  total_repayable: number;
  processing_fee_amount: number;
  total_cost: number;
  is_recommended: boolean;
  savings_vs_this: number | null;
}

export interface LoanCompareRow {
  bankId: string;
  bank: string;
  name: string;
  annualRate: number;
  monthly: number;
  totalRepay: number;
  fee: number;
  totalCost: number;
  collateral: boolean;
  minScore: number | null;
  maxAmount: number;
  phone?: string;
  email?: string;
  contactUrl?: string;
}


const LOAN_TYPE_TO_SLUG: Record<LoanType, string> = {
  Personal: 'personal',
  Salary: 'salary',
  Home: 'home',
  Business: 'business',
  'Asset Finance': 'asset_finance',
  Agriculture: 'agriculture',
  Education: 'education',
};

@Injectable({ providedIn: 'root' })
export class LoansApiService {
  private readonly http = inject(HttpClient);

  compareLoans(
    amount: number,
    termMonths: number,
    loanType: LoanType,
    search: string
  ): Observable<LoanCompareRow[]> {
    let params = new HttpParams()
      .set('amount', amount)
      .set('term_months', termMonths);

    const trimmedSearch = search.trim();
    if (trimmedSearch) {
      params = params.set('search', trimmedSearch);
    } else {
      params = params.set('category', LOAN_TYPE_TO_SLUG[loanType]);
    }

    return this.http
      .get<LoanCompareResultDto[]>(`${API_BASE_URL}/loans/compare`, {
        params,
        headers: { 'ngrok-skip-browser-warning': 'true'}
     })
      .pipe(
        map((results) =>
          results.map((r) => ({
            bankId: r.product.bank.id,
            bank: r.product.bank.name,
            name: r.product.name,
            annualRate: r.product.annual_rate_pct,
            monthly: r.monthly_payment,
            totalRepay: r.total_repayable,
            fee: r.processing_fee_amount,
            totalCost: r.total_cost,
            collateral: r.product.requires_collateral,
            minScore: r.product.min_credit_score,
            maxAmount: r.product.max_amount,
          }))
        ),
        catchError((err: HttpErrorResponse) => {

          if (err.status === 404) {
            return of([]);
          }
          return throwError(() => err);
        })
      );
  }
}
