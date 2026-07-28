import { useCallback, useEffect, useRef, useState } from "react";
import { fetchConversationMessages, streamChat } from "../lib/api";
import type { ChatMessage } from "../lib/types";

const messagesKey = (conversationId: string) => `procurement.messages.${conversationId}`;

function loadMessages(conversationId: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(messagesKey(conversationId));
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

export function useChat(conversationId: string, onMessageSent?: () => void) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages(conversationId));
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Persists on every change so a reload resumes exactly where the user
  // left off — paired with useConversation, which keeps the same
  // thread_id across reloads so the backend's own conversation memory
  // (LangGraph checkpointer) stays in sync with what's shown here.
  useEffect(() => {
    localStorage.setItem(messagesKey(conversationId), JSON.stringify(messages));
  }, [conversationId, messages]);

  // Falls back to the server-reconstructed history (text only — see
  // reconstruct_conversation_messages on the backend) when this browser
  // has no local cache for the conversation, e.g. one picked from the
  // sidebar that was started on a different device/browser. This hook
  // fully remounts on conversation switch (App.tsx keys ChatPanel by
  // conversationId), so "on mount" here means "on conversation selected."
  useEffect(() => {
    if (messages.length > 0) return;
    let cancelled = false;
    fetchConversationMessages(conversationId)
      .then((serverMessages) => {
        if (cancelled || serverMessages.length === 0) return;
        setMessages(
          serverMessages.map((m) => ({
            id: crypto.randomUUID(),
            role: m.role,
            text: m.text,
            steps: [],
          })),
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // A request the user has "moved on" from (switched conversations,
  // navigated away) must not keep running unattended on the backend — it
  // was still burning a full Sonnet/Opus/Haiku call chain server-side with
  // nothing listening. Aborting on unmount (this hook fully remounts on
  // conversation switch, per the comment above) actually cancels the
  // underlying fetch, which Starlette/uvicorn detect as a client
  // disconnect and stop processing. Reproduced live: firing several of
  // these questions back to back without cancelling the prior one drove
  // response times from ~45s to 115-125s each under just 4 concurrent
  // requests, before this fix.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const streamInto = useCallback(
    async (userText: string, assistantId: string) => {
      const controller = new AbortController();
      abortRef.current = controller;
      setIsStreaming(true);
      try {
        await streamChat(
          userText,
          conversationId,
          (chunk) => {
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== assistantId) return m;
                if (chunk.type === "step") return { ...m, steps: [...m.steps, chunk.text] };
                if (chunk.type === "final_answer") {
                  return { ...m, text: chunk.text, query: chunk.query };
                }
                if (chunk.type === "enrichment") {
                  return { ...m, suggestions: chunk.suggestions, chart: chunk.chart };
                }
                if (chunk.type === "error") return { ...m, text: chunk.text };
                return m;
              }),
            );
          },
          controller.signal,
        );
      } catch (err) {
        // A deliberate stop (Stop button, or switching away mid-stream)
        // throws AbortError — that's not a failure, so don't overwrite
        // whatever text had already streamed in with an error message.
        if (err instanceof DOMException && err.name === "AbortError") {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId && !m.text ? { ...m, text: "Stopped." } : m)),
          );
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, text: "Something went wrong — try again." } : m,
            ),
          );
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setIsStreaming(false);
        // The backend touches the conversation's title/updated_at before
        // streaming starts (app/routers/chat.py), so the sidebar has
        // something to show as soon as this resolves — refresh regardless
        // of whether the stream itself succeeded.
        onMessageSent?.();
      }
    },
    [conversationId, onMessageSent],
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", text, steps: [] };
      const assistantId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        userMessage,
        { id: assistantId, role: "assistant", text: "", steps: [] },
      ]);
      await streamInto(text, assistantId);
    },
    [streamInto],
  );

  // Re-asks the question that produced this assistant message, replacing
  // its content in place. This re-sends the same text as a new turn on the
  // same thread rather than erasing the prior turn from the backend's
  // checkpointed history (there's no API for that) — a known, deliberate
  // simplification versus a "true" ChatGPT regenerate.
  const regenerate = useCallback(
    async (assistantMessageId: string) => {
      const index = messages.findIndex((m) => m.id === assistantMessageId);
      if (index <= 0) return;
      const priorUser = messages[index - 1];
      if (priorUser.role !== "user") return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId ? { id: m.id, role: "assistant", text: "", steps: [] } : m,
        ),
      );
      await streamInto(priorUser.text, assistantMessageId);
    },
    [messages, streamInto],
  );

  // Edits a user message in place and re-answers it, replacing the
  // assistant response that followed it. Like `regenerate`, this re-sends
  // the (now-edited) text as a new turn on the same thread rather than
  // erasing the original from the backend's checkpointed history — a
  // deliberate simplification versus ChatGPT's branching edit behavior.
  const editMessage = useCallback(
    async (userMessageId: string, newText: string) => {
      const index = messages.findIndex((m) => m.id === userMessageId);
      if (index === -1) return;
      const next = messages[index + 1];
      const assistantId = next && next.role === "assistant" ? next.id : crypto.randomUUID();

      setMessages((prev) => {
        const withEditedText = prev.map((m) =>
          m.id === userMessageId ? { ...m, text: newText } : m,
        );
        const hasFollowingAssistant = next && next.role === "assistant";
        const reset = withEditedText.map((m) =>
          hasFollowingAssistant && m.id === assistantId
            ? { id: m.id, role: "assistant" as const, text: "", steps: [] }
            : m,
        );
        return hasFollowingAssistant
          ? reset
          : [...reset, { id: assistantId, role: "assistant" as const, text: "", steps: [] }];
      });

      await streamInto(newText, assistantId);
    },
    [messages, streamInto],
  );

  return { messages, sendMessage, regenerate, editMessage, isStreaming, stopStreaming };
}
