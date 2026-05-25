'use client';

import DashboardShell from '../../../../components/dashboard-shell';
import { ChatBubble, Send } from 'lucide-react';

export default function ChatPage() {
  return (
    <DashboardShell>
      <div className="space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-sky-500">Outreach</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-950">Manage candidate and hiring team messages.</h1>
            </div>
            <button className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              <Send className="h-4 w-4" />
              Compose message
            </button>
          </div>
          <div className="mt-8 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-semibold text-slate-950">Latest response</p>
              <p className="mt-3 text-slate-600">Pending reply from the hiring manager on your outreach for the Product Marketing Manager role.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-semibold text-slate-950">Message template</p>
              <p className="mt-3 text-slate-600">“Hi [Name], I’d love to learn more about the opportunity at [Company]. I have experience driving GTM launches and building cross-functional product narratives.”</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <div className="flex items-center gap-3 text-slate-950">
            <ChatBubble className="h-5 w-5 text-sky-500" />
            <p className="font-semibold">Conversation queue</p>
          </div>
          <div className="mt-6 grid gap-4">
            {['Follow-up with Talents team', 'Respond to candidate inquiry', 'Confirm interview scheduling'].map((item) => (
              <div key={item} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-slate-700">{item}</div>
            ))}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
