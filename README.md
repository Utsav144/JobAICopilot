# AI Job Application Agent

Production-ready starter for a policy-safe job search and application assistant for Utsav Dwivedi.

The app searches configurable job sources, filters MNC software engineering roles, scores ATS fit, tailors resume keywords, generates recruiter outreach, tracks applications in PostgreSQL, and uses Playwright for assisted form filling.

Important: the automation is designed to respect platform policies. It pauses for login, captcha, ambiguous screening answers, and final submission unless you explicitly disable `HUMAN_APPROVAL_REQUIRED`.

## Quick Start

```bash
cp .env.example .env
docker compose up --build
```

Then open:

```text
http://localhost:3000
```

Run migrations manually:

```bash
npm run migrate
npm run seed
```

Run one daily cycle:

```bash
npm run run:daily
```

## Modules

- `src/modules/jobs`: source adapters, filtering, dedupe, role quality checks.
- `src/modules/ats`: ATS scoring and explainable match breakdown.
- `src/modules/resume`: JD-aware keyword tailoring with factual guardrails.
- `src/modules/outreach`: recruiter messages.
- `src/modules/automation`: Playwright assisted application workflows.
- `src/modules/scheduler`: daily cron and one-shot runner.
- `src/dashboard`: admin dashboard served by Express.

## Safety Defaults

- Max 50 applications per day.
- Duplicate prevention by source URL and company/title/location hash.
- Captcha and login pause.
- Human confirmation before submit.
- No contract-only, night shift, QA, support, frontend-only, Java-only, startup, or unknown small-company roles.

## Add Real Credentials

Use browser profiles or platform-supported auth flows. Do not store plaintext passwords in this repo. The Playwright runner can reuse a manually authenticated browser storage state saved outside git.

## Brevo Email Reports

Daily workflow email reports use Brevo SMTP through Nodemailer. In Brevo, create or copy your SMTP credentials from Transactional > SMTP & API, then set:

```env
SEND_DAILY_EMAIL_REPORT=true
REPORT_EMAIL_TO=your-report-email@example.com
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-brevo-smtp-login
SMTP_PASS=your-brevo-smtp-key
SMTP_FROM=verified-sender@yourdomain.com
```

`SMTP_FROM` must be a Brevo-verified sender.

### Brevo API SDK

The app also supports Brevo Transactional Email through the official `@getbrevo/brevo` SDK. Prefer this over raw SMTP when possible:

```env
EMAIL_PROVIDER=brevo-api
SEND_DAILY_EMAIL_REPORT=true
BREVO_API_KEY=your-brevo-api-key
REPORT_EMAIL_TO=your-report-email@example.com
SMTP_FROM=verified-sender@yourdomain.com
```

Fetch account, sender, dedicated IP, and SMTP template details after adding the API key:

```bash
npm run brevo:details
```

Brevo requires `SMTP_FROM` to be a verified sender in your Brevo account.
