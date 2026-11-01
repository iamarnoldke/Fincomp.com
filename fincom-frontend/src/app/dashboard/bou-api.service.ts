import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api-config';

export interface BouRate {
  metric: string;
  title: string;
  current: string;
  previous: string | null;
  change_pct_points: number | null;
}

export interface BouBank {
  bank_id: string;
  bank_name: string;
  rates: BouRate[];
}

export interface BouSummary {
  as_at: string | null;
  previous_as_at: string | null;
  banks: BouBank[];
}

@Injectable({ providedIn: 'root' })
export class BouApiService {
  private readonly http = inject(HttpClient);

  getSummary(): Observable<BouSummary> {
    return this.http.get<BouSummary>(`${API_BASE_URL}/bou/summary`);
  }
}
