import { userProfile } from '../../config/profile.js';

const mustHave = ['.net', 'dotnet', 'asp.net', 'c#', 'aws', 'lambda', 'microservice', 'rest', 'sql'];
const rejectTerms = ['java only', 'manual testing', 'qa engineer', 'support engineer', 'night shift', 'internship'];

function normalize(value) {
  return String(value || '').toLowerCase();
}

function includesAny(text, terms) {
  return terms.some((term) => text.includes(term.toLowerCase()));
}

export function scoreJob(job) {
  const corpus = normalize(`${job.title} ${job.description} ${(job.tech_stack || []).join(' ')}`);
  const matchedSkills = userProfile.primarySkills.filter((skill) => {
    const skillText = normalize(skill).replace('amazon ', '');
    if (skill === '.NET Core') return corpus.includes('.net') || corpus.includes('dotnet');
    if (skill === 'S3') return corpus.includes('s3');
    if (skill === 'SNS') return corpus.includes('sns');
    return corpus.includes(skillText);
  });

  const missingSkills = userProfile.primarySkills.filter((skill) => !matchedSkills.includes(skill));
  const roleMatch = includesAny(corpus, userProfile.targetRoles) || /senior|lead|backend|cloud|full stack/.test(corpus);
  const awsMatch = /aws|lambda|serverless|dynamodb|s3|sns/.test(corpus);
  const dotnetMatch = /\.net|dotnet|asp\.net|c#/.test(corpus);
  const experienceMatch =
    Number(job.experience_min ?? 0) <= 8 && Number(job.experience_max ?? 99) >= 6;
  const salaryMatch =
    job.salary_min_lpa == null ||
    job.salary_max_lpa == null ||
    Number(job.salary_max_lpa) >= userProfile.expectedSalaryLpa.min;
  const locationMatch = /noida|remote|hybrid|gurgaon|gurugram|delhi ncr|india/.test(
    normalize(`${job.location} ${job.work_mode}`)
  );
  const hasRejectTerm = rejectTerms.some((term) => corpus.includes(term));

  const breakdown = {
    skills: Math.round((matchedSkills.length / userProfile.primarySkills.length) * 35),
    role: roleMatch ? 15 : 0,
    cloud: awsMatch ? 15 : 0,
    dotnet: dotnetMatch ? 15 : 0,
    experience: experienceMatch ? 10 : 0,
    salary: salaryMatch ? 5 : 0,
    location: locationMatch ? 5 : 0,
    penalties: hasRejectTerm ? -30 : 0
  };

  const rawScore = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  const score = Math.max(0, Math.min(100, rawScore));

  return {
    score,
    breakdown,
    matchedKeywords: [...new Set([...matchedSkills, ...mustHave.filter((term) => corpus.includes(term))])],
    missingKeywords: missingSkills,
    disqualifying: hasRejectTerm
  };
}
