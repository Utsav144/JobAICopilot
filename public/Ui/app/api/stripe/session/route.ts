import { NextRequest, NextResponse } from "next/server";
import { getStripePlan } from "@/lib/stripe-plans";

export const runtime = "nodejs";

type StripeCheckoutSession = {
  id: string;
  status?: string;
  payment_status?: string;
  amount_total?: number;
  currency?: string;
  customer_email?: string | null;
  customer_details?: {
    email?: string | null;
  } | null;
  metadata?: {
    plan?: string;
  } | null;
  subscription?: string | null;
  created?: number;
};

export async function GET(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const sessionId = request.nextUrl.searchParams.get("session_id");

  if (!secretKey) {
    return NextResponse.json(
      { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to public/Ui/.env.local." },
      { status: 500 }
    );
  }

  if (!sessionId || !sessionId.startsWith("cs_")) {
    return NextResponse.json({ error: "A valid Stripe checkout session id is required." }, { status: 400 });
  }

  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: {
      authorization: `Bearer ${secretKey}`
    },
    cache: "no-store"
  });

  const data = (await response.json()) as StripeCheckoutSession & { error?: { message?: string } };

  if (!response.ok) {
    return NextResponse.json({ error: data.error?.message || "Unable to verify Stripe checkout session." }, { status: response.status });
  }

  const plan = getStripePlan(data.metadata?.plan || "pro") || getStripePlan("pro");

  return NextResponse.json({
    id: data.id,
    status: data.status,
    paymentStatus: data.payment_status,
    plan: plan?.id || "pro",
    planName: plan?.name || "Pro Plan",
    amountTotal: data.amount_total,
    currency: data.currency || "usd",
    customerEmail: data.customer_details?.email || data.customer_email || null,
    subscriptionId: data.subscription || null,
    created: data.created
  });
}
