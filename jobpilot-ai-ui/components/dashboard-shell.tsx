'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Sidebar from './sidebar';

export default function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 sm:px-8 xl:flex-row xl:items-start xl:gap-10">
        <Sidebar current={pathname || '/dashboard'} />
        <section className="flex-1 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Dashboard</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-950">Launch workflows or build your next resume package.</h1>
            </div>
            <Link href="/dashboard/settings" className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
              Workspace settings
            </Link>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
