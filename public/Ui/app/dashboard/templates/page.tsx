"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Award,
  BadgeCheck,
  BriefcaseBusiness,
  Code2,
  Crown,
  Download,
  Eye,
  FileDown,
  FileText,
  GraduationCap,
  GripVertical,
  Layers3,
  Lightbulb,
  Link2,
  Lock,
  Mail,
  Maximize2,
  Monitor,
  Palette,
  Phone,
  Search,
  Settings2,
  Smartphone,
  Sparkles,
  Trophy,
  UserRound,
  X,
  Zap
} from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { readBillingAccount, type BillingAccount } from "@/lib/billing";
import { parseList, readResumeProfile, scoreResumeProfile, type ResumeProfile } from "@/lib/resume-profile";
import { getResumeTemplate, resumeTemplates, type ResumeTemplate } from "@/lib/resume-templates";

const filters = ["All", "Recommended", "Trending", "Featured", "Free", "Premium", "Tech", "Executive", "Creative", "Corporate"];
const colorSwatches = ["#2563eb", "#0f766e", "#111827", "#7c3aed", "#be123c", "#c2410c", "#0369a1", "#059669"];
const fonts = ["Inter", "Arial", "Georgia", "Helvetica"];
const spacingOptions = ["Compact", "Balanced", "Airy"];
const defaultSectionOrder = ["summary", "skills", "expertise", "achievements", "experience", "projects", "education", "certifications"];

function hasResumeData(profile: ResumeProfile) {
  return Boolean(profile.name || profile.title || profile.targetRole || profile.summary || profile.experience || profile.skills);
}

function fileNameFromContentDisposition(value: string | null, fallback: string) {
  return value?.match(/filename="([^"]+)"/)?.[1] || fallback;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function titleFor(section: string) {
  const labels: Record<string, string> = {
    summary: "Professional Summary",
    skills: "Core Skills",
    expertise: "Technical Expertise",
    achievements: "Achievements",
    experience: "Experience Timeline",
    projects: "Projects",
    education: "Education",
    certifications: "Certifications"
  };
  return labels[section] || section;
}

function resumeBullets(profile: ResumeProfile) {
  const source = profile.experience || profile.projects || profile.summary;
  const bullets = source
    .split(/\n|•|-/)
    .map((item) => item.trim())
    .filter((item) => item.length > 18)
    .slice(0, 4);

  return bullets.length ? bullets : [
    "Delivered measurable business outcomes through structured execution, ownership, and clear stakeholder communication.",
    "Improved workflows, documentation, quality checks, and delivery visibility across cross-functional teams.",
    "Built recruiter-friendly project stories with tools, scope, and outcome-focused achievements."
  ];
}

function derivedAchievements(profile: ResumeProfile) {
  const metrics = `${profile.summary} ${profile.experience} ${profile.projects}`.match(/\b\d+%|\b\d+\+|\b\d{2,}\b/g) || [];
  return [
    metrics[0] ? `${metrics[0]} measurable improvement` : "Measurable delivery ownership",
    metrics[1] ? `${metrics[1]} scale or delivery signal` : "Cross-functional collaboration",
    profile.targetRole || profile.title ? `${profile.targetRole || profile.title} role alignment` : "Recruiter-ready positioning"
  ];
}

function expertiseGroups(profile: ResumeProfile) {
  const skills = parseList(profile.skills);
  const groups = [
    ["Languages & Tools", skills.slice(0, 4)],
    ["Platforms", skills.slice(4, 8)],
    ["Delivery", skills.slice(8, 12)]
  ];

  return groups.map(([label, items]) => [label, (items as string[]).length ? items : ["Role keywords", "Quality", "Documentation"]]) as [string, string[]][];
}

function recommendedTemplates(profile: ResumeProfile, templates: ResumeTemplate[]) {
  const target = `${profile.targetRole} ${profile.title} ${profile.skills} ${profile.preferredIndustry}`.toLowerCase();
  const matches = templates.filter((template) => template.recommendedRoles.some((role) => target.includes(role.toLowerCase().split(" ")[0])));
  return (matches.length ? matches : templates.filter((template) => template.isFeatured || template.isTrending)).slice(0, 5);
}

function templateShell(template: ResumeTemplate, accent: string) {
  const base = "rounded-md border bg-white text-slate-950 shadow-2xl";
  if (template.designStyle === "dark") return `${base} border-slate-800`;
  if (template.designStyle === "glass") return `${base} border-white/70 bg-white/85 backdrop-blur`;
  if (template.designStyle === "mono") return `${base} border-zinc-300`;
  if (template.designStyle === "split") return `${base} border-rose-200`;
  return `${base} border-slate-200`;
}

function MiniResumePreview({ template, profile, locked, accent, font }: { template: ResumeTemplate; profile: ResumeProfile; locked?: boolean; accent: string; font: string }) {
  const skills = parseList(profile.skills);
  const bullets = resumeBullets(profile);
  const isDark = template.designStyle === "dark" || template.designStyle === "ai-tech" || template.designStyle === "engineer";
  const split = template.designStyle === "split" || template.designStyle === "infographic" || template.designStyle === "glass";

  return (
    <div className={`relative h-76 overflow-hidden rounded-md border bg-white text-slate-950 shadow-sm ${locked ? "opacity-75" : ""}`} style={{ fontFamily: font }}>
      <div className={isDark ? "bg-slate-950 p-4 text-white" : "p-4"} style={isDark ? undefined : { background: split ? `linear-gradient(135deg, ${template.secondaryAccent}, #fff)` : "#fff", borderLeft: `5px solid ${accent}` }}>
        <div className="flex items-center gap-3">
          {template.supportsPhoto ? <div className="grid size-10 shrink-0 place-items-center rounded-full text-xs font-black text-white" style={{ backgroundColor: accent }}>{(profile.name || "YN").split(" ").map((part) => part[0]).slice(0, 2).join("")}</div> : null}
          <div className="min-w-0">
            <p className="truncate text-sm font-black leading-none">{profile.name || "Your Name"}</p>
            <p className="mt-1 truncate text-[11px] font-bold" style={{ color: isDark ? "#bfdbfe" : accent }}>{profile.title || profile.targetRole || template.category}</p>
            <p className={isDark ? "mt-1 truncate text-[9px] text-slate-300" : "mt-1 truncate text-[9px] text-slate-500"}>{[profile.email, profile.location].filter(Boolean).join(" · ") || "Email · Location · LinkedIn"}</p>
          </div>
        </div>
      </div>

      <div className={split ? "grid grid-cols-[0.75fr_1.25fr] gap-2 p-3" : "space-y-3 p-4"}>
        <div className={split ? "space-y-2 border-r border-slate-200 pr-2" : "grid grid-cols-3 gap-1.5"}>
          {derivedAchievements(profile).slice(0, 3).map((item) => (
            <div className="rounded border border-slate-200 bg-slate-50 p-1.5" key={item}>
              <p className="line-clamp-2 text-[8px] font-bold leading-3">{item}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <section>
            <p className="mb-1 text-[9px] font-black uppercase">Summary</p>
            <p className="line-clamp-2 text-[8px] leading-4 text-slate-600">{profile.summary || template.description}</p>
          </section>
          <section>
            <p className="mb-1 text-[9px] font-black uppercase">Skills</p>
            <div className="flex flex-wrap gap-1">
              {(skills.length ? skills : template.strengths).slice(0, 5).map((skill) => <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[7px] font-bold" key={skill}>{skill}</span>)}
            </div>
          </section>
          <section>
            <p className="mb-1 text-[9px] font-black uppercase">Timeline</p>
            {bullets.slice(0, 2).map((item) => <p className="line-clamp-1 text-[8px] leading-4 text-slate-600" key={item}>• {item}</p>)}
          </section>
        </div>
      </div>

      {template.isTrending ? <div className="absolute right-3 top-3 rounded-md bg-white/90 px-2 py-1 text-[9px] font-black text-slate-900 shadow-sm">Trending</div> : null}
      {locked ? (
        <div className="absolute inset-0 grid place-items-center bg-white/60 backdrop-blur-[1px]">
          <div className="grid size-12 place-items-center rounded-full bg-slate-950 text-white shadow-lg"><Lock className="size-5" /></div>
        </div>
      ) : null}
    </div>
  );
}

function FullTemplatePreview({
  template,
  profile,
  accent,
  font,
  spacing,
  sectionOrder,
  previewMode,
  zoom
}: {
  template: ResumeTemplate;
  profile: ResumeProfile;
  accent: string;
  font: string;
  spacing: string;
  sectionOrder: string[];
  previewMode: "desktop" | "mobile";
  zoom: number;
}) {
  const skills = parseList(profile.skills);
  const bullets = resumeBullets(profile);
  const achievements = derivedAchievements(profile);
  const sectionGap = spacing === "Compact" ? "mt-4" : spacing === "Airy" ? "mt-8" : "mt-6";
  const twoColumn = ["split", "glass", "infographic", "cloud", "international", "leadership"].includes(template.designStyle);
  const compact = template.designStyle === "compact";
  const isDark = template.designStyle === "dark" || template.designStyle === "ai-tech";
  const widthClass = previewMode === "mobile" ? "max-w-sm" : "max-w-4xl";

  function SectionTitle({ icon: Icon, children }: { icon: typeof BriefcaseBusiness; children: React.ReactNode }) {
    return (
      <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
        <span className="grid size-7 place-items-center rounded-md text-white" style={{ backgroundColor: accent }}><Icon className="size-3.5" /></span>
        <h3 className="text-sm font-extrabold uppercase tracking-normal">{children}</h3>
      </div>
    );
  }

  function renderSection(section: string) {
    if (section === "summary") {
      return <section className={sectionGap} key={section}><SectionTitle icon={UserRound}>Professional Summary</SectionTitle><p className="text-sm leading-6 text-slate-700">{profile.summary || "Professional summary appears here after you build your resume."}</p></section>;
    }
    if (section === "skills") {
      return (
        <section className={sectionGap} key={section}>
          <SectionTitle icon={Layers3}>Core Skills</SectionTitle>
          <div className={template.designStyle === "mono" || template.designStyle === "international" ? "grid gap-2 sm:grid-cols-2" : "flex flex-wrap gap-2"}>
            {(skills.length ? skills : template.strengths).slice(0, compact ? 10 : 16).map((skill, index) => (
              <span className={template.designStyle === "mono" || template.designStyle === "international" ? "rounded border border-slate-300 px-3 py-2 text-xs font-semibold" : "rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold"} key={`${skill}-${index}`}>
                {skill}
              </span>
            ))}
          </div>
        </section>
      );
    }
    if (section === "expertise") {
      return (
        <section className={sectionGap} key={section}>
          <SectionTitle icon={Code2}>Technical Expertise</SectionTitle>
          <div className="overflow-hidden rounded-md border border-slate-200">
            {expertiseGroups(profile).map(([label, items]) => (
              <div className="grid grid-cols-[0.45fr_1fr] border-b border-slate-200 last:border-b-0" key={label}>
                <div className="bg-slate-50 p-3 text-xs font-extrabold uppercase text-slate-600">{label}</div>
                <div className="p-3 text-sm leading-6 text-slate-700">{items.join(" · ")}</div>
              </div>
            ))}
          </div>
        </section>
      );
    }
    if (section === "achievements") {
      return (
        <section className={sectionGap} key={section}>
          <SectionTitle icon={Trophy}>Achievements</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-3">
            {achievements.map((item) => (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm font-semibold leading-5 text-slate-700" key={item}>{item}</div>
            ))}
          </div>
        </section>
      );
    }
    if (section === "experience") {
      return (
        <section className={sectionGap} key={section}>
          <SectionTitle icon={BriefcaseBusiness}>Experience Timeline</SectionTitle>
          <div className="space-y-3">
            {bullets.map((item, index) => (
              <div className="grid grid-cols-[auto_1fr] gap-3" key={item}>
                <div className="flex flex-col items-center">
                  <span className="grid size-7 place-items-center rounded-full text-xs font-black text-white" style={{ backgroundColor: accent }}>{index + 1}</span>
                  {index < bullets.length - 1 ? <span className="h-full w-px bg-slate-200" /> : null}
                </div>
                <p className="rounded-md border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </section>
      );
    }
    if (section === "projects") {
      return <section className={sectionGap} key={section}><SectionTitle icon={Zap}>Projects</SectionTitle><p className="whitespace-pre-line rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">{profile.projects || "Add project name, tools used, problem solved, and result."}</p></section>;
    }
    if (section === "education") {
      return <section className={sectionGap} key={section}><SectionTitle icon={GraduationCap}>Education</SectionTitle><p className="whitespace-pre-line text-sm leading-6 text-slate-700">{profile.education || "Add education details."}</p></section>;
    }
    if (section === "certifications") {
      const certs = parseList(profile.certifications || "Role certification, Professional training");
      return <section className={sectionGap} key={section}><SectionTitle icon={Award}>Certifications</SectionTitle><div className="flex flex-wrap gap-2">{certs.map((cert) => <span className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold" key={cert}>{cert}</span>)}</div></section>;
    }
    return null;
  }

  const sidebar = (
    <aside className="space-y-5 rounded-md border border-slate-200 bg-slate-50 p-5">
      {template.supportsPhoto ? <div className="mx-auto grid size-24 place-items-center rounded-full text-xl font-black text-white" style={{ background: `linear-gradient(135deg, ${accent}, ${template.secondaryAccent})` }}>{(profile.name || "YN").split(" ").map((part) => part[0]).slice(0, 2).join("")}</div> : null}
      <section>
        <h3 className="text-xs font-extrabold uppercase text-slate-500">Contact Information</h3>
        <div className="mt-3 space-y-2 text-xs leading-5 text-slate-700">
          <p className="flex gap-2"><Mail className="mt-0.5 size-3.5 shrink-0" />{profile.email || "email@example.com"}</p>
          <p className="flex gap-2"><Phone className="mt-0.5 size-3.5 shrink-0" />{profile.phone || "Phone number"}</p>
          <p className="flex gap-2"><Link2 className="mt-0.5 size-3.5 shrink-0" />{profile.links || "LinkedIn / GitHub"}</p>
        </div>
      </section>
      <section>
        <h3 className="text-xs font-extrabold uppercase text-slate-500">Tech Stack</h3>
        <div className="mt-3 flex flex-wrap gap-1.5">{(skills.length ? skills : template.strengths).slice(0, 8).map((skill) => <span className="rounded bg-white px-2 py-1 text-[10px] font-bold" key={skill}>{skill}</span>)}</div>
      </section>
    </aside>
  );

  return (
    <div className="overflow-auto">
      <div className={`${widthClass} mx-auto origin-top transition`} style={{ transform: `scale(${zoom / 100})`, fontFamily: font }}>
        <div className={`${templateShell(template, accent)} p-7 sm:p-9`}>
          <header className={isDark ? "rounded-lg bg-slate-950 p-6 text-white" : "rounded-lg p-6"} style={isDark ? undefined : { background: `linear-gradient(135deg, ${template.secondaryAccent}, #ffffff)` }}>
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wide" style={{ color: isDark ? "#bfdbfe" : accent }}>{template.category}</p>
                <h2 className="mt-2 text-4xl font-extrabold tracking-normal">{profile.name || "Your Name"}</h2>
                <p className="mt-1 text-lg font-bold" style={{ color: isDark ? "#bfdbfe" : accent }}>{profile.title || profile.targetRole || "Target Role"}</p>
                <p className={isDark ? "mt-3 text-sm text-slate-300" : "mt-3 text-sm text-slate-600"}>{[profile.email, profile.phone, profile.location, profile.links].filter(Boolean).join(" · ") || "Email · Phone · Location · LinkedIn/GitHub"}</p>
              </div>
              {template.supportsPhoto ? <div className="grid size-24 place-items-center rounded-full text-2xl font-black text-white shadow-lg" style={{ backgroundColor: accent }}>{(profile.name || "YN").split(" ").map((part) => part[0]).slice(0, 2).join("")}</div> : null}
            </div>
          </header>

          <main className={twoColumn && previewMode !== "mobile" ? "mt-6 grid gap-6 lg:grid-cols-[0.34fr_0.66fr]" : "mt-6"}>
            {twoColumn && previewMode !== "mobile" ? sidebar : null}
            <div className="min-w-0">
              {sectionOrder.map(renderSection)}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const [billing, setBilling] = useState<BillingAccount | null>(null);
  const [profile, setProfile] = useState<ResumeProfile>(() => readResumeProfile());
  const [templates, setTemplates] = useState<ResumeTemplate[]>(resumeTemplates);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedId, setSelectedId] = useState("basic-ats");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("This is a premium template. Please upgrade to download this resume.");
  const [notice, setNotice] = useState("");
  const [accent, setAccent] = useState("#2563eb");
  const [font, setFont] = useState("Inter");
  const [spacing, setSpacing] = useState("Balanced");
  const [sectionOrder, setSectionOrder] = useState(defaultSectionOrder);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [zoom, setZoom] = useState(100);
  const [coverLetter, setCoverLetter] = useState("");
  const isPaid = billing?.status === "paid";
  const selected = useMemo(() => getResumeTemplate(selectedId), [selectedId]);
  const selectedFromList = templates.find((template) => template.id === selected.id) || selected;
  const hasData = hasResumeData(profile);
  const report = useMemo(() => scoreResumeProfile(profile, selectedFromList), [profile, selectedFromList]);
  const recommended = useMemo(() => recommendedTemplates(profile, templates), [profile, templates]);
  const trending = useMemo(() => templates.filter((template) => template.isTrending).slice(0, 5), [templates]);

  useEffect(() => {
    setBilling(readBillingAccount());
    setProfile(readResumeProfile());
    const savedTemplate = getResumeTemplate(localStorage.getItem("jobpilot_resume_template"));
    setSelectedId(savedTemplate.id);
    setAccent(savedTemplate.accent);

    fetch("/api/templates")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data.templates)) setTemplates(data.templates);
      })
      .catch(() => setTemplates(resumeTemplates));
  }, []);

  const filteredTemplates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter((template) => {
      const matchesQuery = !q || `${template.name} ${template.category} ${template.description} ${template.recommendedRoles.join(" ")}`.toLowerCase().includes(q);
      const matchesFilter =
        filter === "All" ||
        (filter === "Trending" && template.isTrending) ||
        (filter === "Featured" && template.isFeatured) ||
        (filter === "Recommended" && recommended.some((item) => item.id === template.id)) ||
        template.filterTags.includes(filter);
      return matchesQuery && matchesFilter;
    });
  }, [filter, query, recommended, templates]);

  function selectTemplate(template: ResumeTemplate) {
    setSelectedId(template.id);
    setAccent(template.accent);
  }

  function reorderSection(target: string) {
    if (!draggedSection || draggedSection === target || !isPaid) return;
    setSectionOrder((items) => {
      const next = items.filter((item) => item !== draggedSection);
      next.splice(next.indexOf(target), 0, draggedSection);
      return next;
    });
  }

  function showUpgrade(message = "This is a premium template. Please upgrade to download this resume.") {
    setUpgradeMessage(message);
    setUpgradeOpen(true);
  }

  async function checkSubscription(template: ResumeTemplate, format?: "PDF" | "DOCX") {
    if (!isPaid && format === "DOCX") {
      showUpgrade("DOCX export is available on paid plans. Free users can export free templates as PDF only.");
      return false;
    }

    const response = await fetch("/api/subscription/check", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        templateId: template.id,
        format,
        subscriptionStatus: billing?.status || "free",
        planType: billing?.plan || "free"
      })
    });
    const data = await response.json();
    if (!response.ok || !data.allowed) {
      showUpgrade(data.message || "This is a premium template. Please upgrade to download this resume.");
      return false;
    }
    return true;
  }

  async function useTemplate(template: ResumeTemplate) {
    selectTemplate(template);
    if (!(await checkSubscription(template))) return;
    localStorage.setItem("jobpilot_resume_template", template.id);
    localStorage.setItem("jobpilot_resume_template_name", template.name);
    setNotice(`${template.name} selected. Resume Builder will use this design without losing your data.`);
  }

  async function downloadTemplate(template: ResumeTemplate, format: "PDF" | "DOCX") {
    selectTemplate(template);
    if (!(await checkSubscription(template, format))) return;

    const response = await fetch("/api/resume-export", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        templateId: template.id,
        format,
        profile,
        subscriptionStatus: billing?.status || "free",
        planType: billing?.plan || "free"
      })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      showUpgrade(data.error || "This is a premium template. Please upgrade to download this resume.");
      return;
    }

    const blob = await response.blob();
    downloadBlob(blob, fileNameFromContentDisposition(response.headers.get("content-disposition"), `${template.id}.${format.toLowerCase()}`));
    setNotice(`${template.name} exported as ${format}.`);
  }

  function generateCoverLetter() {
    if (!isPaid) {
      showUpgrade("Cover letter generator is available on paid plans.");
      return;
    }

    setCoverLetter(
      [
        `Dear Hiring Team,`,
        "",
        `I am excited to apply for the ${profile.targetRole || profile.title || "open role"} opportunity. My background in ${(parseList(profile.skills).slice(0, 5).join(", ") || "role-relevant skills")} aligns strongly with your team's needs, and I bring a practical record of delivering clear outcomes, collaborating across teams, and improving workflows with recruiter-ready professionalism.`,
        "",
        profile.experience ? `A relevant example from my experience: ${resumeBullets(profile)[0]}` : "I have built practical project experience and a strong foundation for this role through focused learning, delivery ownership, and continuous improvement.",
        "",
        "Thank you for your time and consideration. I would welcome the opportunity to discuss how I can contribute to your team.",
        "",
        `Sincerely,`,
        profile.name || "Your Name"
      ].join("\n")
    );
  }

  return (
    <>
      <PageHeading title="Resume Templates" description="Premium AI design engine with live previews, smart customization, protected exports, and ATS-readable resume architecture." />

      <section className="mb-6 overflow-hidden rounded-lg border border-[var(--primary)]/25 bg-[var(--card)] shadow-xl">
        <div className="grid gap-0 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="p-6 sm:p-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-md bg-[var(--primary)]/10 px-3 py-2 text-sm font-extrabold text-[var(--primary)]">
              <Sparkles className="size-4" />
              AI-powered resume design engine
            </div>
            <h2 className="max-w-4xl text-3xl font-extrabold tracking-normal">Premium templates with modern hierarchy, timelines, skill tables, achievements, and ATS-safe structure.</h2>
            <p className="mt-3 max-w-4xl leading-7 text-[var(--muted)]">
              Switch templates instantly without data loss, preview desktop/mobile layouts, reorder sections, customize styles, and keep scoring private inside dashboard analytics only.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/#pricing"><Button type="button"><Crown className="size-4" /> Upgrade to Pro</Button></Link>
              <Link href="/dashboard/resume-builder"><Button type="button" variant="secondary"><FileText className="size-4" /> Edit Resume</Button></Link>
              <Button onClick={() => setPreviewOpen(true)} type="button" variant="secondary"><Maximize2 className="size-4" /> Open Preview</Button>
            </div>
            {!hasData ? <p className="mt-4 rounded-md bg-blue-500/10 p-3 text-sm font-bold text-blue-700 dark:text-blue-200">Add resume data in Resume Builder for realistic previews. The engine still renders polished placeholder structure.</p> : null}
            {notice ? <p className="mt-4 rounded-md bg-emerald-500/10 p-3 text-sm font-bold text-emerald-700 dark:text-emerald-200">{notice}</p> : null}
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-[var(--border)] bg-[linear-gradient(135deg,rgba(37,99,235,0.12),rgba(15,118,110,0.10),rgba(245,158,11,0.10))] p-6 text-center xl:border-l xl:border-t-0">
            <div className="rounded-md bg-white/70 p-4 dark:bg-black/20"><p className="text-3xl font-extrabold">{templates.length}</p><p className="text-xs font-bold text-[var(--muted)]">Premium styles</p></div>
            <div className="rounded-md bg-white/70 p-4 dark:bg-black/20"><p className="text-3xl font-extrabold">2</p><p className="text-xs font-bold text-[var(--muted)]">Free PDF</p></div>
            <div className="rounded-md bg-white/70 p-4 dark:bg-black/20"><p className="text-3xl font-extrabold">{report.score}%</p><p className="text-xs font-bold text-[var(--muted)]">Private score</p></div>
            <div className="rounded-md bg-white/70 p-4 dark:bg-black/20"><p className="text-3xl font-extrabold">{isPaid ? "All" : "Limited"}</p><p className="text-xs font-bold text-[var(--muted)]">Access</p></div>
          </div>
        </div>
      </section>

      <div className="mb-6 grid gap-5 xl:grid-cols-[1fr_0.85fr]">
        <Card className="border-[var(--primary)]/20">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2"><Trophy className="size-5 text-[var(--primary)]" /> Trending templates</CardTitle>
              <p className="mt-2 text-sm text-[var(--muted)]">High-conversion designs for modern recruiter review.</p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {trending.map((template) => (
              <button className={`rounded-md border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${selectedId === template.id ? "border-[var(--primary)] bg-[var(--primary)]/5" : "border-[var(--border)]"}`} key={template.id} onClick={() => selectTemplate(template)} type="button">
                <p className="text-sm font-extrabold">{template.name}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{template.popularity}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lightbulb className="size-5 text-[var(--warning)]" /> Recommended for you</CardTitle>
            <p className="mt-2 text-sm text-[var(--muted)]">Based on target role, skills, and industry in your saved resume.</p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {recommended.map((template) => (
              <button className={`rounded-md border px-3 py-2 text-sm font-bold transition hover:bg-black/5 dark:hover:bg-white/10 ${selectedId === template.id ? "border-[var(--primary)] text-[var(--primary)]" : "border-[var(--border)] text-[var(--muted)]"}`} key={template.id} onClick={() => selectTemplate(template)} type="button">
                {template.name}
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto]">
        <label className="flex min-h-11 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--card)] px-3">
          <Search className="size-4 text-[var(--muted)]" />
          <input className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted)]" onChange={(event) => setQuery(event.target.value)} placeholder="Search by style, role, or category" value={query} />
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((item) => (
            <button className={`min-h-11 rounded-md border px-4 text-sm font-extrabold transition ${filter === item ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]" : "border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/10"}`} key={item} onClick={() => setFilter(item)} type="button">
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className={isPaid ? "border-emerald-500/25" : "border-amber-400/40"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings2 className="size-5 text-[var(--primary)]" /> Design controls</CardTitle>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{isPaid ? "Unlimited customization: colors, fonts, spacing, zoom, mobile preview, and drag-and-drop section order." : "Free users can preview controls. Upgrade to unlock full customization, DOCX, and all premium layouts."}</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-bold">Accent color</p>
              <div className="flex flex-wrap gap-2">{colorSwatches.map((color) => <button aria-label={color} className={`size-9 rounded-md border-2 ${accent === color ? "border-slate-950 dark:border-white" : "border-transparent"} ${!isPaid ? "opacity-50" : ""}`} disabled={!isPaid} key={color} onClick={() => setAccent(color)} style={{ backgroundColor: color }} type="button" />)}</div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="space-y-2 text-sm font-bold">Font<select className="min-h-11 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3" disabled={!isPaid} onChange={(event) => setFont(event.target.value)} value={font}>{fonts.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="space-y-2 text-sm font-bold">Spacing<select className="min-h-11 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3" disabled={!isPaid} onChange={(event) => setSpacing(event.target.value)} value={spacing}>{spacingOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="space-y-2 text-sm font-bold">Zoom<input className="min-h-11 w-full accent-[var(--primary)]" disabled={!isPaid} max="120" min="70" onChange={(event) => setZoom(Number(event.target.value))} type="range" value={zoom} /></label>
            </div>
            <div>
              <p className="mb-2 text-sm font-bold">Preview mode</p>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => setPreviewMode("desktop")} type="button" variant={previewMode === "desktop" ? "default" : "secondary"}><Monitor className="size-4" /> Desktop</Button>
                <Button onClick={() => setPreviewMode("mobile")} type="button" variant={previewMode === "mobile" ? "default" : "secondary"}><Smartphone className="size-4" /> Mobile</Button>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-bold">Drag section order</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {sectionOrder.map((section) => (
                  <button
                    className={`flex min-h-10 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--card)] px-3 text-left text-sm font-bold ${!isPaid ? "opacity-55" : "cursor-grab"}`}
                    draggable={isPaid}
                    key={section}
                    onDragOver={(event) => event.preventDefault()}
                    onDragStart={() => setDraggedSection(section)}
                    onDrop={() => reorderSection(section)}
                    type="button"
                  >
                    <GripVertical className="size-4 text-[var(--muted)]" />
                    {titleFor(section)}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-md border border-[var(--border)] bg-black/[0.03] p-4 dark:bg-white/[0.05]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-extrabold">Cover letter generator</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">Paid users can generate a concise role-specific cover letter from the same resume JSON.</p>
                </div>
                <Button onClick={generateCoverLetter} type="button" variant={isPaid ? "default" : "secondary"}>{isPaid ? <Sparkles className="size-4" /> : <Lock className="size-4" />} Generate</Button>
              </div>
              {coverLetter ? <pre className="mt-4 max-h-56 overflow-auto whitespace-pre-wrap rounded-md bg-white p-4 text-sm leading-6 text-slate-800 dark:bg-black/30 dark:text-slate-100">{coverLetter}</pre> : null}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{selectedFromList.name}</CardTitle>
              <p className="mt-2 text-sm text-[var(--muted)]">{selectedFromList.description}</p>
            </div>
            <Button onClick={() => setPreviewOpen(true)} type="button" variant="secondary"><Maximize2 className="size-4" /> Preview</Button>
          </CardHeader>
          <CardContent className="max-h-[640px] overflow-auto bg-black/[0.02] p-4 dark:bg-white/[0.03]">
            <FullTemplatePreview accent={accent} font={font} previewMode={previewMode} profile={profile} sectionOrder={sectionOrder} spacing={spacing} template={selectedFromList} zoom={Math.min(zoom, 92)} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredTemplates.map((template) => {
          const locked = template.isPremium && !isPaid;
          const active = selectedId === template.id;

          return (
            <Card className={`group overflow-hidden transition hover:-translate-y-1 hover:shadow-xl ${active ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20" : ""}`} key={template.id}>
              <div className="p-3">
                <MiniResumePreview accent={active ? accent : template.accent} font={font} locked={locked} profile={profile} template={template} />
              </div>
              <CardContent className="space-y-4 border-t border-[var(--border)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold">{template.name}</h3>
                      {template.isFeatured ? <span className="rounded bg-[var(--primary)] px-2 py-0.5 text-[10px] font-black uppercase text-[var(--primary-foreground)]">Featured</span> : null}
                    </div>
                    <p className="mt-1 text-xs font-bold uppercase text-[var(--muted)]">{template.category} · {template.popularity}</p>
                  </div>
                  {locked ? <Lock className="size-5 text-[var(--warning)]" /> : <BadgeCheck className="size-5 text-emerald-600" />}
                </div>
                <p className="min-h-12 text-sm leading-6 text-[var(--muted)]">{template.description}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-200">ATS-friendly</span>
                  <span className={`rounded-md px-2 py-1 text-xs font-extrabold ${template.isPremium ? "bg-amber-500/10 text-amber-700 dark:text-amber-200" : "bg-blue-500/10 text-blue-700 dark:text-blue-200"}`}>{template.isPremium ? "Premium" : "Free"}</span>
                  <span className="rounded-md border border-[var(--border)] px-2 py-1 text-xs font-bold">{template.layoutType}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button onClick={() => { selectTemplate(template); setPreviewOpen(true); }} size="sm" type="button" variant="secondary"><Eye className="size-4" /> Preview</Button>
                  <Button onClick={() => useTemplate(template)} size="sm" type="button" variant={locked ? "secondary" : "default"}>{locked ? <Lock className="size-4" /> : <Palette className="size-4" />} Use</Button>
                  <Button onClick={() => downloadTemplate(template, "PDF")} size="sm" type="button" variant={locked ? "secondary" : "default"}><Download className="size-4" /> PDF</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {previewOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/55 p-4 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl rounded-lg border border-[var(--border)] bg-[var(--background)] shadow-2xl">
            <div className="sticky top-0 z-10 flex flex-col gap-4 border-b border-[var(--border)] bg-[var(--background)]/95 p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-[var(--muted)]">{selectedFromList.category} · {selectedFromList.layoutType}</p>
                <h3 className="text-2xl font-extrabold">{selectedFromList.name}</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">{selectedFromList.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => useTemplate(selectedFromList)} type="button">{selectedFromList.isPremium && !isPaid ? <Lock className="size-4" /> : <Palette className="size-4" />} Use Template</Button>
                <Button onClick={() => downloadTemplate(selectedFromList, "PDF")} type="button" variant="secondary"><Download className="size-4" /> PDF</Button>
                <Button onClick={() => downloadTemplate(selectedFromList, "DOCX")} type="button" variant="secondary"><FileDown className="size-4" /> DOCX</Button>
                <Button onClick={() => setPreviewOpen(false)} size="icon" type="button" variant="ghost"><X className="size-5" /></Button>
              </div>
            </div>
            <div className="bg-black/[0.03] p-5 dark:bg-white/[0.03]">
              <FullTemplatePreview accent={accent} font={font} previewMode={previewMode} profile={profile} sectionOrder={sectionOrder} spacing={spacing} template={selectedFromList} zoom={zoom} />
            </div>
          </div>
        </div>
      ) : null}

      {upgradeOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <div className="mb-3 grid size-12 place-items-center rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-200"><Crown className="size-6" /></div>
                <CardTitle className="text-2xl">Premium design locked</CardTitle>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{upgradeMessage}</p>
              </div>
              <Button onClick={() => setUpgradeOpen(false)} size="icon" type="button" variant="ghost"><X className="size-5" /></Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border border-[var(--border)] bg-black/[0.03] p-4 text-sm leading-6 dark:bg-white/[0.05]">
                Upgrade unlocks all premium layouts, DOCX export, AI formatting optimization, cover letter generator access, and unlimited customization without watermark.
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link className="flex-1" href="/#pricing"><Button className="w-full" type="button"><Crown className="size-4" /> Upgrade to Pro</Button></Link>
                <Button className="flex-1" onClick={() => setUpgradeOpen(false)} type="button" variant="secondary">Keep Previewing</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}
