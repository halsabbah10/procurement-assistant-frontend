import { useEffect, useRef, useState } from "react";
import { useChat } from "../../hooks/useChat";
import { useConversations } from "../../hooks/useConversations";
import { MessageBubble } from "./MessageBubble";
import { StarterPrompts } from "./StarterPrompts";

// After this long with no visible progress, reassure the user rather than
// let them assume it's stuck and abandon it for a retry — retrying while
// the original request is still running is exactly what compounds into
// much longer waits for everyone (see useChat's stopStreaming comment).
const SLOW_RESPONSE_HINT_MS = 15_000;

export function ChatPanel({
  conversationId,
  onOpenSidebar,
}: {
  conversationId: string;
  onOpenSidebar: () => void;
}) {
  // Same shared query as ConversationSidebar (TanStack Query dedupes by key)
  // — only `refresh` is used here, to make the sidebar list pick up a new
  // conversation's title as soon as the first message lands.
  const { refresh: refreshConversations } = useConversations();
  const { messages, sendMessage, regenerate, editMessage, isStreaming, stopStreaming } = useChat(
    conversationId,
    refreshConversations,
  );
  const [input, setInput] = useState("");
  const [showSlowHint, setShowSlowHint] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isStreaming) {
      setShowSlowHint(false);
      return;
    }
    const timer = setTimeout(() => setShowSlowHint(true), SLOW_RESPONSE_HINT_MS);
    return () => clearTimeout(timer);
  }, [isStreaming]);

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
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <div className="flex items-center border-b border-line px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open conversations"
          className="rounded-md border border-line px-2 py-1.5 text-ink-soft"
        >
          ☰
        </button>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto"
        role="log"
        aria-live="polite"
        aria-busy={isStreaming}
      >
        {messages.length === 0 ? (
          <StarterPrompts onSelect={handleQuickSend} />
        ) : (
          <div className="divide-y divide-line px-4">
            {messages.map((m, i) => {
              // regenerate/editMessage both re-send as a NEW turn appended
              // to the backend's append-only LangGraph checkpoint (there's
              // no API to erase/replace a turn in it — see useChat.ts).
              // That's only correct for the most recent exchange: editing
              // an earlier message would splice the edited text into the
              // middle of the visible transcript while the backend
              // actually appends it after everything that came later,
              // permanently diverging what's shown from what the model's
              // real context contains. Restricting to the last user/
              // assistant message keeps the UI's displayed order and the
              // backend's real turn order the same thing.
              const isLastAssistant = m.role === "assistant" && i === messages.length - 1;
              // sendMessage always pushes the user turn and its (possibly
              // still-empty/streaming) assistant reply together, so the
              // last user message is always the second-to-last entry.
              const isLastUser = m.role === "user" && i === messages.length - 2;
              return (
                <MessageBubble
                  key={m.id}
                  message={m}
                  entryNumber={i + 1}
                  isStreaming={isStreaming}
                  onRegenerate={
                    isLastAssistant && !isStreaming ? () => regenerate(m.id) : undefined
                  }
                  onEdit={
                    isLastUser && !isStreaming ? (newText) => editMessage(m.id, newText) : undefined
                  }
                  onSelectSuggestion={handleQuickSend}
                />
              );
            })}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-line bg-surface p-4">
        {showSlowHint && (
          <p className="mb-2 text-xs text-ink-faint">
            Still working — complex questions can take up to a minute. Retrying won't speed this
            up; use Stop if you'd rather ask something else.
          </p>
        )}
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-ledger"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about spending, departments, suppliers, or items…"
            disabled={isStreaming}
            aria-label="Ask a question"
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={stopStreaming}
              className="rounded-md border border-oxide px-4 py-2 text-sm font-medium text-oxide transition-colors hover:bg-oxide-tint"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="rounded-md bg-ledger px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ledger-dark disabled:opacity-50"
            >
              Ask
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
