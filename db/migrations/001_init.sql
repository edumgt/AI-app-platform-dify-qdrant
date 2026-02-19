CREATE TABLE IF NOT EXISTS users (
  id              BIGSERIAL PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'user', -- user|admin
  status          TEXT NOT NULL DEFAULT 'active', -- active|blocked
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_apps (
  id              BIGSERIAL PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  dify_app_type   TEXT NOT NULL DEFAULT 'workflow', -- workflow|chat
  dify_app_id     TEXT NOT NULL DEFAULT '',
  input_schema    JSONB NOT NULL DEFAULT '{}'::jsonb,
  plan_required   TEXT NOT NULL DEFAULT 'free',
  is_published    BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_runs (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app_id          BIGINT NOT NULL REFERENCES ai_apps(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'running', -- running|success|failed
  inputs          JSONB NOT NULL DEFAULT '{}'::jsonb,
  outputs         JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message   TEXT,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at        TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS user_api_keys (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL, -- e.g. openai, anthropic, etc
  key_ciphertext  TEXT NOT NULL,
  key_hint        TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  rotated_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS uploads (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  run_id          BIGINT REFERENCES app_runs(id) ON DELETE SET NULL,
  file_name       TEXT NOT NULL,
  file_path       TEXT NOT NULL,
  mime_type       TEXT,
  size_bytes      BIGINT,
  expires_at      TIMESTAMPTZ NOT NULL,
  destroyed_at    TIMESTAMPTZ,
  destroy_reason  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL DEFAULT 'tbd',
  amount          BIGINT NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'KRW',
  status          TEXT NOT NULL DEFAULT 'created', -- created|paid|failed|refunded
  pg_tx_id        TEXT,
  raw_webhook     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS migrations (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
