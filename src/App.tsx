import { Suspense, lazy, useState } from "react";
import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import { ChatPanel } from "./components/Chat/ChatPanel";
import { ConversationSidebar } from "./components/Chat/ConversationSidebar";
import { useConversation } from "./hooks/useConversation";

// Lazy-loaded: pulls in Recharts, which would otherwise force the chart
// library onto every page load (including the chat page) regardless of
// whether the user ever visits Analytics.
const DashboardPanel = lazy(() =>
  import("./components/Dashboard/DashboardPanel").then((m) => ({ default: m.DashboardPanel })),
);

function DashboardFallback() {
  return <div className="flex h-full items-center justify-center text-sm text-ink-faint">Loading analytics…</div>;
}

function TopNav() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-1.5 font-mono text-xs uppercase tracking-wide ${
      isActive ? "bg-ledger-tint text-ledger" : "text-ink-soft hover:text-ledger"
    }`;

  return (
    <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-2.5">
      <span className="font-display text-sm font-semibold text-ink">Ledger</span>
      <nav className="flex gap-1">
        <NavLink to="/" end className={linkClass}>
          Chat
        </NavLink>
        <NavLink to="/analytics" className={linkClass}>
          Analytics
        </NavLink>
      </nav>
    </header>
  );
}

function ChatPage() {
  const { conversationId, startNewConversation, switchConversation } = useConversation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="relative grid h-full grid-cols-1 md:grid-cols-[260px_1fr]">
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
      />

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
    </div>
  );
}

function AnalyticsPage() {
  return (
    <div className="h-full overflow-y-auto">
      <Suspense fallback={<DashboardFallback />}>
        <DashboardPanel />
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen flex-col bg-paper">
        <TopNav />
        <div className="min-h-0 flex-1">
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
