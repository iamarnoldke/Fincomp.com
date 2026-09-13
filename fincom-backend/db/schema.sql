-- =====================================================================
-- FINCOM DATABASE SCHEMA (v2)
-- PostgreSQL 15+
-- Rewritten to match the real data model in finance-data.ts / models.ts
-- exactly, so the FastAPI layer is a thin pass-through of what the
-- Angular app already expects, not a re-invention of it.
--
-- Key decision: banks/categories use human-readable TEXT slugs as
-- primary keys (e.g. 'equity', 'salary', 'motor') instead of UUIDs,
-- because your Angular code (models.ts, finance-data.ts) already
-- treats bankId and product `type` as stable string identifiers.
-- Reusing them means the API response shapes need almost no
-- translation layer on the frontend.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM ('consumer', 'content_admin', 'super_admin');
CREATE TYPE product_status AS ENUM ('active', 'inactive', 'draft');

-- ---------------------------------------------------------------------
-- USERS  (real auth — replaces the localStorage-only Auth service)
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name       VARCHAR(150) NOT NULL,
    phone           VARCHAR(30),
    role            user_role NOT NULL DEFAULT 'consumer',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_email ON users (email);

-- ---------------------------------------------------------------------
-- BANKS
-- ---------------------------------------------------------------------
CREATE TABLE banks (
    id          TEXT PRIMARY KEY,             -- e.g. 'equity', 'dfcu' (matches Bank.id today)
    name        VARCHAR(150) NOT NULL,
    short_code  VARCHAR(10) NOT NULL,          -- e.g. 'EQTY'
    logo_url    TEXT,
    status      product_status NOT NULL DEFAULT 'active',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- LOOKUP TABLES — plain tables (not enums) so a content admin can add
-- a new loan/account/insurance category via INSERT, no migration.
-- ---------------------------------------------------------------------
CREATE TABLE loan_categories (
    slug TEXT PRIMARY KEY,      -- 'personal','salary','home','business','asset_finance','agriculture','education'
    name VARCHAR(100) NOT NULL,
    description TEXT            -- populates typeInfo[] copy on the Compare Loans page
);

CREATE TABLE account_types (
    slug TEXT PRIMARY KEY,      -- 'savings','current','fixed_deposit','student','salary','business'
    name VARCHAR(100) NOT NULL
);

CREATE TABLE insurance_types (
    slug TEXT PRIMARY KEY,      -- 'motor','health','life','home','travel','agriculture'
    name VARCHAR(100) NOT NULL,
    description TEXT            -- populates typeInfo[] copy on the Compare Insurance page
);

-- ---------------------------------------------------------------------
-- LOAN PRODUCTS
-- Mirrors LoanProduct in models.ts. `popularity` drives the dashboard's
-- "Popular loans" ranking (DashboardViewModel.popularLoans).
-- ---------------------------------------------------------------------
CREATE TABLE loan_products (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_id             TEXT NOT NULL REFERENCES banks (id) ON DELETE CASCADE,
    category_slug       TEXT NOT NULL REFERENCES loan_categories (slug),
    name                VARCHAR(150) NOT NULL,
    annual_rate_pct     NUMERIC(6, 3) NOT NULL,   -- LoanProduct.annualRate
    max_amount          NUMERIC(14, 2) NOT NULL,
    min_term_months     INT NOT NULL,
    max_term_months     INT NOT NULL,
    processing_fee_pct  NUMERIC(6, 3) NOT NULL DEFAULT 0,  -- % of principal, matches processingFee usage
    min_credit_score    INT,
    requires_collateral BOOLEAN NOT NULL DEFAULT FALSE,
    popularity          INT NOT NULL DEFAULT 0,
    status              product_status NOT NULL DEFAULT 'active',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_loan_term_range CHECK (max_term_months >= min_term_months)
);

CREATE INDEX idx_loan_products_bank ON loan_products (bank_id);
CREATE INDEX idx_loan_products_search
    ON loan_products (category_slug, status, max_amount, min_term_months, max_term_months);
CREATE INDEX idx_loan_products_score ON loan_products (min_credit_score);
CREATE INDEX idx_loan_products_popularity ON loan_products (popularity DESC);
-- Trigram index for the free-text search box (name / bank / type contains query)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_loan_products_name_trgm ON loan_products USING gin (name gin_trgm_ops);

-- ---------------------------------------------------------------------
-- ACCOUNT PRODUCTS
-- min_opening_balance = "To open" on the Open an Account screen
-- (NOT a fee — it's the balance required to open the account).
-- ---------------------------------------------------------------------
CREATE TABLE account_products (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_id              TEXT NOT NULL REFERENCES banks (id) ON DELETE CASCADE,
    account_type_slug    TEXT NOT NULL REFERENCES account_types (slug),
    name                 VARCHAR(150) NOT NULL,
    min_opening_balance  NUMERIC(14, 2) NOT NULL DEFAULT 0,
    min_balance          NUMERIC(14, 2) NOT NULL DEFAULT 0,
    monthly_fee          NUMERIC(14, 2) NOT NULL DEFAULT 0,
    withdrawal_fee       NUMERIC(14, 2) NOT NULL DEFAULT 0,
    interest_rate_pa     NUMERIC(6, 3) NOT NULL DEFAULT 0,   -- savingsRate
    status               product_status NOT NULL DEFAULT 'active',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_account_products_bank ON account_products (bank_id);
CREATE INDEX idx_account_products_type ON account_products (account_type_slug, status);

CREATE TABLE account_product_requirements (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_product_id UUID NOT NULL REFERENCES account_products (id) ON DELETE CASCADE,
    requirement_text   VARCHAR(150) NOT NULL,
    sort_order         INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_account_req_product ON account_product_requirements (account_product_id);

-- ---------------------------------------------------------------------
-- INSURANCE PRODUCTS
-- IMPORTANT: excess_pct is a PERCENTAGE of cover amount, exactly like
-- premium_rate_pct — matches InsuranceViewModel: excessAmount = cover * policy.excess / 100.
-- There is no flat base premium in the current model; annual premium
-- = cover * premiumRate / 100.
-- ---------------------------------------------------------------------
CREATE TABLE insurance_products (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_id                TEXT NOT NULL REFERENCES banks (id) ON DELETE CASCADE,  -- bancassurance partner
    insurance_type_slug    TEXT NOT NULL REFERENCES insurance_types (slug),
    underwriter_name       VARCHAR(150) NOT NULL,   -- e.g. 'APA Insurance'
    name                   VARCHAR(150) NOT NULL,   -- e.g. 'dfcu Motor Cover'
    premium_rate_pct       NUMERIC(6, 3) NOT NULL,  -- annual premium = cover * rate / 100
    min_cover_amount       NUMERIC(14, 2) NOT NULL,
    max_cover_amount       NUMERIC(14, 2) NOT NULL,
    excess_pct             NUMERIC(6, 3) NOT NULL DEFAULT 0,
    claim_settlement_days  INT,
    popularity             INT NOT NULL DEFAULT 0,
    status                 product_status NOT NULL DEFAULT 'active',
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_cover_range CHECK (max_cover_amount >= min_cover_amount)
);

CREATE INDEX idx_insurance_products_bank ON insurance_products (bank_id);
CREATE INDEX idx_insurance_products_type
    ON insurance_products (insurance_type_slug, status, min_cover_amount, max_cover_amount);
CREATE INDEX idx_insurance_products_popularity ON insurance_products (popularity DESC);

CREATE TABLE insurance_product_benefits (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insurance_product_id  UUID NOT NULL REFERENCES insurance_products (id) ON DELETE CASCADE,
    benefit_text          VARCHAR(150) NOT NULL,
    sort_order            INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_insurance_benefit_product ON insurance_product_benefits (insurance_product_id);

-- ---------------------------------------------------------------------
-- CREDIT SCORE SNAPSHOTS
-- Append-only. Current score = latest row per user. The "+12 pts" trend
-- on the Credit Score screen = latest.score - previous.score.
-- "Loans you qualify for" is NOT stored — it's computed at query time
-- by joining the user's latest score against loan_products.min_credit_score.
-- ---------------------------------------------------------------------
CREATE TABLE credit_score_snapshots (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    score                    INT NOT NULL CHECK (score BETWEEN 300 AND 850),
    payment_history_status   VARCHAR(50),      -- 'On time'
    credit_utilization_pct   NUMERIC(5, 2),    -- 26.00
    credit_age_years         NUMERIC(5, 2),
    credit_mix_count         INT,
    recent_enquiries_count   INT,
    recorded_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_credit_snapshots_user_time ON credit_score_snapshots (user_id, recorded_at DESC);

-- ---------------------------------------------------------------------
-- USER ACTIVITY LOG
-- Backs the Dashboard's "Recent activity" feed (currently hardcoded
-- mock data in DashboardViewModel.activity).
-- ---------------------------------------------------------------------
CREATE TYPE activity_kind AS ENUM ('compare', 'score', 'save', 'apply');

CREATE TABLE user_activity_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    kind        activity_kind NOT NULL,
    description TEXT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_user_time ON user_activity_log (user_id, occurred_at DESC);

-- ---------------------------------------------------------------------
-- updated_at auto-touch trigger
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_banks_updated_at BEFORE UPDATE ON banks
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_loan_products_updated_at BEFORE UPDATE ON loan_products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_account_products_updated_at BEFORE UPDATE ON account_products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_insurance_products_updated_at BEFORE UPDATE ON insurance_products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- LOOKUP SEED DATA (matches LoanType / AccountType / InsuranceType
-- unions in models.ts exactly)
-- ---------------------------------------------------------------------
INSERT INTO loan_categories (slug, name, description) VALUES
    ('personal', 'Personal', 'Common personal loans in Uganda for school fees, medical costs, weddings, and household needs.'),
    ('salary', 'Salary', 'Salary-backed loans are popular for salaried workers who want faster approval and smaller paperwork.'),
    ('home', 'Home', 'Mortgage-style home financing is widely used to buy, build, or improve a family home.'),
    ('business', 'Business', 'SME and trading loans are common for stock, working capital, and business expansion.'),
    ('asset_finance', 'Asset Finance', 'Asset financing is popular for vehicles, machinery, and equipment purchases.'),
    ('agriculture', 'Agriculture', 'Farmers often use agriculture loans for seeds, inputs, equipment, and seasonal cash flow.'),
    ('education', 'Education', 'Education loans are commonly used for tuition, school fees, and study-related expenses.');

INSERT INTO account_types (slug, name) VALUES
    ('savings', 'Savings'),
    ('current', 'Current'),
    ('fixed_deposit', 'Fixed Deposit'),
    ('student', 'Student'),
    ('salary', 'Salary'),
    ('business', 'Business');

INSERT INTO insurance_types (slug, name, description) VALUES
    ('motor', 'Motor', 'Comprehensive and third-party motor cover offered through bank-partnered insurers.'),
    ('health', 'Health', 'Medical insurance bundled by banks for inpatient, outpatient, and maternity needs.'),
    ('life', 'Life', 'Life and disability cover, often bundled with loans or offered as standalone protection.'),
    ('home', 'Home', 'Property and home content cover against fire, burglary, and other perils.'),
    ('travel', 'Travel', 'Short-term travel cover for medical emergencies, delays, and lost baggage abroad.'),
    ('agriculture', 'Agriculture', 'Crop and livestock cover protecting farmers against weather and disease losses.');

-- ---------------------------------------------------------------------
-- SEED DATA: real product data, extracted from finance-data.ts
-- (17 banks, 20 loan products, 10 account products, 16 insurance policies)
-- ---------------------------------------------------------------------
-- Banks
INSERT INTO banks (id, name, short_code, logo_url) VALUES ('stanbic', 'Stanbic Bank Uganda', 'SBU', 'https://logo.clearbit.com/stanbicbank.co.ug');
INSERT INTO banks (id, name, short_code, logo_url) VALUES ('centenary', 'Centenary Bank', 'CENTE', '/logos/centenary-bank-logo-png_seeklogo-410313.png');
INSERT INTO banks (id, name, short_code, logo_url) VALUES ('absa', 'Absa Bank Uganda', 'ABSA', '/logos/absa-bank-uganda-logo-png_seeklogo-550566.png');
INSERT INTO banks (id, name, short_code, logo_url) VALUES ('equity', 'Equity Bank Uganda', 'EQTY', 'https://logo.clearbit.com/equitybank.co.ug');
INSERT INTO banks (id, name, short_code, logo_url) VALUES ('dfcu', 'dfcu Bank', 'DFCU', '/logos/dfcu-bank-uganda-logo-png_seeklogo-550578.png');
INSERT INTO banks (id, name, short_code, logo_url) VALUES ('housing', 'Housing Finance Bank', 'HFB', 'https://logo.clearbit.com/housingfinance.co.ug');
INSERT INTO banks (id, name, short_code, logo_url) VALUES ('bankofafrica', 'Bank of Africa Uganda', 'BOA', 'https://logo.clearbit.com/bankofafrica.co.ug');
INSERT INTO banks (id, name, short_code, logo_url) VALUES ('kcb', 'KCB Bank Uganda', 'KCB', 'https://logo.clearbit.com/kcbgroup.com');
INSERT INTO banks (id, name, short_code, logo_url) VALUES ('ncba', 'NCBA Bank Uganda', 'NCBA', 'https://logo.clearbit.com/ncba.co.ug');
INSERT INTO banks (id, name, short_code, logo_url) VALUES ('postbank', 'PostBank Uganda', 'PBU', 'https://logo.clearbit.com/postbank.co.ug');
INSERT INTO banks (id, name, short_code, logo_url) VALUES ('standardchartered', 'Standard Chartered Uganda', 'SCB', '/logos/standard-chartered-bank-logo-png_seeklogo-131589.png');
INSERT INTO banks (id, name, short_code, logo_url) VALUES ('gtbank', 'Guaranty Trust Bank Uganda', 'GTB', 'https://logo.clearbit.com/gtbank.com');
INSERT INTO banks (id, name, short_code, logo_url) VALUES ('exim', 'Exim Bank Uganda', 'EXIM', 'https://logo.clearbit.com/eximbankuganda.com');
INSERT INTO banks (id, name, short_code, logo_url) VALUES ('bankofbaroda', 'Bank of Baroda Uganda', 'BoB', 'https://logo.clearbit.com/bankofbaroda.com');
INSERT INTO banks (id, name, short_code, logo_url) VALUES ('tropical', 'Tropical Bank Uganda', 'TRO', 'https://logo.clearbit.com/tropicalbank.co.ug');
INSERT INTO banks (id, name, short_code, logo_url) VALUES ('im', 'I&M Bank Uganda', 'I&M', 'https://logo.clearbit.com/imbank.com');
INSERT INTO banks (id, name, short_code, logo_url) VALUES ('cairo', 'Cairo International Bank Uganda', 'CIB', 'https://logo.clearbit.com/cairointernationalbank.com');

-- Loan products
INSERT INTO loan_products (bank_id, category_slug, name, annual_rate_pct, max_amount, min_term_months, max_term_months, processing_fee_pct, min_credit_score, requires_collateral, popularity) VALUES ('stanbic', 'personal', 'Personal Unsecured Loan', 21, 100000000, 6, 60, 2, 600, false, 95);
INSERT INTO loan_products (bank_id, category_slug, name, annual_rate_pct, max_amount, min_term_months, max_term_months, processing_fee_pct, min_credit_score, requires_collateral, popularity) VALUES ('centenary', 'personal', 'CenteFlexi Personal Loan', 23, 50000000, 6, 48, 1.5, 550, false, 88);
INSERT INTO loan_products (bank_id, category_slug, name, annual_rate_pct, max_amount, min_term_months, max_term_months, processing_fee_pct, min_credit_score, requires_collateral, popularity) VALUES ('absa', 'personal', 'Salary Advance / Personal Loan', 22, 120000000, 12, 60, 2.5, 620, false, 82);
INSERT INTO loan_products (bank_id, category_slug, name, annual_rate_pct, max_amount, min_term_months, max_term_months, processing_fee_pct, min_credit_score, requires_collateral, popularity) VALUES ('dfcu', 'salary', 'Salary Loan', 20.5, 70000000, 6, 48, 1.5, 580, false, 90);
INSERT INTO loan_products (bank_id, category_slug, name, annual_rate_pct, max_amount, min_term_months, max_term_months, processing_fee_pct, min_credit_score, requires_collateral, popularity) VALUES ('equity', 'salary', 'Salary Advance Loan', 21.5, 60000000, 3, 24, 1.5, 570, false, 84);
INSERT INTO loan_products (bank_id, category_slug, name, annual_rate_pct, max_amount, min_term_months, max_term_months, processing_fee_pct, min_credit_score, requires_collateral, popularity) VALUES ('housing', 'home', 'Home Mortgage Loan', 18, 500000000, 60, 240, 1, 650, true, 78);
INSERT INTO loan_products (bank_id, category_slug, name, annual_rate_pct, max_amount, min_term_months, max_term_months, processing_fee_pct, min_credit_score, requires_collateral, popularity) VALUES ('stanbic', 'business', 'SME Business Loan', 19.5, 500000000, 12, 84, 2, 640, true, 85);
INSERT INTO loan_products (bank_id, category_slug, name, annual_rate_pct, max_amount, min_term_months, max_term_months, processing_fee_pct, min_credit_score, requires_collateral, popularity) VALUES ('absa', 'asset_finance', 'Asset Finance Loan', 17.5, 350000000, 12, 72, 2, 640, true, 74);
INSERT INTO loan_products (bank_id, category_slug, name, annual_rate_pct, max_amount, min_term_months, max_term_months, processing_fee_pct, min_credit_score, requires_collateral, popularity) VALUES ('centenary', 'agriculture', 'Agriculture Input Loan', 17, 150000000, 6, 60, 1, 560, true, 76);
INSERT INTO loan_products (bank_id, category_slug, name, annual_rate_pct, max_amount, min_term_months, max_term_months, processing_fee_pct, min_credit_score, requires_collateral, popularity) VALUES ('equity', 'education', 'Elimu Education Loan', 20.5, 25000000, 3, 24, 1, 560, false, 80);
INSERT INTO loan_products (bank_id, category_slug, name, annual_rate_pct, max_amount, min_term_months, max_term_months, processing_fee_pct, min_credit_score, requires_collateral, popularity) VALUES ('kcb', 'personal', 'KCB Quick Loan', 24, 150000000, 6, 48, 2, 600, false, 91);
INSERT INTO loan_products (bank_id, category_slug, name, annual_rate_pct, max_amount, min_term_months, max_term_months, processing_fee_pct, min_credit_score, requires_collateral, popularity) VALUES ('bankofafrica', 'business', 'BOA Business Growth Loan', 20, 300000000, 12, 60, 2.2, 600, true, 77);
INSERT INTO loan_products (bank_id, category_slug, name, annual_rate_pct, max_amount, min_term_months, max_term_months, processing_fee_pct, min_credit_score, requires_collateral, popularity) VALUES ('postbank', 'salary', 'PostBank Salary Loan', 21, 80000000, 6, 36, 1.6, 570, false, 70);
INSERT INTO loan_products (bank_id, category_slug, name, annual_rate_pct, max_amount, min_term_months, max_term_months, processing_fee_pct, min_credit_score, requires_collateral, popularity) VALUES ('standardchartered', 'home', 'SCB Mortgage Plus', 16, 600000000, 60, 240, 1, 650, true, 73);
INSERT INTO loan_products (bank_id, category_slug, name, annual_rate_pct, max_amount, min_term_months, max_term_months, processing_fee_pct, min_credit_score, requires_collateral, popularity) VALUES ('ncba', 'personal', 'NCBA Personal Loan', 20, 90000000, 6, 48, 2, 580, false, 80);
INSERT INTO loan_products (bank_id, category_slug, name, annual_rate_pct, max_amount, min_term_months, max_term_months, processing_fee_pct, min_credit_score, requires_collateral, popularity) VALUES ('exim', 'asset_finance', 'Exim Asset Finance', 18.5, 250000000, 12, 72, 2, 620, true, 68);
INSERT INTO loan_products (bank_id, category_slug, name, annual_rate_pct, max_amount, min_term_months, max_term_months, processing_fee_pct, min_credit_score, requires_collateral, popularity) VALUES ('bankofbaroda', 'business', 'BoB SME Financing', 18, 250000000, 12, 72, 1.8, 600, true, 66);
INSERT INTO loan_products (bank_id, category_slug, name, annual_rate_pct, max_amount, min_term_months, max_term_months, processing_fee_pct, min_credit_score, requires_collateral, popularity) VALUES ('tropical', 'education', 'Tropical Education Loan', 21, 30000000, 6, 24, 1.6, 550, false, 64);
INSERT INTO loan_products (bank_id, category_slug, name, annual_rate_pct, max_amount, min_term_months, max_term_months, processing_fee_pct, min_credit_score, requires_collateral, popularity) VALUES ('im', 'salary', 'I&M Salaried Loan', 19, 90000000, 12, 60, 1.9, 575, false, 72);
INSERT INTO loan_products (bank_id, category_slug, name, annual_rate_pct, max_amount, min_term_months, max_term_months, processing_fee_pct, min_credit_score, requires_collateral, popularity) VALUES ('cairo', 'agriculture', 'Cairo Agri Credit', 17.5, 150000000, 6, 60, 1.4, 560, true, 62);

-- Account products
WITH new_account AS (INSERT INTO account_products (bank_id, account_type_slug, name, min_opening_balance, min_balance, monthly_fee, withdrawal_fee, interest_rate_pa) VALUES ('stanbic', 'savings', 'FlexiSave', 0, 0, 0, 5000, 3) RETURNING id) INSERT INTO account_product_requirements (account_product_id, requirement_text, sort_order) SELECT id, 'National ID', 0 FROM new_account UNION ALL SELECT id, 'Mobile number', 1 FROM new_account;
WITH new_account AS (INSERT INTO account_products (bank_id, account_type_slug, name, min_opening_balance, min_balance, monthly_fee, withdrawal_fee, interest_rate_pa) VALUES ('centenary', 'salary', 'CenteSalary', 0, 0, 0, 3000, 1) RETURNING id) INSERT INTO account_product_requirements (account_product_id, requirement_text, sort_order) SELECT id, 'National ID', 0 FROM new_account UNION ALL SELECT id, 'Employer letter', 1 FROM new_account;
WITH new_account AS (INSERT INTO account_products (bank_id, account_type_slug, name, min_opening_balance, min_balance, monthly_fee, withdrawal_fee, interest_rate_pa) VALUES ('absa', 'current', 'Current Account', 50000, 20000, 10000, 5000, 0) RETURNING id) INSERT INTO account_product_requirements (account_product_id, requirement_text, sort_order) SELECT id, 'National ID', 0 FROM new_account UNION ALL SELECT id, 'Proof of address', 1 FROM new_account;
WITH new_account AS (INSERT INTO account_products (bank_id, account_type_slug, name, min_opening_balance, min_balance, monthly_fee, withdrawal_fee, interest_rate_pa) VALUES ('dfcu', 'business', 'Business Account', 100000, 50000, 15000, 7000, 0) RETURNING id) INSERT INTO account_product_requirements (account_product_id, requirement_text, sort_order) SELECT id, 'National ID', 0 FROM new_account UNION ALL SELECT id, 'Business registration', 1 FROM new_account;
WITH new_account AS (INSERT INTO account_products (bank_id, account_type_slug, name, min_opening_balance, min_balance, monthly_fee, withdrawal_fee, interest_rate_pa) VALUES ('equity', 'savings', 'Equity Wallet Savings', 10000, 0, 0, 2000, 4) RETURNING id) INSERT INTO account_product_requirements (account_product_id, requirement_text, sort_order) SELECT id, 'National ID', 0 FROM new_account UNION ALL SELECT id, 'KYC details', 1 FROM new_account;
WITH new_account AS (INSERT INTO account_products (bank_id, account_type_slug, name, min_opening_balance, min_balance, monthly_fee, withdrawal_fee, interest_rate_pa) VALUES ('kcb', 'current', 'KCB Current Plus', 25000, 10000, 5000, 4000, 0) RETURNING id) INSERT INTO account_product_requirements (account_product_id, requirement_text, sort_order) SELECT id, 'National ID', 0 FROM new_account UNION ALL SELECT id, 'Proof of address', 1 FROM new_account;
WITH new_account AS (INSERT INTO account_products (bank_id, account_type_slug, name, min_opening_balance, min_balance, monthly_fee, withdrawal_fee, interest_rate_pa) VALUES ('ncba', 'savings', 'NCBA Savings One', 0, 0, 0, 2000, 3) RETURNING id) INSERT INTO account_product_requirements (account_product_id, requirement_text, sort_order) SELECT id, 'National ID', 0 FROM new_account;
WITH new_account AS (INSERT INTO account_products (bank_id, account_type_slug, name, min_opening_balance, min_balance, monthly_fee, withdrawal_fee, interest_rate_pa) VALUES ('postbank', 'salary', 'PostBank Salary Account', 0, 0, 0, 1000, 2) RETURNING id) INSERT INTO account_product_requirements (account_product_id, requirement_text, sort_order) SELECT id, 'National ID', 0 FROM new_account UNION ALL SELECT id, 'Employer letter', 1 FROM new_account;
WITH new_account AS (INSERT INTO account_products (bank_id, account_type_slug, name, min_opening_balance, min_balance, monthly_fee, withdrawal_fee, interest_rate_pa) VALUES ('bankofafrica', 'business', 'BOA Business Account', 100000, 50000, 8000, 5000, 0) RETURNING id) INSERT INTO account_product_requirements (account_product_id, requirement_text, sort_order) SELECT id, 'National ID', 0 FROM new_account UNION ALL SELECT id, 'Business registration', 1 FROM new_account;
WITH new_account AS (INSERT INTO account_products (bank_id, account_type_slug, name, min_opening_balance, min_balance, monthly_fee, withdrawal_fee, interest_rate_pa) VALUES ('tropical', 'savings', 'Tropical Saver', 0, 0, 0, 2000, 3) RETURNING id) INSERT INTO account_product_requirements (account_product_id, requirement_text, sort_order) SELECT id, 'National ID', 0 FROM new_account;

-- Insurance products
WITH new_policy AS (INSERT INTO insurance_products (bank_id, insurance_type_slug, underwriter_name, name, premium_rate_pct, min_cover_amount, max_cover_amount, excess_pct, claim_settlement_days, popularity) VALUES ('stanbic', 'life', 'Sanlam Life', 'Stanbic Life Shield', 1.2, 5000000, 500000000, 0, 14, 88) RETURNING id) INSERT INTO insurance_product_benefits (insurance_product_id, benefit_text, sort_order) SELECT id, 'Death & disability cover', 0 FROM new_policy UNION ALL SELECT id, 'Funeral expense benefit', 1 FROM new_policy UNION ALL SELECT id, 'No medical exam under 50M', 2 FROM new_policy;
WITH new_policy AS (INSERT INTO insurance_products (bank_id, insurance_type_slug, underwriter_name, name, premium_rate_pct, min_cover_amount, max_cover_amount, excess_pct, claim_settlement_days, popularity) VALUES ('centenary', 'health', 'Jubilee Health', 'Cente Medicare Plus', 4.5, 2000000, 100000000, 5, 7, 90) RETURNING id) INSERT INTO insurance_product_benefits (insurance_product_id, benefit_text, sort_order) SELECT id, 'Inpatient & outpatient', 0 FROM new_policy UNION ALL SELECT id, 'Maternity cover', 1 FROM new_policy UNION ALL SELECT id, 'Dental & optical add-on', 2 FROM new_policy;
WITH new_policy AS (INSERT INTO insurance_products (bank_id, insurance_type_slug, underwriter_name, name, premium_rate_pct, min_cover_amount, max_cover_amount, excess_pct, claim_settlement_days, popularity) VALUES ('absa', 'motor', 'UAP Old Mutual', 'Absa DriveGuard', 6, 5000000, 300000000, 10, 10, 85) RETURNING id) INSERT INTO insurance_product_benefits (insurance_product_id, benefit_text, sort_order) SELECT id, 'Comprehensive cover', 0 FROM new_policy UNION ALL SELECT id, 'Third-party liability', 1 FROM new_policy UNION ALL SELECT id, 'Windscreen cover', 2 FROM new_policy;
WITH new_policy AS (INSERT INTO insurance_products (bank_id, insurance_type_slug, underwriter_name, name, premium_rate_pct, min_cover_amount, max_cover_amount, excess_pct, claim_settlement_days, popularity) VALUES ('equity', 'home', 'Britam', 'Equity HomeSafe', 0.8, 10000000, 800000000, 5, 21, 76) RETURNING id) INSERT INTO insurance_product_benefits (insurance_product_id, benefit_text, sort_order) SELECT id, 'Fire & perils cover', 0 FROM new_policy UNION ALL SELECT id, 'Burglary cover', 1 FROM new_policy UNION ALL SELECT id, 'Alternative accommodation', 2 FROM new_policy;
WITH new_policy AS (INSERT INTO insurance_products (bank_id, insurance_type_slug, underwriter_name, name, premium_rate_pct, min_cover_amount, max_cover_amount, excess_pct, claim_settlement_days, popularity) VALUES ('dfcu', 'motor', 'APA Insurance', 'dfcu Motor Cover', 5.5, 5000000, 250000000, 10, 12, 82) RETURNING id) INSERT INTO insurance_product_benefits (insurance_product_id, benefit_text, sort_order) SELECT id, 'Comprehensive cover', 0 FROM new_policy UNION ALL SELECT id, 'Towing & recovery', 1 FROM new_policy UNION ALL SELECT id, 'Excess protector option', 2 FROM new_policy;
WITH new_policy AS (INSERT INTO insurance_products (bank_id, insurance_type_slug, underwriter_name, name, premium_rate_pct, min_cover_amount, max_cover_amount, excess_pct, claim_settlement_days, popularity) VALUES ('kcb', 'travel', 'ICEA LION', 'KCB TravelSafe', 2, 1000000, 50000000, 0, 5, 60) RETURNING id) INSERT INTO insurance_product_benefits (insurance_product_id, benefit_text, sort_order) SELECT id, 'Medical emergency abroad', 0 FROM new_policy UNION ALL SELECT id, 'Trip cancellation', 1 FROM new_policy UNION ALL SELECT id, 'Lost baggage cover', 2 FROM new_policy;
WITH new_policy AS (INSERT INTO insurance_products (bank_id, insurance_type_slug, underwriter_name, name, premium_rate_pct, min_cover_amount, max_cover_amount, excess_pct, claim_settlement_days, popularity) VALUES ('housing', 'home', 'Liberty Life', 'HFB Property Shield', 0.9, 15000000, 1000000000, 5, 18, 58) RETURNING id) INSERT INTO insurance_product_benefits (insurance_product_id, benefit_text, sort_order) SELECT id, 'Fire & perils cover', 0 FROM new_policy UNION ALL SELECT id, 'Flood cover add-on', 1 FROM new_policy UNION ALL SELECT id, 'Rent loss cover', 2 FROM new_policy;
WITH new_policy AS (INSERT INTO insurance_products (bank_id, insurance_type_slug, underwriter_name, name, premium_rate_pct, min_cover_amount, max_cover_amount, excess_pct, claim_settlement_days, popularity) VALUES ('standardchartered', 'life', 'Prudential', 'SC Priority Life', 1.5, 10000000, 1000000000, 0, 10, 70) RETURNING id) INSERT INTO insurance_product_benefits (insurance_product_id, benefit_text, sort_order) SELECT id, 'Whole life cover', 0 FROM new_policy UNION ALL SELECT id, 'Critical illness rider', 1 FROM new_policy UNION ALL SELECT id, 'Investment-linked option', 2 FROM new_policy;
WITH new_policy AS (INSERT INTO insurance_products (bank_id, insurance_type_slug, underwriter_name, name, premium_rate_pct, min_cover_amount, max_cover_amount, excess_pct, claim_settlement_days, popularity) VALUES ('ncba', 'health', 'Jubilee Health', 'NCBA MediCare', 4.2, 3000000, 150000000, 10, 9, 66) RETURNING id) INSERT INTO insurance_product_benefits (insurance_product_id, benefit_text, sort_order) SELECT id, 'Inpatient cover', 0 FROM new_policy UNION ALL SELECT id, 'Chronic condition management', 1 FROM new_policy UNION ALL SELECT id, 'Cashless hospital network', 2 FROM new_policy;
WITH new_policy AS (INSERT INTO insurance_products (bank_id, insurance_type_slug, underwriter_name, name, premium_rate_pct, min_cover_amount, max_cover_amount, excess_pct, claim_settlement_days, popularity) VALUES ('postbank', 'agriculture', 'APA Insurance', 'PostBank AgriShield', 3.5, 2000000, 80000000, 10, 15, 55) RETURNING id) INSERT INTO insurance_product_benefits (insurance_product_id, benefit_text, sort_order) SELECT id, 'Crop failure cover', 0 FROM new_policy UNION ALL SELECT id, 'Livestock cover', 1 FROM new_policy UNION ALL SELECT id, 'Weather index payouts', 2 FROM new_policy;
WITH new_policy AS (INSERT INTO insurance_products (bank_id, insurance_type_slug, underwriter_name, name, premium_rate_pct, min_cover_amount, max_cover_amount, excess_pct, claim_settlement_days, popularity) VALUES ('centenary', 'motor', 'UAP Old Mutual', 'Cente Motor Plus', 5.8, 5000000, 200000000, 10, 11, 79) RETURNING id) INSERT INTO insurance_product_benefits (insurance_product_id, benefit_text, sort_order) SELECT id, 'Comprehensive cover', 0 FROM new_policy UNION ALL SELECT id, 'Personal accident benefit', 1 FROM new_policy UNION ALL SELECT id, '24/7 roadside assistance', 2 FROM new_policy;
WITH new_policy AS (INSERT INTO insurance_products (bank_id, insurance_type_slug, underwriter_name, name, premium_rate_pct, min_cover_amount, max_cover_amount, excess_pct, claim_settlement_days, popularity) VALUES ('exim', 'health', 'Britam', 'Exim MediCover', 4.8, 2000000, 90000000, 10, 10, 48) RETURNING id) INSERT INTO insurance_product_benefits (insurance_product_id, benefit_text, sort_order) SELECT id, 'Inpatient & outpatient', 0 FROM new_policy UNION ALL SELECT id, 'Maternity cover', 1 FROM new_policy;
WITH new_policy AS (INSERT INTO insurance_products (bank_id, insurance_type_slug, underwriter_name, name, premium_rate_pct, min_cover_amount, max_cover_amount, excess_pct, claim_settlement_days, popularity) VALUES ('stanbic', 'home', 'Sanlam General', 'Stanbic HomeCover', 0.85, 20000000, 900000000, 5, 16, 62) RETURNING id) INSERT INTO insurance_product_benefits (insurance_product_id, benefit_text, sort_order) SELECT id, 'Fire & perils cover', 0 FROM new_policy UNION ALL SELECT id, 'Burglary cover', 1 FROM new_policy UNION ALL SELECT id, 'Domestic worker liability', 2 FROM new_policy;
WITH new_policy AS (INSERT INTO insurance_products (bank_id, insurance_type_slug, underwriter_name, name, premium_rate_pct, min_cover_amount, max_cover_amount, excess_pct, claim_settlement_days, popularity) VALUES ('bankofafrica', 'travel', 'ICEA LION', 'BOA Travel Assist', 1.8, 1000000, 40000000, 0, 6, 44) RETURNING id) INSERT INTO insurance_product_benefits (insurance_product_id, benefit_text, sort_order) SELECT id, 'Medical emergency abroad', 0 FROM new_policy UNION ALL SELECT id, 'Flight delay cover', 1 FROM new_policy;
WITH new_policy AS (INSERT INTO insurance_products (bank_id, insurance_type_slug, underwriter_name, name, premium_rate_pct, min_cover_amount, max_cover_amount, excess_pct, claim_settlement_days, popularity) VALUES ('im', 'life', 'Prudential', 'I&M SecureLife', 1.3, 5000000, 400000000, 0, 12, 50) RETURNING id) INSERT INTO insurance_product_benefits (insurance_product_id, benefit_text, sort_order) SELECT id, 'Death & disability cover', 0 FROM new_policy UNION ALL SELECT id, 'Education fund rider', 1 FROM new_policy;
WITH new_policy AS (INSERT INTO insurance_products (bank_id, insurance_type_slug, underwriter_name, name, premium_rate_pct, min_cover_amount, max_cover_amount, excess_pct, claim_settlement_days, popularity) VALUES ('equity', 'agriculture', 'Britam', 'Equity AgriGuard', 3.2, 2000000, 100000000, 10, 14, 57) RETURNING id) INSERT INTO insurance_product_benefits (insurance_product_id, benefit_text, sort_order) SELECT id, 'Crop failure cover', 0 FROM new_policy UNION ALL SELECT id, 'Drought index payouts', 1 FROM new_policy;