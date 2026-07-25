import { Suspense, lazy } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "../../lib/types";
import { MessageActions } from "./MessageActions";
import { QueryPanel } from "./QueryPanel";
import { SuggestionChips } from "./SuggestionChips";

const InsightChart = lazy(() =>
  import("./InsightChart").then((m) => ({ default: m.InsightChart })),
);

export function MessageBubble({
  message,
  entryNumber,
  onRegenerate,
  onSelectSuggestion,
  isStreaming,
}: {
  message: ChatMessage;
  entryNumber: number;
  onRegenerate?: () => void;
  onSelectSuggestion?: (text: string) => void;
  isStreaming?: boolean;
}) {
  const isUser = message.role === "user";
  const paddedNumber = String(entryNumber).padStart(3, "0");

  return (
    <div
      className={`border-l-2 py-3 pl-4 ${isUser ? "border-brass" : "border-ledger"}`}
      data-role={message.role}
    >
      <div className="mb-1 flex items-baseline gap-2 font-mono text-[0.7rem] uppercase tracking-wide text-ink-faint">
        <span>No. {paddedNumber}</span>
        <span aria-hidden="true">·</span>
        <span className={isUser ? "text-brass" : "text-ledger"}>{isUser ? "You" : "Ledger"}</span>
      </div>

      {isUser ? (
        <p className="text-[0.9375rem] text-ink">{message.text}</p>
      ) : message.text ? (
        <>
          <div className="prose-ledger">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
              {message.text}
            </ReactMarkdown>
          </div>
          {message.chart && (
            <Suspense fallback={<div className="mt-3 h-56 animate-pulse rounded-lg bg-paper-dim" />}>
              <InsightChart chart={message.chart} />
            </Suspense>
          )}
          {message.query && <QueryPanel query={message.query} />}
          <MessageActions text={message.text} onRegenerate={onRegenerate} disabled={isStreaming} />
          {message.suggestions && message.suggestions.length > 0 && onSelectSuggestion && (
            <SuggestionChips
              suggestions={message.suggestions}
              onSelect={onSelectSuggestion}
              disabled={isStreaming}
            />
          )}
        </>
      ) : (
        <p className="animate-pulse text-sm text-ink-faint">Consulting the ledger…</p>
      )}
    </div>
  );
}
