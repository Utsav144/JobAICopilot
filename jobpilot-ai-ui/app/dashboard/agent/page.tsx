'use client';

import Link from 'next/link';
import { AlertTriangle, PlayCircle, Sparkles } from 'lucide-react';
import DashboardShell from '../../../components/dashboard-shell';

export default function AgentPage() {
  return (
    <DashboardShell>
      <div className="space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-sky-500">AI agent</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-950">Run daily sourcing and outreach workflows.</h1>
            </div>
            <button className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              Start automation
            </button>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-xl font-semibold text-slate-950">Workflow status</h2>
              <p className="mt-3 text-slate-600">Daily agent automation is ready. Review the latest candidate matches, messages, and role priorities.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-xl font-semibold text-slate-950">Next run</h2>
              <p className="mt-3 text-slate-600">Tomorrow at 8:00 AM — the agent will fetch new opportunities and surface high-fit roles.</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <div className="flex items-center gap-3 text-slate-950">
            <Sparkles className="h-5 w-5 text-sky-500" />
            <p className="font-semibold">Automation preview</p>
          </div>
          <div className="mt-6 grid gap-4">
            {[
              'Identify matching roles from configured sources.',
              'Score opportunities based on skills and location.',
              'Draft follow-up messages for new contacts.',
              'Sync application statuses into reports.'
            ].map((item) => (
              <div key={item} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </section>

        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-soft">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5" />
            <p className="font-semibold">Beta notice</p>
          </div>
          <p className="mt-3 text-sm text-amber-900/90">This workspace preview uses sample automation. Connect real data sources when you're ready to move from demo to production.</p>
        </div>

        <div className="flex flex-wrap gap-4">
          <Link href="/dashboard" className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">Back to overview</Link>
          <button className="rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Export workflow</button>
        </div>
      </div>
    </DashboardShell>
  );
}
