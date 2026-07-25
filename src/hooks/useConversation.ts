import { useCallback, useState } from "react";

const ACTIVE_ID_KEY = "procurement.conversationId";

function readOrCreateConversationId(): string {
  const existing = localStorage.getItem(ACTIVE_ID_KEY);
  if (existing) return existing;
  const fresh = crypto.randomUUID();
  localStorage.setItem(ACTIVE_ID_KEY, fresh);
  return fresh;
}

/** Persists which conversation is active across reloads — a page refresh
 * resumes the same thread_id, so the backend's LangGraph checkpoint memory
 * and the frontend's displayed history stay in sync. Without this, a
 * refresh would keep showing old messages (if those were persisted
 * separately) while the backend agent had no memory of them at all. */
export function useConversation() {
  const [conversationId, setConversationId] = useState(readOrCreateConversationId);

  const startNewConversation = useCallback(() => {
    const fresh = crypto.randomUUID();
    localStorage.setItem(ACTIVE_ID_KEY, fresh);
    setConversationId(fresh);
  }, []);

  const switchConversation = useCallback((id: string) => {
    localStorage.setItem(ACTIVE_ID_KEY, id);
    setConversationId(id);
  }, []);

  return { conversationId, startNewConversation, switchConversation };
}
