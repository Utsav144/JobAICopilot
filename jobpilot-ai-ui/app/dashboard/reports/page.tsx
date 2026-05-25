'use client';

import DashboardShell from '../../../../components/dashboard-shell';
import { BarChart3, Layers } from 'lucide-react';

export default function ReportsPage() {
  return (
    <DashboardShell>
      <div className="space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-sky-500">Reports</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-950">Review hiring metrics and workflow results.</h1>
            </div>
            <button className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              <BarChart3 className="h-4 w-4" />
              Export report
            </button>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              { title: 'Interview rate', value: '42%' },
              { title: 'Response rate', value: '65%' },
              { title: 'Workflow ROI', value: '3.2x' }
            ].map((item) => (
              <div key={item.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{item.title}</p>
                <p className="mt-4 text-3xl font-semibold text-slate-950">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <div className="flex items-center gap-3 text-slate-950">
            <Layers className="h-5 w-5 text-sky-500" />
            <p className="font-semibold">Report highlights</p>
          </div>
          <ul className="mt-6 space-y-4 text-slate-700">
            <li className="rounded-2xl border border-slate-200 bg-slate-50 p-5">Candidates sourced from daily automation are converting 28% faster.</li>
            <li className="rounded-2xl border border-slate-200 bg-slate-50 p-5">Resume drafts with keywords matched to job descriptions are seeing higher interview rate.</li>
            <li className="rounded-2xl border border-slate-200 bg-slate-50 p-5">Follow-up templates reduced response delays by 1.4 days.</li>
          </ul>
        </section>
      </div>
    </DashboardShell>
  );
}
