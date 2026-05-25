import {
  continueAfterManualAction,
  getNaukriAutomationReport,
  getNaukriAutomationStatus,
  startNaukriAutomation,
  stopNaukriAutomation
} from '../services/naukriAutomationService.js';

export async function start(req, res, next) {
  try {
    res.status(202).json(await startNaukriAutomation(req.body || {}));
  } catch (error) {
    next(error);
  }
}

export async function status(_req, res, next) {
  try {
    res.json(await getNaukriAutomationStatus());
  } catch (error) {
    next(error);
  }
}

export async function stop(_req, res, next) {
  try {
    res.json(await stopNaukriAutomation());
  } catch (error) {
    next(error);
  }
}

export async function report(_req, res, next) {
  try {
    const data = await getNaukriAutomationReport();
    if (!data) return res.status(404).json({ error: 'No Naukri automation report exists yet.' });
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function continueManual(_req, res, next) {
  try {
    res.json(await continueAfterManualAction());
  } catch (error) {
    next(error);
  }
}
