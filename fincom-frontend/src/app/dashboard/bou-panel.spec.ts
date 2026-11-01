import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../core/api-config';
import { BouPanel } from './bou-panel';

const SUMMARY = {
  as_at: '2026-04-01',
  previous_as_at: '2026-01-01',
  banks: [
    { bank_id: 'absa', bank_name: 'Absa Bank', rates: [] },
    {
      bank_id: 'stanbic', bank_name: 'Stanbic Bank',
      rates: [
        { metric: 'lending_max', title: 'Lending rate (max)', current: '22%', previous: '20%', change_pct_points: 2 },
        { metric: 'plr', title: 'Prime lending rate', current: 'N/A', previous: 'N/A', change_pct_points: null },
      ],
    },
  ],
};

describe('BouPanel', () => {
  function setup() {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(BouPanel);
    const http = TestBed.inject(HttpTestingController);
    return { fixture, http };
  }

  it('shows the date and the movement for Stanbic by default', () => {
    const { fixture, http } = setup();
    http.expectOne(`${API_BASE_URL}/bou/summary`).flush(SUMMARY);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('1 April 2026');
    expect(text).toContain('22%');
    expect(text).toContain('2 pts from 20%');
  });

  it('shows nothing when no edition has been imported', () => {
    const { fixture, http } = setup();
    http.expectOne(`${API_BASE_URL}/bou/summary`).flush({ as_at: null, previous_as_at: null, banks: [] });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.bou-card')).toBeNull();
  });

  it('shows nothing when the request fails', () => {
    const { fixture, http } = setup();
    http.expectOne(`${API_BASE_URL}/bou/summary`).flush('x', { status: 500, statusText: 'err' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.bou-card')).toBeNull();
  });
});
