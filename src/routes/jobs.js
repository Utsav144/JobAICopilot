import { Router } from 'express';
import { env } from '../config/env.js';
import { query } from '../db/pool.js';
import { listJobs } from '../modules/jobs/repository.js';
import { filterJob } from '../modules/jobs/filter.js';
import { listDemoJobs } from '../modules/demo/store.js';
import { withTransaction } from '../db/pool.js';
import { tailorResume } from '../modules/resume/tailor.js';
import { generateRecruiterMessage } from '../modules/outreach/message.js';

export const jobsRouter = Router();

jobsRouter.get('/', async (req, res, next) => {
  try {
    res.json(await listJobs(req.query.status));
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      res.set('X-Data-Mode', 'demo');
      res.json(listDemoJobs(req.query.status));
      return;
    }
    next(error);
  }
});

jobsRouter.post('/score', async (req, res, next) => {
  try {
    res.json(filterJob(req.body, env.MIN_ATS_SCORE));
  } catch (error) {
    next(error);
  }
});

jobsRouter.post('/:id/queue', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM jobs WHERE id = $1', [req.params.id]);
    const job = result.rows[0];
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const queued = await withTransaction(async (client) => {
      await client.query('UPDATE jobs SET status = $1, rejection_reason = NULL WHERE id = $2', ['qualified', job.id]);
      const resume = await tailorResume(job, { missingKeywords: [] });
      const resumeResult = await client.query(
        `INSERT INTO resume_versions (job_id, file_path, content, tailored_keywords, notes)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [job.id, resume.filePath, resume.content, resume.tailoredKeywords, 'Queued manually from rejected list. ' + resume.notes]
      );
      const message = generateRecruiterMessage(job);
      const messageResult = await client.query(
        `INSERT INTO recruiter_messages (job_id, recruiter_name, message)
         VALUES ($1, $2, $3) RETURNING id`,
        [job.id, null, message]
      );
      const applicationResult = await client.query(
        `INSERT INTO applications (job_id, resume_version_id, recruiter_message_id, status, notes)
         VALUES ($1, $2, $3, 'queued', $4)
         ON CONFLICT (job_id) DO UPDATE SET
           status = 'queued',
           resume_version_id = EXCLUDED.resume_version_id,
           recruiter_message_id = EXCLUDED.recruiter_message_id,
           notes = EXCLUDED.notes,
           updated_at = now()
         RETURNING *`,
        [job.id, resumeResult.rows[0].id, messageResult.rows[0].id, 'Queued manually despite rejection reason.']
      );
      return applicationResult.rows[0];
    });

    res.json({ status: 'queued', application: queued });
  } catch (error) {
    next(error);
  }
});

jobsRouter.get('/:id', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT j.*, s.score, s.breakdown, s.matched_keywords, s.missing_keywords
       FROM jobs j
       LEFT JOIN LATERAL (
         SELECT * FROM ats_scores WHERE job_id = j.id ORDER BY created_at DESC LIMIT 1
       ) s ON true
       WHERE j.id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Job not found' });
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});
