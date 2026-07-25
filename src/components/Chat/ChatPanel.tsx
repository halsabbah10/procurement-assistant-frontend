import { useEffect, useRef, useState } from "react";
import { useChat } from "../../hooks/useChat";
import { useConversations } from "../../hooks/useConversations";
import { MessageBubble } from "./MessageBubble";
import { StarterPrompts } from "./StarterPrompts";

export function ChatPanel({
  conversationId,
  onNewConversation,
  onOpenSidebar,
  onOpenDashboard,
}: {
  conversationId: string;
  onNewConversation: () => void;
  onOpenSidebar: () => void;
  onOpenDashboard: () => void;
}) {
  // Same shared query as ConversationSidebar (TanStack Query dedupes by key)
  // — only `refresh` is used here, to make the sidebar list pick up a new
  // conversation's title as soon as the first message lands.
  const { refresh: refreshConversations } = useConversations();
  const { messages, sendMessage, regenerate, isStreaming } = useChat(
    conversationId,
    refreshConversations,
  );
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput("");
  };

  const handleQuickSend = (text: string) => {
    if (isStreaming) return;
    sendMessage(text);
  };

  return (
    <div className="flex h-full min-w-0 flex-col">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label="Open conversations"
            className="rounded-md border border-line px-2 py-1.5 text-ink-soft md:hidden"
          >
            ☰
          </button>
          <span className="font-display text-sm font-semibold text-ink">Ledger</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNewConversation}
            className="rounded-md border border-line px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-ink-soft hover:border-ledger hover:text-ledger"
          >
            New conversation
          </button>
          <button
            type="button"
            onClick={onOpenDashboard}
            aria-label="Open dashboard"
            className="rounded-md border border-line px-2 py-1.5 text-ink-soft md:hidden"
          >
            ▤
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <StarterPrompts onSelect={handleQuickSend} />
        ) : (
          <div className="divide-y divide-line px-4">
            {messages.map((m, i) => (
              <MessageBubble
                key={m.id}
                message={m}
                entryNumber={i + 1}
                isStreaming={isStreaming}
                onRegenerate={
                  m.role === "assistant" && !isStreaming ? () => regenerate(m.id) : undefined
                }
                onSelectSuggestion={handleQuickSend}
              />
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-line bg-surface p-4">
        <input
          className="flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-ledger"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about spending, departments, suppliers, or items…"
          disabled={isStreaming}
          aria-label="Ask a question"
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="rounded-md bg-ledger px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ledger-dark disabled:opacity-50"
        >
          {isStreaming ? "Asking…" : "Ask"}
        </button>
      </form>
    </div>
  );
}
