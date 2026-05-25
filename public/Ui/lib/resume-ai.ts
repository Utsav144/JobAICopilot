import type { ResumeProfile } from "@/lib/resume-profile";
import { emptyResumeProfile, parseList } from "@/lib/resume-profile";

const industryKeywords: Record<string, string[]> = {
  technology: ["Agile", "SDLC", "scalability", "cloud", "API", "automation", "CI/CD", "security", "performance"],
  finance: ["risk controls", "compliance", "reporting", "audit readiness", "stakeholder management", "process improvement"],
  healthcare: ["data privacy", "patient experience", "compliance", "quality improvement", "workflow optimization"],
  ecommerce: ["conversion", "customer journey", "catalog", "payments", "analytics", "growth", "operations"],
  consulting: ["client delivery", "business analysis", "transformation", "governance", "stakeholder communication"],
  default: ["problem solving", "cross-functional collaboration", "process improvement", "quality", "documentation", "delivery ownership"]
};

const roleKeywords: Record<string, string[]> = {
  developer: ["software development", "debugging", "REST API", "Git", "testing", "deployment", "clean code", "system design"],
  engineer: ["engineering", "architecture", "automation", "monitoring", "reliability", "performance optimization"],
  manager: ["team leadership", "planning", "roadmap", "stakeholder management", "governance", "delivery tracking"],
  analyst: ["data analysis", "dashboards", "requirements", "insights", "reporting", "SQL", "documentation"],
  tester: ["test cases", "defect tracking", "automation testing", "regression testing", "quality assurance"],
  designer: ["user research", "wireframes", "design systems", "prototyping", "accessibility", "usability"],
  fresher: ["academic projects", "internship", "problem solving", "communication", "learning agility", "team collaboration"]
};

const actionVerbs = ["Delivered", "Built", "Improved", "Automated", "Optimized", "Led", "Created", "Implemented", "Reduced", "Streamlined", "Designed", "Launched"];

function cleanSentence(value: string) {
  return value.replace(/\s+/g, " ").replace(/\s+([,.])/g, "$1").trim();
}

function titleCase(value: string) {
  return value.replace(/\w\S*/g, (text) => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase());
}

function roleKey(role: string, level: ResumeProfile["candidateLevel"]) {
  const lower = role.toLowerCase();
  if (level === "fresher") return "fresher";
  return Object.keys(roleKeywords).find((key) => lower.includes(key)) || "engineer";
}

function industryKey(industry: string) {
  const lower = industry.toLowerCase();
  return Object.keys(industryKeywords).find((key) => lower.includes(key)) || "default";
}

export function recommendedKeywords(profile: ResumeProfile) {
  const role = roleKeywords[roleKey(profile.targetRole || profile.title, profile.candidateLevel)] || roleKeywords.engineer;
  const industry = industryKeywords[industryKey(profile.preferredIndustry)] || industryKeywords.default;
  const jdWords = profile.targetJobDescription
    .split(/[^\w+#.-]+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 3 && !["with", "that", "from", "this", "have", "will", "your", "role"].includes(word.toLowerCase()))
    .slice(0, 12);

  return Array.from(new Set([...parseList(profile.skills), ...role, ...industry, ...jdWords])).slice(0, 28);
}

export function generateProfessionalSummary(profile: ResumeProfile) {
  const role = profile.targetRole || profile.title || "target role";
  const industry = profile.preferredIndustry || "modern business";
  const skills = recommendedKeywords(profile).slice(0, 6).join(", ");
  const base = profile.existingSummary || profile.summary;

  if (profile.candidateLevel === "fresher") {
    return cleanSentence(
      `Motivated ${role} candidate with strong foundation in ${skills}. Experienced through academic projects, certifications, and hands-on practice in ${industry} environments. Known for fast learning, clear communication, structured problem solving, and building recruiter-ready project outcomes aligned with ATS and LinkedIn hiring requirements.`
    );
  }

  return cleanSentence(
    `${base ? `${base} ` : ""}Results-driven ${role} with experience delivering ${industry} solutions using ${skills}. Strong record of improving workflows, collaborating with cross-functional teams, and converting business requirements into measurable outcomes. Resume is optimized for ATS parsing, MNC screening, and recruiter review across Naukri, LinkedIn, Indeed, and enterprise hiring systems.`
  );
}

export function generateExperienceBullets(profile: ResumeProfile) {
  const role = profile.targetRole || profile.title || "professional";
  const keywords = recommendedKeywords(profile);
  const primarySkills = keywords.slice(0, 6);

  if (profile.candidateLevel === "fresher") {
    return [
      `- Built academic and self-driven projects using ${primarySkills.slice(0, 3).join(", ")} to solve practical ${profile.preferredIndustry || "business"} problems.`,
      "- Applied structured debugging, documentation, and testing practices to improve project quality and recruiter readability.",
      `- Collaborated in team assignments and presented technical decisions clearly for ${role} interview readiness.`,
      "- Converted learning outcomes into measurable project stories with tools, scope, and result-focused explanations."
    ].join("\n");
  }

  return [
    `- ${actionVerbs[0]} ${profile.preferredIndustry || "business"} initiatives for ${role} responsibilities using ${primarySkills.slice(0, 4).join(", ")} with clear ownership from requirement analysis to release.`,
    `- ${actionVerbs[2]} process quality and delivery speed by applying ${primarySkills.slice(2, 6).join(", ")} across daily execution, documentation, and stakeholder reporting.`,
    `- ${actionVerbs[3]} repeatable workflows and reduced manual effort through structured problem solving, quality checks, and performance-focused improvements.`,
    `- ${actionVerbs[5]} cross-functional communication with product, operations, and technical teams to deliver concise, recruiter-friendly achievements.`
  ].join("\n");
}

export function generateProjects(profile: ResumeProfile) {
  const role = profile.targetRole || profile.title || "target role";
  const skills = recommendedKeywords(profile).slice(0, 5).join(", ");

  return [
    `${titleCase(role)} Portfolio Project`,
    `- Designed an ATS-relevant project using ${skills} to demonstrate role readiness, business understanding, and structured delivery.`,
    "- Added measurable outputs, documentation, and recruiter-friendly explanation for LinkedIn and Naukri profile alignment."
  ].join("\n");
}

export function enhanceText(value: string, profile: ResumeProfile, section: keyof ResumeProfile) {
  const keywords = recommendedKeywords(profile).slice(0, 6).join(", ");
  const cleaned = cleanSentence(value);

  if (section === "summary") return generateProfessionalSummary({ ...profile, existingSummary: cleaned });
  if (section === "experience") return cleaned ? cleaned.replace(/\bresponsible for\b/gi, "Owned").replace(/\bworked on\b/gi, "Delivered") : generateExperienceBullets(profile);
  if (section === "skills") return recommendedKeywords(profile).join(", ");
  if (section === "projects") return cleaned ? `${cleaned}\n- Highlighted tools, measurable outcomes, and ATS keywords: ${keywords}.` : generateProjects(profile);
  if (section === "certifications") return cleaned || "Add role-relevant certifications, training, or course completions.";

  return cleaned;
}

export function generateOptimizedResume(input: ResumeProfile) {
  const normalized: ResumeProfile = { ...emptyResumeProfile, ...input };
  const keywords = recommendedKeywords(normalized);

  return {
    ...normalized,
    title: normalized.title || normalized.targetRole,
    skills: Array.from(new Set([...parseList(normalized.skills), ...keywords])).slice(0, 24).join(", "),
    summary: generateProfessionalSummary(normalized),
    experience: normalized.experience?.trim() ? enhanceText(normalized.experience, normalized, "experience") : generateExperienceBullets(normalized),
    projects: normalized.projects?.trim() ? enhanceText(normalized.projects, normalized, "projects") : generateProjects(normalized)
  };
}
