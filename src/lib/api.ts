import type { ChatChunk, ConversationSummary } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export async function streamChat(
  message: string,
  conversationId: string,
  onChunk: (chunk: ChatChunk) => void,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
      const chunk = JSON.parse(line.slice("data: ".length)) as ChatChunk;
      onChunk(chunk);
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
  const response = await fetch(`${API_BASE_URL}/api/conversations`);
  if (!response.ok) throw new Error("Failed to fetch conversations");
  return response.json();
}

export async function fetchConversationMessages(
  conversationId: string,
): Promise<Array<{ role: "user" | "assistant"; text: string }>> {
  const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages`);
  if (!response.ok) return [];
  const body = await response.json();
  return body.messages;
}

export async function renameConversation(conversationId: string, title: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!response.ok) throw new Error("Failed to rename conversation");
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`, {
    method: "DELETE",
  });
  if (!response.ok && response.status !== 204) throw new Error("Failed to delete conversation");
}
