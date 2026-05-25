import { stripePlans, type StripePlanId } from "@/lib/stripe-plans";

export type BillingStatus = "free" | "paid";

export type BillingAccount = {
  status: BillingStatus;
  plan: StripePlanId;
  planName: string;
  sessionId: string;
  subscriptionId?: string;
  customerEmail?: string;
  amountTotal?: number;
  currency?: string;
  paidAt: string;
};

export function formatStripeAmount(amount?: number, currency = "usd") {
  if (typeof amount !== "number") return "";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase()
  }).format(amount / 100);
}

export function getPlanName(plan: string | null | undefined) {
  const planId = plan === "premium" ? "premium" : "pro";
  return stripePlans[planId].name;
}

export function readBillingAccount(): BillingAccount | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem("jobpilot_billing");
    return raw ? (JSON.parse(raw) as BillingAccount) : null;
  } catch {
    return null;
  }
}

export function savePaidBillingAccount(account: BillingAccount) {
  localStorage.setItem("jobpilot_billing", JSON.stringify(account));

  const existingRaw = localStorage.getItem("jobpilot_session");
  if (!existingRaw) return;

  let existingSession: Record<string, unknown> = {};
  try {
    existingSession = JSON.parse(existingRaw);
  } catch {
    existingSession = {};
  }

  localStorage.setItem(
    "jobpilot_session",
    JSON.stringify({
      user: existingSession.user || "User",
      createdAt: existingSession.createdAt || Date.now(),
      plan: account.plan,
      planName: account.planName,
      billingStatus: "paid",
      paidAt: account.paidAt
    })
  );
}
