import { Suspense, lazy, useState } from "react";
import { ChatPanel } from "./components/Chat/ChatPanel";
import { ConversationSidebar } from "./components/Chat/ConversationSidebar";
import { useConversation } from "./hooks/useConversation";

// Lazy-loaded: DashboardPanel pulls in Recharts, which would otherwise
// force the same chart-library bundle onto every page load regardless of
// whether it's needed yet — deferring it lets the chat become interactive
// first, with the dashboard filling in a beat later. This also restores
// the point of lazy-loading Chat/InsightChart's own Recharts usage: if the
// dashboard imported it eagerly, Recharts would already be in the main
// bundle and that chat-side lazy-loading would do nothing.
const DashboardPanel = lazy(() =>
  import("./components/Dashboard/DashboardPanel").then((m) => ({ default: m.DashboardPanel })),
);

function DashboardFallback() {
  return <div className="h-full animate-pulse bg-paper-dim" />;
}

export default function App() {
  const { conversationId, startNewConversation, switchConversation } = useConversation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileDashboardOpen, setMobileDashboardOpen] = useState(false);

  return (
    <div className="relative grid h-screen grid-cols-1 bg-paper md:grid-cols-[260px_1fr_380px]">
      <aside className="hidden border-r border-line md:block">
        <ConversationSidebar
          activeConversationId={conversationId}
          onSelect={switchConversation}
          onNew={startNewConversation}
        />
      </aside>

      <ChatPanel
        key={conversationId}
        conversationId={conversationId}
        onNewConversation={startNewConversation}
        onOpenSidebar={() => setMobileSidebarOpen(true)}
        onOpenDashboard={() => setMobileDashboardOpen(true)}
      />

      <aside className="hidden border-l border-line md:block">
        <Suspense fallback={<DashboardFallback />}>
          <DashboardPanel />
        </Suspense>
      </aside>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-20 flex md:hidden">
          <div className="w-72 bg-paper-dim shadow-xl">
            <ConversationSidebar
              activeConversationId={conversationId}
              onSelect={(id) => {
                switchConversation(id);
                setMobileSidebarOpen(false);
              }}
              onNew={() => {
                startNewConversation();
                setMobileSidebarOpen(false);
              }}
            />
          </div>
          <button
            type="button"
            aria-label="Close conversation list"
            className="flex-1 bg-ink/20"
            onClick={() => setMobileSidebarOpen(false)}
          />
        </div>
      )}

      {mobileDashboardOpen && (
        <div className="fixed inset-0 z-20 flex justify-end md:hidden">
          <button
            type="button"
            aria-label="Close dashboard"
            className="flex-1 bg-ink/20"
            onClick={() => setMobileDashboardOpen(false)}
          />
          <div className="w-80 bg-paper shadow-xl">
            <Suspense fallback={<DashboardFallback />}>
              <DashboardPanel />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}
