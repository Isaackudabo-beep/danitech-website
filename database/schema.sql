-- Dani-Tech application schema.
-- Run this migration against the Neon database before enabling the API.

CREATE TABLE IF NOT EXISTS contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  email varchar(255) NOT NULL,
  service varchar(100) NOT NULL DEFAULT '',
  message varchar(2000) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'read', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_submissions_created_at_idx
  ON contact_submissions (created_at DESC);

CREATE TABLE IF NOT EXISTS api_rate_limits (
  key_hash char(64) PRIMARY KEY,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0)
);

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL,
  slug varchar(140) NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  status varchar(40) NOT NULL DEFAULT '',
  website_url text,
  screenshot_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL,
  role varchar(120) NOT NULL,
  bio text NOT NULL DEFAULT '',
  image_url text,
  highlights jsonb NOT NULL DEFAULT '[]'::jsonb,
  social_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name varchar(120) NOT NULL,
  author_role varchar(160) NOT NULL DEFAULT '',
  quote text NOT NULL,
  image_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL,
  description text NOT NULL DEFAULT '',
  logo_url text,
  website_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);


