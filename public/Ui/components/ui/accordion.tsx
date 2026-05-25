"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Accordion({ items }: { items: { question: string; answer: string }[] }) {
  const [open, setOpen] = useState(0);

  return (
    <div className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)] bg-[var(--card)]">
      {items.map((item, index) => (
        <div key={item.question}>
          <button
            className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-3 text-left font-semibold"
            onClick={() => setOpen(open === index ? -1 : index)}
            type="button"
          >
            <span>{item.question}</span>
            <ChevronDown className={cn("size-5 shrink-0 transition", open === index && "rotate-180")} />
          </button>
          {open === index ? <p className="px-5 pb-5 text-sm leading-6 text-[var(--muted)]">{item.answer}</p> : null}
        </div>
      ))}
    </div>
  );
}
