import { TestBed } from '@angular/core/testing';

import { FinanceData } from './finance-data';

describe('FinanceData', () => {
  let service: FinanceData;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FinanceData);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
