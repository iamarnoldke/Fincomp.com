import { Injectable, inject, signal } from '@angular/core';
import { ErrorHandlerService } from '../core/error-handler.service';
import { API_BASE_URL } from '../core/api-config';
import { Auth } from '../auth';

export interface CreditScoreFactor {
  label: string;
  weight: string;
  status: 'good' | 'fair' | 'poor';
}

export interface CreditScoreEligibleItem {
  bank: string;
  name: string;
  rate: number;
}

export interface CreditScoreSummary {
  label: string;
  message: string;
  trend: string;
}

export interface CreditScoreProfile {
  score: number;
  summary: CreditScoreSummary;
  factors: CreditScoreFactor[];
  eligible: CreditScoreEligibleItem[];
}

// Shape the backend actually returns
interface BackendProfile {
  score: number;
  summary: { label: string; message: string; trend: string };
  factors: { label: string; weight: string; status: string }[];
  eligible: { bank_name: string; loan_name: string; annual_rate_pct: number }[];
}

@Injectable({ providedIn: 'root' })
export class CreditScoreDataService {
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly auth = inject(Auth);

  readonly profile = signal<CreditScoreProfile | null>(null);
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);
  readonly score = signal(0);

  async loadProfile(): Promise<CreditScoreProfile> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const profile = await this.fetchFromBackend('/credit-score/me', 'GET');
      this.storeProfile(profile);
      return profile;
    } catch (error) {
      const appError = this.errorHandler.handle(error, 'Unable to load credit score.');
      this.error.set(appError.message);
      const fallback = this.defaultProfile();
      this.storeProfile(fallback);
      return fallback;
    } finally {
      this.loading.set(false);
    }
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const profile = await this.fetchFromBackend('/credit-score/refresh', 'POST');
      this.storeProfile(profile);
    } catch (error) {
      const appError = this.errorHandler.handle(error, 'Unable to refresh credit score.');
      this.error.set(appError.message);
    } finally {
      this.loading.set(false);
    }
  }

  private async fetchFromBackend(path: string, method: string): Promise<CreditScoreProfile> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.auth.getToken()}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    });
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    const raw: BackendProfile = await res.json();
    // Map backend field names to frontend field names
    return {
      score: raw.score,
      summary: raw.summary,
      factors: raw.factors.map(f => ({
        label: f.label,
        weight: f.weight,
        status: f.status as 'good' | 'fair' | 'poor',
      })),
      eligible: raw.eligible.map(e => ({
        bank: e.bank_name,
        name: e.loan_name,
        rate: e.annual_rate_pct,
      })),
    };
  }

  private storeProfile(profile: CreditScoreProfile): void {
    this.profile.set(profile);
    this.score.set(profile.score);
  }

  private defaultProfile(): CreditScoreProfile {
    return {
      score: 712,
      summary: { label: 'Good', message: 'You are in a strong position to borrow.', trend: '+0 pts' },
      factors: [
        { label: 'Payment history', weight: 'On time', status: 'good' },
        { label: 'Credit utilisation', weight: '28% used', status: 'good' },
        { label: 'Credit age', weight: '4 yrs', status: 'fair' },
        { label: 'Credit mix', weight: '2 types', status: 'fair' },
        { label: 'Recent enquiries', weight: '1 recent', status: 'good' },
      ],
      eligible: [
        { bank: 'Stanbic Bank', name: 'Personal Loan', rate: 21 },
        { bank: 'Absa Bank', name: 'Salary Loan', rate: 20.5 },
        { bank: 'dfcu Bank', name: 'Asset Finance', rate: 17.5 },
      ],
    };
  }
}
