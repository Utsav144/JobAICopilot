type SendOtpEmailResult =
  | { sent: true; messageId?: string }
  | { sent: false; reason: string; devOtp?: string };

function senderEmail() {
  return process.env.AUTH_EMAIL_FROM || process.env.SMTP_FROM || process.env.REPORT_EMAIL_TO || "";
}

function senderName() {
  return process.env.AUTH_EMAIL_FROM_NAME || "JobPilot AI";
}

export async function sendOtpEmail(email: string, otp: string, expiresInMinutes: number): Promise<SendOtpEmailResult> {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = senderEmail();

  if (!apiKey || !fromEmail) {
    if (process.env.NODE_ENV !== "production") {
      return {
        sent: false,
        reason: "Brevo email is not configured for the UI app. Showing OTP for local development.",
        devOtp: otp
      };
    }

    return { sent: false, reason: "Email OTP is not configured." };
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      accept: "application/json"
    },
    body: JSON.stringify({
      sender: { name: senderName(), email: fromEmail },
      to: [{ email }],
      subject: "Your JobPilot AI login OTP",
      textContent: `Your JobPilot AI login OTP is ${otp}. It expires in ${expiresInMinutes} minutes. If you did not request this, ignore this email.`,
      htmlContent: `
        <div style="font-family:Inter,Arial,sans-serif;background:#f7f9fb;padding:24px;color:#101828;">
          <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #d9e2ec;border-radius:12px;padding:28px;">
            <p style="margin:0 0 8px;font-size:14px;color:#667085;font-weight:700;">JobPilot AI secure login</p>
            <h1 style="margin:0 0 16px;font-size:24px;">Your verification code</h1>
            <div style="font-size:34px;font-weight:900;letter-spacing:8px;background:#eef4ff;border-radius:10px;padding:16px 18px;text-align:center;color:#2563eb;">${otp}</div>
            <p style="margin:18px 0 0;color:#667085;line-height:1.6;">This code expires in ${expiresInMinutes} minutes. If you did not request this login, you can ignore this email.</p>
          </div>
        </div>
      `
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      sent: false,
      reason: data?.message || data?.error || "Brevo could not send the OTP email.",
      devOtp: process.env.NODE_ENV !== "production" ? otp : undefined
    };
  }

  return { sent: true, messageId: data?.messageId };
}
