ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source_fetch_status TEXT,
  ADD COLUMN IF NOT EXISTS source_notes TEXT;

CREATE INDEX IF NOT EXISTS jobs_source_name_idx ON jobs(source_name);
CREATE INDEX IF NOT EXISTS jobs_source_fetch_status_idx ON jobs(source_fetch_status);
