import { NextResponse } from "next/server";
import { resumeTemplates } from "@/lib/resume-templates";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    templates: resumeTemplates,
    total: resumeTemplates.length
  });
}
