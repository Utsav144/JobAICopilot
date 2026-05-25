"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StripePlanId } from "@/lib/stripe-plans";

type CheckoutButtonProps = {
  plan: StripePlanId;
  variant?: "default" | "secondary";
};

export function CheckoutButton({ plan, variant = "default" }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState("");

  async function startCheckout() {
    setLoading(true);
    setError("");
    setCheckoutUrl("");

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan })
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Checkout could not be started.");
      }

      if (data.id) {
        localStorage.setItem("jobpilot_pending_checkout_session", data.id);
        localStorage.setItem("jobpilot_pending_checkout_plan", plan);
      }

      setCheckoutUrl(data.url);
      window.location.assign(data.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout could not be started.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button className="w-full" disabled={loading} onClick={startCheckout} type="button" variant={variant}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
        {loading ? "Opening Checkout..." : "Pay with Stripe"}
      </Button>
      {checkoutUrl ? (
        <a className="block text-center text-xs font-bold text-[var(--primary)] underline-offset-4 hover:underline" href={checkoutUrl}>
          Open secure Stripe checkout
        </a>
      ) : null}
      {error ? <p className="text-xs font-semibold text-red-600 dark:text-red-300">{error}</p> : null}
    </div>
  );
}
