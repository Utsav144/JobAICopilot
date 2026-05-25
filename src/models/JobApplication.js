import { query } from '../db/pool.js';

export class JobApplication {
  static async createSession({ filters, targetMin = 15, targetMax = 25 }) {
    const result = await query(
      `INSERT INTO naukri_automation_sessions (status, filters, target_min, target_max, current_message)
       VALUES ('starting', $1, $2, $3, $4)
       RETURNING *`,
      [filters, targetMin, targetMax, 'Starting browser-assisted Naukri automation.']
    );
    return result.rows[0];
  }

  static async updateSession(id, updates) {
    const fields = [];
    const values = [];
    let index = 1;
    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = $${index}`);
      values.push(value);
      index += 1;
    }
    fields.push('updated_at = now()');
    values.push(id);
    const result = await query(
      `UPDATE naukri_automation_sessions SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async recordAction(sessionId, action) {
    const result = await query(
      `INSERT INTO naukri_application_actions (
         session_id, job_url, title, company, location, experience, salary,
         skills, posted_date, score, status, reason, screenshot_path
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (session_id, job_url) DO UPDATE SET
         title = EXCLUDED.title,
         company = EXCLUDED.company,
         location = EXCLUDED.location,
         experience = EXCLUDED.experience,
         salary = EXCLUDED.salary,
         skills = EXCLUDED.skills,
         posted_date = EXCLUDED.posted_date,
         score = EXCLUDED.score,
         status = EXCLUDED.status,
         reason = EXCLUDED.reason,
         screenshot_path = EXCLUDED.screenshot_path
       RETURNING *`,
      [
        sessionId,
        action.job_url,
        action.title || '',
        action.company || '',
        action.location || '',
        action.experience || '',
        action.salary || '',
        action.skills || [],
        action.posted_date || '',
        action.score || 0,
        action.status,
        action.reason || '',
        action.screenshot_path || null
      ]
    );
    return result.rows[0];
  }

  static async latestSession() {
    const result = await query(
      'SELECT * FROM naukri_automation_sessions ORDER BY started_at DESC LIMIT 1'
    );
    return result.rows[0] || null;
  }

  static async listActions(sessionId) {
    const result = await query(
      `SELECT * FROM naukri_application_actions
       WHERE session_id = $1
       ORDER BY created_at DESC, id DESC`,
      [sessionId]
    );
    return result.rows;
  }

  static async buildReport(sessionId) {
    const session = await this.getSession(sessionId);
    const cleanSession = session ? { ...session, report: undefined } : null;
    const actions = await this.listActions(sessionId);
    return {
      session: cleanSession,
      summary: {
        totalScanned: actions.length,
        totalApplied: actions.filter((item) => item.status === 'applied').length,
        totalSkipped: actions.filter((item) => item.status === 'skipped').length,
        totalFailed: actions.filter((item) => item.status === 'failed').length,
        totalManualRequired: actions.filter((item) => item.status === 'manual_required').length
      },
      applied: actions.filter((item) => item.status === 'applied'),
      skipped: actions.filter((item) => item.status === 'skipped'),
      failed: actions.filter((item) => item.status === 'failed'),
      manualRequired: actions.filter((item) => item.status === 'manual_required'),
      actions
    };
  }

  static async getSession(id) {
    const result = await query('SELECT * FROM naukri_automation_sessions WHERE id = $1', [id]);
    return result.rows[0] || null;
  }
}
