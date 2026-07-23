
import { useCallback, useState } from "react";
import { streamChat } from "../lib/api";
import type { ChatMessage } from "../lib/types";

export function useChat(conversationId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = useCallback(
    async (text: string) => {
      const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", text, steps: [] };
      const assistantId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        userMessage,
        { id: assistantId, role: "assistant", text: "", steps: [] },
      ]);
      setIsStreaming(true);

      try {
        await streamChat(text, conversationId, (chunk) => {
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== assistantId) return m;
              if (chunk.type === "step") return { ...m, steps: [...m.steps, chunk.text] };
              if (chunk.type === "final_answer" || chunk.type === "error") {
                return { ...m, text: chunk.text };
              }
              return m;
            }),
          );
        });
      } catch (error) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== assistantId) return m;
            return { ...m, text: "Something went wrong — try again." };
          }),
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [conversationId],
  );

  return { messages, sendMessage, isStreaming };
}
