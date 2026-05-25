import { env } from '../../config/env.js';
import { userProfile } from '../../config/profile.js';
import { scoreJob } from '../ats/scorer.js';

const blockedTerms = [
  'java only',
  'frontend only',
  'react only',
  'qa',
  'testing',
  'support',
  'intern',
  'night shift',
  'contract only'
];

const knownMncAliases = new Set(userProfile.targetCompanies.map((company) => company.toLowerCase()));

export function filterJob(job, minAtsScore = 75) {
  const text = `${job.company} ${job.title} ${job.location || ''} ${job.work_mode || ''} ${job.description}`.toLowerCase();
  const reasons = [];

  const isKnownMnc = knownMncAliases.has(String(job.company).toLowerCase()) || job.employee_count >= 1000 || job.is_mnc;
  if (env.REQUIRE_VERIFIED_MNC && !isKnownMnc) {
    reasons.push('Company is not a verified MNC or 1000+ employee employer');
  }

  if (blockedTerms.some((term) => text.includes(term))) {
    reasons.push('Rejected keyword found');
  }

  if (job.experience_min != null && job.experience_max != null) {
    if (Number(job.experience_min) > 8 || Number(job.experience_max) < 6) {
      reasons.push('Experience range is outside 6-10 years');
    }
  }

  if (!/noida|remote|hybrid|delhi ncr|india/.test(text)) {
    reasons.push('Location is not Noida, Remote, or Hybrid compatible');
  }

  const ats = scoreJob(job);
  if (ats.score < minAtsScore) reasons.push(`ATS score ${ats.score} is below ${minAtsScore}`);
  if (ats.disqualifying) reasons.push('Disqualifying role type found');

  return {
    accepted: reasons.length === 0,
    reasons,
    ats
  };
}
