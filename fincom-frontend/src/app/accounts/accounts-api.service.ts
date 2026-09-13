import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../core/api-config';
import { AccountType } from '../models';


interface BankOutDto {
  id: string;
  name: string;
  short_code: string;
  logo_url: string | null;
}

interface AccountRequirementOutDto {
  requirement_text: string;
}

interface AccountProductOutDto {
  id: string;
  name: string;
  account_type_slug: string;
  min_opening_balance: number;
  min_balance: number;
  monthly_fee: number;
  withdrawal_fee: number;
  interest_rate_pa: number;
  bank: BankOutDto;
  requirements: AccountRequirementOutDto[];
}

interface AccountResultDto {
  product: AccountProductOutDto;
  value_score: number;
  is_recommended: boolean;
}


export interface AccountRow {
  bankId: string;
  bank: string;
  name: string;
  type: AccountType;
  minOpeningBalance: number;
  minBalance: number;
  monthlyFee: number;
  withdrawalFee: number;
  savingsRate: number;
  requirements: string[];
}


const ACCOUNT_TYPE_TO_SLUG: Record<AccountType, string> = {
  Savings: 'savings',
  Current: 'current',
  'Fixed Deposit': 'fixed_deposit',
  Student: 'student',
  Salary: 'salary',
  Business: 'business',
};

const SLUG_TO_ACCOUNT_TYPE: Record<string, AccountType> = Object.fromEntries(
  Object.entries(ACCOUNT_TYPE_TO_SLUG).map(([label, slug]) => [slug, label as AccountType])
);

@Injectable({ providedIn: 'root' })
export class AccountsApiService {
  private readonly http = inject(HttpClient);

  listAccounts(selectedType: AccountType | 'All'): Observable<AccountRow[]> {
    let params = new HttpParams();
    if (selectedType !== 'All') {
      params = params.set('account_type', ACCOUNT_TYPE_TO_SLUG[selectedType]);
    }

    return this.http
      .get<AccountResultDto[]>(`${API_BASE_URL}/accounts`, { params })
      .pipe(
        map((results) =>
          results.map((r) => ({
            bankId: r.product.bank.id,
            bank: r.product.bank.name,
            name: r.product.name,
            type: SLUG_TO_ACCOUNT_TYPE[r.product.account_type_slug],
            minOpeningBalance: r.product.min_opening_balance,
            minBalance: r.product.min_balance,
            monthlyFee: r.product.monthly_fee,
            withdrawalFee: r.product.withdrawal_fee,
            savingsRate: r.product.interest_rate_pa,
            requirements: r.product.requirements.map((req) => req.requirement_text),
          }))
        )
      );
  }
}