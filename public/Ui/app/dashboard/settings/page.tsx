"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BadgeCheck, CreditCard, ReceiptText } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form";
import { formatStripeAmount, readBillingAccount, type BillingAccount } from "@/lib/billing";
import { getPlanLimit, limitRows } from "@/lib/plan-limits";
import { readResumeProfile, type ResumeProfile, writeResumeProfile } from "@/lib/resume-profile";

export default function SettingsPage() {
  const [enabled, setEnabled] = useState(true);
  const [billing, setBilling] = useState<BillingAccount | null>(null);
  const [profile, setProfile] = useState<ResumeProfile | null>(null);
  const activePlan = getPlanLimit(billing?.status === "paid" ? billing.plan : "free");

  useEffect(() => {
    setBilling(readBillingAccount());
    setProfile(readResumeProfile());
  }, []);

  function updateProfile(key: keyof ResumeProfile, value: string) {
    setProfile((current) => current ? { ...current, [key]: value } : current);
  }

  function saveProfile() {
    if (!profile) return;
    writeResumeProfile(profile);
  }

  function showFreeUser() {
    localStorage.removeItem("jobpilot_billing");
    localStorage.removeItem("jobpilot_pending_checkout_session");
    localStorage.removeItem("jobpilot_pending_checkout_plan");
    const existingRaw = localStorage.getItem("jobpilot_session");
    let existingSession: Record<string, unknown> = {};

    try {
      existingSession = existingRaw ? JSON.parse(existingRaw) : {};
    } catch {
      existingSession = {};
    }

    localStorage.setItem(
      "jobpilot_session",
      JSON.stringify({
        user: existingSession.user || profile?.name || "User",
        createdAt: existingSession.createdAt || Date.now(),
        plan: "free",
        planName: "Free Plan",
        billingStatus: "free"
      })
    );
    setBilling(null);
  }

  return (
    <>
      <PageHeading title="Settings" description="Manage profile details, resume defaults, notification preferences, themes, and portal placeholders." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="border-emerald-200/80 dark:border-emerald-400/25">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Stripe payment status</CardTitle>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">Your current JobPilot AI billing state for this workspace.</p>
              </div>
              <div className="grid size-11 place-items-center rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-200">
                {billing?.status === "paid" ? <BadgeCheck className="size-5" /> : <CreditCard className="size-5" />}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-[var(--border)] bg-black/[0.03] p-4 dark:bg-white/[0.05]">
              <p className="text-xs font-bold uppercase text-[var(--muted)]">Account plan</p>
              <p className="mt-1 text-2xl font-extrabold">{activePlan.name}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {billing?.status === "paid" ? `${formatStripeAmount(billing.amountTotal, billing.currency)} active subscription` : "Upgrade from pricing to activate paid features."}
              </p>
            </div>
            <div className="grid gap-2 rounded-md border border-[var(--border)] p-4 text-sm sm:grid-cols-2">
              {limitRows.map(([label, key]) => (
                <div className="rounded-md bg-black/[0.03] p-3 dark:bg-white/[0.05]" key={key}>
                  <p className="text-xs font-bold uppercase text-[var(--muted)]">{label}</p>
                  <p className="mt-1 font-extrabold">{activePlan[key]}</p>
                </div>
              ))}
            </div>
            {billing?.status === "paid" ? (
              <div className="space-y-2 rounded-md border border-[var(--border)] p-4 text-sm">
                <div className="flex items-center gap-2 font-bold">
                  <ReceiptText className="size-4 text-[var(--primary)]" />
                  Stripe session
                </div>
                <p className="break-all text-xs text-[var(--muted)]">{billing.sessionId}</p>
                <p className="text-xs text-[var(--muted)]">Paid on {new Date(billing.paidAt).toLocaleString()}</p>
              </div>
            ) : null}
            <Link href="/#pricing">
              <Button variant={billing?.status === "paid" ? "secondary" : "default"}>
                {billing?.status === "paid" ? "View Pricing" : "Upgrade with Stripe"}
              </Button>
            </Link>
            {billing?.status === "paid" ? (
              <Button onClick={showFreeUser} type="button" variant="secondary">
                Show Non-Paid User
              </Button>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Profile settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Name"><Input onChange={(event) => updateProfile("name", event.target.value)} value={profile?.name || ""} placeholder="Your name" /></Field>
            <Field label="Email"><Input onChange={(event) => updateProfile("email", event.target.value)} value={profile?.email || ""} placeholder="you@example.com" /></Field>
            <Button onClick={saveProfile} type="button">Save Profile</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Resume upload settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Default resume"><Input type="file" /></Field>
            <Field label="Target role"><Input onChange={(event) => updateProfile("targetRole", event.target.value)} value={profile?.targetRole || profile?.title || ""} placeholder="Target job title" /></Field>
            <Button onClick={saveProfile} type="button" variant="secondary">Update Resume Defaults</Button>
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle>Notification settings</CardTitle></CardHeader><CardContent><label className="flex items-center justify-between gap-4 rounded-md border border-[var(--border)] p-4"><span className="font-semibold">Daily automation summary</span><input checked={enabled} onChange={(e) => setEnabled(e.target.checked)} type="checkbox" /></label></CardContent></Card>
        <Card><CardHeader><CardTitle>Connected portals</CardTitle></CardHeader><CardContent className="space-y-3">{["Naukri", "LinkedIn", "Indeed"].map((portal) => <div className="flex items-center justify-between rounded-md border border-[var(--border)] p-3" key={portal}><span className="font-semibold">{portal}</span><Button size="sm" variant="secondary">Connect</Button></div>)}</CardContent></Card>
      </div>
    </>
  );
}
