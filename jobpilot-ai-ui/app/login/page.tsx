import Link from 'next/link';
import { Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16 sm:px-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-10 shadow-soft">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.28em] text-sky-500">Sign in</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950">Welcome back to JobPilot.</h1>
          <p className="mt-3 text-slate-600">Log in to access your hiring dashboard, automation, and analytics.</p>
        </div>

        <form className="space-y-6">
          <label className="block text-sm font-medium text-slate-700">
            Email address
            <div className="mt-2 relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type="email" required placeholder="you@example.com" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
            </div>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <div className="mt-2 relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type="password" required placeholder="Enter your password" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
            </div>
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
              Remember me
            </label>
            <Link href="/forgot-password" className="text-sm font-medium text-sky-600 hover:text-sky-700">Forgot password?</Link>
          </div>
          <button className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Continue to dashboard</button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-600">
          New to JobPilot?{' '}
          <Link href="/signup" className="font-semibold text-slate-950 hover:text-slate-700">Create an account</Link>
        </p>
      </section>
    </main>
  );
}
