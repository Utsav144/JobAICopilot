import { NextRequest, NextResponse } from "next/server";
import { createOtp } from "@/lib/otp-store";
import { sendOtpEmail } from "@/lib/otp-email";

export const runtime = "nodejs";

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!validEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const created = createOtp(email);
  if (!created.ok) {
    return NextResponse.json(
      { error: `Please wait ${created.retryAfterSeconds}s before requesting another OTP.` },
      { status: 429 }
    );
  }

  const result = await sendOtpEmail(created.email, created.otp, created.expiresInMinutes);
  if (!result.sent && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: result.reason }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    email: created.email,
    expiresInMinutes: created.expiresInMinutes,
    sent: result.sent,
    messageId: result.sent ? result.messageId : undefined,
    devOtp: result.sent ? undefined : result.devOtp,
    warning: result.sent ? undefined : result.reason
  });
}
