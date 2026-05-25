import {
  importNaukriAlertText,
  importNaukriUrl,
  naukriConnectionStatus,
  searchNaukriJobs
} from '../services/naukriService.js';

export async function getNaukriStatus(_req, res, next) {
  try {
    res.json(await naukriConnectionStatus());
  } catch (error) {
    next(error);
  }
}

export async function searchNaukri(req, res, next) {
  try {
    res.json(
      await searchNaukriJobs({
        keyword: req.query.keyword,
        location: req.query.location,
        experience: req.query.experience
      })
    );
  } catch (error) {
    next(error);
  }
}

export async function importNaukriJobUrl(req, res, next) {
  try {
    res.json(await importNaukriUrl(req.body.url, req.body.details || {}));
  } catch (error) {
    next(error);
  }
}

export async function importNaukriAlert(req, res, next) {
  try {
    res.json(await importNaukriAlertText(req.body.text || ''));
  } catch (error) {
    next(error);
  }
}
