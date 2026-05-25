'use client';

import DashboardShell from '../../../../components/dashboard-shell';
import { FileText, Sparkles } from 'lucide-react';

export default function ResumeBuilderPage() {
  return (
    <DashboardShell>
      <div className="space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-sky-500">Resume builder</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-950">Create tailored resumes for each role.</h1>
            </div>
            <button className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              <Sparkles className="h-4 w-4" />
              Generate resume
            </button>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-xl font-semibold text-slate-950">Resume ready</h2>
              <p className="mt-3 text-slate-600">AI has created a version optimized for senior product marketing roles with metrics-first bullet points.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-xl font-semibold text-slate-950">Actions</h2>
              <p className="mt-3 text-slate-600">Download PDF, edit sections, or connect directly with applications from the dashboard.</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <div className="flex items-center gap-3 text-slate-950">
            <FileText className="h-5 w-5 text-sky-500" />
            <p className="font-semibold">Resume preview</p>
          </div>
          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Career summary</p>
            <p className="mt-4 text-slate-700">Experienced growth strategist with a track record of scaling SaaS teams and increasing pipeline conversion by 38% across enterprise accounts.</p>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
