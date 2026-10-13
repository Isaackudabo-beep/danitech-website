-- Additive admin-auth migration for databases where database/schema.sql is already applied.
-- Creates only admin authentication/session and login-rate-limit objects; no existing rows are changed.

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL UNIQUE,
  password_salt char(32) NOT NULL,
  password_hash char(128) NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash char(64) PRIMARY KEY,
  csrf_token varchar(64) NOT NULL,
  admin_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_sessions_expiry_idx
  ON admin_sessions (expires_at);

CREATE TABLE IF NOT EXISTS admin_login_limits (
  key_hash char(64) PRIMARY KEY,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0)
);
