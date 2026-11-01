import { Component, PLATFORM_ID, ViewEncapsulation, inject, signal } from '@angular/core';
import { DatePipe, isPlatformBrowser } from '@angular/common';

import { BouApiService, BouBank, BouSummary } from './bou-api.service';

@Component({
  selector: 'app-bou-panel',
  imports: [DatePipe],
  template: `
    @if (summary(); as s) {
      @if (s.as_at) {
        <section class="bou-card">
          <div class="bou-head">
            <h2>Bank of Uganda rates by bank</h2>
            <span class="bou-date">Figures as at {{ s.as_at | date: 'd MMMM y' }}</span>
          </div>
          <p class="bou-note">
            Published by the Bank of Uganda each quarter. These are ranges banks report,
            not the rate you will be offered.
            @if (s.previous_as_at) {
              Change is compared with {{ s.previous_as_at | date: 'd MMMM y' }}.
            }
          </p>
          <label class="bou-pick">
            Bank
            <select (change)="choose($any($event.target).value)">
              @for (b of s.banks; track b.bank_id) {
                <option [value]="b.bank_id" [selected]="b.bank_id === selected()">{{ b.bank_name }}</option>
              }
            </select>
          </label>
          @if (current(); as bank) {
            <ul class="bou-list">
              @for (r of bank.rates; track r.metric) {
                <li>
                  <span class="bou-title">{{ r.title }}</span>
                  <span class="bou-value">{{ r.current }}</span>
                  @if (r.change_pct_points === null || r.change_pct_points === 0) {
                    <span class="bou-chg flat">{{ r.previous ? 'No change' : '' }}</span>
                  } @else {
                    <span class="bou-chg" [class.up]="r.change_pct_points > 0" [class.down]="r.change_pct_points < 0">
                      {{ r.change_pct_points > 0 ? '▲' : '▼' }}
                      {{ abs(r.change_pct_points) }} pts from {{ r.previous }}
                    </span>
                  }
                </li>
              }
            </ul>
          }
        </section>
      }
    }
  `,
  styles: `
    app-bou-panel { display: block; }
    .bou-card { background: #fff; border: 1px solid #e3ebf5; border-radius: 16px; padding: 20px; margin: 20px 0; }
    .bou-head { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 6px 16px; align-items: baseline; }
    .bou-head h2 { margin: 0; font-size: 18px; }
    .bou-date { font-size: 13px; color: #5b6b82; font-weight: 600; }
    .bou-note { margin: 8px 0 14px; font-size: 13px; line-height: 1.5; color: #5b6b82; }
    .bou-pick { display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 700; max-width: 320px; }
    .bou-pick select { height: 42px; padding: 0 10px; border: 1.5px solid #d6e3f1; border-radius: 10px; font: inherit; background: #f8fbff; }
    .bou-list { list-style: none; margin: 14px 0 0; padding: 0; display: grid; gap: 4px; }
    .bou-list li { display: grid; grid-template-columns: 1.4fr 1fr 1.6fr; gap: 8px; align-items: center; padding: 10px 0; border-top: 1px solid #eef3f9; font-size: 14px; }
    .bou-value { font-weight: 700; }
    .bou-chg { font-size: 13px; font-weight: 600; color: #5b6b82; }
    .bou-chg.up { color: #b3541e; }
    .bou-chg.down { color: #1a7f4b; }
    @media (max-width: 600px) { .bou-list li { grid-template-columns: 1fr 1fr; } .bou-chg { grid-column: 1 / -1; } }
  `,
  encapsulation: ViewEncapsulation.None,
})
export class BouPanel {
  private readonly api = inject(BouApiService);

  readonly summary = signal<BouSummary | null>(null);
  readonly selected = signal<string>('');

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      this.api.getSummary().subscribe({
        next: (s) => {
          this.summary.set(s);
          this.selected.set(s.banks.find((b) => b.bank_id === 'stanbic')?.bank_id ?? s.banks[0]?.bank_id ?? '');
        },
        error: () => this.summary.set(null),
      });
    }
  }

  current(): BouBank | undefined {
    return this.summary()?.banks.find((b) => b.bank_id === this.selected());
  }

  choose(id: string): void {
    this.selected.set(id);
  }

  abs(n: number): number {
    return Math.abs(Math.round(n * 100) / 100);
  }
}
