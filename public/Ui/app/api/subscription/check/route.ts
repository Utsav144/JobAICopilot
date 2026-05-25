import { NextRequest, NextResponse } from "next/server";
import { getResumeTemplate } from "@/lib/resume-templates";

export const runtime = "nodejs";

function isPaidStatus(value: unknown) {
  return value === "paid" || value === "pro" || value === "premium";
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const template = getResumeTemplate(typeof body.templateId === "string" ? body.templateId : "");
  const format = String(body.format || "PDF").toUpperCase();
  const paid = isPaidStatus(body.subscriptionStatus) || isPaidStatus(body.planType);
  const allowed = (!template.isPremium || paid) && (format !== "DOCX" || paid);

  return NextResponse.json({
    allowed,
    subscriptionStatus: paid ? "paid" : "free",
    templateId: template.id,
    isPremium: template.isPremium,
    message: allowed
      ? "Template access allowed."
      : format === "DOCX" && !paid
        ? "DOCX export is available on paid plans. Free users can export free templates as PDF only."
        : "This is a premium template. Please upgrade to download this resume."
  });
}
