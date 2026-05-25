import { Router } from 'express';
import { continueManual, report, start, status, stop } from '../controllers/naukriController.js';

export const naukriRoutes = Router();

naukriRoutes.post('/start', start);
naukriRoutes.post('/stop', stop);
naukriRoutes.get('/status', status);
naukriRoutes.get('/report', report);
naukriRoutes.post('/continue-after-manual-action', continueManual);
