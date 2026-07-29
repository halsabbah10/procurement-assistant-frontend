import type { ChatChunk, ConversationSummary } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
const CLIENT_ID_KEY = "procurement.clientId";
const CLIENT_ID_HEADER = "X-Client-Id";

// Anonymous per-browser identity — this app has no login system. Sent on
// every request so the backend can scope "your conversations" to this
// browser instead of returning every visitor's conversation history (see
// backend's app/core/client_id.py for the full rationale). Guarded the
// same way useConversation.ts's localStorage calls are: some environments
// (storage disabled, certain private-browsing modes) throw on access, and
// losing conversation-list scoping for that one session is a fine
// degrade — crashing the app over it is not.
function getClientId(): string | undefined {
  try {
    const existing = localStorage.getItem(CLIENT_ID_KEY);
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_KEY, fresh);
    return fresh;
  } catch {
    return undefined;
  }
}

function withClientId(headers: Record<string, string> = {}): Record<string, string> {
  const clientId = getClientId();
  return clientId ? { ...headers, [CLIENT_ID_HEADER]: clientId } : headers;
}

export async function streamChat(
  message: string,
  conversationId: string,
  onChunk: (chunk: ChatChunk) => void,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: withClientId({ "Content-Type": "application/json" }),
    body: JSON.stringify({ message, conversation_id: conversationId }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Chat API error (${response.status}): ${errorText}`);
  }

  if (!response.body) throw new Error("No response body from chat endpoint");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const chunk = JSON.parse(line.slice("data: ".length)) as ChatChunk;
        onChunk(chunk);
      } catch {
        // One malformed chunk (a network hiccup mid-frame, a backend
        // serialization edge case) must not discard the rest of an
        // otherwise-good stream — previously this threw uncaught out of
        // the read loop, aborting all remaining chunks including a
        // final_answer that may not have arrived yet.
        // eslint-disable-next-line no-console
        console.warn("Skipping malformed SSE chunk:", line);
      }
    }
  }
}

export async function fetchAnalyticsSummary() {
  const response = await fetch(`${API_BASE_URL}/api/analytics/summary`);
  if (!response.ok) throw new Error("Failed to fetch analytics summary");
  return response.json();
}

export async function fetchDepartmentDrilldown(department: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/analytics/department/${encodeURIComponent(department)}`,
  );
  if (!response.ok) throw new Error("Failed to fetch department detail");
  return response.json();
}

export async function exportQueryResults(query: string, format: "csv" | "json"): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, format }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(body.detail ?? "Export failed");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = format === "csv" ? "export.csv" : "export.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function fetchConversations(): Promise<ConversationSummary[]> {
  const response = await fetch(`${API_BASE_URL}/api/conversations`, { headers: withClientId() });
  if (!response.ok) throw new Error("Failed to fetch conversations");
  return response.json();
}

export async function fetchConversationMessages(
  conversationId: string,
): Promise<Array<{ role: "user" | "assistant"; text: string }>> {
  const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages`, {
    headers: withClientId(),
  });
  if (!response.ok) return [];
  const body = await response.json();
  return body.messages;
}

export async function renameConversation(conversationId: string, title: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`, {
    method: "PATCH",
    headers: withClientId({ "Content-Type": "application/json" }),
    body: JSON.stringify({ title }),
  });
  if (!response.ok) throw new Error("Failed to rename conversation");
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`, {
    method: "DELETE",
    headers: withClientId(),
  });
  if (!response.ok && response.status !== 204) throw new Error("Failed to delete conversation");
}
