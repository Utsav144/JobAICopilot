import { filterJob } from '../jobs/filter.js';
import { fetchJobsFromSources } from '../jobs/sources.js';
import { generateRecruiterMessage } from '../outreach/message.js';

let nextJobId = 1;
let nextApplicationId = 1;

const jobs = [];
const applications = [];

function now() {
  return new Date().toISOString();
}

function toStoredJob(rawJob, status = 'discovered', rejectionReason = null) {
  return {
    ...rawJob,
    id: nextJobId++,
    status,
    rejection_reason: rejectionReason,
    discovered_at: now()
  };
}

function toApplication(job, status = 'queued', notes = 'Demo application. Start Docker/Postgres for persistent data.') {
  return {
    ...job,
    id: nextApplicationId++,
    job_id: job.id,
    status,
    notes,
    created_at: now(),
    updated_at: now(),
    recruiter_message: generateRecruiterMessage(job)
  };
}

function ensureSeeded() {
  if (jobs.length > 0) return;

  const seedJob = toStoredJob(
    {
      source_name: 'Demo',
      source_job_id: 'demo-001',
      source_url: 'https://careers.example.com/jobs/demo-001',
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
    },
    'qualified'
  );

  jobs.push(seedJob);
  applications.push(toApplication(seedJob));
}

export function listDemoJobs(status) {
  ensureSeeded();
  return status ? jobs.filter((job) => job.status === status) : jobs;
}

export function listDemoApplications(status) {
  ensureSeeded();
  return status ? applications.filter((app) => app.status === status) : applications;
}

export function updateDemoApplicationStatus(id, status, notes = null) {
  ensureSeeded();
  const application = applications.find((app) => String(app.id) === String(id));
  if (!application) return null;
  application.status = status;
  application.notes = notes || application.notes;
  application.updated_at = now();
  application.submitted_at = status === 'submitted' ? now() : application.submitted_at;
  return application;
}

export async function runDemoDailyWorkflow(minAtsScore) {
  ensureSeeded();
  const rawJobs = await fetchJobsFromSources();
  const results = [];

  for (const rawJob of rawJobs) {
    let job = jobs.find((item) => item.source_url === rawJob.source_url);
    if (!job) {
      job = toStoredJob(rawJob);
      jobs.unshift(job);
    }

    const filtered = filterJob(job, minAtsScore);
    job.ats_score = filtered.ats.score;
    job.ats_breakdown = filtered.ats.breakdown;

    if (!filtered.accepted) {
      job.status = 'rejected';
      job.rejection_reason = filtered.reasons.join('; ');
      results.push({ jobId: job.id, status: 'rejected', reasons: filtered.reasons, score: filtered.ats.score });
      continue;
    }

    job.status = 'qualified';
    job.rejection_reason = null;
    if (!applications.some((app) => app.job_id === job.id)) {
      applications.unshift(toApplication(job));
    }
    results.push({ jobId: job.id, status: 'queued', score: filtered.ats.score });
  }

  return results;
}
