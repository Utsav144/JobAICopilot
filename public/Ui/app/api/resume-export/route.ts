import { NextRequest, NextResponse } from "next/server";
import { emptyResumeProfile, type ResumeProfile } from "@/lib/resume-profile";
import { createResumeDocx, createResumePdf } from "@/lib/resume-export";
import { getResumeTemplate } from "@/lib/resume-templates";

export const runtime = "nodejs";

type ExportFormat = "PDF" | "DOCX";

function isPaidStatus(value: unknown) {
  return value === "paid" || value === "pro" || value === "premium";
}

function safeFileName(value: string) {
  return value.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "resume";
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const template = getResumeTemplate(typeof body.templateId === "string" ? body.templateId : "");
  const format = String(body.format || "PDF").toUpperCase() as ExportFormat;
  const paid = isPaidStatus(body.subscriptionStatus) || isPaidStatus(body.planType);
  const profile: ResumeProfile = { ...emptyResumeProfile, ...(body.profile || {}) };

  if (!["PDF", "DOCX"].includes(format)) {
    return NextResponse.json({ error: "Supported export formats are PDF and DOCX." }, { status: 400 });
  }

  if (format === "DOCX" && !paid) {
    return NextResponse.json(
      { error: "DOCX export is available on paid plans. Free users can export free templates as PDF only.", templateId: template.id },
      { status: 402 }
    );
  }

  if (template.isPremium && !paid) {
    return NextResponse.json(
      { error: "This is a premium template. Please upgrade to download this resume.", templateId: template.id },
      { status: 402 }
    );
  }

  const fileBase = `${safeFileName(profile.name || "jobpilot")}-${template.id}`;
  const bytes = format === "DOCX" ? createResumeDocx(profile, template) : createResumePdf(profile, template);
  const contentType = format === "DOCX"
    ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    : "application/pdf";

  return new NextResponse(bytes, {
    headers: {
      "content-type": contentType,
      "content-disposition": `attachment; filename="${fileBase}.${format.toLowerCase()}"`,
      "x-jobpilot-template-id": template.id,
      "x-jobpilot-subscription": paid ? "paid" : "free"
    }
  });
}
