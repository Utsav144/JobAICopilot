'use client';

import DashboardShell from '../../../components/dashboard-shell';
import { ShieldCheck, Sparkles } from 'lucide-react';

export default function AtsCheckerPage() {
  return (
    <DashboardShell>
      <div className="space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-sky-500">ATS checker</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-950">Validate your resume for applicant tracking systems.</h1>
            </div>
            <button className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              <ShieldCheck className="h-4 w-4" />
              Run scan
            </button>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-xl font-semibold text-slate-950">Readability score</h2>
              <p className="mt-3 text-slate-600">Your latest draft has strong ATS compatibility with highlighted keywords and resume structure alignment.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-xl font-semibold text-slate-950">Improvement tips</h2>
              <p className="mt-3 text-slate-600">Avoid overly complex sections, use standard role names, and add quantifiable outcomes.</p>
            </div>
          </div>
        </section>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="text-xl font-semibold text-slate-950">ATS readiness summary</h2>
          <p className="mt-4 text-slate-600">The resume is currently aligned with major systems, but consider refining experience bullets for stronger keyword targeting.</p>
          <ul className="mt-6 space-y-3 text-slate-700">
            <li className="rounded-2xl border border-slate-200 bg-slate-50 p-4">Use standard section headings like "Experience" and "Skills".</li>
            <li className="rounded-2xl border border-slate-200 bg-slate-50 p-4">Include 2-3 measurable accomplishments per role.</li>
            <li className="rounded-2xl border border-slate-200 bg-slate-50 p-4">Limit formatting to plain text where possible.</li>
          </ul>
        </div>
      </div>
    </DashboardShell>
  );
}
