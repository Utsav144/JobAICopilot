import { AgentWorkspace } from "@/components/agent-workspace";

const agentUrl = process.env.NEXT_PUBLIC_AGENT_URL || "/legacy-agent";

export default function AgentPage() {
  return <AgentWorkspace agentUrl={agentUrl} />;
}
