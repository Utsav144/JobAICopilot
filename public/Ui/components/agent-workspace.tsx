"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  BriefcaseBusiness,
  Check,
  Clock3,
  Crown,
  ExternalLink,
  Filter,
  Lock,
  PauseCircle,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  Zap
} from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { readBillingAccount, type BillingAccount } from "@/lib/billing";
import { getPlanLimit, planLimits } from "@/lib/plan-limits";

const agentSteps = [
  ["Find matching jobs", "The existing agent scans configured sources for your target role and location."],
  ["Filter and qualify", "Low-match roles are skipped before any apply action is attempted."],
  ["Apply with checkpoints", "Manual steps, access denied, OTP, CAPTCHA, and portal issues pause safely."],
  ["Report outcomes", "Submitted, skipped, pending, and manual-required actions remain visible."]
];

function UpgradeAgentWall() {
  const free = planLimits.free;
  const pro = planLimits.pro;
  const premium = planLimits.premium;

  return (
    <>
      <PageHeading
        title="AI Automatic Job Search Agent"
        description="Premium automation is available after upgrading your JobPilot AI workspace."
      />
      <Card className="overflow-hidden border-[var(--primary)]/35 shadow-xl">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="p-6 sm:p-8">
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-black/[0.03] px-3 py-2 text-sm font-extrabold dark:bg-white/[0.05]">
              <Lock className="size-4 text-[var(--primary)]" />
              Paid users only
            </div>
            <h1 className="max-w-2xl text-3xl font-extrabold tracking-normal sm:text-4xl">Unlock the AI agent that runs your daily job application workflow.</h1>
            <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
              Free accounts get {free.resumeProfiles}, {free.atsChecks}, {free.resumeTemplates}, and manual tracking. Upgrade to Pro or Premium to access the automatic job search agent.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {["Automatic job search agent", "Daily submitted-job goal", "Smart job filtering", "Auto apply reports"].map((feature) => (
                <div className="flex items-center gap-3 rounded-md border border-[var(--border)] bg-[var(--card)] p-3 text-sm font-semibold" key={feature}>
                  <Sparkles className="size-4 text-[var(--accent)]" />
                  {feature}
                </div>
              ))}
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/#pricing">
                <Button size="lg">
                  Upgrade with Stripe
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/dashboard/resume-builder">
                <Button size="lg" variant="secondary">Continue Free Tools</Button>
              </Link>
            </div>
          </div>
          <div className="border-t border-[var(--border)] bg-[linear-gradient(135deg,rgba(37,99,235,0.12),rgba(15,118,110,0.10),rgba(245,158,11,0.10))] p-6 sm:p-8 lg:border-l lg:border-t-0">
            <div className="rounded-lg border border-white/50 bg-white/75 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/25">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[var(--muted)]">Free Plan</p>
                  <p className="text-2xl font-extrabold">$0/mo</p>
                </div>
                <BadgeCheck className="size-9 rounded-md bg-emerald-500/10 p-2 text-emerald-700 dark:text-emerald-200" />
              </div>
              <div className="space-y-3">
                {[free.resumeProfiles, free.atsChecks, free.resumeTemplates, free.reports].map((item) => (
                  <p className="flex items-center gap-2 text-sm font-semibold" key={item}>
                    <Check className="size-4 text-[var(--accent)]" />
                    {item}
                  </p>
                ))}
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
              <p className="text-sm font-bold text-[var(--muted)]">Paid automation unlocks</p>
              <p className="mt-2 text-3xl font-extrabold">{pro.dailyApplications}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Pro runs {pro.schedulerCadence.toLowerCase()}. Premium increases to {premium.dailyApplications} with {premium.schedulerCadence.toLowerCase()} cadence.</p>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}

function PremiumAgentWorkspace({ agentUrl, billing }: { agentUrl: string; billing: BillingAccount }) {
  const plan = getPlanLimit(billing.plan);
  const agentStats = [
    ["Daily goal", plan.dailyApplications, Target, "Submitted applications"],
    ["Scan cadence", plan.schedulerCadence, Clock3, "Loops until goal is met"],
    ["Smart filters", plan.automation, Filter, "Role, skill, salary, portal"],
    ["Manual safety", "On", ShieldCheck, "Stops for login or access checks"]
  ] as const;

  return (
    <>
      <PageHeading
        title="AI Automatic Job Search Agent"
        description="Premium automation control center for your existing running job agent."
      />

      <section className="mb-5 overflow-hidden rounded-lg border border-emerald-200/80 bg-[var(--card)] shadow-xl dark:border-emerald-400/25">
        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-6 sm:p-8">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-sm font-extrabold text-emerald-700 dark:text-emerald-200">
                <Crown className="size-4" />
                {billing.planName} active
              </span>
              <span className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-sm font-bold text-[var(--muted)]">
                <Radar className="size-4 text-[var(--primary)]" />
                Existing agent embedded
              </span>
            </div>
            <h1 className="max-w-3xl text-3xl font-extrabold tracking-normal sm:text-4xl">
              Your AI agent is ready to scan, filter, apply, and report with safety checkpoints.
            </h1>
            <p className="mt-4 max-w-3xl leading-7 text-[var(--muted)]">
              This page does not rebuild the automation. It wraps your current running agent with a clean command surface, status cards, and your active {plan.name} limits.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href={agentUrl} rel="noreferrer" target="_blank">
                <Button size="lg">
                  Open Agent Window
                  <ExternalLink className="size-4" />
                </Button>
              </a>
              <Link href="/dashboard/reports">
                <Button size="lg" variant="secondary">
                  View Reports
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="border-t border-[var(--border)] bg-[linear-gradient(135deg,rgba(16,185,129,0.15),rgba(59,130,246,0.12),rgba(245,158,11,0.12))] p-6 sm:p-8 lg:border-l lg:border-t-0">
            <div className="grid gap-3">
              {agentStats.map(([label, value, Icon, hint]) => (
                <div className="rounded-lg border border-white/50 bg-white/75 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/25" key={label as string}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase text-[var(--muted)]">{label as string}</p>
                      <p className="mt-1 text-2xl font-extrabold">{value as string}</p>
                    </div>
                    <Icon className="size-10 rounded-md bg-[var(--primary)]/10 p-2 text-[var(--primary)]" />
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted)]">{hint as string}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mb-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Automation pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {agentSteps.map(([title, body], index) => (
              <div className="flex gap-3 rounded-md border border-[var(--border)] p-4" key={title}>
                <div className="grid size-8 shrink-0 place-items-center rounded-md bg-[var(--foreground)] text-sm font-extrabold text-[var(--background)]">{index + 1}</div>
                <div>
                  <p className="font-bold">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{body}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Live agent controls</CardTitle>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">Use the embedded agent below for real start, stop, Naukri, and scheduler actions.</p>
            </div>
            <Bot className="size-10 rounded-md bg-blue-100 p-2 text-blue-700 dark:bg-blue-400/15 dark:text-blue-200" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Scheduler", plan.schedulerCadence, Zap],
                ["Naukri", "Manual safe mode", PauseCircle],
                ["Reports", plan.reports, BriefcaseBusiness]
              ].map(([label, status, Icon]) => (
                <div className="rounded-md border border-[var(--border)] bg-black/[0.03] p-4 dark:bg-white/[0.05]" key={label as string}>
                  <Icon className="mb-3 size-5 text-[var(--primary)]" />
                  <p className="font-bold">{label as string}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{status as string}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-[var(--primary)]/25 shadow-xl">
        <div className="flex flex-col gap-3 border-b border-[var(--border)] bg-[var(--card)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-extrabold">Existing AI job agent</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Integration target: <span className="font-semibold text-[var(--foreground)]">{agentUrl}</span></p>
          </div>
          <a href={agentUrl} rel="noreferrer" target="_blank">
            <Button variant="secondary">
              <ExternalLink className="size-4" />
              Open Full Screen
            </Button>
          </a>
        </div>
        <div className="h-[calc(100vh-15rem)] min-h-[680px] bg-white">
          <iframe className="h-full w-full border-0" src={agentUrl} title="Existing AI Job Agent" />
        </div>
      </Card>
    </>
  );
}

export function AgentWorkspace({ agentUrl }: { agentUrl: string }) {
  const [billing, setBilling] = useState<BillingAccount | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setBilling(readBillingAccount());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Card className="w-full max-w-md">
          <CardContent className="grid place-items-center p-8 text-center">
            <Bot className="mb-4 size-10 animate-pulse text-[var(--primary)]" />
            <p className="font-bold">Checking your agent access</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Premium workspace status is loading.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!billing || billing.status !== "paid") {
    return <UpgradeAgentWall />;
  }

  return <PremiumAgentWorkspace agentUrl={agentUrl} billing={billing} />;
}
