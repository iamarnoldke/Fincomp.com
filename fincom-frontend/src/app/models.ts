export interface Bank { id: string; name: string; short: string; logoUrl: string; contactUrl?: string; phone?: string; email?: string; }
export type LoanType = 'Personal' | 'Salary' | 'Home' | 'Business' | 'Asset Finance' | 'Agriculture' | 'Education';
export interface LoanProduct { bankId: string; type: LoanType; name: string; annualRate: number; maxAmount: number; minTerm: number; maxTerm: number; processingFee: number; minScore: number; collateral: boolean; popularity: number; }
export type AccountType = 'Savings' | 'Current' | 'Fixed Deposit' | 'Student' | 'Salary' | 'Business';
export interface AccountProduct { bankId: string; type: AccountType; name: string; minOpeningBalance: number; minBalance: number; monthlyFee: number; withdrawalFee: number; savingsRate: number; requirements: string[]; }
export type InsuranceType = 'Motor' | 'Health' | 'Life' | 'Home' | 'Travel' | 'Agriculture';
export interface InsurancePolicy { bankId: string; type: InsuranceType; name: string; insurer: string; premiumRate: number; minCover: number; maxCover: number; excess: number; claimSettlementDays: number; benefits: string[]; popularity: number; }
