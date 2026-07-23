import { useState } from "react";
import { useChat } from "../../hooks/useChat";
import { MessageBubble } from "./MessageBubble";

export function ChatPanel({ conversationId }: { conversationId: string }) {
  const { messages, sendMessage, isStreaming } = useChat(conversationId);
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400">
            Ask about California state purchase orders — e.g. "What quarter had the highest
            spending in FY2013-2014?"
          </p>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 border-t p-4">
        <input
          className="flex-1 rounded-md border px-3 py-2 text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          disabled={isStreaming}
        />
        <button
          type="submit"
          disabled={isStreaming}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
