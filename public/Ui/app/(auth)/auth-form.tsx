"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, BadgeCheck, Loader2, Mail, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form";
import { readBillingAccount, type BillingAccount } from "@/lib/billing";

export function AuthForm({ mode }: { mode: "login" | "signup" | "forgot" }) {
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const [billing, setBilling] = useState<BillingAccount | null>(null);
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const isForgot = mode === "forgot";
  const title = mode === "login" ? "Welcome back" : mode === "signup" ? "Create your workspace" : "Reset your password";

  useEffect(() => {
    setBilling(readBillingAccount());
  }, []);

  function createSession() {
    localStorage.setItem("jobpilot_session", JSON.stringify({
      user: name || email.split("@")[0] || "User",
      email,
      createdAt: Date.now(),
      plan: billing?.plan || "free",
      planName: billing?.planName || "Free Plan",
      billingStatus: billing?.status || "free",
      paidAt: billing?.paidAt
    }));
    router.push("/dashboard");
  }

  async function sendOtp() {
    setLoading(true);
    setError("");
    setStatus("");
    setDevOtp("");

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "OTP could not be sent.");
      }

      setStep("otp");
      setStatus(data.sent ? `OTP sent to ${data.email}. It expires in ${data.expiresInMinutes} minutes.` : data.warning || "OTP generated for local development.");
      if (data.devOtp) setDevOtp(data.devOtp);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "OTP could not be sent.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyLoginOtp() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, otp })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "OTP verification failed.");
      }

      createSession();
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isForgot) {
      setSent(true);
      return;
    }

    if (step === "credentials") {
      sendOtp();
      return;
    }

    verifyLoginOtp();
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link className="mb-6 block" href="/">
          <Brand />
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <p className="text-sm leading-6 text-[var(--muted)]">
              {isForgot ? "Enter your email and we will send reset instructions." : step === "otp" ? "Enter the 6-digit verification code sent to your email." : "Login uses email OTP verification before opening your dashboard."}
            </p>
          </CardHeader>
          <CardContent>
            {!isForgot && billing?.status === "paid" ? (
              <div className="mb-4 rounded-md border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm leading-6">
                <div className="mb-1 flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-200">
                  <BadgeCheck className="size-4" />
                  Paid account detected
                </div>
                Login will open your {billing.planName} workspace.
              </div>
            ) : null}
            {sent ? (
              <div className="rounded-md border border-[var(--border)] bg-black/[0.03] p-4 text-sm leading-6 dark:bg-white/[0.05]">
                <Mail className="mb-3 size-5 text-[var(--primary)]" />
                Reset instructions have been queued for your email.
              </div>
            ) : (
              <form className="space-y-4" onSubmit={submit}>
                {step === "credentials" ? (
                  <>
                    {mode === "signup" ? <Field label="Full name"><Input required onChange={(event) => setName(event.target.value)} value={name} /></Field> : null}
                    <Field label="Email"><Input required onChange={(event) => setEmail(event.target.value)} type="email" value={email} /></Field>
                    {!isForgot ? <Field label="Password"><Input required onChange={(event) => setPassword(event.target.value)} type="password" value={password} /></Field> : null}
                    <Button className="w-full" disabled={loading} type="submit">
                      {loading ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                      {isForgot ? "Send Reset Link" : "Send Email OTP"}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="rounded-md border border-[var(--border)] bg-black/[0.03] p-4 text-sm leading-6 dark:bg-white/[0.05]">
                      <Mail className="mb-2 size-5 text-[var(--primary)]" />
                      {status || `OTP sent to ${email}.`}
                    </div>
                    {devOtp ? (
                      <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm font-bold text-amber-950 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
                        Local dev OTP: {devOtp}
                      </div>
                    ) : null}
                    <Field label="6-digit OTP" hint="The code expires in 5 minutes.">
                      <Input
                        autoComplete="one-time-code"
                        className="text-center text-2xl font-extrabold tracking-[0.35em]"
                        inputMode="numeric"
                        maxLength={6}
                        onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                        value={otp}
                      />
                    </Field>
                    <Button className="w-full" disabled={loading || otp.length !== 6} type="submit">
                      {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                      Verify OTP & Login
                    </Button>
                    <div className="flex items-center justify-between gap-3 text-sm font-semibold">
                      <button className="text-[var(--muted)]" onClick={() => setStep("credentials")} type="button">Change email</button>
                      <button className="text-[var(--primary)]" disabled={loading} onClick={sendOtp} type="button">Resend OTP</button>
                    </div>
                  </>
                )}
                {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">{error}</p> : null}
              </form>
            )}
            <div className="mt-5 flex items-center justify-between text-sm font-semibold text-[var(--muted)]">
              {mode !== "login" ? <Link href="/login">Back to login</Link> : <Link href="/forgot-password">Forgot password?</Link>}
              {mode !== "signup" ? <Link href="/signup">Sign up</Link> : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
