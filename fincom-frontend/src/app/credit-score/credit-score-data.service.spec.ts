import { TestBed } from '@angular/core/testing';

import { CreditScoreDataService } from './credit-score-data.service';

describe('CreditScoreDataService', () => {
  let service: CreditScoreDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CreditScoreDataService);
  });

  it('returns a fallback credit score profile', async () => {
    const profile = await service.loadProfile();

    expect(profile.score).toBe(742);
    expect(profile.summary.label).toBe('Strong');
    expect(profile.eligible[0].name).toBe('Personal Unsecured Loan');
  });
});
