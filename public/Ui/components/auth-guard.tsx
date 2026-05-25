"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("jobpilot_session")) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--background)]">
        <div className="h-24 w-72 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--card)]" />
      </div>
    );
  }

  return children;
}
