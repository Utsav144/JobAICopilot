import { Router } from 'express';
import { query } from '../db/pool.js';
import { assistApplication } from '../modules/automation/playwrightAgent.js';
import { listDemoApplications, updateDemoApplicationStatus } from '../modules/demo/store.js';

export const applicationsRouter = Router();

applicationsRouter.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT a.*, j.company, j.title, j.location, j.source_url
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       ORDER BY a.created_at DESC
       LIMIT 200`
    );
    res.json(result.rows);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      res.set('X-Data-Mode', 'demo');
      res.json(listDemoApplications(req.query.status));
      return;
    }
    next(error);
  }
});

applicationsRouter.patch('/:id/status', async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE applications
       SET status = $1, notes = COALESCE($2, notes), updated_at = now(),
           submitted_at = CASE WHEN $1 = 'submitted' THEN now() ELSE submitted_at END
       WHERE id = $3
       RETURNING *`,
      [req.body.status, req.body.notes || null, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      const application = updateDemoApplicationStatus(req.params.id, req.body.status, req.body.notes);
      if (!application) return res.status(404).json({ error: 'Application not found' });
      res.set('X-Data-Mode', 'demo');
      res.json(application);
      return;
    }
    next(error);
  }
});

applicationsRouter.post('/:id/assist', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT a.*, j.*, rv.file_path, rm.message AS recruiter_message
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       LEFT JOIN resume_versions rv ON rv.id = a.resume_version_id
       LEFT JOIN recruiter_messages rm ON rm.id = a.recruiter_message_id
       WHERE a.id = $1`,
      [req.params.id]
    );
    const application = result.rows[0];
    if (!application) return res.status(404).json({ error: 'Application not found' });
    if (!application.file_path) return res.status(409).json({ error: 'No generated resume file exists' });

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
      [automationResult.status, automationResult.reason, req.params.id]
    );

    res.json(automationResult);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      const application = updateDemoApplicationStatus(
        req.params.id,
        'ready_for_review',
        'Demo mode: Postgres is unavailable, so browser-assisted submission was skipped.'
      );
      if (!application) return res.status(404).json({ error: 'Application not found' });
      res.set('X-Data-Mode', 'demo');
      res.json({ status: 'ready_for_review', reason: application.notes });
      return;
    }
    next(error);
  }
});
