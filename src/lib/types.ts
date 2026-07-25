export interface ChartPayload {
  type: "bar" | "line" | "pie";
  title: string;
  category_field: string;
  value_field: string;
  data: Array<{ category: string; value: number }>;
}

export type ChatChunk =
  | { type: "step"; text: string }
  | {
      type: "final_answer";
      text: string;
      query?: string;
      suggestions?: string[];
      chart?: ChartPayload;
    }
  | { type: "error"; text: string };

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  steps: string[];
  query?: string;
  suggestions?: string[];
  chart?: ChartPayload;
}

export interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}
