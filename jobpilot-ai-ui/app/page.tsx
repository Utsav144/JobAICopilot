import Link from 'next/link';
import { ArrowRight, Activity, Square, Layers, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  { title: 'Automated job matching', description: 'Scan new listings, rank fit, and surface best opportunities automatically.', icon: Activity },
  { title: 'Resume optimization', description: 'Generate tailored resumes and cover letters for every role in seconds.', icon: Square },
  { title: 'Smart outreach', description: 'Send network messages, track follow-ups, and close more interviews.', icon: MessageCircle },
  { title: 'Workflow orchestration', description: 'Run daily automation for sourcing, screening, and reporting.', icon: Layers }
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-7xl px-6 pb-20 pt-10 sm:px-8">
      <header className="mb-16 flex flex-col gap-6 text-center">
        <p className="inline-flex rounded-full bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-700 ring-1 ring-sky-200">
          JobPilot AI • SaaS workspace for smarter job search and recruiting
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
          Build your career engine with AI-powered hiring workflows.
        </h1>
        <p className="mx-auto max-w-2xl text-lg leading-8 text-slate-600">
          From intelligent sourcing to resume tailoring and outreach automation, JobPilot AI gives teams and candidates a polished, modern workspace to manage every step of the hiring motion.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/signup" className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
            Get started free
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link href="/dashboard" className="inline-flex items-center justify-center rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300">
            Explore dashboard
          </Link>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <article key={feature.title} className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft backdrop-blur-xl">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-slate-950">{feature.title}</h2>
              <p className="mt-3 text-slate-600">{feature.description}</p>
            </article>
          );
        })}
      </section>

      <section className="mt-20 rounded-[2rem] bg-slate-950 px-8 py-14 text-white shadow-soft sm:px-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="mb-4 text-sm uppercase tracking-[0.3em] text-sky-300">Build faster, hire smarter</p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              One platform for teams and candidates to own the recruiting lifecycle.
            </h2>
            <p className="mt-6 max-w-xl text-slate-300">
              Launch workflows, manage applications, and surface priority roles without bouncing between tools. Respond to clients, candidates, and hiring teams from a polished central workspace.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/signup" className="inline-flex items-center justify-center rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400">
                Start free trial
              </Link>
              <Link href="/terms" className="inline-flex items-center justify-center rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800/80">
                Learn more
              </Link>
            </div>
          </div>
          <div className="rounded-[2rem] bg-slate-900/95 p-8 ring-1 ring-white/10">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-800 p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-sky-300">Resume tailor</p>
                <p className="mt-4 text-xl font-semibold text-white">Customize each application in seconds.</p>
              </div>
              <div className="rounded-3xl bg-slate-800 p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-sky-300">Daily workflow</p>
                <p className="mt-4 text-xl font-semibold text-white">Automate candidate sourcing and follow-ups.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-20 grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-sky-500">Trusted by hiring teams</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Accelerate outreach with modern automation and clarity.
          </h2>
          <p className="mt-6 max-w-xl text-slate-600">
            Move from manual tasks to a single modern workspace that helps teams keep hiring momentum and candidates feel supported through every stage.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">120%</p>
            <p className="mt-4 text-3xl font-semibold text-slate-950">More interviews</p>
            <p className="mt-3 text-slate-600">Automated resume optimization and messaging helps candidates secure interviews faster.</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">8h</p>
            <p className="mt-4 text-3xl font-semibold text-slate-950">Saved weekly</p>
            <p className="mt-3 text-slate-600">Workflows reduce busywork for recruiters and job seekers alike.</p>
          </div>
        </div>
      </section>

      <section className="mt-20 rounded-3xl bg-white p-10 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-sky-500">Get started fast</p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Everything you need for modern hiring and career progress.</h2>
          </div>
          <Link href="/dashboard" className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
            View workspace
          </Link>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-xl font-semibold text-slate-950">Smart sourcing</h3>
            <p className="mt-3 text-slate-600">Prioritize roles with fit scores and built-in automation triggers.</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-xl font-semibold text-slate-950">Resume intelligence</h3>
            <p className="mt-3 text-slate-600">Tailor applications for each job with structured prompts and review highlights.</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-xl font-semibold text-slate-950">Flexible reporting</h3>
            <p className="mt-3 text-slate-600">Track results across workflows, outreach, and candidate pipelines.</p>
          </div>
        </div>
      </section>

      <footer className="mt-20 border-t border-slate-200 pt-10 text-sm text-slate-500">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright © 2026 JobPilot AI. Designed for modern recruiting teams.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="transition hover:text-slate-900">Privacy</Link>
            <Link href="/terms" className="transition hover:text-slate-900">Terms</Link>
            <Link href="/refund" className="transition hover:text-slate-900">Refund policy</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
