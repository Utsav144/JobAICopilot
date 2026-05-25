import Link from 'next/link';
import { CalendarCheck, FileText, MessageSquare, Settings, Sparkles, Target } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: Target },
  { href: '/dashboard/agent', label: 'AI Agent', icon: Sparkles },
  { href: '/dashboard/resume-builder', label: 'Resume Builder', icon: FileText },
  { href: '/dashboard/ats-checker', label: 'ATS Checker', icon: CalendarCheck },
  { href: '/dashboard/chat', label: 'Outreach', icon: MessageSquare },
  { href: '/dashboard/reports', label: 'Reports', icon: Settings }
];

export default function Sidebar({ current = '/dashboard' }: { current?: string }) {
  return (
    <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-72 shrink-0 self-start rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft xl:block">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Workspace</p>
        <h2 className="mt-4 text-2xl font-semibold text-slate-950">JobPilot AI</h2>
      </div>
      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = current === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${active ? 'bg-slate-950 text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'}`}>
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-10 rounded-3xl bg-slate-950 p-5 text-white">
        <p className="text-sm uppercase tracking-[0.24em] text-sky-300">Need help?</p>
        <p className="mt-3 text-sm leading-7 text-slate-200">Use the workspace modules to sync sourcing, score matches, and manage templates across conversations.</p>
      </div>
    </aside>
  );
}
