import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreJob } from '../src/modules/ats/scorer.js';
import { filterJob } from '../src/modules/jobs/filter.js';

test('scores strong .NET AWS job above threshold', () => {
  const job = {
    company: 'Accenture',
    title: 'Senior .NET Developer AWS',
    location: 'Noida Hybrid',
    work_mode: 'Hybrid',
    salary_min_lpa: 22,
    salary_max_lpa: 26,
    experience_min: 6,
    experience_max: 10,
    description:
      'ASP.NET Core C# .NET Core AWS Lambda DynamoDB S3 SNS microservices REST APIs SQL Server Angular CI/CD serverless architecture',
    tech_stack: ['.NET Core', 'AWS Lambda', 'SQL Server'],
    is_mnc: true,
    employee_count: 10000
  };

  const result = scoreJob(job);
  assert.ok(result.score >= 75);
  assert.equal(filterJob(job, 75).accepted, true);
});

test('rejects QA support role even at known company', () => {
  const job = {
    company: 'Infosys',
    title: 'QA Support Engineer',
    location: 'Noida',
    work_mode: 'Hybrid',
    experience_min: 6,
    experience_max: 10,
    description: 'Manual testing QA support night shift',
    is_mnc: true,
    employee_count: 10000
  };

  const result = filterJob(job, 75);
  assert.equal(result.accepted, false);
});
