export type StripePlanId = "pro" | "premium";

export type StripePlan = {
  id: StripePlanId;
  name: string;
  priceLabel: string;
  amount: number;
  priceEnv: string;
  description: string;
};

export const stripePlans: Record<StripePlanId, StripePlan> = {
  pro: {
    id: "pro",
    name: "Pro Plan",
    priceLabel: "$19",
    amount: 1900,
    priceEnv: "STRIPE_PRO_PRICE_ID",
    description: "AI resume optimization, live assistant, daily tracking, and auto apply reports."
  },
  premium: {
    id: "premium",
    name: "Premium Plan",
    priceLabel: "$49",
    amount: 4900,
    priceEnv: "STRIPE_PREMIUM_PRICE_ID",
    description: "Priority automation, advanced analytics, portal placeholders, and premium support."
  }
};

export function getStripePlan(planId: string | null) {
  if (!planId) return null;
  return stripePlans[planId as StripePlanId] || null;
}
