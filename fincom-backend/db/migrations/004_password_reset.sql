-- =====================================================================
-- 004: password reset tokens
-- Safe to run more than once.
--
-- We never store the token itself, only its SHA-256 hash, so a leaked
-- database cannot be used to reset anyone's password.
-- =====================================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash  CHAR(64) NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON password_reset_tokens (user_id, created_at DESC);