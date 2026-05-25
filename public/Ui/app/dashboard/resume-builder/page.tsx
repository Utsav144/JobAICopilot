"use client";

import Link from "next/link";
import {
  BadgeCheck,
  Brain,
  CheckCircle2,
  Download,
  FileDown,
  LayoutTemplate,
  Lightbulb,
  Save,
  Sparkles,
  Wand2,
  Zap
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeading } from "@/components/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/form";
import { enhanceText, generateOptimizedResume, recommendedKeywords } from "@/lib/resume-ai";
import { createResumeDocx, createResumePdf } from "@/lib/resume-export";
import {
  createResumeProfileFromSession,
  parseList,
  readResumeProfile,
  resumeProfileToText,
  scoreResumeProfile,
  type ResumeProfile,
  type ResumeScoreReport,
  writeResumeProfile
} from "@/lib/resume-profile";
import { getResumeTemplate, resumeTemplates } from "@/lib/resume-templates";

type EnhanceableSection = "summary" | "experience" | "skills" | "projects" | "certifications";

function scoreColor(score: number) {
  if (score >= 85) return "#059669";
  if (score >= 70) return "#2563eb";
  if (score >= 55) return "#d97706";
  return "#dc2626";
}

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function concatBytes(chunks: Uint8Array[]) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  chunks.forEach((chunk) => {
    output.set(chunk, offset);
    offset += chunk.length;
  });
  return output;
}

function createZip(files: { name: string; content: string }[]) {
  const encoder = new TextEncoder();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

  files.forEach((file) => {
    const name = encoder.encode(file.name);
    const data = encoder.encode(file.content);
    const crc = crc32(data);
    const local = new Uint8Array(30 + name.length + data.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(10, dosTime, true);
    localView.setUint16(12, dosDate, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, name.length, true);
    local.set(name, 30);
    local.set(data, 30 + name.length);
    locals.push(local);

    const central = new Uint8Array(46 + name.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(12, dosTime, true);
    centralView.setUint16(14, dosDate, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, name.length, true);
    centralView.setUint32(42, offset, true);
    central.set(name, 46);
    centrals.push(central);
    offset += local.length;
  });

  const centralDirectory = concatBytes(centrals);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralDirectory.length, true);
  endView.setUint32(16, offset, true);

  return concatBytes([...locals, centralDirectory, end]);
}

function docParagraph(text: string, options: { heading?: boolean; bold?: boolean } = {}) {
  const size = options.heading ? "24" : "21";
  const bold = options.bold || options.heading ? "<w:b/>" : "";
  return `<w:p><w:pPr><w:spacing w:after="${options.heading ? "120" : "80"}"/></w:pPr><w:r><w:rPr>${bold}<w:sz w:val="${size}"/></w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

function createDocx(profile: ResumeProfile) {
  const sections = [
    ["PROFESSIONAL SUMMARY", profile.summary],
    ["CORE SKILLS", parseList(profile.skills).join(" | ")],
    ["EXPERIENCE", profile.experience],
    ["PROJECTS", profile.projects],
    ["EDUCATION", profile.education],
    ["CERTIFICATIONS", profile.certifications]
  ];
  const sectionXml = sections
    .filter(([, value]) => value)
    .map(([label, value]) => [
      docParagraph(label, { heading: true }),
      ...String(value).split("\n").filter(Boolean).map((line) => docParagraph(line.trim()))
    ].join(""))
    .join("");
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${docParagraph(profile.name || "Resume", { bold: true })}${docParagraph(profile.title || profile.targetRole || "Target Role", { bold: true })}${docParagraph([profile.email, profile.phone, profile.location, profile.links].filter(Boolean).join(" | "))}${sectionXml}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/></w:sectPr></w:body></w:document>`;
  const bytes = createZip([
    { name: "[Content_Types].xml", content: `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>` },
    { name: "_rels/.rels", content: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>` },
    { name: "word/document.xml", content: documentXml }
  ]);

  return new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}

function ScoreRing({ report }: { report: ResumeScoreReport }) {
  const color = scoreColor(report.score);

  return (
    <div className="grid size-44 place-items-center rounded-full p-3 shadow-inner" style={{ background: `conic-gradient(${color} ${report.score * 3.6}deg, rgba(148,163,184,0.24) 0deg)` }}>
      <div className="grid size-full place-items-center rounded-full border border-[var(--border)] bg-[var(--card)] text-center">
        <div>
          <p className="text-5xl font-extrabold" style={{ color }}>{report.score}%</p>
          <p className="mt-1 text-xs font-extrabold uppercase text-[var(--muted)]">{report.verdict}</p>
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs font-bold">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-black/10 dark:bg-white/10">
        <div className="h-2 rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: scoreColor(value) }} />
      </div>
    </div>
  );
}

function SectionHeader({ label, onEnhance }: { label: string; onEnhance: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <Button onClick={onEnhance} size="sm" type="button" variant="secondary">
        <Sparkles className="size-3.5" />
        Enhance
      </Button>
    </div>
  );
}

export default function ResumeBuilderPage() {
  const [profile, setProfile] = useState<ResumeProfile>(() => createResumeProfileFromSession());
  const [templateId, setTemplateId] = useState("ats-friendly");
  const [hydrated, setHydrated] = useState(false);
  const [savedAt, setSavedAt] = useState("");
  const [aiStatus, setAiStatus] = useState("");
  const template = getResumeTemplate(templateId);
  const skills = useMemo(() => parseList(profile.skills), [profile.skills]);
  const report = useMemo(() => scoreResumeProfile(profile, template), [profile, template]);
  const keywords = useMemo(() => recommendedKeywords(profile), [profile]);

  useEffect(() => {
    setProfile(readResumeProfile());
    setTemplateId(localStorage.getItem("jobpilot_resume_template") || "ats-friendly");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeResumeProfile(profile);
    setSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
  }, [hydrated, profile]);

  function update(key: keyof ResumeProfile, value: string) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function generateResume() {
    setProfile((current) => generateOptimizedResume(current));
    setAiStatus("AI generated recruiter-friendly summary, ATS keywords, role bullets, and project content.");
  }

  function enhanceSection(section: EnhanceableSection) {
    setProfile((current) => ({ ...current, [section]: enhanceText(String(current[section] || ""), current, section) }));
    setAiStatus(`${section.charAt(0).toUpperCase() + section.slice(1)} enhanced with stronger wording and ATS keywords.`);
  }

  function downloadPdf() {
    const bytes = createResumePdf(profile, template);
    downloadBlob(new Blob([bytes], { type: "application/pdf" }), `${profile.name || "jobpilot-resume"}.pdf`);
  }

  function downloadDocx() {
    const bytes = createResumeDocx(profile, template);
    downloadBlob(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }), `${profile.name || "jobpilot-resume"}.docx`);
  }

  const headerClass =
    template.layout === "accent"
      ? "border-l-4 border-blue-600 pl-5"
      : template.layout === "dark-head"
        ? "rounded bg-slate-950 p-5 text-white"
        : template.layout === "executive"
          ? "border-b-4 border-slate-900 pb-5"
          : "border-b border-slate-200 pb-5";

  return (
    <>
      <PageHeading title="AI Resume Builder" description="Provide basic details. JobPilot AI generates an ATS-friendly, recruiter-ready resume with live scoring." />

      <section className="mb-5 overflow-hidden rounded-lg border border-[var(--primary)]/25 bg-[var(--card)] shadow-xl">
        <div className="grid gap-0 xl:grid-cols-[1fr_0.95fr]">
          <div className="p-6 sm:p-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-md bg-[var(--primary)]/10 px-3 py-2 text-sm font-extrabold text-[var(--primary)]">
              <Brain className="size-4" />
              HR recruiter + ATS specialist mode
            </div>
            <h2 className="max-w-3xl text-3xl font-extrabold tracking-normal">From basic info to premium MNC-ready resume.</h2>
            <p className="mt-3 max-w-3xl leading-7 text-[var(--muted)]">
              Generates concise summaries, ATS keywords, role-specific achievements, action verbs, missing-section alerts, LinkedIn/Naukri-ready formatting, and live scoring while you edit.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={generateResume} type="button"><Wand2 className="size-4" /> Generate AI Resume</Button>
              <Button onClick={downloadPdf} type="button" variant="secondary"><Download className="size-4" /> PDF</Button>
              <Button onClick={downloadDocx} type="button" variant="secondary"><FileDown className="size-4" /> DOCX</Button>
              <Link href="/dashboard/templates"><Button type="button" variant="secondary"><LayoutTemplate className="size-4" /> Templates</Button></Link>
            </div>
            {aiStatus ? <p className="mt-4 rounded-md bg-emerald-500/10 p-3 text-sm font-bold text-emerald-700 dark:text-emerald-200">{aiStatus}</p> : null}
          </div>
          <div className="grid gap-5 border-t border-[var(--border)] bg-[linear-gradient(135deg,rgba(37,99,235,0.12),rgba(15,118,110,0.10),rgba(245,158,11,0.10))] p-6 lg:grid-cols-[auto_1fr] xl:border-l xl:border-t-0">
            <ScoreRing report={report} />
            <div className="grid content-center gap-3">
              <MiniMetric label="Keywords" value={report.keywordStrength} />
              <MiniMetric label="Formatting" value={report.atsStructure} />
              <MiniMetric label="Readability" value={report.readability} />
              <MiniMetric label="Role match" value={report.roleMatch} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 2xl:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-5">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Basic information</CardTitle>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Only these details are needed. AI fills structure, keywords, and recruiter wording.</p>
              </div>
              <div className="rounded-md bg-emerald-500/10 px-3 py-2 text-xs font-extrabold text-emerald-700 dark:text-emerald-200">
                <Save className="mr-1 inline size-3.5" />
                {savedAt ? `Saved ${savedAt}` : "Ready"}
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name"><Input value={profile.name} onChange={(e) => update("name", e.target.value)} placeholder="Your full name" /></Field>
                <Field label="Target job role"><Input value={profile.targetRole} onChange={(e) => update("targetRole", e.target.value)} placeholder="Frontend Engineer, Business Analyst..." /></Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email"><Input value={profile.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" /></Field>
                <Field label="Phone"><Input value={profile.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+91 98765 43210" /></Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Location"><Input value={profile.location} onChange={(e) => update("location", e.target.value)} placeholder="City, Country" /></Field>
                <Field label="LinkedIn / portfolio"><Input value={profile.links} onChange={(e) => update("links", e.target.value)} placeholder="LinkedIn, GitHub, portfolio" /></Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Preferred industry"><Input value={profile.preferredIndustry} onChange={(e) => update("preferredIndustry", e.target.value)} placeholder="Technology, Finance, Healthcare..." /></Field>
                <Field label="Candidate type">
                  <select className="min-h-11 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]/40" value={profile.candidateLevel} onChange={(e) => update("candidateLevel", e.target.value as ResumeProfile["candidateLevel"])}>
                    <option value="experienced">Experienced</option>
                    <option value="fresher">Fresher</option>
                  </select>
                </Field>
              </div>
              <Field label="Skills" hint="Add known skills. AI will add safe industry and role keywords.">
                <Textarea value={profile.skills} onChange={(e) => update("skills", e.target.value)} placeholder="React, Node.js, AWS, SQL, Excel, Communication" />
              </Field>
              <Field label="Experience summary" hint="Write rough points. AI will convert them into role-specific achievements.">
                <Textarea className="min-h-32" value={profile.experience} onChange={(e) => update("experience", e.target.value)} placeholder="I worked on dashboards, APIs, reporting, client communication..." />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Education"><Textarea value={profile.education} onChange={(e) => update("education", e.target.value)} placeholder="Degree, college, year" /></Field>
                <Field label="Certifications"><Textarea value={profile.certifications} onChange={(e) => update("certifications", e.target.value)} placeholder="AWS, Azure, Scrum, Google, course certificates" /></Field>
              </div>
              <Field label="Projects"><Textarea value={profile.projects} onChange={(e) => update("projects", e.target.value)} placeholder="Project name, stack, problem solved, result" /></Field>
              <Field label="Existing resume summary (optional)"><Textarea value={profile.existingSummary} onChange={(e) => update("existingSummary", e.target.value)} placeholder="Paste old summary if you want AI to improve it" /></Field>
              <Field label="Target job description / company keywords" hint="Paste JD text from LinkedIn, Naukri, Indeed, TCS, Infosys, Accenture, Amazon, Microsoft, etc. Missing keywords update live.">
                <Textarea className="min-h-32" value={profile.targetJobDescription} onChange={(e) => update("targetJobDescription", e.target.value)} placeholder="Paste target job description here" />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>AI editable sections</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <Field label="" hint="Generated from your basic information and target role.">
                <SectionHeader label="Professional Summary" onEnhance={() => enhanceSection("summary")} />
                <Textarea className="mt-2 min-h-32" value={profile.summary} onChange={(e) => update("summary", e.target.value)} placeholder="Create a powerful professional summary." />
              </Field>
              <Field label="">
                <SectionHeader label="Role-specific bullet points" onEnhance={() => enhanceSection("experience")} />
                <Textarea className="mt-2 min-h-40" value={profile.experience} onChange={(e) => update("experience", e.target.value)} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="">
                  <SectionHeader label="Projects" onEnhance={() => enhanceSection("projects")} />
                  <Textarea className="mt-2" value={profile.projects} onChange={(e) => update("projects", e.target.value)} />
                </Field>
                <Field label="">
                  <SectionHeader label="Skills / keywords" onEnhance={() => enhanceSection("skills")} />
                  <Textarea className="mt-2" value={profile.skills} onChange={(e) => update("skills", e.target.value)} />
                </Field>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-5">
          <Card className="overflow-hidden border-[var(--primary)]/25 shadow-xl">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Live ATS report</CardTitle>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Analyzes keywords, formatting, readability, completeness, skills relevance, grammar signals, action verbs, role match, and contact quality.</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-3 py-2 text-xs font-extrabold text-emerald-700 dark:text-emerald-200">
                <Zap className="size-3.5" />
                Live
              </span>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[auto_1fr]">
              <ScoreRing report={report} />
              <div className="grid gap-3">
                {[
                  ["Section completeness", report.completeness],
                  ["Skills relevance", report.keywordStrength],
                  ["ATS formatting", report.atsStructure],
                  ["Grammar/readability", report.readability],
                  ["Action verbs", report.actionVerbs],
                  ["Resume length", report.length],
                  ["Contact quality", report.contactQuality],
                  ["Job role matching", report.roleMatch]
                ].map(([label, value]) => <MiniMetric key={label as string} label={label as string} value={value as number} />)}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between"><CardTitle>ATS suggestions</CardTitle><Lightbulb className="size-5 text-[var(--warning)]" /></CardHeader>
              <CardContent className="space-y-2">
                {(report.suggestions.length ? report.suggestions : ["Resume looks strong for ATS parsing and recruiter review."]).slice(0, 8).map((item) => (
                  <p className="flex gap-2 text-sm leading-6 text-[var(--muted)]" key={item}><CheckCircle2 className="mt-1 size-4 shrink-0 text-[var(--primary)]" />{item}</p>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Missing keywords</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {(report.missingKeywords.length ? report.missingKeywords : ["No major missing keywords"]).slice(0, 14).map((keyword) => (
                  <span className="rounded-md border border-[var(--border)] px-3 py-1 text-sm font-semibold" key={keyword}>{keyword}</span>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Live premium preview</CardTitle>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-200"><BadgeCheck className="size-3.5" />{template.name}</span>
                  <select className="rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs font-bold" value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
                    {resumeTemplates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={downloadPdf} size="sm" type="button"><Download className="size-4" /> PDF</Button>
                <Button onClick={downloadDocx} size="sm" type="button" variant="secondary"><FileDown className="size-4" /> DOCX</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="min-h-[780px] rounded-md border border-[var(--border)] bg-white p-8 text-slate-950 shadow-inner">
                <div className={headerClass}>
                  <h2 className="text-3xl font-extrabold">{profile.name || "Your Name"}</h2>
                  <p className={template.layout === "dark-head" ? "mt-1 font-semibold text-blue-200" : "mt-1 font-semibold text-blue-700"}>{profile.title || profile.targetRole || "Target Job Role"}</p>
                  <p className={template.layout === "dark-head" ? "mt-2 text-sm text-slate-200" : "mt-2 text-sm text-slate-600"}>
                    {[profile.email, profile.phone, profile.location, profile.links].filter(Boolean).join(" | ") || "Email | Phone | Location | LinkedIn"}
                  </p>
                </div>
                <section className="mt-6">
                  <h3 className="text-sm font-extrabold uppercase tracking-normal">Professional Summary</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{profile.summary || "Add a concise recruiter-friendly summary."}</p>
                </section>
                <section className="mt-6">
                  <h3 className="text-sm font-extrabold uppercase tracking-normal">Core Skills</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(skills.length ? skills : keywords.slice(0, 8)).map((skill) => <span className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold" key={skill}>{skill}</span>)}
                  </div>
                </section>
                {[
                  ["Experience", profile.experience],
                  ["Projects", profile.projects],
                  ["Education", profile.education],
                  ["Certifications", profile.certifications]
                ].map(([section, value]) => (
                  <section className="mt-6" key={section}>
                    <h3 className="text-sm font-extrabold uppercase tracking-normal">{section}</h3>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{value || `Add ${section.toLowerCase()} details to complete this section.`}</p>
                  </section>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
