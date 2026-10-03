import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../core/api-config';


interface RateBarDto {
  id: string;
  bank_id: string;
  bank_name: string;
  product_name: string;
  category_slug: string;
  annual_rate_pct: number;
}

interface PopularLoanDto {
  id: string;
  bank_id: string;
  bank_name: string;
  name: string;
  category_slug: string;
  annual_rate_pct: number;
  popularity: number;
}

interface PopularInsuranceDto {
  id: string;
  bank_id: string;
  bank_name: string;
  name: string;
  insurance_type_slug: string;
  underwriter_name: string;
  popularity: number;
}

interface ActivityDto {
  kind: string;
  description: string;
  occurred_at: string;
}

interface DashboardSummaryDto {
  generated_at: string;
  rates_last_updated: string | null;
  bank_count: number;
  loan_product_count: number;
  account_product_count: number;
  insurance_product_count: number;
  products_compared: number;
  sample_amount: number;
  sample_term_months: number;
  potential_savings: number;
  credit_score: number | null;
  activity_count_30d: number;
  rate_bars: RateBarDto[];
  popular_loans: PopularLoanDto[];
  popular_insurance: PopularInsuranceDto[];
  recent_activity: ActivityDto[];
}


export interface DashboardRate {
  id: string;
  bankId: string;
  bank: string;
  name: string;
  category: string;
  rate: number;
}

export interface DashboardPopularLoan {
  id: string;
  bank: string;
  name: string;
  category: string;
  rate: number;
  popularity: number;
}

export interface DashboardPopularInsurance {
  id: string;
  bank: string;
  name: string;
  category: string;
  insurer: string;
  popularity: number;
}

export interface DashboardActivity {
  kind: string;
  text: string;
  occurredAt: Date;
}

export interface DashboardSummary {
  generatedAt: Date;
  ratesLastUpdated: Date | null;
  bankCount: number;
  productsCompared: number;
  potentialSavings: number;
  creditScore: number | null;
  activityCount30d: number;
  rates: DashboardRate[];
  popularLoans: DashboardPopularLoan[];
  popularInsurance: DashboardPopularInsurance[];
  activity: DashboardActivity[];
}

/** 'asset_finance' -> 'Asset Finance' */
export function slugToLabel(slug: string): string {
  return slug
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly http = inject(HttpClient);

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummaryDto>(`${API_BASE_URL}/dashboard/summary`).pipe(
      map((dto) => ({
        generatedAt: new Date(dto.generated_at),
        ratesLastUpdated: dto.rates_last_updated ? new Date(dto.rates_last_updated) : null,
        bankCount: dto.bank_count,
        productsCompared: dto.products_compared,
        potentialSavings: dto.potential_savings,
        creditScore: dto.credit_score,
        activityCount30d: dto.activity_count_30d,
        rates: dto.rate_bars.map((r) => ({
          id: r.id,
          bankId: r.bank_id,
          bank: r.bank_name,
          name: r.product_name,
          category: slugToLabel(r.category_slug),
          rate: r.annual_rate_pct,
        })),
        popularLoans: dto.popular_loans.map((p) => ({
          id: p.id,
          bank: p.bank_name,
          name: p.name,
          category: slugToLabel(p.category_slug),
          rate: p.annual_rate_pct,
          popularity: p.popularity,
        })),
        popularInsurance: dto.popular_insurance.map((p) => ({
          id: p.id,
          bank: p.bank_name,
          name: p.name,
          category: slugToLabel(p.insurance_type_slug),
          insurer: p.underwriter_name,
          popularity: p.popularity,
        })),
        activity: dto.recent_activity.map((a) => ({
          kind: a.kind,
          text: a.description,
          occurredAt: new Date(a.occurred_at),
        })),
      }))
    );
  }
}
