"use client";

import { SendHorizonal } from "lucide-react";
import { useState } from "react";
import { PaidFeatureGate } from "@/components/paid-feature-gate";
import { PageHeading } from "@/components/page-heading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/form";

const history = ["Resume strategy", "AWS backend roles", "Recruiter follow-up"];

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { role: "ai", text: "I can help optimize your resume, explain ATS reports, and draft job-specific application responses." },
    { role: "user", text: "Help me focus on senior .NET roles with AWS." },
    { role: "ai", text: "Great. I will prioritize .NET Core, Web API, SQL Server, AWS Lambda, S3, and architecture keywords." }
  ]);
  const [input, setInput] = useState("");

  function send() {
    if (!input.trim()) return;
    setMessages((items) => [...items, { role: "user", text: input }, { role: "ai", text: "Typing analysis complete: I would tailor your summary toward cloud delivery, APIs, and measurable backend ownership." }]);
    setInput("");
  }

  return (
    <>
      <PageHeading title="Live Chat Agent" description="A modern AI chat interface for resume tuning, screening answers, and job search decisions." />
      <PaidFeatureGate title="Live Chat Agent is available on paid plans" description="Free users can build resumes and run basic ATS checks. Upgrade to Pro or Premium to unlock AI chat limits, resume optimization support, and job-search strategy help.">
        <div className="grid min-h-[720px] gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="p-4">
          <Button className="mb-4 w-full">New Chat</Button>
          <div className="space-y-2">
            {history.map((item) => <button className="w-full rounded-md px-3 py-3 text-left text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/10" key={item} type="button">{item}</button>)}
          </div>
        </Card>
        <Card className="flex flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-auto p-4">
            {messages.map((message, index) => (
              <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`} key={`${message.role}-${index}`}>
                <div className={`max-w-[78%] rounded-lg px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "bg-black/[0.05] dark:bg-white/[0.08]"}`}>{message.text}</div>
              </div>
            ))}
            <div className="w-fit rounded-lg bg-black/[0.05] px-4 py-3 text-sm text-[var(--muted)] dark:bg-white/[0.08]">AI is ready...</div>
          </div>
          <div className="flex gap-2 border-t border-[var(--border)] p-4">
            <Input onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask JobPilot AI..." value={input} />
            <Button onClick={send} size="icon" type="button"><SendHorizonal className="size-5" /></Button>
          </div>
        </Card>
        </div>
      </PaidFeatureGate>
    </>
  );
}
