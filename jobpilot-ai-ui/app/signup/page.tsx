import Link from 'next/link';

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16 sm:px-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-10 shadow-soft">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.28em] text-sky-500">Create account</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950">Begin your job workflow.</h1>
          <p className="mt-3 text-slate-600">Sign up to start saving time with tailored resumes, sourcing automation, and team workflows.</p>
        </div>

        <form className="space-y-6">
          <label className="block text-sm font-medium text-slate-700">
            Full name
            <input type="text" required placeholder="Your name" className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Work email
            <input type="email" required placeholder="you@example.com" className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input type="password" required placeholder="Create a password" className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
          </label>
          <button className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Create account</button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-slate-950 hover:text-slate-700">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
