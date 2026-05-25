import { createHash, randomInt } from "node:crypto";

type OtpRecord = {
  hash: string;
  expiresAt: number;
  attempts: number;
  resendAfter: number;
};

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 45 * 1000;
const MAX_ATTEMPTS = 5;

const otpStore = new Map<string, OtpRecord>();

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function otpSecret() {
  return process.env.AUTH_OTP_SECRET || process.env.STRIPE_SECRET_KEY || "jobpilot-local-otp-secret";
}

function hashOtp(email: string, otp: string) {
  return createHash("sha256").update(`${normalizeEmail(email)}:${otp}:${otpSecret()}`).digest("hex");
}

export function createOtp(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const existing = otpStore.get(normalizedEmail);
  const now = Date.now();

  if (existing && existing.resendAfter > now) {
    return {
      ok: false as const,
      retryAfterSeconds: Math.ceil((existing.resendAfter - now) / 1000)
    };
  }

  const otp = randomInt(100000, 1000000).toString();
  otpStore.set(normalizedEmail, {
    hash: hashOtp(normalizedEmail, otp),
    expiresAt: now + OTP_TTL_MS,
    attempts: 0,
    resendAfter: now + RESEND_COOLDOWN_MS
  });

  return {
    ok: true as const,
    email: normalizedEmail,
    otp,
    expiresInMinutes: Math.round(OTP_TTL_MS / 60000)
  };
}

export function verifyOtp(email: string, otp: string) {
  const normalizedEmail = normalizeEmail(email);
  const record = otpStore.get(normalizedEmail);

  if (!record) {
    return { ok: false as const, reason: "No OTP was requested for this email." };
  }

  if (record.expiresAt < Date.now()) {
    otpStore.delete(normalizedEmail);
    return { ok: false as const, reason: "OTP expired. Please request a new code." };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(normalizedEmail);
    return { ok: false as const, reason: "Too many incorrect attempts. Please request a new OTP." };
  }

  record.attempts += 1;
  if (record.hash !== hashOtp(normalizedEmail, otp.trim())) {
    return { ok: false as const, reason: "Invalid OTP code." };
  }

  otpStore.delete(normalizedEmail);
  return { ok: true as const };
}
