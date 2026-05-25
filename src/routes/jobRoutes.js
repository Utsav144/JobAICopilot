import { Router } from 'express';
import {
  getNaukriStatus,
  importNaukriAlert,
  importNaukriJobUrl,
  searchNaukri
} from '../controllers/jobController.js';

export const jobRoutes = Router();

jobRoutes.get('/sources/naukri/status', getNaukriStatus);
jobRoutes.get('/sources/naukri/search', searchNaukri);
jobRoutes.post('/sources/naukri/import-url', importNaukriJobUrl);
jobRoutes.post('/sources/naukri/import-alert', importNaukriAlert);
