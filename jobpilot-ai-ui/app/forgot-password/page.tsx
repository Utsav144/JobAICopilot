import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16 sm:px-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-10 shadow-soft">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.28em] text-sky-500">Reset password</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950">Forgot your password?</h1>
          <p className="mt-3 text-slate-600">Enter your email and we’ll send you instructions to reset your account.</p>
        </div>

        <form className="space-y-6">
          <label className="block text-sm font-medium text-slate-700">
            Email address
            <input type="email" required placeholder="you@example.com" className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
          </label>
          <button className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Send reset link</button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-600">
          Back to{' '}
          <Link href="/login" className="font-semibold text-slate-950 hover:text-slate-700">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
