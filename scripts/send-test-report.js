import { sendDailyEmailReport } from '../src/modules/reporting/emailReport.js';
import { pool } from '../src/db/pool.js';

try {
  const result = await sendDailyEmailReport(
    [
      {
        status: 'submitted',
        applicationId: 'sample',
        reason: 'Manual preview email requested.'
      },
      {
        status: 'needs_human',
        applicationId: 'sample',
        jobId: 'sample',
        reason: 'Captcha or human verification detected. Automation paused safely.'
      },
      {
        status: 'queued',
        jobId: 'sample',
        score: 82,
        reason: 'Resume and recruiter message prepared for the next automation pass.'
      },
      {
        status: 'rejected',
        jobId: 'sample',
        score: 35,
        reasons: ['ATS score is below threshold', 'Location is not Noida, Remote, or Hybrid compatible']
      }
    ],
    { force: true, submittedToday: [] }
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  await pool.end();
}
