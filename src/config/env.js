import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value === 'string') return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
  return value;
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().default('postgres://postgres:postgres@localhost:5432/job_agent'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-5.5'),
  OLLAMA_URL: z.string().optional(),
  OLLAMA_API_KEY: z.string().optional(),
  OLLAMA_MODEL: z.string().default('kimi-k2.6:cloud'),
  TELEGRAM_TOKEN: z.string().optional(),
  SCHEDULER_ENABLED: booleanFromEnv.default(true),
  DAILY_CRON: z.string().default('0 9 * * *'),
  DAILY_SUBMITTED_GOAL: z.coerce.number().default(20),
  DAILY_GOAL_RETRY_MINUTES: z.coerce.number().default(10),
  SCHEDULER_RUN_ON_START: booleanFromEnv.default(false),
  MAX_APPLICATIONS_PER_DAY: z.coerce.number().default(50),
  MIN_ATS_SCORE: z.coerce.number().default(75),
  REQUIRE_VERIFIED_MNC: booleanFromEnv.default(true),
  USER_TIMEZONE: z.string().default('Asia/Kolkata'),
  PLAYWRIGHT_HEADLESS: booleanFromEnv.default(false),
  HUMAN_APPROVAL_REQUIRED: booleanFromEnv.default(true),
  ENABLE_LIVE_JOB_SEARCH: booleanFromEnv.default(false),
  NAUKRI_ALERT_TEXT_PATH: z.string().default('./data/naukri-alerts.txt'),
  NAUKRI_BROWSER_PROFILE_PATH: z.string().default('./data/browser-profiles/naukri'),
  NAUKRI_BROWSER_CHANNEL: z.string().optional(),
  AUTO_ASSIST_APPLICATIONS: booleanFromEnv.default(false),
  SEND_DAILY_EMAIL_REPORT: booleanFromEnv.default(false),
  EMAIL_REPORT_MIN_SUBMITTED: z.coerce.number().default(20),
  EMAIL_PROVIDER: z.enum(['brevo-api', 'smtp']).default('brevo-api'),
  BREVO_API_KEY: z.string().optional(),
  BREVO_ALLOWED_OUTBOUND_IPS: z.string().optional(),
  BREVO_CHECK_OUTBOUND_IP: booleanFromEnv.default(true),
  BREVO_DIRECT_IP_FALLBACK: booleanFromEnv.default(false),
  REPORT_EMAIL_TO: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: booleanFromEnv.default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  APPLICANT_NAME: z.string().default('Utsav Dwivedi'),
  APPLICANT_EMAIL: z.string().optional(),
  APPLICANT_PHONE: z.string().optional(),
  APPLICANT_LOCATION: z.string().default('Noida, India'),
  APPLICANT_LINKEDIN: z.string().optional(),
  APPLICANT_GITHUB: z.string().optional(),
  APPLICANT_PORTFOLIO: z.string().optional(),
  RESUME_SOURCE_PATH: z.string().default('./data/resumes/Utsav_Dwivedi_Master_Resume.txt')
});

export const env = envSchema.parse(process.env);
