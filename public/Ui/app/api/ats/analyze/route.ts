import { NextRequest, NextResponse } from "next/server";
import { emptyResumeProfile, scoreResumeProfile, type ResumeProfile } from "@/lib/resume-profile";
import { getResumeTemplate } from "@/lib/resume-templates";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const profile: ResumeProfile = { ...emptyResumeProfile, ...(body.profile || {}) };
  const template = getResumeTemplate(typeof body.templateId === "string" ? body.templateId : "");
  const report = scoreResumeProfile(profile, template);

  return NextResponse.json({
    templateId: template.id,
    score: report.score,
    verdict: report.verdict,
    sections: {
      completeness: report.completeness,
      keywords: report.keywordStrength,
      structure: report.atsStructure,
      readability: report.readability,
      actionVerbs: report.actionVerbs,
      contactQuality: report.contactQuality,
      roleMatch: report.roleMatch
    },
    missingKeywords: report.missingKeywords,
    suggestions: report.suggestions
  });
}
