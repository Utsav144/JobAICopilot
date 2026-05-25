CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  "current_role" TEXT NOT NULL,
  current_company TEXT NOT NULL,
  experience_years NUMERIC NOT NULL,
  location_preference TEXT[] NOT NULL,
  work_preference TEXT[] NOT NULL,
  expected_salary_min_lpa NUMERIC NOT NULL,
  expected_salary_max_lpa NUMERIC NOT NULL,
  primary_skills TEXT[] NOT NULL,
  target_roles TEXT[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_sources (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobs (
  id BIGSERIAL PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_job_id TEXT,
  source_url TEXT NOT NULL,
  company TEXT NOT NULL,
  title TEXT NOT NULL,
  location TEXT,
  work_mode TEXT,
  salary_min_lpa NUMERIC,
  salary_max_lpa NUMERIC,
  experience_min NUMERIC,
  experience_max NUMERIC,
  description TEXT NOT NULL,
  tech_stack TEXT[] NOT NULL DEFAULT '{}',
  is_mnc BOOLEAN NOT NULL DEFAULT false,
  employee_count INTEGER,
  status TEXT NOT NULL DEFAULT 'discovered',
  rejection_reason TEXT,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_url)
);

CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs(status);
CREATE INDEX IF NOT EXISTS jobs_company_idx ON jobs(company);

CREATE TABLE IF NOT EXISTS ats_scores (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  breakdown JSONB NOT NULL,
  matched_keywords TEXT[] NOT NULL DEFAULT '{}',
  missing_keywords TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resume_versions (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT REFERENCES jobs(id) ON DELETE SET NULL,
  file_path TEXT,
  content TEXT NOT NULL,
  tailored_keywords TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recruiter_messages (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT REFERENCES jobs(id) ON DELETE CASCADE,
  recruiter_name TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS applications (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  resume_version_id BIGINT REFERENCES resume_versions(id) ON DELETE SET NULL,
  recruiter_message_id BIGINT REFERENCES recruiter_messages(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  submitted_at TIMESTAMPTZ,
  external_application_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id)
);

CREATE TABLE IF NOT EXISTS application_events (
  id BIGSERIAL PRIMARY KEY,
  application_id BIGINT REFERENCES applications(id) ON DELETE CASCADE,
  job_id BIGINT REFERENCES jobs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
