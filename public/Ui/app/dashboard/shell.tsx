"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Bot,
  FileCheck2,
  FileText,
  Home,
  LayoutTemplate,
  Lock,
  LogOut,
  Menu,
  MessageSquareText,
  ScrollText,
  Settings,
  X,
  BarChart3
} from "lucide-react";
import { useEffect, useState } from "react";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { readBillingAccount, type BillingAccount } from "@/lib/billing";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Overview", href: "/dashboard", Icon: Home },
  { label: "AI Automatic Job Search Agent", href: "/dashboard/agent", Icon: Bot, paidOnly: true },
  { label: "Resume Builder", href: "/dashboard/resume-builder", Icon: FileText },
  { label: "ATS Score Checker", href: "/dashboard/ats-checker", Icon: FileCheck2 },
  { label: "Resume Templates", href: "/dashboard/templates", Icon: LayoutTemplate },
  { label: "Live Chat Agent", href: "/dashboard/chat", Icon: MessageSquareText, paidOnly: true },
  { label: "Applications Report", href: "/dashboard/reports", Icon: BarChart3, paidOnly: true },
  { label: "Settings", href: "/dashboard/settings", Icon: Settings },
  { label: "Terms & Conditions", href: "/terms", Icon: ScrollText }
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [billing, setBilling] = useState<BillingAccount | null>(null);
  const [userName, setUserName] = useState("User");
  const isPaid = billing?.status === "paid";

  useEffect(() => {
    setBilling(readBillingAccount());
    try {
      const session = JSON.parse(localStorage.getItem("jobpilot_session") || "{}");
      const resume = JSON.parse(localStorage.getItem("jobpilot_resume_profile") || "{}");
      setUserName(resume.name || session.user || "User");
    } catch {
      setUserName("User");
    }
  }, []);

  function logout() {
    localStorage.removeItem("jobpilot_session");
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <aside className={cn("fixed inset-y-0 left-0 z-50 w-72 border-r border-[var(--border)] bg-[var(--card)] p-4 transition lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="mb-6 flex items-center justify-between">
          <Brand />
          <Button className="lg:hidden" onClick={() => setOpen(false)} size="icon" type="button" variant="ghost">
            <X className="size-5" />
          </Button>
        </div>
        <nav className="space-y-1">
          {nav.map(({ label, href, Icon, paidOnly }) => {
            const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                className={cn("flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold text-[var(--muted)] transition hover:bg-black/5 dark:hover:bg-white/10", active && "bg-[var(--primary)] text-[var(--primary-foreground)]", paidOnly && !isPaid && !active && "border border-dashed border-[var(--border)]")}
                href={href}
                key={label}
                onClick={() => setOpen(false)}
              >
                <Icon className="size-4" />
                <span className="min-w-0 flex-1">{label}</span>
                {paidOnly && !isPaid ? <Lock className="size-3.5 shrink-0" /> : null}
              </Link>
            );
          })}
        </nav>
        {!isPaid ? (
          <div className="mt-5 rounded-lg border border-[var(--border)] bg-black/[0.03] p-4 dark:bg-white/[0.05]">
            <p className="text-sm font-extrabold">Free workspace</p>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Agent, live chat, and reports unlock after Stripe payment.</p>
            <Link className="mt-3 block" href="/#pricing" onClick={() => setOpen(false)}>
              <Button className="w-full" size="sm">Upgrade</Button>
            </Link>
          </div>
        ) : null}
      </aside>

      {open ? <button aria-label="Close menu" className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setOpen(false)} type="button" /> : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--background)]/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <Button className="lg:hidden" onClick={() => setOpen(true)} size="icon" type="button" variant="secondary">
              <Menu className="size-5" />
            </Button>
            <div>
              <p className="text-sm font-bold">JobPilot AI Dashboard</p>
              <p className="hidden text-xs text-[var(--muted)] sm:block">Automation, resumes, ATS scoring, and reporting</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button aria-label="Notifications" size="icon" type="button" variant="secondary"><Bell className="size-4" /></Button>
            <ThemeToggle />
            <div className="hidden items-center gap-3 rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 sm:flex">
              <div className="grid size-8 place-items-center rounded-full bg-[var(--primary)] text-xs font-bold text-[var(--primary-foreground)]">
                {userName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U"}
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold">{userName}</p>
                  {billing?.status === "paid" ? <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-extrabold uppercase text-emerald-700 dark:text-emerald-200">Paid</span> : null}
                </div>
                <p className="text-xs text-[var(--muted)]">{billing?.status === "paid" ? `${billing.planName} workspace` : "Free workspace"}</p>
              </div>
            </div>
            <Button onClick={logout} size="icon" type="button" variant="ghost"><LogOut className="size-4" /></Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
