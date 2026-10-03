import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { API_BASE_URL } from '../core/api-config';
import { Dashboard } from './dashboard';
import { timeAgo } from './dashboard-view-model';

const SUMMARY = {
  generated_at: '2026-10-03T10:00:00Z',
  rates_last_updated: '2026-10-02T08:00:00Z',
  bank_count: 17,
  loan_product_count: 2,
  account_product_count: 1,
  insurance_product_count: 1,
  products_compared: 4,
  sample_amount: 20000000,
  sample_term_months: 24,
  potential_savings: 1500000,
  credit_score: 712,
  activity_count_30d: 3,
  rate_bars: [
    { id: 'a', bank_id: 'kcb', bank_name: 'KCB Bank Uganda', product_name: 'Quick Loan', category_slug: 'personal', annual_rate_pct: 9.5 },
    { id: 'b', bank_id: 'absa', bank_name: 'Absa Bank Uganda', product_name: 'Asset', category_slug: 'asset_finance', annual_rate_pct: 19 },
  ],
  popular_loans: [
    { id: 'a', bank_id: 'kcb', bank_name: 'KCB Bank Uganda', name: 'Quick Loan', category_slug: 'personal', annual_rate_pct: 9.5, popularity: 91 },
  ],
  popular_insurance: [
    { id: 'i', bank_id: 'absa', bank_name: 'Absa Bank Uganda', name: 'DriveGuard', insurance_type_slug: 'motor', underwriter_name: 'UAP', popularity: 85 },
  ],
  recent_activity: [{ kind: 'compare', description: 'Compared 8 personal loans', occurred_at: '2026-10-03T08:00:00Z' }],
};

describe('Dashboard', () => {
  let fixture: ComponentFixture<Dashboard>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('requests live data from the backend', () => {
    http.expectOne(`${API_BASE_URL}/dashboard/summary`).flush(SUMMARY);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows what the backend returned, not hardcoded numbers', async () => {
    http.expectOne(`${API_BASE_URL}/dashboard/summary`).flush(SUMMARY);
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.bankCount()).toBe(17);
    expect(component.creditScore()).toBe(712);
    expect(component.bestLoan().bank).toBe('KCB Bank Uganda');
    expect(component.bestLoan().rate).toBe(9.5);
    expect(component.potentialSavings()).toBe(1500000);
    expect(component.popularLoans()[0].type).toBe('Personal');
    expect(component.activity()[0].text).toBe('Compared 8 personal loans');
  });

  it('shows a friendly message when the request fails', async () => {
    http.expectOne(`${API_BASE_URL}/dashboard/summary`).flush('boom', { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.error()).toBe('Unable to load live dashboard data.');
  });

  it('tells an expired session apart from other failures', async () => {
    http.expectOne(`${API_BASE_URL}/dashboard/summary`).flush({ detail: 'Invalid or expired token' }, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();

    expect(fixture.componentInstance.error()).toContain('session has expired');
  });
});

describe('timeAgo', () => {
  const now = new Date('2026-10-03T12:00:00Z');

  it('formats minutes, hours and days', () => {
    expect(timeAgo(new Date('2026-10-03T11:59:40Z'), now)).toBe('just now');
    expect(timeAgo(new Date('2026-10-03T11:30:00Z'), now)).toBe('30m ago');
    expect(timeAgo(new Date('2026-10-03T10:00:00Z'), now)).toBe('2h ago');
    expect(timeAgo(new Date('2026-10-01T12:00:00Z'), now)).toBe('2d ago');
  });
});
