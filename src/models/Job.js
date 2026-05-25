import { query } from '../db/pool.js';
import { upsertJob } from '../modules/jobs/repository.js';

export class Job {
  static async upsert(job) {
    return upsertJob(job);
  }

  static async findByUrl(sourceUrl) {
    const result = await query('SELECT * FROM jobs WHERE source_url = $1', [sourceUrl]);
    return result.rows[0] || null;
  }

  static async sourceStatus(sourceName) {
    const result = await query(
      `SELECT
         count(*)::int AS total,
         count(*) FILTER (WHERE source_fetch_status = 'fetched')::int AS fetched,
         count(*) FILTER (WHERE source_fetch_status = 'skipped')::int AS skipped,
         count(*) FILTER (WHERE source_fetch_status = 'blocked')::int AS blocked,
         count(*) FILTER (WHERE source_fetch_status = 'manual_required')::int AS manual_required,
         max(discovered_at) AS last_seen
       FROM jobs
       WHERE source_name = $1`,
      [sourceName]
    );
    return result.rows[0];
  }
}
