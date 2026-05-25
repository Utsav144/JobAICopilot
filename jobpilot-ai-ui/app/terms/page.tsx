import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 sm:px-8">
      <h1 className="text-3xl font-semibold text-slate-950">Terms of Service</h1>
      <p className="mt-6 text-slate-600">JobPilot AI is a demo SaaS workspace designed for job search and hiring workflow management. These terms outline service expectations, user responsibilities, and acceptable usage.</p>
      <section className="mt-10 space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Using the service</h2>
          <p className="mt-3 text-slate-600">Users agree to use the platform responsibly and not abuse automation features, message templates, or any integrations.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Data & privacy</h2>
          <p className="mt-3 text-slate-600">Your usage data may be logged for analytics, debugging, and product improvements. For sensitive information, rely on secure workflows and avoid sharing private credentials.</p>
        </div>
      </section>
      <p className="mt-10 text-sm text-slate-500">Return to <Link href="/" className="font-medium text-slate-900 hover:text-slate-700">homepage</Link>.</p>
    </main>
  );
}
