import { NextRequest, NextResponse } from "next/server";
import { getStripePlan } from "@/lib/stripe-plans";

export const runtime = "nodejs";

function appendPrice(params: URLSearchParams, plan: NonNullable<ReturnType<typeof getStripePlan>>) {
  const priceId = process.env[plan.priceEnv];

  if (priceId) {
    params.append("line_items[0][price]", priceId);
    params.append("line_items[0][quantity]", "1");
    return;
  }

  params.append("line_items[0][price_data][currency]", "usd");
  params.append("line_items[0][price_data][unit_amount]", String(plan.amount));
  params.append("line_items[0][price_data][recurring][interval]", "month");
  params.append("line_items[0][price_data][product_data][name]", plan.name);
  params.append("line_items[0][price_data][product_data][description]", plan.description);
  params.append("line_items[0][quantity]", "1");
}

export async function POST(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to public/Ui/.env.local." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const plan = getStripePlan(typeof body.plan === "string" ? body.plan : null);
  if (!plan) {
    return NextResponse.json({ error: "Unknown Stripe plan." }, { status: 400 });
  }

  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const params = new URLSearchParams();
  params.append("mode", "subscription");
  params.append("success_url", `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`);
  params.append("cancel_url", `${origin}/billing/cancel?plan=${plan.id}`);
  params.append("payment_method_types[0]", "card");
  params.append("metadata[plan]", plan.id);
  params.append("subscription_data[metadata][plan]", plan.id);
  params.append("allow_promotion_codes", "true");
  appendPrice(params, plan);

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${secretKey}`,
      "content-type": "application/x-www-form-urlencoded"
    },
    body: params
  });

  const data = await response.json();
  if (!response.ok) {
    return NextResponse.json(
      { error: data.error?.message || "Stripe checkout session could not be created." },
      { status: response.status }
    );
  }

  return NextResponse.json({ id: data.id, url: data.url });
}
