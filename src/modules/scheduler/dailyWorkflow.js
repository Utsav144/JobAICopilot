import { env } from '../../config/env.js';
import { query, withTransaction } from '../../db/pool.js';
import { logger } from '../logging/logger.js';
import { fetchJobsFromSources } from '../jobs/sources.js';
import { filterJob } from '../jobs/filter.js';
import { recordAtsScore, updateJobStatus, upsertJob } from '../jobs/repository.js';
import { tailorResume } from '../resume/tailor.js';
import { generateRecruiterMessage } from '../outreach/message.js';
import { assistApplication } from '../automation/playwrightAgent.js';
import { sendDailyEmailReport } from '../reporting/emailReport.js';

export async function runDailyWorkflow() {
  logger.info('Starting daily job application workflow');
  const jobs = await fetchJobsFromSources();
  const results = [];

  for (const rawJob of jobs) {
    const job = await upsertJob(rawJob);
    const filtered = filterJob(job, env.MIN_ATS_SCORE);
    await recordAtsScore(job.id, filtered.ats);

    if (!filtered.accepted) {
      await updateJobStatus(job.id, 'rejected', filtered.reasons.join('; '));
      results.push({ jobId: job.id, status: 'rejected', reasons: filtered.reasons, score: filtered.ats.score });
      continue;
    }

    await withTransaction(async (client) => {
      await client.query('UPDATE jobs SET status = $1, rejection_reason = NULL WHERE id = $2', ['qualified', job.id]);
      const resume = await tailorResume(job, filtered.ats);
      const resumeResult = await client.query(
        `INSERT INTO resume_versions (job_id, file_path, content, tailored_keywords, notes)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [job.id, resume.filePath, resume.content, resume.tailoredKeywords, resume.notes]
      );
      const message = generateRecruiterMessage(job);
      const messageResult = await client.query(
        `INSERT INTO recruiter_messages (job_id, recruiter_name, message)
         VALUES ($1, $2, $3) RETURNING id`,
        [job.id, null, message]
      );
      await client.query(
        `INSERT INTO applications (job_id, resume_version_id, recruiter_message_id, status)
         VALUES ($1, $2, $3, 'queued')
         ON CONFLICT (job_id) DO NOTHING`,
        [job.id, resumeResult.rows[0].id, messageResult.rows[0].id]
      );
    });

    results.push({ jobId: job.id, status: 'queued', score: filtered.ats.score });
  }

  await enforceDailyLimit();

  if (env.AUTO_ASSIST_APPLICATIONS) {
    results.push(...(await assistQueuedApplications()));
  }

  const emailReport = await sendDailyEmailReport(results);
  logger.info({ results, emailReport }, 'Daily workflow finished');
  return results;
}

async function enforceDailyLimit() {
  const result = await query(
    `UPDATE applications
     SET status = 'held_daily_limit'
     WHERE id IN (
       SELECT id FROM applications
       WHERE status = 'queued'
       ORDER BY created_at DESC
       OFFSET $1
     )`,
    [env.MAX_APPLICATIONS_PER_DAY]
  );
  return result.rowCount;
}


async function assistQueuedApplications() {
  const result = await query(
    `SELECT a.id AS application_id, a.*, j.*, rv.file_path, rm.message AS recruiter_message
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     LEFT JOIN resume_versions rv ON rv.id = a.resume_version_id
     LEFT JOIN recruiter_messages rm ON rm.id = a.recruiter_message_id
     WHERE a.status = 'queued'
     ORDER BY a.created_at ASC
     LIMIT $1`,
    [env.MAX_APPLICATIONS_PER_DAY]
  );

  const results = [];
  for (const application of result.rows) {
    if (!application.file_path) {
      results.push({
        applicationId: application.application_id,
        jobId: application.job_id,
        status: 'needs_human',
        reason: 'No tailored resume file is available.'
      });
      continue;
    }

    const automationResult = await assistApplication({
      job: application,
      resumePath: application.file_path,
      recruiterMessage: application.recruiter_message || ''
    });

    await query(
      `UPDATE applications
       SET status = $1, notes = $2, updated_at = now(),
           submitted_at = CASE WHEN $1 = 'submitted' THEN now() ELSE submitted_at END
       WHERE id = $3`,
      [automationResult.status, automationResult.reason, application.application_id]
    );

    results.push({
      applicationId: application.application_id,
      jobId: application.job_id,
      status: automationResult.status,
      reason: automationResult.reason
    });
  }

  return results;
}
