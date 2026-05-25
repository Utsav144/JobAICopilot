"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BadgeCheck, Crown, CreditCard } from "lucide-react";
import { formatStripeAmount, readBillingAccount, type BillingAccount } from "@/lib/billing";
import { getPlanLimit, limitRows } from "@/lib/plan-limits";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function BillingStatusBanner() {
  const [billing, setBilling] = useState<BillingAccount | null>(null);
  const plan = getPlanLimit(billing?.status === "paid" ? billing.plan : "free");

  useEffect(() => {
    setBilling(readBillingAccount());
  }, []);

  if (!billing || billing.status !== "paid") {
    return (
      <Card className="mb-5 border-dashed">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-md bg-[var(--primary)]/10 text-[var(--primary)]">
              <CreditCard className="size-5" />
            </div>
            <div>
              <p className="font-extrabold">Free workspace</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{plan.resumeProfiles}, {plan.atsChecks}, {plan.resumeTemplates}. Upgrade to unlock automatic applications.</p>
            </div>
          </div>
          <Link href="/#pricing">
            <Button variant="secondary">Upgrade</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-5 overflow-hidden border-emerald-200/80 dark:border-emerald-400/25">
      <CardContent className="flex flex-col gap-4 bg-[linear-gradient(135deg,rgba(16,185,129,0.14),rgba(59,130,246,0.10))] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-200">
            <Crown className="size-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-extrabold">{billing.planName} active</p>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2.5 py-1 text-xs font-extrabold uppercase text-emerald-700 dark:text-emerald-200">
                <BadgeCheck className="size-3.5" />
                Paid
              </span>
            </div>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              Stripe payment confirmed{billing.amountTotal ? ` at ${formatStripeAmount(billing.amountTotal, billing.currency)}` : ""}. {plan.dailyApplications}, {plan.schedulerCadence.toLowerCase()} scheduler.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {limitRows.slice(0, 4).map(([label, key]) => (
                <span className="rounded-md border border-[var(--border)] bg-white/60 px-2.5 py-1 text-xs font-bold dark:bg-black/20" key={key}>
                  {label}: {plan[key]}
                </span>
              ))}
            </div>
          </div>
        </div>
        <Link href="/dashboard/settings">
          <Button variant="secondary">View Billing</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
