import { runDailyWorkflow } from './dailyWorkflow.js';
import { pool } from '../../db/pool.js';

try {
  const results = await runDailyWorkflow();
  console.log(JSON.stringify(results, null, 2));
} finally {
  await pool.end();
}
