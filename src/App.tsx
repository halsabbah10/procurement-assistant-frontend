import { useMemo } from "react";
import { ChatPanel } from "./components/Chat/ChatPanel";
import { DashboardPanel } from "./components/Dashboard/DashboardPanel";

export default function App() {
  const conversationId = useMemo(() => crypto.randomUUID(), []);

  return (
    <div className="grid h-screen grid-cols-[1fr_320px] bg-white">
      <ChatPanel conversationId={conversationId} />
      <DashboardPanel />
    </div>
  );
}
