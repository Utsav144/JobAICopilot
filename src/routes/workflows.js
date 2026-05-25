import { Router } from 'express';
import { env } from '../config/env.js';
import { runDemoDailyWorkflow } from '../modules/demo/store.js';
import { runDailyWorkflow } from '../modules/scheduler/dailyWorkflow.js';
import { sendDailyEmailReport } from '../modules/reporting/emailReport.js';

export const workflowsRouter = Router();

workflowsRouter.post('/daily', async (_req, res, next) => {
  try {
    res.json({ results: await runDailyWorkflow() });
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      res.set('X-Data-Mode', 'demo');
      const results = await runDemoDailyWorkflow(env.MIN_ATS_SCORE);
      const emailReport = await sendDailyEmailReport(results);
      res.json({ mode: 'demo', results, emailReport });
      return;
    }
    next(error);
  }
});
