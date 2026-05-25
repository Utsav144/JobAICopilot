import type { ResumeTemplate } from "@/lib/resume-templates";

export type ResumeProfile = {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  links: string;
  summary: string;
  existingSummary: string;
  experience: string;
  education: string;
  skills: string;
  projects: string;
  certifications: string;
  targetRole: string;
  preferredIndustry: string;
  targetJobDescription: string;
  candidateLevel: "fresher" | "experienced";
};

export type ResumeScoreReport = {
  score: number;
  verdict: string;
  completeness: number;
  keywordStrength: number;
  atsStructure: number;
  impact: number;
  readability: number;
  actionVerbs: number;
  length: number;
  contactQuality: number;
  roleMatch: number;
  missing: string[];
  missingKeywords: string[];
  suggestions: string[];
  weakContent: string[];
};

export const resumeProfileStorageKey = "jobpilot_resume_profile";
export const atsResumeTextStorageKey = "jobpilot_ats_resume_text";
export const atsJobDescriptionStorageKey = "jobpilot_ats_job_description";

export const emptyResumeProfile: ResumeProfile = {
  name: "",
  title: "",
  email: "",
  phone: "",
  location: "",
  links: "",
  summary: "",
  existingSummary: "",
  experience: "",
  education: "",
  skills: "",
  projects: "",
  certifications: "",
  targetRole: "",
  preferredIndustry: "",
  targetJobDescription: "",
  candidateLevel: "experienced"
};

function hasWindow() {
  return typeof window !== "undefined";
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function words(value: string) {
  return value.trim().split(/\s+/).filter(Boolean);
}

export function createResumeProfileFromSession(): ResumeProfile {
  if (!hasWindow()) return emptyResumeProfile;

  try {
    const session = JSON.parse(localStorage.getItem("jobpilot_session") || "{}");
    return { ...emptyResumeProfile, name: session.user || "", email: session.email || "" };
  } catch {
    return emptyResumeProfile;
  }
}

export function readResumeProfile(): ResumeProfile {
  if (!hasWindow()) return emptyResumeProfile;

  try {
    const saved = localStorage.getItem(resumeProfileStorageKey);
    if (saved) return { ...emptyResumeProfile, ...JSON.parse(saved) };

    const atsText = localStorage.getItem(atsResumeTextStorageKey);
    if (atsText) return parseResumeTextToProfile(atsText);

    return createResumeProfileFromSession();
  } catch {
    return createResumeProfileFromSession();
  }
}

export function writeResumeProfile(profile: ResumeProfile) {
  if (!hasWindow()) return;
  localStorage.setItem(resumeProfileStorageKey, JSON.stringify(profile));
  localStorage.setItem(atsResumeTextStorageKey, resumeProfileToText(profile));
}

export function saveAtsResumeText(text: string) {
  if (!hasWindow()) return;
  localStorage.setItem(atsResumeTextStorageKey, text);

  const existingProfile = localStorage.getItem(resumeProfileStorageKey);
  if (!existingProfile && text.trim()) {
    localStorage.setItem(resumeProfileStorageKey, JSON.stringify(parseResumeTextToProfile(text)));
  }
}

export function saveAtsJobDescription(text: string) {
  if (!hasWindow()) return;
  localStorage.setItem(atsJobDescriptionStorageKey, text);
}

export function readAtsJobDescription() {
  if (!hasWindow()) return "";
  return localStorage.getItem(atsJobDescriptionStorageKey) || "";
}

export function resumeProfileToText(profile: ResumeProfile) {
  return [
    profile.name,
    profile.title,
    [profile.email, profile.phone, profile.location, profile.links].filter(Boolean).join(" | "),
    profile.summary ? `Summary\n${profile.summary}` : "",
    profile.targetRole ? `Target Role\n${profile.targetRole}` : "",
    profile.preferredIndustry ? `Preferred Industry\n${profile.preferredIndustry}` : "",
    profile.experience ? `Experience\n${profile.experience}` : "",
    profile.skills ? `Skills\n${profile.skills}` : "",
    profile.education ? `Education\n${profile.education}` : "",
    profile.projects ? `Projects\n${profile.projects}` : "",
    profile.certifications ? `Certifications\n${profile.certifications}` : ""
  ].filter(Boolean).join("\n\n");
}

export function parseList(value: string) {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function sectionFromText(text: string, heading: string) {
  const pattern = new RegExp(`${heading}\\s*\\n([\\s\\S]*?)(?=\\n\\s*(summary|experience|work experience|skills|education|projects|certifications)\\s*\\n|$)`, "i");
  return text.match(pattern)?.[1]?.trim() || "";
}

export function parseResumeTextToProfile(text: string): ResumeProfile {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const email = text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)?.[0] || "";
  const phone = text.match(/(\+?\d[\d\s().-]{8,}\d)/)?.[0] || "";
  const firstContentLines = lines.filter((line) => !/^(summary|experience|work experience|skills|education|projects|certifications)$/i.test(line));

  return {
    ...emptyResumeProfile,
    name: firstContentLines[0] || "",
    title: firstContentLines[1] && !firstContentLines[1].includes("@") ? firstContentLines[1] : "",
    email,
    phone,
    links: (text.match(/(linkedin\.com\/[^\s]+|github\.com\/[^\s]+|https?:\/\/[^\s]+)/gi) || []).join(", "),
    summary: sectionFromText(text, "summary"),
    existingSummary: sectionFromText(text, "summary"),
    experience: sectionFromText(text, "experience|work experience"),
    education: sectionFromText(text, "education"),
    skills: sectionFromText(text, "skills"),
    projects: sectionFromText(text, "projects"),
    certifications: sectionFromText(text, "certifications"),
    candidateLevel: /fresher|graduate|intern|entry level/i.test(text) ? "fresher" : "experienced"
  };
}

export function scoreResumeProfile(profile: ResumeProfile, template: ResumeTemplate): ResumeScoreReport {
  const skillList = parseList(profile.skills);
  const resumeText = resumeProfileToText(profile);
  const normalizedResume = resumeText.toLowerCase();
  const targetText = `${profile.targetRole} ${profile.preferredIndustry} ${profile.targetJobDescription}`.toLowerCase();
  const impactSignals = (resumeText.match(/\b\d+%|\b\d+\+|\b\d{2,}\b|reduced|improved|increased|automated|optimized|delivered|saved/gi) || []).length;
  const actionVerbSignals = (resumeText.match(/\b(achieved|built|created|delivered|designed|developed|drove|improved|implemented|increased|launched|led|managed|migrated|optimized|reduced|resolved|shipped|streamlined|automated)\b/gi) || []).length;
  const contactSignals = [
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(profile.email),
    /(\+?\d[\d\s().-]{8,}\d)/.test(profile.phone),
    Boolean(profile.location),
    /linkedin|github|portfolio|https?:\/\//i.test(profile.links)
  ].filter(Boolean).length;
  const targetKeywords = Array.from(new Set(targetText.split(/[^\w+#.-]+/).filter((word) => word.length > 2 && !["and", "the", "for", "with", "role", "job"].includes(word))));
  const skillKeywords = skillList.map((skill) => skill.toLowerCase());
  const missingKeywords = [...targetKeywords, ...skillKeywords].filter((keyword) => keyword && !normalizedResume.includes(keyword)).slice(0, 12);
  const duplicateLines = resumeText
    .split(/\n+/)
    .map((line) => line.trim().toLowerCase())
    .filter((line, index, lines) => line.length > 24 && lines.indexOf(line) !== index);
  const weakContent = [
    /\bresponsible for\b/i.test(resumeText) ? "Replace 'responsible for' with stronger ownership verbs." : "",
    /\bworked on\b/i.test(resumeText) ? "Replace 'worked on' with delivered, built, optimized, or automated." : "",
    duplicateLines.length ? "Duplicate resume lines detected. Merge repeated content." : "",
    profile.summary.length > 520 ? "Professional summary is too long. Keep it concise for recruiters." : ""
  ].filter(Boolean);

  const checks = [
    Boolean(profile.name),
    Boolean(profile.title || profile.targetRole),
    Boolean(profile.email),
    Boolean(profile.summary && words(profile.summary).length >= 18),
    profile.candidateLevel === "fresher" ? Boolean(profile.projects && words(profile.projects).length >= 18) : Boolean(profile.experience && words(profile.experience).length >= 35),
    skillList.length >= 5,
    Boolean(profile.education),
    Boolean(profile.projects || profile.certifications)
  ];

  const completeness = clampScore((checks.filter(Boolean).length / checks.length) * 100);
  const keywordStrength = clampScore(Math.min(100, skillList.length * 7 + (targetKeywords.length ? ((targetKeywords.length - missingKeywords.length) / targetKeywords.length) * 40 : 20)));
  const atsStructure = clampScore(
    (profile.summary ? 22 : 0) +
    (profile.experience ? 28 : 0) +
    (profile.skills ? 22 : 0) +
    (profile.education ? 14 : 0) +
    (profile.email ? 14 : 0)
  );
  const impact = clampScore(Math.min(100, impactSignals * 18));
  const readability = clampScore(
    (profile.summary && words(profile.summary).length <= 85 ? 30 : 12) +
    (resumeText.split("\n").filter((line) => line.trim().startsWith("-")).length >= 3 ? 30 : 12) +
    (resumeText.length < 5500 ? 25 : 12) +
    (weakContent.length ? 5 : 15)
  );
  const actionVerbs = clampScore(Math.min(100, actionVerbSignals * 12));
  const length = clampScore(words(resumeText).length >= 220 && words(resumeText).length <= 850 ? 100 : words(resumeText).length >= 120 ? 72 : 45);
  const contactQuality = clampScore((contactSignals / 4) * 100);
  const roleMatch = clampScore(targetKeywords.length ? ((targetKeywords.length - missingKeywords.length) / targetKeywords.length) * 100 : keywordStrength);
  const designBoost = Math.max(0, template.atsScore - 84) * 0.35;
  const score = clampScore(
    completeness * 0.18 +
    keywordStrength * 0.18 +
    atsStructure * 0.16 +
    impact * 0.12 +
    readability * 0.1 +
    actionVerbs * 0.08 +
    length * 0.06 +
    contactQuality * 0.06 +
    roleMatch * 0.06 +
    designBoost
  );

  const missing = [
    !profile.name ? "Add full name" : "",
    !profile.title && !profile.targetRole ? "Add target job role" : "",
    !profile.email ? "Add email" : "",
    !profile.summary || words(profile.summary).length < 18 ? "Write a stronger summary" : "",
    profile.candidateLevel === "fresher" && (!profile.projects || words(profile.projects).length < 18) ? "Add project details for fresher profile" : "",
    profile.candidateLevel === "experienced" && (!profile.experience || words(profile.experience).length < 35) ? "Add detailed work experience" : "",
    skillList.length < 5 ? "Add at least 5 skills" : "",
    impact < 35 ? "Add measurable outcomes" : "",
    actionVerbs < 35 ? "Use stronger action verbs" : "",
    !profile.education ? "Add education" : "",
    missingKeywords.length ? "Add missing target-role keywords" : ""
  ].filter(Boolean);
  const suggestions = [
    ...missing.slice(0, 4),
    ...missingKeywords.slice(0, 5).map((keyword) => `Add keyword: ${keyword}`),
    ...weakContent.slice(0, 3)
  ];

  return {
    score,
    verdict: score >= 85 ? "ATS-ready" : score >= 70 ? "Strong draft" : score >= 50 ? "Needs optimization" : "Incomplete resume",
    completeness,
    keywordStrength,
    atsStructure,
    impact,
    readability,
    actionVerbs,
    length,
    contactQuality,
    roleMatch,
    missing,
    missingKeywords,
    suggestions,
    weakContent
  };
}
