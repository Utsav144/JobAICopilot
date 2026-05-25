CREATE TABLE IF NOT EXISTS email_report_sends (
  report_date DATE PRIMARY KEY,
  submitted_count INTEGER NOT NULL DEFAULT 0,
  provider TEXT,
  message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
