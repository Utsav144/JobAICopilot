import type { JobPilotPlanId } from "@/lib/plan-limits";

export type ResumeTemplateId =
  | "basic-ats"
  | "modern-professional"
  | "clean-corporate"
  | "tech-developer"
  | "senior-software-engineer"
  | "fresher"
  | "minimalist"
  | "executive"
  | "creative-professional"
  | "finance"
  | "hr-admin"
  | "marketing"
  | "project-manager"
  | "international"
  | "one-page";

export type ResumeTemplate = {
  id: ResumeTemplateId;
  name: string;
  category: string;
  description: string;
  isPremium: boolean;
  isAtsFriendly: boolean;
  previewImage: string;
  layoutType: string;
  supportedFormats: ("PDF" | "DOCX")[];
  createdAt: string;
  minPlan: JobPilotPlanId;
  atsScore: number;
  layout: "classic" | "accent" | "compact" | "dark-head" | "executive";
  strengths: string[];
  filterTags: string[];
  accent: string;
  secondaryAccent: string;
  designStyle: "minimal" | "corporate" | "dark" | "engineer" | "cloud" | "timeline" | "startup" | "glass" | "mono" | "ai-tech" | "international" | "split" | "compact" | "leadership" | "infographic";
  popularity: string;
  recommendedRoles: string[];
  isTrending: boolean;
  isFeatured: boolean;
  supportsPhoto: boolean;
};

export const resumeTemplates: ResumeTemplate[] = [
  {
    id: "basic-ats",
    name: "Minimal ATS Classic",
    category: "ATS Classic",
    description: "A clean single-column resume for maximum parser compatibility across Workday, Oracle, Taleo, Greenhouse, LinkedIn, Naukri, and Indeed.",
    isPremium: false,
    isAtsFriendly: true,
    previewImage: "html-card",
    layoutType: "single-column",
    supportedFormats: ["PDF"],
    createdAt: "2026-05-17",
    minPlan: "free",
    atsScore: 96,
    layout: "classic",
    strengths: ["Parser-safe", "Readable headings", "Best free export"],
    filterTags: ["Free", "ATS", "Corporate", "Recommended"],
    accent: "#2563eb",
    secondaryAccent: "#dbeafe",
    designStyle: "minimal",
    popularity: "Most compatible",
    recommendedRoles: ["Analyst", "Developer", "Engineer", "Admin", "Fresher"],
    isTrending: true,
    isFeatured: true,
    supportsPhoto: false
  },
  {
    id: "modern-professional",
    name: "Modern Corporate",
    category: "Corporate",
    description: "Premium corporate structure with crisp hierarchy, subtle accent bands, achievement cards, and strong recruiter scanning.",
    isPremium: true,
    isAtsFriendly: true,
    previewImage: "html-card",
    layoutType: "modern-corporate",
    supportedFormats: ["PDF", "DOCX"],
    createdAt: "2026-05-17",
    minPlan: "pro",
    atsScore: 94,
    layout: "accent",
    strengths: ["Corporate polish", "Achievement cards", "MNC ready"],
    filterTags: ["Premium", "ATS", "Corporate", "Recommended"],
    accent: "#0f766e",
    secondaryAccent: "#ccfbf1",
    designStyle: "corporate",
    popularity: "Recruiter favorite",
    recommendedRoles: ["Consultant", "Manager", "Business Analyst", "Operations"],
    isTrending: true,
    isFeatured: true,
    supportsPhoto: false
  },
  {
    id: "clean-corporate",
    name: "Executive Dark Theme",
    category: "Executive",
    description: "A premium dark-header leadership resume with board-ready summary, scope highlights, and elegant separators.",
    isPremium: true,
    isAtsFriendly: true,
    previewImage: "html-card",
    layoutType: "dark-executive",
    supportedFormats: ["PDF", "DOCX"],
    createdAt: "2026-05-17",
    minPlan: "pro",
    atsScore: 91,
    layout: "dark-head",
    strengths: ["Dark header", "Leadership scope", "Premium presence"],
    filterTags: ["Premium", "ATS", "Executive", "Corporate"],
    accent: "#111827",
    secondaryAccent: "#e5e7eb",
    designStyle: "dark",
    popularity: "Premium pick",
    recommendedRoles: ["Director", "Lead", "Manager", "Architect"],
    isTrending: false,
    isFeatured: true,
    supportsPhoto: false
  },
  {
    id: "tech-developer",
    name: "Software Engineer Pro",
    category: "Tech",
    description: "Technical template with tech-stack chips, project tables, delivery timeline, and engineering achievement blocks.",
    isPremium: true,
    isAtsFriendly: true,
    previewImage: "html-card",
    layoutType: "software-engineering",
    supportedFormats: ["PDF", "DOCX"],
    createdAt: "2026-05-17",
    minPlan: "pro",
    atsScore: 95,
    layout: "dark-head",
    strengths: ["Tech stack chips", "Project table", "Engineering metrics"],
    filterTags: ["Premium", "ATS", "Tech", "Recommended"],
    accent: "#1d4ed8",
    secondaryAccent: "#dbeafe",
    designStyle: "engineer",
    popularity: "Top tech",
    recommendedRoles: ["Software Engineer", "Frontend Engineer", "Backend Developer", "Full Stack"],
    isTrending: true,
    isFeatured: true,
    supportsPhoto: false
  },
  {
    id: "senior-software-engineer",
    name: "Cloud Architect Resume",
    category: "Cloud",
    description: "Architecture-first layout for cloud platforms, distributed systems, DevOps, security, reliability, and modernization.",
    isPremium: true,
    isAtsFriendly: true,
    previewImage: "html-card",
    layoutType: "cloud-architecture",
    supportedFormats: ["PDF", "DOCX"],
    createdAt: "2026-05-17",
    minPlan: "pro",
    atsScore: 96,
    layout: "executive",
    strengths: ["Cloud systems", "Architecture map", "Reliability focus"],
    filterTags: ["Premium", "ATS", "Tech"],
    accent: "#0369a1",
    secondaryAccent: "#e0f2fe",
    designStyle: "cloud",
    popularity: "Cloud ready",
    recommendedRoles: ["Cloud Architect", "DevOps Engineer", "Platform Engineer", "SRE"],
    isTrending: true,
    isFeatured: false,
    supportsPhoto: false
  },
  {
    id: "fresher",
    name: "Senior Developer Timeline",
    category: "Tech",
    description: "Timeline-led engineering resume for senior developers, ownership growth, releases, mentoring, and delivery impact.",
    isPremium: false,
    isAtsFriendly: true,
    previewImage: "html-card",
    layoutType: "timeline",
    supportedFormats: ["PDF"],
    createdAt: "2026-05-17",
    minPlan: "free",
    atsScore: 92,
    layout: "classic",
    strengths: ["Timeline", "Impact bullets", "Free export"],
    filterTags: ["Free", "ATS", "Tech"],
    accent: "#059669",
    secondaryAccent: "#d1fae5",
    designStyle: "timeline",
    popularity: "Free timeline",
    recommendedRoles: ["Senior Developer", "Software Engineer", "Tech Lead"],
    isTrending: false,
    isFeatured: false,
    supportsPhoto: false
  },
  {
    id: "minimalist",
    name: "Startup Modern Resume",
    category: "Startup",
    description: "Energetic premium layout for product-minded candidates, fast growth teams, ownership, launches, and startup outcomes.",
    isPremium: true,
    isAtsFriendly: true,
    previewImage: "html-card",
    layoutType: "startup-modern",
    supportedFormats: ["PDF", "DOCX"],
    createdAt: "2026-05-17",
    minPlan: "pro",
    atsScore: 91,
    layout: "accent",
    strengths: ["Launch focus", "Modern rhythm", "Product outcomes"],
    filterTags: ["Premium", "ATS", "Creative", "Recommended"],
    accent: "#f97316",
    secondaryAccent: "#ffedd5",
    designStyle: "startup",
    popularity: "Fast-growth",
    recommendedRoles: ["Product Engineer", "Startup Operator", "Growth", "Product Manager"],
    isTrending: true,
    isFeatured: false,
    supportsPhoto: false
  },
  {
    id: "executive",
    name: "Premium Glassmorphism",
    category: "Premium",
    description: "High-end glass-style preview with translucent cards, structured text, and ATS-safe semantic sections.",
    isPremium: true,
    isAtsFriendly: true,
    previewImage: "html-card",
    layoutType: "glass-premium",
    supportedFormats: ["PDF", "DOCX"],
    createdAt: "2026-05-17",
    minPlan: "pro",
    atsScore: 89,
    layout: "accent",
    strengths: ["Glass cards", "Premium feel", "Clean semantics"],
    filterTags: ["Premium", "ATS", "Creative", "Featured"],
    accent: "#7c3aed",
    secondaryAccent: "#ede9fe",
    designStyle: "glass",
    popularity: "Featured",
    recommendedRoles: ["Designer", "Product", "Marketing", "Creative"],
    isTrending: true,
    isFeatured: true,
    supportsPhoto: true
  },
  {
    id: "creative-professional",
    name: "Elegant Monochrome",
    category: "Minimal",
    description: "Black-and-white premium typography system with refined spacing, monochrome cards, and timeless recruiter readability.",
    isPremium: true,
    isAtsFriendly: true,
    previewImage: "html-card",
    layoutType: "monochrome",
    supportedFormats: ["PDF", "DOCX"],
    createdAt: "2026-05-17",
    minPlan: "pro",
    atsScore: 93,
    layout: "classic",
    strengths: ["Monochrome", "Typography", "Elegant spacing"],
    filterTags: ["Premium", "ATS", "Corporate"],
    accent: "#18181b",
    secondaryAccent: "#f4f4f5",
    designStyle: "mono",
    popularity: "Elegant",
    recommendedRoles: ["Consultant", "Finance", "Legal", "Operations"],
    isTrending: false,
    isFeatured: false,
    supportsPhoto: false
  },
  {
    id: "finance",
    name: "AI/Tech Resume",
    category: "AI/Tech",
    description: "AI and data resume with model/product keywords, technical expertise tables, research/projects, and modern tech identity.",
    isPremium: true,
    isAtsFriendly: true,
    previewImage: "html-card",
    layoutType: "ai-tech",
    supportedFormats: ["PDF", "DOCX"],
    createdAt: "2026-05-17",
    minPlan: "pro",
    atsScore: 95,
    layout: "dark-head",
    strengths: ["AI keywords", "Research blocks", "Data projects"],
    filterTags: ["Premium", "ATS", "Tech", "Recommended"],
    accent: "#4f46e5",
    secondaryAccent: "#e0e7ff",
    designStyle: "ai-tech",
    popularity: "AI hiring",
    recommendedRoles: ["AI Engineer", "Data Scientist", "ML Engineer", "Automation Engineer"],
    isTrending: true,
    isFeatured: true,
    supportsPhoto: false
  },
  {
    id: "hr-admin",
    name: "International CV Style",
    category: "International",
    description: "Global CV layout with clean contact hierarchy, role summary, compact experience tables, and relocation-friendly presentation.",
    isPremium: true,
    isAtsFriendly: true,
    previewImage: "html-card",
    layoutType: "international-cv",
    supportedFormats: ["PDF", "DOCX"],
    createdAt: "2026-05-17",
    minPlan: "pro",
    atsScore: 93,
    layout: "compact",
    strengths: ["Global format", "CV tables", "Clean contact"],
    filterTags: ["Premium", "ATS", "Corporate"],
    accent: "#0891b2",
    secondaryAccent: "#cffafe",
    designStyle: "international",
    popularity: "Global",
    recommendedRoles: ["International", "Consultant", "Research", "Healthcare"],
    isTrending: false,
    isFeatured: false,
    supportsPhoto: false
  },
  {
    id: "marketing",
    name: "Creative Split Layout",
    category: "Creative",
    description: "Modern split resume with optional profile image area, brand-safe color, and strong content hierarchy.",
    isPremium: true,
    isAtsFriendly: true,
    previewImage: "html-card",
    layoutType: "creative-split",
    supportedFormats: ["PDF", "DOCX"],
    createdAt: "2026-05-17",
    minPlan: "pro",
    atsScore: 88,
    layout: "accent",
    strengths: ["Split layout", "Portfolio ready", "Optional photo"],
    filterTags: ["Premium", "ATS", "Creative", "Featured"],
    accent: "#be123c",
    secondaryAccent: "#ffe4e6",
    designStyle: "split",
    popularity: "Creative",
    recommendedRoles: ["Designer", "Marketing", "Content", "Brand"],
    isTrending: true,
    isFeatured: true,
    supportsPhoto: true
  },
  {
    id: "project-manager",
    name: "Compact One-Page Resume",
    category: "One Page",
    description: "Dense one-page premium layout with smart spacing, compressed sections, and fast recruiter scanning.",
    isPremium: true,
    isAtsFriendly: true,
    previewImage: "html-card",
    layoutType: "one-page-compact",
    supportedFormats: ["PDF", "DOCX"],
    createdAt: "2026-05-17",
    minPlan: "pro",
    atsScore: 92,
    layout: "compact",
    strengths: ["One-page fit", "Smart spacing", "Fast scan"],
    filterTags: ["Premium", "ATS", "Corporate"],
    accent: "#334155",
    secondaryAccent: "#e2e8f0",
    designStyle: "compact",
    popularity: "One-page",
    recommendedRoles: ["Project Manager", "Analyst", "Consultant", "Engineer"],
    isTrending: false,
    isFeatured: false,
    supportsPhoto: false
  },
  {
    id: "international",
    name: "Leadership Executive Resume",
    category: "Executive",
    description: "Leadership-first executive layout with transformation stories, scope cards, achievements, and strategic clarity.",
    isPremium: true,
    isAtsFriendly: true,
    previewImage: "html-card",
    layoutType: "leadership-executive",
    supportedFormats: ["PDF", "DOCX"],
    createdAt: "2026-05-17",
    minPlan: "pro",
    atsScore: 90,
    layout: "executive",
    strengths: ["Transformation", "Scope cards", "Strategic story"],
    filterTags: ["Premium", "ATS", "Executive", "Corporate"],
    accent: "#7c2d12",
    secondaryAccent: "#ffedd5",
    designStyle: "leadership",
    popularity: "Leadership",
    recommendedRoles: ["Director", "VP", "Head", "Program Leader"],
    isTrending: false,
    isFeatured: true,
    supportsPhoto: false
  },
  {
    id: "one-page",
    name: "Premium Infographic ATS Hybrid",
    category: "Infographic",
    description: "A polished hybrid with subtle visual blocks, skill tables, achievement cards, and ATS-readable text structure.",
    isPremium: true,
    isAtsFriendly: true,
    previewImage: "html-card",
    layoutType: "infographic-hybrid",
    supportedFormats: ["PDF", "DOCX"],
    createdAt: "2026-05-17",
    minPlan: "pro",
    atsScore: 90,
    layout: "accent",
    strengths: ["Infographic feel", "Skill tables", "ATS-readable"],
    filterTags: ["Premium", "ATS", "Creative", "Featured"],
    accent: "#c2410c",
    secondaryAccent: "#fed7aa",
    designStyle: "infographic",
    popularity: "Visual premium",
    recommendedRoles: ["Product", "Marketing", "Consulting", "Operations"],
    isTrending: true,
    isFeatured: true,
    supportsPhoto: true
  }
];

const legacyTemplateMap: Record<string, ResumeTemplateId> = {
  "ats-friendly": "basic-ats",
  modern: "modern-professional",
  corporate: "modern-professional",
  developer: "tech-developer",
  "cloud-engineer": "senior-software-engineer",
  "ats-verified-advanced": "basic-ats",
  "product-leader": "international"
};

export function canUseTemplate(userPlan: JobPilotPlanId, template: ResumeTemplate) {
  return !template.isPremium || userPlan === "pro" || userPlan === "premium";
}

export function getResumeTemplate(id: string | null | undefined) {
  const normalizedId = id && legacyTemplateMap[id] ? legacyTemplateMap[id] : id;
  return resumeTemplates.find((template) => template.id === normalizedId) || resumeTemplates[0];
}
