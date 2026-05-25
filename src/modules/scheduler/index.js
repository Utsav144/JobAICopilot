import cron from 'node-cron';
import { env } from '../../config/env.js';
import { query } from '../../db/pool.js';
import { logger } from '../logging/logger.js';
import { runDailyWorkflow } from './dailyWorkflow.js';

let goalLoopRunning = false;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function todaySubmittedStats() {
  const result = await query(
    `SELECT
       (
         SELECT COUNT(*)::int
         FROM applications
         WHERE status = 'submitted'
           AND submitted_at IS NOT NULL
           AND (submitted_at AT TIME ZONE $1)::date = (now() AT TIME ZONE $1)::date
       ) AS application_submitted,
       (
         SELECT COUNT(*)::int
         FROM naukri_application_actions
         WHERE status = 'applied'
           AND (created_at AT TIME ZONE $1)::date = (now() AT TIME ZONE $1)::date
       ) AS naukri_applied`,
    [env.USER_TIMEZONE]
  );
  const row = result.rows[0] || {};
  const applicationSubmitted = row.application_submitted || 0;
  const naukriApplied = row.naukri_applied || 0;
  return {
    applicationSubmitted,
    naukriApplied,
    totalSubmitted: applicationSubmitted + naukriApplied
  };
}

export async function getSchedulerStatus() {
  const stats = await todaySubmittedStats();
  const remaining = Math.max(0, env.DAILY_SUBMITTED_GOAL - stats.totalSubmitted);
  return {
    enabled: env.SCHEDULER_ENABLED,
    running: goalLoopRunning,
    date: todayKey(),
    timezone: env.USER_TIMEZONE,
    cron: env.DAILY_CRON,
    runOnStart: env.SCHEDULER_RUN_ON_START,
    retryMinutes: env.DAILY_GOAL_RETRY_MINUTES,
    goal: env.DAILY_SUBMITTED_GOAL,
    remaining,
    progressPercent: env.DAILY_SUBMITTED_GOAL
      ? Math.min(100, Math.round((stats.totalSubmitted / env.DAILY_SUBMITTED_GOAL) * 100))
      : 100,
    ...stats,
    message:
      stats.totalSubmitted >= env.DAILY_SUBMITTED_GOAL
        ? 'Daily submitted goal reached. Scheduler is resting.'
        : goalLoopRunning
          ? 'Scheduler is running and will keep retrying until the goal is reached.'
          : env.SCHEDULER_ENABLED
            ? 'Scheduler is enabled and waiting for the next cron/start trigger.'
            : 'Scheduler is disabled.'
  };
}

function todayKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: env.USER_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

async function runUntilDailyGoal(trigger) {
  if (goalLoopRunning) {
    logger.info({ trigger }, 'Daily submitted goal loop is already running; skipping overlapping scheduler tick');
    return;
  }

  goalLoopRunning = true;
  let goalDate = todayKey();
  const retryMs = Math.max(1, env.DAILY_GOAL_RETRY_MINUTES) * 60_000;

  try {
    while (true) {
      const currentDate = todayKey();
      if (currentDate !== goalDate) {
        goalDate = currentDate;
        logger.info(
          { trigger, date: goalDate, goal: env.DAILY_SUBMITTED_GOAL },
          'New scheduler day detected; continuing daily goal loop immediately'
        );
      }

      const before = await todaySubmittedStats();
      if (before.totalSubmitted >= env.DAILY_SUBMITTED_GOAL) {
        logger.info(
          { ...before, goal: env.DAILY_SUBMITTED_GOAL, date: goalDate },
          'Daily submitted goal reached'
        );
        return;
      }

      logger.info(
        {
          trigger,
          ...before,
          remaining: env.DAILY_SUBMITTED_GOAL - before.totalSubmitted,
          goal: env.DAILY_SUBMITTED_GOAL,
          date: goalDate
        },
        'Daily submitted goal not reached; running workflow'
      );

      try {
        await runDailyWorkflow();
      } catch (error) {
        logger.error(
          {
            error,
            trigger,
            date: goalDate,
            goal: env.DAILY_SUBMITTED_GOAL,
            submittedBeforeAttempt: before.totalSubmitted
          },
          'Daily workflow attempt failed; scheduler will rest and retry until the daily goal or day end'
        );
      }

      const after = await todaySubmittedStats();
      if (after.totalSubmitted >= env.DAILY_SUBMITTED_GOAL) {
        logger.info(
          { ...after, goal: env.DAILY_SUBMITTED_GOAL, date: goalDate },
          'Daily submitted goal reached after workflow'
        );
        return;
      }

      logger.info(
        {
          ...after,
          remaining: env.DAILY_SUBMITTED_GOAL - after.totalSubmitted,
          retryMinutes: env.DAILY_GOAL_RETRY_MINUTES,
          date: goalDate
        },
        'Daily submitted goal still pending; resting before next workflow attempt'
      );
      await sleep(retryMs);
    }
  } catch (error) {
    logger.error({ error }, 'Daily submitted goal loop failed');
  } finally {
    goalLoopRunning = false;
  }
}

export function startScheduler() {
  if (!env.SCHEDULER_ENABLED) {
    logger.info('Scheduler disabled');
    return;
  }

  cron.schedule(
    env.DAILY_CRON,
    () => runUntilDailyGoal('cron'),
    { timezone: env.USER_TIMEZONE }
  );
  logger.info(
    {
      cron: env.DAILY_CRON,
      timezone: env.USER_TIMEZONE,
      dailySubmittedGoal: env.DAILY_SUBMITTED_GOAL,
      retryMinutes: env.DAILY_GOAL_RETRY_MINUTES,
      runOnStart: env.SCHEDULER_RUN_ON_START
    },
    'Scheduler started'
  );

  if (env.SCHEDULER_RUN_ON_START) {
    runUntilDailyGoal('startup');
  }
}
