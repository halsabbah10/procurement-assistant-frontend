import { Suspense, lazy, useState } from "react";
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
  onEdit,
  onSelectSuggestion,
  isStreaming,
}: {
  message: ChatMessage;
  entryNumber: number;
  onRegenerate?: () => void;
  onEdit?: (newText: string) => void;
  onSelectSuggestion?: (text: string) => void;
  isStreaming?: boolean;
}) {
  const isUser = message.role === "user";
  const paddedNumber = String(entryNumber).padStart(3, "0");
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.text);

  const commitEdit = () => {
    const trimmed = draft.trim();
    setIsEditing(false);
    if (trimmed && trimmed !== message.text) onEdit?.(trimmed);
    else setDraft(message.text);
  };

  return (
    <div
      className={`border-l-2 py-3 pl-4 ${isUser ? "border-brass" : "border-ledger"}`}
      data-role={message.role}
    >
      <div className="mb-1 flex items-baseline gap-2 font-mono text-[0.7rem] uppercase tracking-wide text-ink-faint">
        <span>No. {paddedNumber}</span>
        <span aria-hidden="true">·</span>
        <span className={isUser ? "text-brass" : "text-ledger"}>{isUser ? "You" : "Assistant"}</span>
      </div>

      {isUser ? (
        isEditing ? (
          <div>
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  commitEdit();
                }
                if (e.key === "Escape") {
                  setDraft(message.text);
                  setIsEditing(false);
                }
              }}
              rows={3}
              className="w-full rounded-md border border-brass bg-surface px-3 py-2 text-[0.9375rem] text-ink"
            />
            <div className="mt-1.5 flex gap-2">
              <button
                type="button"
                onClick={commitEdit}
                className="rounded-md bg-ledger px-3 py-1 text-xs font-medium text-white hover:bg-ledger-dark"
              >
                Save &amp; submit
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraft(message.text);
                  setIsEditing(false);
                }}
                className="rounded-md border border-line px-3 py-1 text-xs text-ink-soft hover:border-ledger hover:text-ledger"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-[0.9375rem] text-ink">{message.text}</p>
            <MessageActions
              text={message.text}
              onEdit={onEdit ? () => setIsEditing(true) : undefined}
              disabled={isStreaming}
            />
          </>
        )
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
        <p className="animate-pulse text-sm text-ink-faint">Checking the purchase order records…</p>
      )}
    </div>
  );
}
