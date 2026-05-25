import Link from 'next/link';

export default function RefundPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 sm:px-8">
      <h1 className="text-3xl font-semibold text-slate-950">Refund Policy</h1>
      <p className="mt-6 text-slate-600">If you are not satisfied with JobPilot AI, contact our support team within 30 days to review your subscription and refund options.</p>
      <section className="mt-10 space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Support</h2>
          <p className="mt-3 text-slate-600">Reach out to our team with purchase details and a reason for the refund request. We will process eligible refunds promptly.</p>
        </div>
      </section>
      <p className="mt-10 text-sm text-slate-500">Return to <Link href="/" className="font-medium text-slate-900 hover:text-slate-700">homepage</Link>.</p>
    </main>
  );
}
