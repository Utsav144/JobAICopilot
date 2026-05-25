import { Bot, CalendarCheck, CircleAlert, FileCheck2, Send, TrendingUp } from "lucide-react";
import { BillingStatusBanner } from "@/components/billing-status-banner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeading } from "@/components/page-heading";

const metrics = [
  ["Total Applied Jobs", "128", Send, "18% higher than last week"],
  ["Pending Applications", "34", CalendarCheck, "12 awaiting recruiter review"],
  ["Rejected Jobs", "17", CircleAlert, "Mostly salary or location mismatch"],
  ["Interview Scheduled", "6", TrendingUp, "3 this week"]
];

export default function DashboardPage() {
  return (
    <>
      <PageHeading title="Overview" description="A live executive view of your AI-powered job search workspace." />
      <BillingStatusBanner />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value, Icon, hint]) => (
          <Card key={label as string}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm text-[var(--muted)]">{label as string}</CardTitle>
              <Icon className="size-5 text-[var(--primary)]" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-extrabold">{value as string}</p>
              <p className="mt-2 text-xs text-[var(--muted)]">{hint as string}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Weekly application velocity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-72 items-end gap-3">
              {[28, 36, 52, 44, 70, 61, 84].map((value, index) => (
                <div className="flex flex-1 flex-col items-center gap-2" key={value}>
                  <div className="w-full rounded-t-md bg-[var(--primary)]/80" style={{ height: `${value}%` }} />
                  <span className="text-xs font-semibold text-[var(--muted)]">{["M", "T", "W", "T", "F", "S", "S"][index]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>AI work queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {["Resume optimization queued for AWS backend roles", "Naukri session needs manual verification", "9 applications ready for review", "ATS score report generated for Product Engineer JD"].map((item, index) => (
              <div className="flex items-start gap-3 rounded-md border border-[var(--border)] p-3" key={item}>
                {index === 1 ? <CircleAlert className="mt-0.5 size-5 text-[var(--warning)]" /> : <Bot className="mt-0.5 size-5 text-[var(--primary)]" />}
                <p className="text-sm leading-6">{item}</p>
              </div>
            ))}
            <div className="rounded-md border border-[var(--border)] bg-black/[0.03] p-4 dark:bg-white/[0.05]">
              <FileCheck2 className="mb-2 size-5 text-[var(--accent)]" />
              <p className="text-sm font-semibold">Latest ATS score: 91%</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Strong match for .NET Core, AWS Lambda, SQL Server, and Web API.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
