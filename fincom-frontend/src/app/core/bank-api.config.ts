export interface BankApiProviderConfig {
  apiKey: string;
  baseUrl: string;
  enabled: boolean;
}

export interface BankApiConfig {
  providers: Record<string, BankApiProviderConfig>;
}

// Insert bank API keys, credentials, and base URLs here.
// The UI keeps this as a runtime configuration contract for the bank integration layer.
export const BANK_API_CONFIG: BankApiConfig = {
  providers: {
    stanbic: {
      apiKey: '',
      baseUrl: 'https://api.stanbicbank.co.ug',
      enabled: false,
    },
    centenary: {
      apiKey: '',
      baseUrl: 'https://api.centenarybank.co.ug',
      enabled: false,
    },
    absa: {
      apiKey: '',
      baseUrl: 'https://api.absa.co.ug',
      enabled: false,
    },
    equity: {
      apiKey: '',
      baseUrl: 'https://api.equitybank.co.ug',
      enabled: false,
    },
    dfcu: {
      apiKey: '',
      baseUrl: 'https://api.dfcu.co.ug',
      enabled: false,
    },
    housing: {
      apiKey: '',
      baseUrl: 'https://api.housingfinance.co.ug',
      enabled: false,
    },
    bankofafrica: {
      apiKey: '',
      baseUrl: 'https://api.bankofafrica.co.ug',
      enabled: false,
    },
    kcb: {
      apiKey: '',
      baseUrl: 'https://api.kcbgroup.com',
      enabled: false,
    },
    ncba: {
      apiKey: '',
      baseUrl: 'https://api.ncba.co.ug',
      enabled: false,
    },
    postbank: {
      apiKey: '',
      baseUrl: 'https://api.postbank.co.ug',
      enabled: false,
    },
    standardchartered: {
      apiKey: '',
      baseUrl: 'https://api.sc.com/ug',
      enabled: false,
    },
    gtbank: {
      apiKey: '',
      baseUrl: 'https://api.gtbank.com',
      enabled: false,
    },
    exim: {
      apiKey: '',
      baseUrl: 'https://api.eximbankuganda.com',
      enabled: false,
    },
    bankofbaroda: {
      apiKey: '',
      baseUrl: 'https://api.bankofbaroda.com',
      enabled: false,
    },
    tropical: {
      apiKey: '',
      baseUrl: 'https://api.tropicalbank.co.ug',
      enabled: false,
    },
    im: {
      apiKey: '',
      baseUrl: 'https://api.imbank.com',
      enabled: false,
    },
    cairo: {
      apiKey: '',
      baseUrl: 'https://api.cairointernationalbank.com',
      enabled: false,
    },
  },
};
