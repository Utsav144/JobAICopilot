import { query } from '../../db/pool.js';

export async function upsertJob(job) {
  const result = await query(
    `INSERT INTO jobs (
      source_name, source_job_id, source_url, company, title, location, work_mode,
      salary_min_lpa, salary_max_lpa, experience_min, experience_max, description,
      tech_stack, is_mnc, employee_count, posted_at, source_fetch_status, source_notes
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
    ON CONFLICT (source_url) DO UPDATE SET
      source_name = EXCLUDED.source_name,
      source_job_id = EXCLUDED.source_job_id,
      company = EXCLUDED.company,
      title = EXCLUDED.title,
      location = EXCLUDED.location,
      work_mode = EXCLUDED.work_mode,
      salary_min_lpa = EXCLUDED.salary_min_lpa,
      salary_max_lpa = EXCLUDED.salary_max_lpa,
      experience_min = EXCLUDED.experience_min,
      experience_max = EXCLUDED.experience_max,
      description = EXCLUDED.description,
      tech_stack = EXCLUDED.tech_stack,
      is_mnc = EXCLUDED.is_mnc,
      employee_count = EXCLUDED.employee_count,
      posted_at = COALESCE(EXCLUDED.posted_at, jobs.posted_at),
      source_fetch_status = EXCLUDED.source_fetch_status,
      source_notes = EXCLUDED.source_notes,
      discovered_at = now()
    RETURNING *`,
    [
      job.source_name,
      job.source_job_id,
      job.source_url,
      job.company,
      job.title,
      job.location,
      job.work_mode,
      job.salary_min_lpa,
      job.salary_max_lpa,
      job.experience_min,
      job.experience_max,
      job.description,
      job.tech_stack || [],
      Boolean(job.is_mnc),
      job.employee_count || null,
      job.posted_at || null,
      job.source_fetch_status || 'fetched',
      job.source_notes || null
    ]
  );
  return result.rows[0];
}

export async function recordAtsScore(jobId, ats) {
  await query(
    `INSERT INTO ats_scores (job_id, score, breakdown, matched_keywords, missing_keywords)
     VALUES ($1, $2, $3, $4, $5)`,
    [jobId, ats.score, ats.breakdown, ats.matchedKeywords, ats.missingKeywords]
  );
}

export async function updateJobStatus(jobId, status, rejectionReason = null) {
  await query('UPDATE jobs SET status = $1, rejection_reason = $2 WHERE id = $3', [
    status,
    rejectionReason,
    jobId
  ]);
}

export async function listJobs(status) {
  const params = [];
  let sql = 'SELECT * FROM jobs';
  if (status) {
    params.push(status);
    sql += ' WHERE status = $1';
  }
  sql += ' ORDER BY discovered_at DESC LIMIT 200';
  const result = await query(sql, params);
  return result.rows;
}
