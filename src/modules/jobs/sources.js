import { chromium } from 'playwright';
import { env } from '../../config/env.js';
import { logger } from '../logging/logger.js';
import { searchNaukriJobs } from '../../services/naukriService.js';

export const sourceConfigs = [
  {
    name: 'Shine',
    type: 'browser',
    searchUrl: 'https://www.shine.com/job-search/dot-net-aws-developer-jobs-in-noida'
  },
  {
    name: 'LinkedIn Jobs',
    type: 'browser',
    searchUrl:
      'https://www.linkedin.com/jobs/search/?keywords=Senior%20.NET%20AWS%20Developer&location=Noida%2C%20Uttar%20Pradesh%2C%20India&f_WT=2%2C3'
  },
  {
    name: 'Naukri',
    type: 'compliant-fallback',
    searchUrl: 'https://www.naukri.com/dot-net-aws-developer-jobs-in-noida'
  },
  {
    name: 'Indeed India',
    type: 'browser',
    searchUrl: 'https://in.indeed.com/jobs?q=.net+aws+developer&l=Noida'
  },
  {
    name: 'Wellfound',
    type: 'browser',
    searchUrl: 'https://wellfound.com/jobs'
  },
  {
    name: 'Company Career Pages',
    type: 'company-careers',
    companies: [
      'Infosys',
      'TCS',
      'Accenture',
      'Deloitte',
      'Capgemini',
      'EPAM',
      'HCLTech',
      'Wipro',
      'Coforge',
      'LTIMindtree',
      'Birlasoft',
      'Persistent Systems'
    ]
  }
];

export async function fetchJobsFromSources() {
  if (env.ENABLE_LIVE_JOB_SEARCH) {
    const liveJobs = await fetchJobsFromPublicApis();
    for (const source of sourceConfigs.filter((item) => item.type === 'browser')) {
      liveJobs.push(...(await scrapeBrowserSource(source)));
    }
    const naukri = await searchNaukriJobs({
      keyword: 'Senior .NET AWS Developer',
      location: 'Noida',
      experience: '6-10'
    });
    liveJobs.push(...naukri.jobs);
    return dedupeJobs(liveJobs).slice(0, 200);
  }

  return [
    {
      source_name: 'Seed Example',
      source_job_id: 'sample-001',
      source_url: 'https://careers.example.com/jobs/sample-001',
      company: 'Accenture',
      title: 'Senior .NET Developer - AWS Serverless',
      location: 'Noida / Hybrid',
      work_mode: 'Hybrid',
      salary_min_lpa: 22,
      salary_max_lpa: 26,
      experience_min: 6,
      experience_max: 10,
      description:
        'Senior .NET Developer with ASP.NET Core, C#, AWS Lambda, DynamoDB, S3, SNS, microservices, REST APIs, SQL Server, CI/CD, and Angular exposure.',
      tech_stack: ['.NET Core', 'ASP.NET Core', 'C#', 'AWS Lambda', 'DynamoDB', 'S3', 'SNS', 'SQL Server'],
      is_mnc: true,
      employee_count: 10000
    }
  ];
}

async function scrapeBrowserSource(source) {
  const browser = await chromium.launch({ headless: env.PLAYWRIGHT_HEADLESS });
  const page = await browser.newPage();
  try {
    await page.goto(source.searchUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(4_000);
    const pageTitle = await page.title();
    if (/access denied|blocked/i.test(pageTitle)) {
      logger.warn({ source: source.name, title: pageTitle }, 'Job source blocked browser access');
      return [];
    }

    const cards = await page.locator('a[href]').evaluateAll(
      (nodes, sourceName) =>
        nodes
          .map((node, index) => {
            const text = (node.innerText || node.textContent || '').trim().replace(/\s+/g, ' ');
            const href = node.href || '';
            return {
              source_name: sourceName,
              source_job_id: node.getAttribute?.('data-job-id') || sourceName + '-' + index,
              source_url: href,
              company: '',
              title: text.split(' | ')[0] || text || 'Software Engineer',
              location: text.match(/Noida|Remote|Hybrid|India|Delhi NCR|Gurgaon|Gurugram|Bengaluru|Hyderabad|Pune/i)?.[0] || (sourceName === 'Shine' ? 'Noida' : ''),
              work_mode: text.match(/Remote|Hybrid/i)?.[0] || (sourceName === 'Shine' ? 'Onsite' : ''),
              description: text,
              tech_stack: [],
              is_mnc: false,
              employee_count: null
            };
          })
          .filter((job) => /job|jobs|developer|engineer|dot|\.net|aws|software/i.test(job.title + ' ' + job.source_url))
          .slice(0, 40),
      source.name
    );
    return cards.filter((job) => job.source_url && job.description.length > 8);
  } catch (error) {
    logger.warn({ source: source.name, error }, 'Job source scrape failed');
    return [];
  } finally {
    await browser.close();
  }
}

function stripHtml(value = '') {
  return String(value).replace(/<[^>]*>/g, ' ').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim();
}

function relevantSoftwareJob(text) {
  return /\b(dotnet|\.net|asp\.net|c#|csharp|aws|lambda|serverless|backend|full stack|software engineer|software developer|api|microservices)\b/i.test(text);
}

function dedupeJobs(jobs) {
  const seen = new Set();
  return jobs.filter((job) => {
    if (!job.source_url || seen.has(job.source_url)) return false;
    seen.add(job.source_url);
    return true;
  });
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      'user-agent': 'JobApplicationAgent/1.0 (+https://localhost)'
    }
  });
  if (!response.ok) throw new Error('HTTP ' + response.status + ' for ' + url);
  return response.json();
}

async function fetchJobsFromPublicApis() {
  const results = await Promise.allSettled([
    fetchRemoteOkJobs(),
    fetchArbeitnowJobs(),
    fetchHimalayasJobs()
  ]);

  return results.flatMap((result) => {
    if (result.status === 'fulfilled') return result.value;
    logger.warn({ error: result.reason }, 'Public jobs API failed');
    return [];
  });
}

async function fetchRemoteOkJobs() {
  const data = await fetchJson('https://remoteok.com/api');
  return data
    .filter((item) => item && item.id && item.position)
    .map((item) => {
      const description = stripHtml(item.description || '');
      return {
        source_name: 'Remote OK',
        source_job_id: String(item.id),
        source_url: item.apply_url || item.url,
        company: item.company || 'Unknown',
        title: item.position,
        location: item.location || 'Remote',
        work_mode: 'Remote',
        salary_min_lpa: null,
        salary_max_lpa: null,
        experience_min: null,
        experience_max: null,
        description,
        tech_stack: item.tags || [],
        is_mnc: false,
        employee_count: null
      };
    })
    .filter((job) => relevantSoftwareJob(job.title + ' ' + job.description + ' ' + job.tech_stack.join(' ')))
    .slice(0, 30);
}

async function fetchArbeitnowJobs() {
  const data = await fetchJson('https://www.arbeitnow.com/api/job-board-api');
  return (data.data || [])
    .map((item) => {
      const description = stripHtml(item.description || '');
      return {
        source_name: 'Arbeitnow',
        source_job_id: item.slug,
        source_url: item.url,
        company: item.company_name || 'Unknown',
        title: item.title,
        location: item.remote ? 'Remote' : item.location,
        work_mode: item.remote ? 'Remote' : '',
        salary_min_lpa: null,
        salary_max_lpa: null,
        experience_min: null,
        experience_max: null,
        description,
        tech_stack: item.tags || [],
        is_mnc: false,
        employee_count: null
      };
    })
    .filter((job) => relevantSoftwareJob(job.title + ' ' + job.description + ' ' + job.tech_stack.join(' ')))
    .slice(0, 30);
}

async function fetchHimalayasJobs() {
  const data = await fetchJson('https://himalayas.app/jobs/api');
  const jobs = Array.isArray(data) ? data : data.jobs || [];
  return jobs
    .map((item) => {
      const description = stripHtml(item.description || item.excerpt || '');
      const locations = item.locationRestrictions || [];
      return {
        source_name: 'Himalayas',
        source_job_id: item.guid || item.applicationLink,
        source_url: item.applicationLink || item.guid,
        company: item.companyName || 'Unknown',
        title: item.title,
        location: locations.length ? locations.join(', ') : 'Remote',
        work_mode: 'Remote',
        salary_min_lpa: null,
        salary_max_lpa: null,
        experience_min: null,
        experience_max: null,
        description,
        tech_stack: item.categories || [],
        is_mnc: false,
        employee_count: null
      };
    })
    .filter((job) => relevantSoftwareJob(job.title + ' ' + job.description + ' ' + job.tech_stack.join(' ')))
    .slice(0, 30);
}
