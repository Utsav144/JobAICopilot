"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Crown, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { readBillingAccount, type BillingAccount } from "@/lib/billing";
import { planLimits } from "@/lib/plan-limits";

type PaidFeatureGateProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function PaidFeatureGate({ title, description, children }: PaidFeatureGateProps) {
  const [billing, setBilling] = useState<BillingAccount | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setBilling(readBillingAccount());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <Card>
        <CardContent className="grid min-h-56 place-items-center p-8 text-center">
          <Sparkles className="mb-3 size-8 animate-pulse text-[var(--primary)]" />
          <p className="font-bold">Checking plan access</p>
        </CardContent>
      </Card>
    );
  }

  if (billing?.status === "paid") {
    return <>{children}</>;
  }

  return (
    <Card className="overflow-hidden border-[var(--primary)]/35 shadow-xl">
      <div className="grid gap-0 lg:grid-cols-[1fr_0.9fr]">
        <div className="p-6 sm:p-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-black/[0.03] px-3 py-2 text-sm font-extrabold dark:bg-white/[0.05]">
            <Lock className="size-4 text-[var(--primary)]" />
            Paid feature
          </div>
          <h2 className="max-w-2xl text-3xl font-extrabold tracking-normal">{title}</h2>
          <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">{description}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[planLimits.pro.dailyApplications, planLimits.pro.liveChat, planLimits.premium.dailyApplications, planLimits.premium.reports].map((item) => (
              <div className="flex items-center gap-3 rounded-md border border-[var(--border)] bg-[var(--card)] p-3 text-sm font-semibold" key={item}>
                <Check className="size-4 text-[var(--accent)]" />
                {item}
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
            <Link href="/dashboard">
              <Button size="lg" variant="secondary">Back to Overview</Button>
            </Link>
          </div>
        </div>
        <div className="border-t border-[var(--border)] bg-[linear-gradient(135deg,rgba(37,99,235,0.12),rgba(15,118,110,0.10),rgba(245,158,11,0.10))] p-6 sm:p-8 lg:border-l lg:border-t-0">
          <div className="rounded-lg border border-white/50 bg-white/75 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/25">
            <Crown className="mb-4 size-10 rounded-md bg-emerald-500/10 p-2 text-emerald-700 dark:text-emerald-200" />
            <p className="text-sm font-bold text-[var(--muted)]">Recommended</p>
            <p className="mt-1 text-2xl font-extrabold">{planLimits.pro.name}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{planLimits.pro.dailyApplications}, {planLimits.pro.schedulerCadence.toLowerCase()}, and {planLimits.pro.liveChat.toLowerCase()}.</p>
          </div>
          <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-sm font-bold text-[var(--muted)]">Premium limit</p>
            <p className="mt-2 text-3xl font-extrabold">{planLimits.premium.dailyApplications}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{planLimits.premium.reports} with {planLimits.premium.support.toLowerCase()}.</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
