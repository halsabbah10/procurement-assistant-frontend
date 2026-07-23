import type { ChatMessage } from "../../lib/types";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-lg rounded-lg px-4 py-2 ${
          isUser ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-900"
        }`}
      >
        {!isUser && message.steps.length > 0 && (
          <div className="mb-1 space-y-0.5 text-xs text-slate-400">
            {message.steps.map((step, i) => (
              <div key={i}>{step}</div>
            ))}
          </div>
        )}
        <div>{message.text || (isUser ? "" : "…")}</div>
      </div>
    </div>
  );
}
