import { CalendarClock, CircleX, Send, UserRoundCheck } from "lucide-react";
import { PaidFeatureGate } from "@/components/paid-feature-gate";
import { PageHeading } from "@/components/page-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  ["Total applied jobs", "128", Send],
  ["Pending applications", "34", CalendarClock],
  ["Rejected jobs", "17", CircleX],
  ["Interview scheduled", "6", UserRoundCheck]
];

export default function ReportsPage() {
  return (
    <>
      <PageHeading title="Applications Report" description="Track outcomes and weekly trends from automated and manual applications." />
      <PaidFeatureGate title="Applications Report is available on paid plans" description="Free users can track manually. Upgrade to unlock automation reports, submitted-job analytics, and advanced Premium exports.">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(([label, value, Icon]) => (
            <Card key={label as string}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm text-[var(--muted)]">{label as string}</CardTitle>
                <Icon className="size-5 text-[var(--primary)]" />
              </CardHeader>
              <CardContent><p className="text-3xl font-extrabold">{value as string}</p></CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Daily analytics</CardTitle></CardHeader>
            <CardContent><div className="flex h-80 items-end gap-3">{[42, 58, 36, 72, 64, 48, 80].map((v) => <div className="flex-1 rounded-t-md bg-[var(--primary)]" key={v} style={{ height: `${v}%` }} />)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Weekly status mix</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[["Submitted", 62, "bg-blue-500"], ["Pending", 24, "bg-amber-500"], ["Rejected", 10, "bg-red-500"], ["Interview", 4, "bg-teal-500"]].map(([label, value, color]) => (
                <div key={label as string}>
                  <div className="mb-2 flex justify-between text-sm font-semibold"><span>{label as string}</span><span>{value as number}%</span></div>
                  <div className="h-3 rounded-full bg-black/10 dark:bg-white/10"><div className={`h-3 rounded-full ${color as string}`} style={{ width: `${value}%` }} /></div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </PaidFeatureGate>
    </>
  );
}
