import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BillingCancelPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Brand />
        <Card className="mt-8">
          <CardHeader>
            <CircleAlert className="size-12 rounded-md bg-amber-100 p-2 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200" />
            <CardTitle>Checkout Canceled</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="leading-7 text-[var(--muted)]">
              No payment was taken. You can return to pricing and choose a plan whenever you are ready.
            </p>
            <Link href="/#pricing">
              <Button variant="secondary">Back to Pricing</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
