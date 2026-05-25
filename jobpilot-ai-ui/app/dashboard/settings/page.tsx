'use client';

import DashboardShell from '../../../../components/dashboard-shell';
import { ShieldCheck, UserCircle2 } from 'lucide-react';

export default function SettingsPage() {
  return (
    <DashboardShell>
      <div className="space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-sky-500">Settings</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-950">Manage account and workspace preferences.</h1>
            </div>
            <button className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              <ShieldCheck className="h-4 w-4" />
              Security
            </button>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Profile</p>
              <p className="mt-3 text-slate-600">Update your name, email, and company details in one place.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Notifications</p>
              <p className="mt-3 text-slate-600">Control alerts for workflow summaries, outreach reminders, and report exports.</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <div className="flex items-center gap-3 text-slate-950">
            <UserCircle2 className="h-5 w-5 text-sky-500" />
            <p className="font-semibold">Account plan</p>
          </div>
          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-lg font-semibold text-slate-950">Starter plan</p>
            <p className="mt-3 text-slate-600">Build and automate hiring workflows with sample data. Upgrade when you want live integrations and team collaboration.</p>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
