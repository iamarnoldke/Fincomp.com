import { Component, computed, inject, input, signal } from '@angular/core';
import { FinanceData } from '../finance-data';

@Component({
  selector: 'app-bank-logo',
  imports: [],
  templateUrl: './bank-logo.html',
  styleUrl: './bank-logo.css',
})
export class BankLogo {
  private readonly data = inject(FinanceData);

  readonly bankId = input.required<string>();
  readonly size = input(40);

  private readonly failed = signal(false);

  readonly name = computed(() => this.data.bankName(this.bankId()));
  readonly initials = computed(() => this.data.bankShort(this.bankId()).slice(0, 4));
  readonly logoUrl = computed(() => this.data.bankLogo(this.bankId()));
  readonly color = computed(() => this.data.bankColor(this.bankId()));
  readonly showImage = computed(() => !this.failed() && this.logoUrl().length > 0);

  onError(): void {
    this.failed.set(true);
  }
}
