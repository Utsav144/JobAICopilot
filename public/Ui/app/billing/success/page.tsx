import { Brand } from "@/components/brand";
import { PaymentSuccessPanel } from "@/components/payment-success-panel";

export default function BillingSuccessPage({ searchParams }: { searchParams: { session_id?: string } }) {
  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <Brand />
        <PaymentSuccessPanel sessionId={searchParams.session_id} />
      </div>
    </main>
  );
}
