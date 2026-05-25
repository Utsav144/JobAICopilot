"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, CheckCircle2, Crown, Loader2, ReceiptText, Sparkles } from "lucide-react";
import { formatStripeAmount, getPlanName, savePaidBillingAccount, type BillingAccount } from "@/lib/billing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StripeSessionSummary = {
  id: string;
  status: string;
  paymentStatus: string;
  plan: "pro" | "premium";
  planName: string;
  amountTotal?: number;
  currency?: string;
  customerEmail?: string | null;
  subscriptionId?: string | null;
};

export function PaymentSuccessPanel({ sessionId }: { sessionId?: string }) {
  const router = useRouter();
  const [session, setSession] = useState<StripeSessionSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [redirectHref, setRedirectHref] = useState("");
  const [redirectLabel, setRedirectLabel] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(4);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);

    async function verifyPayment() {
      const checkoutSessionId = sessionId || localStorage.getItem("jobpilot_pending_checkout_session") || "";

      if (!checkoutSessionId) {
        setError("Stripe did not return a checkout session id. Please open billing from the pricing page again.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/stripe/session?session_id=${encodeURIComponent(checkoutSessionId)}`, {
          cache: "no-store",
          signal: controller.signal
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to verify payment.");
        }

        if (ignore) return;

        setSession(data);

        if (data.paymentStatus === "paid" || data.status === "complete") {
          const wasLoggedIn = Boolean(localStorage.getItem("jobpilot_session"));
          const account: BillingAccount = {
            status: "paid",
            plan: data.plan,
            planName: data.planName || getPlanName(data.plan),
            sessionId: data.id,
            subscriptionId: data.subscriptionId || undefined,
            customerEmail: data.customerEmail || undefined,
            amountTotal: data.amountTotal,
            currency: data.currency,
            paidAt: new Date().toISOString()
          };
          savePaidBillingAccount(account);
          localStorage.removeItem("jobpilot_pending_checkout_session");
          localStorage.removeItem("jobpilot_pending_checkout_plan");
          setRedirectHref(wasLoggedIn ? "/dashboard" : "/login");
          setRedirectLabel(wasLoggedIn ? "dashboard" : "login");
        }
      } catch (paymentError) {
        if (!ignore) {
          setError(paymentError instanceof Error && paymentError.name === "AbortError" ? "Stripe verification took too long. Please refresh this page or open billing from Settings." : paymentError instanceof Error ? paymentError.message : "Unable to verify payment.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    verifyPayment();

    return () => {
      ignore = true;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [sessionId]);

  useEffect(() => {
    if (!redirectHref) return;

    const interval = window.setInterval(() => {
      setSecondsLeft((value) => Math.max(value - 1, 0));
    }, 1000);
    const timeout = window.setTimeout(() => router.replace(redirectHref), 4000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [redirectHref, router]);

  const isPaid = session?.paymentStatus === "paid" || session?.status === "complete";
  const amount = useMemo(() => formatStripeAmount(session?.amountTotal, session?.currency), [session]);

  if (loading) {
    return (
      <Card className="mt-8 overflow-hidden">
        <CardContent className="grid min-h-72 place-items-center p-8 text-center">
          <div>
            <Loader2 className="mx-auto mb-4 size-10 animate-spin text-[var(--primary)]" />
            <p className="text-lg font-bold">Verifying your Stripe payment</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Your paid workspace will open in a moment.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Payment Verification Needs Attention</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="rounded-md border border-[var(--border)] bg-black/[0.03] p-4 text-sm leading-6 text-[var(--muted)] dark:bg-white/[0.05]">{error}</p>
          <Link href="/#pricing">
            <Button variant="secondary">Back to Pricing</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (session && !isPaid) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Payment Status Pending</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="leading-7 text-[var(--muted)]">
            Stripe returned this checkout session, but payment is not marked paid yet. Complete the Stripe payment, then return here to activate your paid badge.
          </p>
          <div className="grid gap-4 rounded-lg border border-[var(--border)] bg-black/[0.03] p-4 text-sm dark:bg-white/[0.05] sm:grid-cols-2">
            <div>
              <p className="font-bold">Checkout session</p>
              <p className="mt-1 break-all text-xs text-[var(--muted)]">{session.id}</p>
            </div>
            <div>
              <p className="font-bold">Payment status</p>
              <p className="mt-1 text-xs font-bold text-amber-700 dark:text-amber-200">{session.paymentStatus || session.status}</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/#pricing">
              <Button>Start Checkout Again</Button>
            </Link>
            <Button onClick={() => window.location.reload()} type="button" variant="secondary">Refresh Status</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8 overflow-hidden border-emerald-200/80 dark:border-emerald-400/25">
      <div className="bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(59,130,246,0.12),rgba(245,158,11,0.13))] p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm font-bold text-emerald-700 dark:text-emerald-200">
              <CheckCircle2 className="size-4" />
              Payment confirmed
            </div>
            <h1 className="max-w-xl text-3xl font-extrabold tracking-normal sm:text-4xl">Welcome to your paid JobPilot AI workspace</h1>
            <p className="mt-3 max-w-xl leading-7 text-[var(--muted)]">
              Your {session?.planName || "paid plan"} is active. {redirectHref === "/login" ? "Login next and your paid workspace will open with the premium badge enabled." : "The dashboard now recognizes this browser session as a paid account."}
            </p>
            {redirectLabel ? (
              <p className="mt-3 inline-flex rounded-md border border-[var(--border)] bg-white/70 px-3 py-2 text-sm font-bold text-[var(--foreground)] dark:bg-black/25">
                Redirecting to {redirectLabel} in {secondsLeft}s
              </p>
            ) : null}
          </div>
          <div className="rounded-lg border border-white/40 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/25">
            <p className="text-xs font-bold uppercase text-[var(--muted)]">Plan activated</p>
            <p className="mt-1 text-2xl font-extrabold">{session?.planName}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{amount || "Stripe test mode"}</p>
          </div>
        </div>
      </div>

      <CardContent className="space-y-6 p-6 sm:p-8">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["Paid badge enabled", BadgeCheck, "Your dashboard profile now shows paid status."],
            ["Automation unlocked", Sparkles, "Premium job automation UI is ready for your account."],
            ["Receipts tracked", ReceiptText, "Stripe session details are saved locally for testing."]
          ].map(([title, Icon, text]) => (
            <div className="rounded-md border border-[var(--border)] p-4" key={title as string}>
              <Icon className="mb-3 size-5 text-[var(--primary)]" />
              <p className="font-bold">{title as string}</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{text as string}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 rounded-lg border border-[var(--border)] bg-black/[0.03] p-4 text-sm dark:bg-white/[0.05] sm:grid-cols-2">
          <div>
            <p className="font-bold">Checkout session</p>
            <p className="mt-1 break-all text-xs text-[var(--muted)]">{session?.id}</p>
          </div>
          <div>
            <p className="font-bold">Subscription</p>
            <p className="mt-1 break-all text-xs text-[var(--muted)]">{session?.subscriptionId || "Created by Stripe Checkout"}</p>
          </div>
          <div>
            <p className="font-bold">Customer</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{session?.customerEmail || "Captured by Stripe Checkout"}</p>
          </div>
          <div>
            <p className="font-bold">Payment status</p>
            <p className="mt-1 text-xs font-bold text-emerald-700 dark:text-emerald-200">{isPaid ? "Paid and active" : session?.paymentStatus}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href={redirectHref || "/dashboard"}>
            <Button size="lg">
              {redirectHref === "/login" ? "Continue to Login" : "Open Paid Dashboard"}
              <ArrowRight className="size-4" />
            </Button>
          </Link>
          <Link href="/dashboard/settings">
            <Button size="lg" variant="secondary">
              <Crown className="size-4" />
              View Account Settings
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
