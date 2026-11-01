-- =====================================================================
-- 005: Bank of Uganda quarterly "interest rates and bank charges" table
-- Safe to run more than once.
--
-- One row in bou_editions per published edition (for example 2026-04-01),
-- and one row in bank_rate_snapshots per bank and rate in that edition.
-- Old editions are kept, which is what lets the dashboard show movement.
-- =====================================================================
CREATE TABLE IF NOT EXISTS bou_editions (
    as_at        DATE PRIMARY KEY,
    source_url   TEXT,
    imported_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bank_rate_snapshots (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    as_at       DATE NOT NULL REFERENCES bou_editions (as_at) ON DELETE CASCADE,
    bank_id     TEXT NOT NULL REFERENCES banks (id) ON DELETE CASCADE,
    metric      VARCHAR(30) NOT NULL,   -- e.g. savings_max, lending_min, plr
    raw_text    TEXT NOT NULL,          -- the cell exactly as the BoU printed it
    kind        VARCHAR(12) NOT NULL,   -- percent | plr | text | negotiable | na
    value_pct   NUMERIC(8,3),           -- for kind = percent
    margin_pct  NUMERIC(8,3),           -- for kind = plr (PLR + margin)
    period      VARCHAR(2),             -- pa (per year) or pm (per month)
    UNIQUE (as_at, bank_id, metric)
);
CREATE INDEX IF NOT EXISTS idx_bank_rate_snapshots_bank ON bank_rate_snapshots (bank_id, metric, as_at DESC);