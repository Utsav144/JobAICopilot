import type { StripePlanId } from "@/lib/stripe-plans";

export type JobPilotPlanId = "free" | StripePlanId;

export type PlanLimit = {
  id: JobPilotPlanId;
  name: string;
  price: string;
  badge: string;
  dailyApplications: string;
  schedulerCadence: string;
  atsChecks: string;
  resumeTemplates: string;
  resumeProfiles: string;
  liveChat: string;
  reports: string;
  support: string;
  automation: string;
  recommended?: boolean;
  pricingItems: string[];
};

export const planLimits: Record<JobPilotPlanId, PlanLimit> = {
  free: {
    id: "free",
    name: "Free Plan",
    price: "$0",
    badge: "Free",
    dailyApplications: "0 auto applies",
    schedulerCadence: "Manual only",
    atsChecks: "3 checks/month",
    resumeTemplates: "3 templates",
    resumeProfiles: "1 resume profile",
    liveChat: "Locked",
    reports: "Manual tracker only",
    support: "Community support",
    automation: "Locked",
    pricingItems: ["Resume builder", "Basic ATS score", "3 saved templates", "Manual application tracking"]
  },
  pro: {
    id: "pro",
    name: "Pro Plan",
    price: "$19",
    badge: "Pro",
    dailyApplications: "20 submitted/day",
    schedulerCadence: "Every 10 minutes",
    atsChecks: "50 checks/month",
    resumeTemplates: "10 templates",
    resumeProfiles: "3 resume profiles",
    liveChat: "300 messages/month",
    reports: "Standard reports",
    support: "Email support",
    automation: "Standard priority",
    recommended: true,
    pricingItems: ["20 auto submits/day", "AI resume optimization", "Live AI assistant", "Standard reports"]
  },
  premium: {
    id: "premium",
    name: "Premium Plan",
    price: "$49",
    badge: "Premium",
    dailyApplications: "50+ submitted/day",
    schedulerCadence: "Every 5 minutes",
    atsChecks: "Unlimited checks",
    resumeTemplates: "Unlimited templates",
    resumeProfiles: "10 resume profiles",
    liveChat: "Unlimited messages",
    reports: "Advanced reports + export",
    support: "Priority support + portal setup",
    automation: "Priority queue",
    pricingItems: ["50+ auto submits/day", "Priority scheduler", "Advanced analytics/export", "Premium support"]
  }
};

export const pricingPlans = [planLimits.free, planLimits.pro, planLimits.premium];

export const limitRows = [
  ["Daily auto applications", "dailyApplications"],
  ["Scheduler cadence", "schedulerCadence"],
  ["ATS checks", "atsChecks"],
  ["Resume templates", "resumeTemplates"],
  ["Resume profiles", "resumeProfiles"],
  ["Live AI chat", "liveChat"],
  ["Reports", "reports"],
  ["Automation priority", "automation"],
  ["Support", "support"]
] as const;

export function getPlanLimit(plan: string | null | undefined): PlanLimit {
  if (plan === "pro" || plan === "premium") return planLimits[plan];
  return planLimits.free;
}
