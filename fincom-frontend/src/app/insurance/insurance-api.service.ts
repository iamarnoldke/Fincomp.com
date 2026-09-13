import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { API_BASE_URL } from '../core/api-config';
import { InsuranceType } from '../models';


interface BankOutDto {
  id: string;
  name: string;
  short_code: string;
  logo_url: string | null;
}

interface InsuranceBenefitOutDto {
  benefit_text: string;
}

interface InsuranceProductOutDto {
  id: string;
  name: string;
  insurance_type_slug: string;
  underwriter_name: string;
  min_cover_amount: number;
  max_cover_amount: number;
  premium_rate_pct: number;
  excess_pct: number;
  claim_settlement_days: number | null;
  popularity: number;
  bank: BankOutDto;
  benefits: InsuranceBenefitOutDto[];
}

interface InsuranceCompareResultDto {
  product: InsuranceProductOutDto;
  annual_premium: number;
  excess_amount: number;
  is_recommended: boolean;
}

interface InsuranceCompareResponseDto {
  results: InsuranceCompareResultDto[];
  saving: number;
}


export interface InsuranceRow {
  bankId: string;
  bank: string;
  name: string;
  insurer: string;
  annualPremium: number;
  excessAmount: number;
  minCover: number;
  maxCover: number;
  claimSettlementDays: number | null;
  benefits: string[];
}


const INSURANCE_TYPE_TO_SLUG: Record<InsuranceType, string> = {
  Motor: 'motor',
  Health: 'health',
  Life: 'life',
  Home: 'home',
  Travel: 'travel',
  Agriculture: 'agriculture',
};

@Injectable({ providedIn: 'root' })
export class InsuranceApiService {
  private readonly http = inject(HttpClient);

  compareInsurance(
    cover: number,
    insuranceType: InsuranceType,
    search: string
  ): Observable<InsuranceRow[]> {
    let params = new HttpParams().set('cover', cover);

    const trimmedSearch = search.trim();
    if (trimmedSearch) {
      
      params = params.set('search', trimmedSearch);
    } else {
      params = params.set('insurance_type', INSURANCE_TYPE_TO_SLUG[insuranceType]);
    }

    return this.http
      .get<InsuranceCompareResponseDto>(`${API_BASE_URL}/insurance/compare`, { params })
      .pipe(
        map((response) =>
          response.results.map((r) => ({
            bankId: r.product.bank.id,
            bank: r.product.bank.name,
            name: r.product.name,
            insurer: r.product.underwriter_name,
            annualPremium: r.annual_premium,
            excessAmount: r.excess_amount,
            minCover: r.product.min_cover_amount,
            maxCover: r.product.max_cover_amount,
            claimSettlementDays: r.product.claim_settlement_days,
            benefits: r.product.benefits.map((b) => b.benefit_text),
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