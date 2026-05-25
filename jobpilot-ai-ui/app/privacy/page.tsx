import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 sm:px-8">
      <h1 className="text-3xl font-semibold text-slate-950">Privacy Policy</h1>
      <p className="mt-6 text-slate-600">JobPilot AI respects your privacy. This policy explains what information we collect and how we use it to improve the platform.</p>
      <section className="mt-10 space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Information collected</h2>
          <p className="mt-3 text-slate-600">We collect usage data to help improve dashboards and workflows. Personal data is used only to support account access and communication.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Security</h2>
          <p className="mt-3 text-slate-600">We apply standard web security practices. Always protect your credentials and avoid sharing sensitive details on unsecured channels.</p>
        </div>
      </section>
      <p className="mt-10 text-sm text-slate-500">Return to <Link href="/" className="font-medium text-slate-900 hover:text-slate-700">homepage</Link>.</p>
    </main>
  );
}
