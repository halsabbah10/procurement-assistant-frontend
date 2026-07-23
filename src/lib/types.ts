export type ChatChunk =
  | { type: "step"; text: string }
  | { type: "final_answer"; text: string }
  | { type: "error"; text: string };

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  steps: string[];
}
