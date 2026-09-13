import { Injectable, inject } from '@angular/core';
import { BANK_API_CONFIG } from './bank-api.config';
import { ErrorHandlerService } from './error-handler.service';

@Injectable({ providedIn: 'root' })
export class BankApiService {
  private readonly errorHandler = inject(ErrorHandlerService);

  readonly config = BANK_API_CONFIG;

  resolveProvider(bankId: string): string | null {
    const provider = this.config.providers[bankId];
    if (!provider || !provider.enabled || !provider.apiKey) {
      return null;
    }

    return provider.apiKey;
  }

  getProviderEndpoint(bankId: string): string | null {
    const provider = this.config.providers[bankId];
    if (!provider || !provider.enabled) {
      return null;
    }

    return provider.baseUrl;
  }

  validateBankSearch(query: string): string {
    return query.trim().length > 0 ? query.trim() : 'all';
  }

  searchBankProducts(query: string): string[] {
    // Placeholder integration boundary.
    // This is the place to call bank APIs once credentials are entered.
    try {
      const normalized = this.validateBankSearch(query);
      if (!normalized || normalized === 'all') {
        return Object.keys(this.config.providers);
      }

      return Object.keys(this.config.providers).filter((bankId) => {
        const provider = this.config.providers[bankId];
        return provider.enabled && provider.apiKey.length > 0;
      });
    } catch (caught) {
      this.errorHandler.handle(caught, 'Unable to query bank providers.');
      return [];
    }
  }
}
