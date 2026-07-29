import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

const ACTIVE_ID_KEY = "procurement.conversationId";

// localStorage.getItem/setItem throw in some real environments (storage
// disabled, certain private-browsing modes) — unguarded, this crashed on
// the very first render of the default route (resolveActiveConversationId
// runs synchronously in ChatEntry's effect), white-screening the app
// before the user could do anything. Silent fallback: a fresh in-memory id
// still lets the app work for that session, just without persistence.
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Best-effort persistence — see safeGetItem's docstring.
  }
}

/** Resolves which conversation the bare /chat route should redirect to:
 * whatever was last active, or a fresh id if there's no history yet. Only
 * used by the /chat entry-redirect — once a conversation has its own
 * /chat/:conversationId URL, that URL (not localStorage) is the source of
 * truth for which thread is showing. */
export function resolveActiveConversationId(): string {
  const existing = safeGetItem(ACTIVE_ID_KEY);
  if (existing) return existing;
  const fresh = crypto.randomUUID();
  safeSetItem(ACTIVE_ID_KEY, fresh);
  return fresh;
}

/** Navigation actions for switching the active conversation. Every
 * conversation gets its own URL (/chat/:conversationId) — bookmarkable,
 * shareable, and survives a reload by URL alone, not just localStorage.
 * Still updates the "last active" pointer so a bare /chat visit resumes
 * the right thread. */
export function useConversationNav() {
  const navigate = useNavigate();

  const switchConversation = useCallback(
    (id: string) => {
      safeSetItem(ACTIVE_ID_KEY, id);
      navigate(`/chat/${id}`);
    },
    [navigate],
  );

  const startNewConversation = useCallback(() => {
    const fresh = crypto.randomUUID();
    safeSetItem(ACTIVE_ID_KEY, fresh);
    navigate(`/chat/${fresh}`);
  }, [navigate]);

  return { switchConversation, startNewConversation };
}
