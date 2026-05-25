const DEFAULT_FILTERS = {
  titles: [
    '.NET Developer',
    '.NET Core Developer',
    'Senior .NET Developer',
    'Full Stack .NET Developer',
    'AWS .NET Developer'
  ],
  locations: ['Noida', 'Remote', 'Hybrid Noida', 'Delhi NCR'],
  experienceMin: 6,
  experienceMax: 9,
  salaryMinLpa: 22,
  salaryMaxLpa: 24,
  skills: [
    '.NET Core',
    'C#',
    'ASP.NET Core',
    'Web API',
    'SQL Server',
    'AWS',
    'Lambda',
    'S3',
    'JavaScript',
    'Angular',
    'Node.js'
  ],
  mncPreferred: true,
  threshold: 60
};

const KNOWN_MNC_HINTS = [
  'accenture',
  'tcs',
  'infosys',
  'wipro',
  'hcl',
  'cognizant',
  'capgemini',
  'deloitte',
  'ibm',
  'microsoft',
  'oracle',
  'epam',
  'ltimindtree',
  'tech mahindra',
  'coforge',
  'persistent',
  'birlasoft',
  'global',
  'technologies',
  'systems'
];

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\bdot\s*net\b/g, '.net')
    .replace(/\basp\s*dot\s*net\b/g, 'asp.net')
    .replace(/\bnode\s*js\b/g, 'node.js')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseExperience(value = '') {
  const match = String(value).match(/(\d+)\s*[-–]\s*(\d+)|(\d+)\s*\+?\s*(?:yrs|years|yr)/i);
  if (!match) return { min: null, max: null };
  if (match[1] && match[2]) return { min: Number(match[1]), max: Number(match[2]) };
  const single = Number(match[3]);
  return { min: single, max: single };
}

function parseSalary(value = '') {
  const match = String(value).match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*(?:lpa|lac|lakh)/i);
  if (!match) return { min: null, max: null };
  return { min: Number(match[1]), max: Number(match[2]) };
}

function overlap(range, preferredMin, preferredMax) {
  if (range.min == null || range.max == null) return false;
  return range.max >= preferredMin && range.min <= preferredMax;
}

function matchedSkills(job, filters) {
  const haystack = normalize([
    job.title,
    job.company,
    job.location,
    job.experience,
    job.salary,
    job.description,
    job.rawText,
    ...(job.skills || [])
  ].join(' '));
  return filters.skills.filter((skill) => {
    const normalized = normalize(skill);
    if (normalized === '.net core') return haystack.includes('.net core') || haystack.includes('dotnet core') || haystack.includes('.net');
    if (normalized === 'asp.net core') return haystack.includes('asp.net core') || haystack.includes('asp.net');
    if (normalized === 'web api') return haystack.includes('web api') || haystack.includes('rest api') || haystack.includes('api');
    return haystack.includes(normalized);
  });
}

export function defaultNaukriFilters(overrides = {}) {
  return {
    ...DEFAULT_FILTERS,
    ...overrides,
    titles: overrides.titles || DEFAULT_FILTERS.titles,
    locations: overrides.locations || DEFAULT_FILTERS.locations,
    skills: overrides.skills || DEFAULT_FILTERS.skills
  };
}

export function scoreNaukriJob(job, rawFilters = {}) {
  const filters = defaultNaukriFilters(rawFilters);
  const titleText = normalize(job.title);
  const locationText = normalize([job.location, job.job_url, job.rawText].join(' '));
  const companyText = normalize(job.company);
  const titleMatched = filters.titles.some((title) => {
    const clean = normalize(title);
    return titleText.includes(clean.replace(' developer', '')) || titleText.includes(clean);
  }) || /\.net|asp\.net|dotnet|c#|csharp/i.test(titleText);
  const locationMatched = filters.locations.some((location) => {
    const clean = normalize(location);
    return locationText.includes(clean) || (clean.includes('delhi') && /delhi|gurgaon|gurugram|noida|ncr/.test(locationText));
  });
  const experience = parseExperience(job.experience);
  const experienceMatched = experience.min == null ? false : overlap(experience, filters.experienceMin, filters.experienceMax);
  const salary = parseSalary(job.salary);
  const salaryMatched = salary.min == null ? null : overlap(salary, filters.salaryMinLpa, filters.salaryMaxLpa);
  const skills = matchedSkills(job, filters);
  const skillPercent = Math.round((skills.length / filters.skills.length) * 100);
  const mncMatched = KNOWN_MNC_HINTS.some((hint) => companyText.includes(hint));

  const score =
    (titleMatched ? 25 : 0) +
    (locationMatched ? 20 : 0) +
    (experienceMatched ? 20 : 0) +
    Math.round(skillPercent * 0.25) +
    (salaryMatched === true ? 5 : salaryMatched === null ? 3 : 0) +
    (filters.mncPreferred && mncMatched ? 5 : 0);

  const reasons = [];
  if (!titleMatched) reasons.push('irrelevant title');
  if (!locationMatched) reasons.push('wrong location');
  if (!experienceMatched) reasons.push('wrong experience');
  if (skillPercent < 60) reasons.push(`skills match ${skillPercent}% below 60%`);
  if (salaryMatched === false) reasons.push('salary outside preferred range');

  return {
    score: Math.min(100, score),
    accepted: score >= filters.threshold && titleMatched && locationMatched && experienceMatched && skillPercent >= 60,
    reasons,
    matchedSkills: skills,
    skillPercent,
    breakdown: {
      titleMatched,
      locationMatched,
      experienceMatched,
      salaryMatched,
      mncMatched
    }
  };
}
