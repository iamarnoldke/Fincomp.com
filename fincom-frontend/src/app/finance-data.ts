import { Injectable, signal } from '@angular/core';
import { AccountProduct, Bank, InsurancePolicy, LoanProduct } from './models';

@Injectable({ providedIn: 'root' })
export class FinanceData {
  readonly banks = signal<Bank[]>([
    { id: 'stanbic', name: 'Stanbic Bank Uganda', short: 'SBU', logoUrl: 'https://logo.clearbit.com/stanbicbank.co.ug', contactUrl: 'https://www.stanbicbank.co.ug' },
    { id: 'centenary', name: 'Centenary Bank', short: 'CENTE', logoUrl: '/logos/centenary-bank-logo-png_seeklogo-410313.png', contactUrl: 'https://www.centenarybank.co.ug/contact-us' },
    { id: 'absa', name: 'Absa Bank Uganda', short: 'ABSA', logoUrl: '/logos/absa-bank-uganda-logo-png_seeklogo-550566.png', contactUrl: 'https://www.absa.co.ug' },
    { id: 'equity', name: 'Equity Bank Uganda', short: 'EQTY', logoUrl: 'https://logo.clearbit.com/equitybank.co.ug', contactUrl: 'https://www.equitybank.co.ug' },
    { id: 'dfcu', name: 'dfcu Bank', short: 'DFCU', logoUrl: '/logos/dfcu-bank-uganda-logo-png_seeklogo-550578.png', contactUrl: 'https://www.dfcugroup.com' },
    { id: 'housing', name: 'Housing Finance Bank', short: 'HFB', logoUrl: 'https://logo.clearbit.com/housingfinance.co.ug', contactUrl: 'https://www.housing.co.ug' },
    { id: 'bankofafrica', name: 'Bank of Africa Uganda', short: 'BOA', logoUrl: 'https://logo.clearbit.com/bankofafrica.co.ug', contactUrl: 'https://www.boauganda.com' },
    { id: 'kcb', name: 'KCB Bank Uganda', short: 'KCB', logoUrl: 'https://logo.clearbit.com/kcbgroup.com', contactUrl: 'https://ug.kcbgroup.com' },
    { id: 'ncba', name: 'NCBA Bank Uganda', short: 'NCBA', logoUrl: 'https://logo.clearbit.com/ncba.co.ug', contactUrl: 'https://ncbagroup.com' },
    { id: 'postbank', name: 'PostBank Uganda', short: 'PBU', logoUrl: 'https://logo.clearbit.com/postbank.co.ug', contactUrl: 'https://postbank.co.ug' },
    { id: 'standardchartered', name: 'Standard Chartered Uganda', short: 'SCB', logoUrl: '/logos/standard-chartered-bank-logo-png_seeklogo-131589.png', contactUrl: 'https://www.sc.com/ug', phone: '+256200524100', email: 'Ug.Service@sc.com' },
    { id: 'gtbank', name: 'Guaranty Trust Bank Uganda', short: 'GTB', logoUrl: 'https://logo.clearbit.com/gtbank.com', contactUrl: 'https://www.gtbank.com' },
    { id: 'exim', name: 'Exim Bank Uganda', short: 'EXIM', logoUrl: 'https://logo.clearbit.com/eximbankuganda.com', contactUrl: 'https://www.eximbank-ug.com' },
    { id: 'bankofbaroda', name: 'Bank of Baroda Uganda', short: 'BoB', logoUrl: 'https://logo.clearbit.com/bankofbaroda.com', contactUrl: 'https://www.bankofbaroda.in' },
    { id: 'tropical', name: 'Tropical Bank Uganda', short: 'TRO', logoUrl: 'https://logo.clearbit.com/tropicalbank.co.ug', contactUrl: 'https://www.tropicalbank.co.ug' },
    { id: 'im', name: 'I&M Bank Uganda', short: 'I&M', logoUrl: 'https://logo.clearbit.com/imbank.com', contactUrl: 'https://ug.imbank.com' },
    { id: 'cairo', name: 'Cairo International Bank Uganda', short: 'CIB', logoUrl: 'https://logo.clearbit.com/cairointernationalbank.com', contactUrl: 'https://www.cairointernationalbank.com' },
  ]);

  readonly loans = signal<LoanProduct[]>([
    { bankId: 'stanbic', type: 'Personal', name: 'Personal Unsecured Loan', annualRate: 21, maxAmount: 100_000_000, minTerm: 6, maxTerm: 60, processingFee: 2, minScore: 600, collateral: false, popularity: 95 },
    { bankId: 'centenary', type: 'Personal', name: 'CenteFlexi Personal Loan', annualRate: 23, maxAmount: 50_000_000, minTerm: 6, maxTerm: 48, processingFee: 1.5, minScore: 550, collateral: false, popularity: 88 },
    { bankId: 'absa', type: 'Personal', name: 'Salary Advance / Personal Loan', annualRate: 22, maxAmount: 120_000_000, minTerm: 12, maxTerm: 60, processingFee: 2.5, minScore: 620, collateral: false, popularity: 82 },
    { bankId: 'dfcu', type: 'Salary', name: 'Salary Loan', annualRate: 20.5, maxAmount: 70_000_000, minTerm: 6, maxTerm: 48, processingFee: 1.5, minScore: 580, collateral: false, popularity: 90 },
    { bankId: 'equity', type: 'Salary', name: 'Salary Advance Loan', annualRate: 21.5, maxAmount: 60_000_000, minTerm: 3, maxTerm: 24, processingFee: 1.5, minScore: 570, collateral: false, popularity: 84 },
    { bankId: 'housing', type: 'Home', name: 'Home Mortgage Loan', annualRate: 18, maxAmount: 500_000_000, minTerm: 60, maxTerm: 240, processingFee: 1, minScore: 650, collateral: true, popularity: 78 },
    { bankId: 'stanbic', type: 'Business', name: 'SME Business Loan', annualRate: 19.5, maxAmount: 500_000_000, minTerm: 12, maxTerm: 84, processingFee: 2, minScore: 640, collateral: true, popularity: 85 },
    { bankId: 'absa', type: 'Asset Finance', name: 'Asset Finance Loan', annualRate: 17.5, maxAmount: 350_000_000, minTerm: 12, maxTerm: 72, processingFee: 2, minScore: 640, collateral: true, popularity: 74 },
    { bankId: 'centenary', type: 'Agriculture', name: 'Agriculture Input Loan', annualRate: 17, maxAmount: 150_000_000, minTerm: 6, maxTerm: 60, processingFee: 1, minScore: 560, collateral: true, popularity: 76 },
    { bankId: 'equity', type: 'Education', name: 'Elimu Education Loan', annualRate: 20.5, maxAmount: 25_000_000, minTerm: 3, maxTerm: 24, processingFee: 1, minScore: 560, collateral: false, popularity: 80 },
    { bankId: 'kcb', type: 'Personal', name: 'KCB Quick Loan', annualRate: 24, maxAmount: 150_000_000, minTerm: 6, maxTerm: 48, processingFee: 2, minScore: 600, collateral: false, popularity: 91 },
    { bankId: 'bankofafrica', type: 'Business', name: 'BOA Business Growth Loan', annualRate: 20, maxAmount: 300_000_000, minTerm: 12, maxTerm: 60, processingFee: 2.2, minScore: 600, collateral: true, popularity: 77 },
    { bankId: 'postbank', type: 'Salary', name: 'PostBank Salary Loan', annualRate: 21, maxAmount: 80_000_000, minTerm: 6, maxTerm: 36, processingFee: 1.6, minScore: 570, collateral: false, popularity: 70 },
    { bankId: 'standardchartered', type: 'Home', name: 'SCB Mortgage Plus', annualRate: 16, maxAmount: 600_000_000, minTerm: 60, maxTerm: 240, processingFee: 1, minScore: 650, collateral: true, popularity: 73 },
    { bankId: 'ncba', type: 'Personal', name: 'NCBA Personal Loan', annualRate: 20, maxAmount: 90_000_000, minTerm: 6, maxTerm: 48, processingFee: 2, minScore: 580, collateral: false, popularity: 80 },
    { bankId: 'exim', type: 'Asset Finance', name: 'Exim Asset Finance', annualRate: 18.5, maxAmount: 250_000_000, minTerm: 12, maxTerm: 72, processingFee: 2, minScore: 620, collateral: true, popularity: 68 },
    { bankId: 'bankofbaroda', type: 'Business', name: 'BoB SME Financing', annualRate: 18, maxAmount: 250_000_000, minTerm: 12, maxTerm: 72, processingFee: 1.8, minScore: 600, collateral: true, popularity: 66 },
    { bankId: 'tropical', type: 'Education', name: 'Tropical Education Loan', annualRate: 21, maxAmount: 30_000_000, minTerm: 6, maxTerm: 24, processingFee: 1.6, minScore: 550, collateral: false, popularity: 64 },
    { bankId: 'im', type: 'Salary', name: 'I&M Salaried Loan', annualRate: 19, maxAmount: 90_000_000, minTerm: 12, maxTerm: 60, processingFee: 1.9, minScore: 575, collateral: false, popularity: 72 },
    { bankId: 'cairo', type: 'Agriculture', name: 'Cairo Agri Credit', annualRate: 17.5, maxAmount: 150_000_000, minTerm: 6, maxTerm: 60, processingFee: 1.4, minScore: 560, collateral: true, popularity: 62 }
  ]);

  readonly accounts = signal<AccountProduct[]>([
    { bankId: 'stanbic', type: 'Savings', name: 'FlexiSave', minOpeningBalance: 0, minBalance: 0, monthlyFee: 0, withdrawalFee: 5_000, savingsRate: 3, requirements: ['National ID', 'Mobile number'] },
    { bankId: 'centenary', type: 'Salary', name: 'CenteSalary', minOpeningBalance: 0, minBalance: 0, monthlyFee: 0, withdrawalFee: 3_000, savingsRate: 1, requirements: ['National ID', 'Employer letter'] },
    { bankId: 'absa', type: 'Current', name: 'Current Account', minOpeningBalance: 50_000, minBalance: 20_000, monthlyFee: 10_000, withdrawalFee: 5_000, savingsRate: 0, requirements: ['National ID', 'Proof of address'] },
    { bankId: 'dfcu', type: 'Business', name: 'Business Account', minOpeningBalance: 100_000, minBalance: 50_000, monthlyFee: 15_000, withdrawalFee: 7_000, savingsRate: 0, requirements: ['National ID', 'Business registration'] },
    { bankId: 'equity', type: 'Savings', name: 'Equity Wallet Savings', minOpeningBalance: 10_000, minBalance: 0, monthlyFee: 0, withdrawalFee: 2_000, savingsRate: 4, requirements: ['National ID', 'KYC details'] },
    { bankId: 'kcb', type: 'Current', name: 'KCB Current Plus', minOpeningBalance: 25_000, minBalance: 10_000, monthlyFee: 5_000, withdrawalFee: 4_000, savingsRate: 0, requirements: ['National ID', 'Proof of address'] },
    { bankId: 'ncba', type: 'Savings', name: 'NCBA Savings One', minOpeningBalance: 0, minBalance: 0, monthlyFee: 0, withdrawalFee: 2_000, savingsRate: 3, requirements: ['National ID'] },
    { bankId: 'postbank', type: 'Salary', name: 'PostBank Salary Account', minOpeningBalance: 0, minBalance: 0, monthlyFee: 0, withdrawalFee: 1_000, savingsRate: 2, requirements: ['National ID', 'Employer letter'] },
    { bankId: 'bankofafrica', type: 'Business', name: 'BOA Business Account', minOpeningBalance: 100_000, minBalance: 50_000, monthlyFee: 8_000, withdrawalFee: 5_000, savingsRate: 0, requirements: ['National ID', 'Business registration'] },
    { bankId: 'tropical', type: 'Savings', name: 'Tropical Saver', minOpeningBalance: 0, minBalance: 0, monthlyFee: 0, withdrawalFee: 2_000, savingsRate: 3, requirements: ['National ID'] },
  ]);

  readonly insurancePolicies = signal<InsurancePolicy[]>([
    { bankId: 'stanbic', type: 'Life', name: 'Stanbic Life Shield', insurer: 'Sanlam Life', premiumRate: 1.2, minCover: 5_000_000, maxCover: 500_000_000, excess: 0, claimSettlementDays: 14, benefits: ['Death & disability cover', 'Funeral expense benefit', 'No medical exam under 50M'], popularity: 88 },
    { bankId: 'centenary', type: 'Health', name: 'Cente Medicare Plus', insurer: 'Jubilee Health', premiumRate: 4.5, minCover: 2_000_000, maxCover: 100_000_000, excess: 5, claimSettlementDays: 7, benefits: ['Inpatient & outpatient', 'Maternity cover', 'Dental & optical add-on'], popularity: 90 },
    { bankId: 'absa', type: 'Motor', name: 'Absa DriveGuard', insurer: 'UAP Old Mutual', premiumRate: 6, minCover: 5_000_000, maxCover: 300_000_000, excess: 10, claimSettlementDays: 10, benefits: ['Comprehensive cover', 'Third-party liability', 'Windscreen cover'], popularity: 85 },
    { bankId: 'equity', type: 'Home', name: 'Equity HomeSafe', insurer: 'Britam', premiumRate: 0.8, minCover: 10_000_000, maxCover: 800_000_000, excess: 5, claimSettlementDays: 21, benefits: ['Fire & perils cover', 'Burglary cover', 'Alternative accommodation'], popularity: 76 },
    { bankId: 'dfcu', type: 'Motor', name: 'dfcu Motor Cover', insurer: 'APA Insurance', premiumRate: 5.5, minCover: 5_000_000, maxCover: 250_000_000, excess: 10, claimSettlementDays: 12, benefits: ['Comprehensive cover', 'Towing & recovery', 'Excess protector option'], popularity: 82 },
    { bankId: 'kcb', type: 'Travel', name: 'KCB TravelSafe', insurer: 'ICEA LION', premiumRate: 2, minCover: 1_000_000, maxCover: 50_000_000, excess: 0, claimSettlementDays: 5, benefits: ['Medical emergency abroad', 'Trip cancellation', 'Lost baggage cover'], popularity: 60 },
    { bankId: 'housing', type: 'Home', name: 'HFB Property Shield', insurer: 'Liberty Life', premiumRate: 0.9, minCover: 15_000_000, maxCover: 1_000_000_000, excess: 5, claimSettlementDays: 18, benefits: ['Fire & perils cover', 'Flood cover add-on', 'Rent loss cover'], popularity: 58 },
    { bankId: 'standardchartered', type: 'Life', name: 'SC Priority Life', insurer: 'Prudential', premiumRate: 1.5, minCover: 10_000_000, maxCover: 1_000_000_000, excess: 0, claimSettlementDays: 10, benefits: ['Whole life cover', 'Critical illness rider', 'Investment-linked option'], popularity: 70 },
    { bankId: 'ncba', type: 'Health', name: 'NCBA MediCare', insurer: 'Jubilee Health', premiumRate: 4.2, minCover: 3_000_000, maxCover: 150_000_000, excess: 10, claimSettlementDays: 9, benefits: ['Inpatient cover', 'Chronic condition management', 'Cashless hospital network'], popularity: 66 },
    { bankId: 'postbank', type: 'Agriculture', name: 'PostBank AgriShield', insurer: 'APA Insurance', premiumRate: 3.5, minCover: 2_000_000, maxCover: 80_000_000, excess: 10, claimSettlementDays: 15, benefits: ['Crop failure cover', 'Livestock cover', 'Weather index payouts'], popularity: 55 },
    { bankId: 'centenary', type: 'Motor', name: 'Cente Motor Plus', insurer: 'UAP Old Mutual', premiumRate: 5.8, minCover: 5_000_000, maxCover: 200_000_000, excess: 10, claimSettlementDays: 11, benefits: ['Comprehensive cover', 'Personal accident benefit', '24/7 roadside assistance'], popularity: 79 },
    { bankId: 'exim', type: 'Health', name: 'Exim MediCover', insurer: 'Britam', premiumRate: 4.8, minCover: 2_000_000, maxCover: 90_000_000, excess: 10, claimSettlementDays: 10, benefits: ['Inpatient & outpatient', 'Maternity cover'], popularity: 48 },
    { bankId: 'stanbic', type: 'Home', name: 'Stanbic HomeCover', insurer: 'Sanlam General', premiumRate: 0.85, minCover: 20_000_000, maxCover: 900_000_000, excess: 5, claimSettlementDays: 16, benefits: ['Fire & perils cover', 'Burglary cover', 'Domestic worker liability'], popularity: 62 },
    { bankId: 'bankofafrica', type: 'Travel', name: 'BOA Travel Assist', insurer: 'ICEA LION', premiumRate: 1.8, minCover: 1_000_000, maxCover: 40_000_000, excess: 0, claimSettlementDays: 6, benefits: ['Medical emergency abroad', 'Flight delay cover'], popularity: 44 },
    { bankId: 'im', type: 'Life', name: 'I&M SecureLife', insurer: 'Prudential', premiumRate: 1.3, minCover: 5_000_000, maxCover: 400_000_000, excess: 0, claimSettlementDays: 12, benefits: ['Death & disability cover', 'Education fund rider'], popularity: 50 },
    { bankId: 'equity', type: 'Agriculture', name: 'Equity AgriGuard', insurer: 'Britam', premiumRate: 3.2, minCover: 2_000_000, maxCover: 100_000_000, excess: 10, claimSettlementDays: 14, benefits: ['Crop failure cover', 'Drought index payouts'], popularity: 57 },
  ]);

  private readonly logoPalette = [
    '#1d84d6', '#7c3aed', '#059669', '#dc2626', '#ea580c',
    '#0891b2', '#c026d3', '#4f46e5', '#16a34a', '#d97706',
    '#0d9488', '#be123c', '#2563eb', '#9333ea', '#0f766e', '#b45309',
  ];

  bankName(id: string): string { return this.banks().find((bank) => bank.id === id)?.name ?? id; }
  bankLogo(id: string): string { return this.banks().find((bank) => bank.id === id)?.logoUrl ?? ''; }
  bankShort(id: string): string { return this.banks().find((bank) => bank.id === id)?.short ?? id.slice(0, 3).toUpperCase(); }

  bankContactUrl(id: string): string | undefined { return this.banks().find((bank) => bank.id === id)?.contactUrl; }
  bankPhone(id: string): string | undefined { return this.banks().find((bank) => bank.id === id)?.phone; }
  bankEmail(id: string): string | undefined { return this.banks().find((bank) => bank.id === id)?.email; }

  bankColor(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return this.logoPalette[hash % this.logoPalette.length];
  }
}
