import Link from "next/link";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function LegalPage({ title, body }: { title: string; body: string[] }) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link href="/"><Brand /></Link>
        <Link href="/dashboard"><Button variant="secondary">Dashboard</Button></Link>
      </div>
      <Card className="p-6 sm:p-8">
        <h1 className="text-3xl font-extrabold">{title}</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">Last updated: May 12, 2026</p>
        <div className="mt-8 space-y-5">
          {body.map((paragraph) => <p className="leading-7 text-[var(--muted)]" key={paragraph}>{paragraph}</p>)}
        </div>
      </Card>
    </main>
  );
}
