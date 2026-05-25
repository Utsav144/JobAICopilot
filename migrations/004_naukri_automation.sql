CREATE TABLE IF NOT EXISTS naukri_automation_sessions (
  id BIGSERIAL PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'idle',
  filters JSONB NOT NULL DEFAULT '{}',
  target_min INTEGER NOT NULL DEFAULT 15,
  target_max INTEGER NOT NULL DEFAULT 25,
  scanned_count INTEGER NOT NULL DEFAULT 0,
  applied_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  manual_required_count INTEGER NOT NULL DEFAULT 0,
  current_message TEXT,
  report JSONB NOT NULL DEFAULT '{}',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS naukri_application_actions (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT NOT NULL REFERENCES naukri_automation_sessions(id) ON DELETE CASCADE,
  job_url TEXT NOT NULL,
  title TEXT,
  company TEXT,
  location TEXT,
  experience TEXT,
  salary TEXT,
  skills TEXT[] NOT NULL DEFAULT '{}',
  posted_date TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  reason TEXT,
  screenshot_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, job_url)
);

CREATE INDEX IF NOT EXISTS naukri_sessions_status_idx ON naukri_automation_sessions(status);
CREATE INDEX IF NOT EXISTS naukri_actions_session_status_idx ON naukri_application_actions(session_id, status);
