import { Suspense, lazy, useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { ChatPanel } from "./components/Chat/ChatPanel";
import { ConversationSidebar } from "./components/Chat/ConversationSidebar";
import { resolveActiveConversationId, useConversationNav } from "./hooks/useConversation";

// Lazy-loaded: pulls in Recharts, which would otherwise force the chart
// library onto every page load (including the chat page) regardless of
// whether the user ever visits Analytics.
const DashboardPanel = lazy(() =>
  import("./components/Dashboard/DashboardPanel").then((m) => ({ default: m.DashboardPanel })),
);

function DashboardFallback() {
  return <div className="flex h-full items-center justify-center text-sm text-ink-faint">Loading analytics…</div>;
}

function LogoMark() {
  return (
    <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true">
      <rect x="4" y="3" width="24" height="26" rx="3" fill="#0f5c4d" />
      <rect x="8" y="3" width="1.5" height="26" fill="#0b4438" />
      <line x1="13" y1="11" x2="24" y2="11" stroke="#faf9f5" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="13" y1="16" x2="24" y2="16" stroke="#faf9f5" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="13" y1="21" x2="20" y2="21" stroke="#faf9f5" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="24" cy="22.5" r="3.4" fill="#9c7a1f" />
      <path
        d="M22.5 22.5l1.1 1.1 2-2.2"
        stroke="#faf9f5"
        strokeWidth="1.1"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TopNav() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-1.5 font-mono text-xs uppercase tracking-wide ${
      isActive ? "bg-ledger-tint text-ledger" : "text-ink-soft hover:text-ledger"
    }`;

  return (
    <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-2.5">
      <div className="flex items-center gap-2">
        <LogoMark />
        <span className="font-display text-sm font-semibold text-ink">CA Procurement Assistant</span>
      </div>
      <nav className="flex gap-1">
        <NavLink to="/chat" className={linkClass}>
          Chat
        </NavLink>
        <NavLink to="/analytics" className={linkClass}>
          Analytics
        </NavLink>
      </nav>
    </header>
  );
}

// Bare /chat has no conversation id of its own — resolve which thread to
// show (last active, or a fresh one) and normalize the URL to
// /chat/:conversationId immediately, so every thread is individually
// addressable rather than /chat silently standing in for "whichever
// conversation happens to be active."
function ChatEntry() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(`/chat/${resolveActiveConversationId()}`, { replace: true });
  }, [navigate]);
  return null;
}

function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { startNewConversation, switchConversation } = useConversationNav();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (!conversationId) return null;

  return (
    <div className="relative grid h-full min-h-0 grid-cols-1 md:grid-cols-[260px_1fr]">
      <aside className="hidden min-h-0 border-r border-line md:block">
        <ConversationSidebar
          activeConversationId={conversationId}
          onSelect={switchConversation}
          onNew={startNewConversation}
        />
      </aside>

      <ChatPanel
        key={conversationId}
        conversationId={conversationId}
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
    <div className="h-full min-h-0 overflow-y-auto">
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
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="/chat" element={<ChatEntry />} />
            <Route path="/chat/:conversationId" element={<ChatPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
