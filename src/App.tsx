import { useMemo } from "react";
import { ChatPanel } from "./components/Chat/ChatPanel";

export default function App() {
  const conversationId = useMemo(() => crypto.randomUUID(), []);

  return (
    <div className="h-screen bg-white">
      <ChatPanel conversationId={conversationId} />
    </div>
  );
}
