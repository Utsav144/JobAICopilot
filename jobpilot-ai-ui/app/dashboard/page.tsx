'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Activity, Bookmark, FileText, MessageSquare, Settings, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import DashboardShell from '../../components/dashboard-shell';

export default function DashboardPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = window.localStorage.getItem('jobpilot-token');
      if (!token) {
        window.localStorage.setItem('jobpilot-token', 'demo-token');
      }
    }
  }, []);

  return (
    <DashboardShell>
      <div className="space-y-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-sky-500">Workspace overview</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-950">Your hiring ops control center.</h1>
            </div>
            <Link href="/dashboard/agent" className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              Launch AI agent
            </Link>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Open roles', value: '24', icon: Activity },
              { label: 'Resume drafts', value: '12', icon: FileText },
              { label: 'Follow-ups', value: '73', icon: MessageSquare },
              { label: 'AI workflows', value: '5 active', icon: Sparkles }
            ].map((item) => (
              <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="mt-5 text-3xl font-semibold text-slate-950">{item.value}</p>
                <p className="mt-2 text-sm text-slate-600">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
            <div className="flex items-center gap-3 text-slate-950">
              <Bookmark className="h-5 w-5 text-sky-500" />
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Resume brief</p>
            </div>
            <h2 className="mt-5 text-2xl font-semibold">Latest application ready for review</h2>
            <p className="mt-4 text-slate-600">Your AI assistant has drafted a new resume tailored for the Sales Director role at Nimbus Labs.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard/resume-builder" className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:border-slate-300">Review draft</Link>
              <Link href="/dashboard/ats-checker" className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:border-slate-300">Run ATS check</Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
            <div className="flex items-center gap-3 text-slate-950">
              <Settings className="h-5 w-5 text-slate-500" />
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Workflow actions</p>
            </div>
            <div className="mt-8 grid gap-4">
              {[
                { title: 'Daily sourcing run', description: 'Launch candidate discovery and update pipeline status.', href: '/dashboard/agent' },
                { title: 'Outreach batch', description: 'Draft follow-up messages and review replies in one place.', href: '/dashboard/chat' },
                { title: 'Reporting snapshot', description: 'Download weekly performance metrics for team review.', href: '/dashboard/reports' }
              ].map((item) => (
                <Link key={item.title} href={item.href} className="block rounded-2xl border border-slate-200 p-5 transition hover:border-slate-300">
                  <p className="font-semibold text-slate-950">{item.title}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </motion.section>
      </div>
    </DashboardShell>
  );
}
