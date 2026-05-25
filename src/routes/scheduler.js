import { Router } from 'express';
import { getSchedulerStatus } from '../modules/scheduler/index.js';

export const schedulerRouter = Router();

schedulerRouter.get('/status', async (_req, res, next) => {
  try {
    res.json(await getSchedulerStatus());
  } catch (error) {
    next(error);
  }
});
