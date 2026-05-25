"use client";

import { Activity, FileText, Gauge, Lightbulb, Target, Upload } from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { PageHeading } from "@/components/page-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Textarea } from "@/components/ui/form";
import {
  readAtsJobDescription,
  resumeProfileToText,
  readResumeProfile,
  saveAtsJobDescription,
  saveAtsResumeText
} from "@/lib/resume-profile";

const initialJob = "We are hiring a Senior .NET Developer with AWS, SQL Server, Web API, CI/CD, Kubernetes, distributed systems, REST API design, and event-driven architecture experience.";

const stopWords = new Set([
  "about", "above", "after", "again", "against", "also", "and", "any", "are", "because", "been", "being", "between", "both",
  "but", "can", "did", "does", "doing", "down", "during", "each", "few", "for", "from", "further", "had", "has", "have",
  "having", "her", "here", "him", "his", "how", "into", "its", "itself", "job", "more", "most", "our", "out", "own",
  "role", "same", "she", "should", "some", "such", "than", "that", "the", "their", "them", "then", "there", "these",
  "they", "this", "through", "too", "under", "until", "very", "was", "we", "were", "what", "when", "where", "which",
  "while", "who", "will", "with", "you", "your"
]);

const skills = [
  { label: ".NET Core", aliases: [".net core", "dotnet core", ".net"] },
  { label: "C#", aliases: ["c#", "c sharp"] },
  { label: "ASP.NET", aliases: ["asp.net", "asp net"] },
  { label: "Web API", aliases: ["web api", "rest api", "api design"] },
  { label: "AWS", aliases: ["aws", "amazon web services"] },
  { label: "AWS Lambda", aliases: ["lambda", "aws lambda"] },
  { label: "S3", aliases: ["s3", "aws s3"] },
  { label: "SQL Server", aliases: ["sql server", "mssql"] },
  { label: "Node.js", aliases: ["node.js", "nodejs", "node"] },
  { label: "Angular", aliases: ["angular"] },
  { label: "React", aliases: ["react", "react.js", "reactjs"] },
  { label: "CI/CD", aliases: ["ci/cd", "cicd", "pipeline", "pipelines"] },
  { label: "Kubernetes", aliases: ["kubernetes", "k8s"] },
  { label: "Docker", aliases: ["docker", "container"] },
  { label: "Microservices", aliases: ["microservices", "distributed services", "distributed systems"] },
  { label: "Event-driven architecture", aliases: ["event-driven", "event driven", "event-driven architecture"] },
  { label: "Azure", aliases: ["azure", "microsoft azure"] },
  { label: "DevOps", aliases: ["devops"] }
];

const resumeSectionTerms = ["summary", "experience", "work experience", "professional experience", "skills", "education", "projects", "certifications"];
const careerTerms = ["developer", "engineer", "manager", "analyst", "consultant", "architect", "specialist", "lead", "intern", "experience", "skills", "projects", "education"];

function normalize(text: string) {
  return text.toLowerCase().replace(/[^\w+#./-]+/g, " ");
}

function hasAny(text: string, aliases: string[]) {
  const normalized = normalize(text);
  return aliases.some((alias) => normalized.includes(normalize(alias).trim()));
}

function getWords(text: string) {
  return normalize(text)
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

function extractImportantTerms(jobDescription: string) {
  const counts = new Map<string, number>();

  getWords(jobDescription).forEach((word) => {
    if (/^\d+$/.test(word)) return;
    counts.set(word, (counts.get(word) || 0) + 1);
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, 18)
    .map(([word]) => word);
}

function percent(matched: number, total: number) {
  return total ? Math.round((matched / total) * 100) : 0;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreColor(score: number) {
  if (score >= 85) return "#059669";
  if (score >= 70) return "#2563eb";
  if (score >= 55) return "#d97706";
  return "#dc2626";
}

function analyzeResume(resume: string, jobDescription: string) {
  const requiredSkills = skills.filter((skill) => hasAny(jobDescription, skill.aliases));
  const matchedSkills = requiredSkills.filter((skill) => hasAny(resume, skill.aliases));
  const missingSkills = requiredSkills.filter((skill) => !hasAny(resume, skill.aliases));

  const importantTerms = extractImportantTerms(jobDescription);
  const matchedTerms = importantTerms.filter((term) => normalize(resume).includes(term));
  const missingTerms = importantTerms.filter((term) => !normalize(resume).includes(term));

  const resumeWords = getWords(resume);
  const jobWords = getWords(jobDescription);
  const hasEmail = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(resume);
  const hasPhone = /(\+?\d[\d\s().-]{8,}\d)/.test(resume);
  const hasLinkedIn = /linkedin\.com/i.test(resume);
  const hasSections = ["summary", "experience", "skills"].filter((section) => normalize(resume).includes(section));
  const detectedResumeSections = resumeSectionTerms.filter((section) => normalize(resume).includes(section));
  const detectedCareerTerms = careerTerms.filter((term) => normalize(resume).includes(term));
  const hasMetrics = /\b\d+%|\b\d+\+|\b\d{2,}\b/.test(resume);
  const seniorityTerms = ["senior", "lead", "architect", "manager", "principal", "years", "experience"];
  const jobSeniority = seniorityTerms.filter((term) => normalize(jobDescription).includes(term));
  const resumeSeniority = jobSeniority.filter((term) => normalize(resume).includes(term));
  const resumeSignalCount =
    [hasEmail, hasPhone, hasLinkedIn].filter(Boolean).length +
    detectedResumeSections.length +
    Math.min(detectedCareerTerms.length, 3) +
    (matchedSkills.length ? 1 : 0);

  const skillScore = percent(matchedSkills.length, requiredSkills.length || 1);
  const keywordScore = percent(matchedTerms.length, importantTerms.length || 1);
  const sectionScore = percent(hasSections.length, 3);
  const contactScore = percent([hasEmail, hasPhone, hasLinkedIn].filter(Boolean).length, 3);
  const experienceScore = clampScore((percent(resumeSeniority.length, jobSeniority.length || 1) * 0.65) + (hasMetrics ? 35 : 0));
  const lengthScore = resumeWords.length >= 180 && resumeWords.length <= 850 ? 100 : resumeWords.length >= 90 ? 72 : 45;
  const formatScore = clampScore((sectionScore * 0.45) + (contactScore * 0.25) + (lengthScore * 0.3));

  const score = clampScore(
    skillScore * 0.35 +
    keywordScore * 0.25 +
    experienceScore * 0.18 +
    formatScore * 0.14 +
    contactScore * 0.08
  );

  if (!resume.trim()) {
    return {
      score: 0,
      verdict: "No resume analyzed",
      skillScore: 0,
      keywordScore: 0,
      experienceScore: 0,
      formatScore: 0,
      contactScore: 0,
      matchedSkills: [],
      missingSkills: requiredSkills.map((skill) => skill.label),
      matchedTerms: [],
      missingTerms: importantTerms,
      suggestions: ["Upload a readable TXT resume or paste resume text into the resume box."],
      resumeWords: 0,
      jobWords: jobWords.length
    };
  }

  if (resumeWords.length < 25 || resumeSignalCount < 3) {
    return {
      score: clampScore(Math.min(12, skillScore * 0.08 + keywordScore * 0.04)),
      verdict: "Not a resume",
      skillScore: clampScore(skillScore * 0.15),
      keywordScore: clampScore(keywordScore * 0.15),
      experienceScore: 0,
      formatScore: 0,
      contactScore,
      matchedSkills: matchedSkills.map((skill) => skill.label),
      missingSkills: missingSkills.map((skill) => skill.label),
      matchedTerms,
      missingTerms,
      suggestions: [
        "This document does not look like a resume. Paste a resume with Summary, Experience, Skills, and contact details.",
        "If this was a PDF/DOCX, copy the resume text from the file and paste it here for analysis."
      ],
      resumeWords: resumeWords.length,
      jobWords: jobWords.length
    };
  }

  const suggestions = [
    ...missingSkills.slice(0, 5).map((skill) => `Add "${skill.label}" only if it is truthful to your experience.`),
    ...missingTerms.slice(0, 4).map((term) => `Mirror the job description term "${term}" in a relevant bullet.`),
    !hasMetrics ? "Add measurable impact such as percentages, cost savings, scale, or delivery time." : "",
    hasSections.length < 3 ? "Keep clear Summary, Experience, and Skills sections for ATS parsing." : "",
    !hasEmail ? "Add an email address in the resume header." : ""
  ].filter(Boolean);

  return {
    score,
    verdict: score >= 85 ? "Strong match" : score >= 70 ? "Good match" : score >= 55 ? "Needs optimization" : "Low match",
    skillScore,
    keywordScore,
    experienceScore,
    formatScore,
    contactScore,
    matchedSkills: matchedSkills.map((skill) => skill.label),
    missingSkills: missingSkills.map((skill) => skill.label),
    matchedTerms,
    missingTerms,
    suggestions: suggestions.slice(0, 8),
    resumeWords: resumeWords.length,
    jobWords: jobWords.length
  };
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm font-semibold">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-3 rounded-full bg-black/10 dark:bg-white/10">
        <div className="h-3 rounded-full transition-all duration-300" style={{ width: `${value}%`, backgroundColor: scoreColor(value) }} />
      </div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const color = scoreColor(score);

  return (
    <div
      className="grid size-48 shrink-0 place-items-center rounded-full p-4 shadow-inner"
      style={{ background: `conic-gradient(${color} ${score * 3.6}deg, rgba(148,163,184,0.22) 0deg)` }}
    >
      <div className="grid size-full place-items-center rounded-full border border-[var(--border)] bg-[var(--card)] text-center">
        <div>
          <p className="text-5xl font-extrabold" style={{ color }}>{score}%</p>
          <p className="mt-1 text-xs font-extrabold uppercase text-[var(--muted)]">ATS match</p>
        </div>
      </div>
    </div>
  );
}

export default function AtsCheckerPage() {
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState(initialJob);
  const [fileName, setFileName] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(() => new Date());
  const report = useMemo(() => analyzeResume(resume, jobDescription), [resume, jobDescription]);

  useEffect(() => {
    const savedResume = localStorage.getItem("jobpilot_ats_resume_text") || resumeProfileToText(readResumeProfile());
    const savedJob = readAtsJobDescription();
    if (savedResume.trim()) setResume(savedResume);
    if (savedJob.trim()) setJobDescription(savedJob);
  }, []);

  function updateResume(value: string) {
    setResume(value);
    saveAtsResumeText(value);
    setUpdatedAt(new Date());
  }

  function updateJobDescription(value: string) {
    setJobDescription(value);
    saveAtsJobDescription(value);
    setUpdatedAt(new Date());
  }

  async function uploadResume(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadMessage("");
    setFileName(file.name);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/ats/extract", {
        method: "POST",
        body: formData
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not extract resume text.");
      }

      updateResume(data.text);
      setUploadMessage(`Extracted ${data.words} words from ${data.fileName}. Score recalculated from the uploaded resume.`);
    } catch (error) {
      updateResume("");
      setUploadMessage(error instanceof Error ? `${error.message} The old score was cleared.` : "Could not read this resume. The old score was cleared.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <>
      <PageHeading title="ATS Score Checker" description="Paste a resume and job description to see a real-time match report." />
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Resume and job text</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="grid min-h-32 cursor-pointer place-items-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--card)] p-6 text-center">
              <Upload className="mb-3 size-8 text-[var(--primary)]" />
              <span className="font-bold">{uploading ? "Extracting resume..." : fileName || "Upload resume file"}</span>
              <span className="mt-1 text-sm text-[var(--muted)]">PDF, DOCX, TXT, MD, and RTF are extracted and scored</span>
              <input accept=".txt,.md,.rtf,.pdf,.docx,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" onChange={uploadResume} type="file" />
            </label>
            {uploadMessage ? (
              <div className="rounded-md border border-[var(--border)] bg-black/[0.03] p-3 text-sm font-semibold leading-6 text-[var(--muted)] dark:bg-white/[0.05]">
                {uploadMessage}
              </div>
            ) : null}
            <Field label="Resume text">
              <Textarea className="min-h-80" onChange={(event) => updateResume(event.target.value)} value={resume} />
            </Field>
            <Field label="Job description">
              <Textarea className="min-h-44" onChange={(event) => updateJobDescription(event.target.value)} value={jobDescription} />
            </Field>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="sticky top-20 overflow-hidden border-[var(--primary)]/25 shadow-xl">
            <div className="grid gap-0 lg:grid-cols-[auto_1fr]">
              <div className="grid place-items-center bg-[linear-gradient(135deg,rgba(37,99,235,0.12),rgba(15,118,110,0.10),rgba(245,158,11,0.10))] p-6">
                <ScoreRing score={report.score} />
              </div>
              <div className="p-6">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-1.5 text-xs font-extrabold uppercase text-emerald-700 dark:text-emerald-200">
                    <Activity className="size-3.5" />
                    Live recalculated
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-bold text-[var(--muted)]">
                    Updated {updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl">{report.verdict}</CardTitle>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
                      The score changes as you edit resume text or job description text. It uses skills, keyword coverage, experience proof, format, contact parsing, and text length.
                    </p>
                  </div>
                  <Gauge className="size-10 rounded-md bg-blue-100 p-2 text-blue-700 dark:bg-blue-400/15 dark:text-blue-200" />
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[
                    ["Resume words", report.resumeWords],
                    ["JD words", report.jobWords],
                    ["Matched skills", report.matchedSkills.length]
                  ].map(([label, value]) => (
                    <div className="rounded-md border border-[var(--border)] bg-black/[0.03] p-3 dark:bg-white/[0.05]" key={label as string}>
                      <p className="text-xs font-bold uppercase text-[var(--muted)]">{label as string}</p>
                      <p className="mt-1 text-2xl font-extrabold">{value as number}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Match breakdown</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <ScoreBar label="Skills matching" value={report.skillScore} />
                <ScoreBar label="Keyword coverage" value={report.keywordScore} />
                <ScoreBar label="Experience matching" value={report.experienceScore} />
                <ScoreBar label="ATS format" value={report.formatScore} />
                <ScoreBar label="Contact parsing" value={report.contactScore} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Required skills</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-bold">Matched</p>
                  <div className="flex flex-wrap gap-2">
                    {(report.matchedSkills.length ? report.matchedSkills : ["No required skills matched yet"]).map((item) => (
                      <span className="rounded-md bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-900" key={item}>{item}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-bold">Missing</p>
                  <div className="flex flex-wrap gap-2">
                    {(report.missingSkills.length ? report.missingSkills : ["No critical skill gaps found"]).map((item) => (
                      <span className="rounded-md bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-950" key={item}>{item}</span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Missing keywords</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {(report.missingTerms.length ? report.missingTerms.slice(0, 12) : ["Keyword coverage looks strong"]).map((item) => (
                  <span className="rounded-md border border-[var(--border)] px-3 py-1 text-sm font-semibold" key={item}>{item}</span>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Improvement actions</CardTitle>
                <Lightbulb className="size-5 text-[var(--warning)]" />
              </CardHeader>
              <CardContent className="space-y-2">
                {(report.suggestions.length ? report.suggestions : ["Resume is well aligned with this job description."]).map((item) => (
                  <p className="flex gap-2 text-sm leading-6 text-[var(--muted)]" key={item}>
                    <Target className="mt-1 size-4 shrink-0 text-[var(--primary)]" />
                    {item}
                  </p>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>ATS parsing report</CardTitle>
              <FileText className="size-5 text-[var(--primary)]" />
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              {[
                ["Matched keywords", report.matchedTerms.length],
                ["Missing keywords", report.missingTerms.length],
                ["Matched skills", report.matchedSkills.length]
              ].map(([label, value]) => (
                <div className="rounded-md border border-[var(--border)] bg-black/[0.03] p-4 dark:bg-white/[0.05]" key={label as string}>
                  <p className="text-sm font-semibold text-[var(--muted)]">{label as string}</p>
                  <p className="mt-1 text-3xl font-extrabold">{value as number}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
