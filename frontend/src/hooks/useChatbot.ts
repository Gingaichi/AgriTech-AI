import { useState } from "react";
import client from "../lib/openai";

export function useChatbot() {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);

  const askQuestion = async (question: string) => {
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: question }]);

    try {
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini", // lightweight + fast
        messages: [
          {
            role: "system",
            content:
              "You are an agriculture assistant for Malawi. Answer in simple terms, and use Chichewa when the farmer prefers.",
          },
          ...messages,
          { role: "user", content: question },
        ],
      });

      const answer = response.choices[0].message?.content || "No response.";
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return { messages, askQuestion, loading };
}
