import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';
import { logger } from '../modules/logging/logger.js';
import { startScheduler } from '../modules/scheduler/index.js';
import { jobsRouter } from '../routes/jobs.js';
import { applicationsRouter } from '../routes/applications.js';
import { workflowsRouter } from '../routes/workflows.js';
import { naukriRoutes } from '../routes/naukriRoutes.js';
import { schedulerRouter } from '../routes/scheduler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(pinoHttp({ logger }));
app.use(express.static(path.join(root, 'public')));

app.use('/api/jobs', jobsRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/workflows', workflowsRouter);
app.use('/api/naukri', naukriRoutes);
app.use('/api/scheduler', schedulerRouter);

app.get('*', (_req, res) => {
  res.sendFile(path.join(root, 'public/index.html'));
});

app.use((error, _req, res, _next) => {
  logger.error({ error }, 'Request failed');
  res.status(500).json({ error: error.message || 'Internal server error' });
});

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'Job Application Agent API started');
  startScheduler();
});
