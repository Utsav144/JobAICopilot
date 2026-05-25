import Link from "next/link";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Check,
  FileCheck2,
  FileText,
  Filter,
  LineChart,
  MessageSquareText,
  Send,
  Sparkles,
  Star
} from "lucide-react";
import { Accordion } from "@/components/ui/accordion";
import { Brand } from "@/components/brand";
import { CheckoutButton } from "@/components/checkout-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MotionSection } from "@/components/motion-section";
import { ThemeToggle } from "@/components/theme-toggle";
import { limitRows, pricingPlans } from "@/lib/plan-limits";

const features = [
  ["AI Automatic Job Apply", BriefcaseBusiness, "Run guided job applications across matching roles with human checkpoints."],
  ["ATS Resume Score", FileCheck2, "See how your resume aligns before you send another application."],
  ["Resume Builder", FileText, "Build role-ready resumes with structured sections and instant previews."],
  ["AI Resume Optimization", Sparkles, "Rewrite bullets, summaries, and keywords for each target role."],
  ["Live AI Assistant", MessageSquareText, "Chat through job search strategy, screening questions, and follow-ups."],
  ["Daily Job Tracking", LineChart, "Monitor applications, statuses, and outcomes from one dashboard."],
  ["Smart Job Filtering", Filter, "Focus on roles that match skills, location, experience, and salary goals."],
  ["Auto Apply Reports", Send, "Review every automated action with transparent reports and next steps."]
];

const testimonials = [
  ["Aarav Mehta", "The dashboard finally made my job search feel organized. I could see where AI helped and where I needed to step in."],
  ["Neha Kapoor", "The ATS checker and resume builder helped me tailor applications faster without losing quality."],
  ["Rohan Shah", "I liked that the automation pauses for manual steps instead of pretending every application is identical."]
];

const faqs = [
  {
    question: "Does JobPilot AI apply without my approval?",
    answer: "The UI is designed around transparent automation. Sensitive steps, custom questions, CAPTCHA, OTP, and verification moments should pause for manual review."
  },
  {
    question: "Can I use my existing job agent?",
    answer: "Yes. The AI Automatic Job Search Agent page embeds the existing running agent instead of creating a new automation app."
  },
  {
    question: "Are the resume and ATS tools connected to a backend?",
    answer: "This implementation uses production-shaped mock data and client-side interactions. API wiring can be connected once endpoints are available."
  },
  {
    question: "Is dark mode included?",
    answer: "Yes. Use the theme toggle in the top navigation or dashboard settings to switch between light and dark presentation."
  }
];

export default function Home() {
  return (
    <main>
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Brand />
          <nav className="hidden items-center gap-6 text-sm font-semibold text-[var(--muted)] md:flex">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="secondary">Login</Button>
            </Link>
            <Link className="hidden sm:block" href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-sm font-semibold text-[var(--muted)]">
            <Sparkles className="size-4 text-[var(--accent)]" />
            AI job automation workspace
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-normal sm:text-5xl lg:text-6xl">
            AI-powered Job Search & Resume Automation Platform
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            Automatically apply jobs, build ATS-friendly resumes, and track applications using AI.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup">
              <Button size="lg">
                Get Started <ArrowRight className="size-5" />
              </Button>
            </Link>
            <a href="#pricing">
              <Button size="lg" variant="secondary">View Pricing</Button>
            </a>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-bold">Today&apos;s automation</p>
              <p className="text-sm text-[var(--muted)]">Senior .NET / AWS roles</p>
            </div>
            <Bot className="size-9 rounded-md bg-blue-100 p-2 text-blue-700 dark:bg-blue-400/15 dark:text-blue-200" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {["42 scanned", "18 qualified", "9 queued", "4 need review"].map((metric) => (
              <div key={metric} className="rounded-md border border-[var(--border)] p-4">
                <p className="text-2xl font-extrabold">{metric.split(" ")[0]}</p>
                <p className="text-sm font-medium text-[var(--muted)]">{metric.split(" ").slice(1).join(" ")}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-3">
            {["Resume optimized for cloud backend roles", "Naukri automation paused for manual verification", "ATS match improved from 72% to 91%"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-md bg-black/[0.03] p-3 text-sm dark:bg-white/[0.05]">
                <Check className="size-4 text-[var(--accent)]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <MotionSection className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8" id="features">
        <div className="mb-8 max-w-2xl">
          <p className="font-bold text-[var(--primary)]">Platform</p>
          <h2 className="mt-2 text-3xl font-extrabold">Everything your job search needs in one cockpit.</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(([title, Icon, body]) => (
            <Card key={title as string}>
              <CardHeader>
                <Icon className="size-9 rounded-md bg-blue-100 p-2 text-blue-700 dark:bg-blue-400/15 dark:text-blue-200" />
                <CardTitle>{title as string}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-[var(--muted)]">{body as string}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </MotionSection>

      <MotionSection className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {["Upload Resume", "Configure AI Agent", "AI Automatically Applies Jobs"].map((step, index) => (
            <Card key={step} className="p-6">
              <div className="mb-5 grid size-10 place-items-center rounded-md bg-[var(--foreground)] font-extrabold text-[var(--background)]">{index + 1}</div>
              <h3 className="text-xl font-bold">{step}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {index === 0 && "Start with a resume, profile details, and your preferred role targets."}
                {index === 1 && "Set skills, salary range, location preferences, and portal connection placeholders."}
                {index === 2 && "Review application activity, reports, and manual checkpoints from the dashboard."}
              </p>
            </Card>
          ))}
        </div>
      </MotionSection>

      <MotionSection className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map(([name, quote]) => (
            <Card key={name} className="p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-full bg-[var(--primary)] text-sm font-bold text-[var(--primary-foreground)]">{name.charAt(0)}</div>
                <div>
                  <p className="font-bold">{name}</p>
                  <div className="flex text-amber-500">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="size-4 fill-current" />)}</div>
                </div>
              </div>
              <p className="text-sm leading-6 text-[var(--muted)]">{quote}</p>
            </Card>
          ))}
        </div>
      </MotionSection>

      <MotionSection className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8" id="pricing">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-extrabold">Pricing that grows with your search.</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {pricingPlans.map(({ id, name, price, pricingItems, recommended, dailyApplications, schedulerCadence }) => (
            <Card key={name} className={recommended ? "border-[var(--primary)] shadow-xl" : ""}>
              <CardHeader>
                {recommended ? <span className="w-fit rounded-full bg-[var(--primary)] px-3 py-1 text-xs font-bold text-[var(--primary-foreground)]">Recommended</span> : null}
                <CardTitle>{name}</CardTitle>
                <p className="text-4xl font-extrabold">{price}<span className="text-sm font-semibold text-[var(--muted)]">/mo</span></p>
                <p className="text-sm font-semibold text-[var(--muted)]">{dailyApplications} · {schedulerCadence}</p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  {pricingItems.map((item) => (
                    <p key={item} className="flex items-center gap-2 text-sm"><Check className="size-4 text-[var(--accent)]" />{item}</p>
                  ))}
                </div>
                {id === "free" ? (
                  <Link href="/signup"><Button className="w-full" variant="secondary">Start Free</Button></Link>
                ) : (
                  <CheckoutButton plan={id as "pro" | "premium"} variant={recommended ? "default" : "secondary"} />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-5 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[1.1fr_repeat(3,0.9fr)] border-b border-[var(--border)] bg-black/[0.03] text-sm font-extrabold dark:bg-white/[0.05]">
              <div className="p-3">Plan limits</div>
              {pricingPlans.map((plan) => <div className="p-3" key={plan.id}>{plan.name}</div>)}
            </div>
            {limitRows.slice(0, 6).map(([label, key]) => (
              <div className="grid grid-cols-[1.1fr_repeat(3,0.9fr)] border-b border-[var(--border)] text-sm last:border-b-0" key={key}>
                <div className="p-3 font-semibold text-[var(--muted)]">{label}</div>
                {pricingPlans.map((plan) => <div className="p-3 font-bold" key={`${plan.id}-${key}`}>{plan[key]}</div>)}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-sm leading-6 text-[var(--muted)]">
          <p className="font-bold text-[var(--foreground)]">Stripe test card</p>
          <p>Use Stripe test mode only. Card: <span className="font-mono font-bold">4242 4242 4242 4242</span>, expiry: <span className="font-mono font-bold">12/34</span>, CVC: <span className="font-mono font-bold">567</span>. Any billing name and ZIP work in test mode.</p>
        </div>
      </MotionSection>

      <MotionSection className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8" id="faq">
        <div>
          <p className="font-bold text-[var(--primary)]">FAQ</p>
          <h2 className="mt-2 text-3xl font-extrabold">Questions before takeoff.</h2>
        </div>
        <Accordion items={faqs} />
      </MotionSection>

      <footer className="border-t border-[var(--border)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <Brand />
          <div className="flex flex-wrap gap-4 text-sm font-semibold text-[var(--muted)]">
            <Link href="/terms">Terms & Conditions</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/refund">Refund Policy</Link>
            <Link href="mailto:hello@jobpilot.ai">Contact</Link>
            <span>LinkedIn</span>
            <span>X</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
