import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="grid size-10 place-items-center rounded-md bg-[var(--foreground)] text-[var(--background)]">
        <Bot className="size-5" />
      </div>
      <div className="leading-tight">
        <p className="text-base font-extrabold">JobPilot AI</p>
        <p className="text-xs font-medium text-[var(--muted)]">Autonomous job search</p>
      </div>
    </div>
  );
}
