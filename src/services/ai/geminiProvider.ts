import type { AIProvider, AIRequest, AIResponse } from "./types";
import { mockAIProvider } from "./mockProvider";

/**
 * GeminiProvider — intended production flow:
 *   Frontend → FastAPI backend (/api/ai/chat) → Gemini API
 * The API key never lives in frontend source. If the backend is not reachable
 * yet, we degrade honestly to the mock provider rather than failing the UI.
 */
export const geminiProvider: AIProvider = {
  id: "gemini",
  name: "Gemini (via backend)",

  async send(request: AIRequest): Promise<AIResponse> {
    const endpoint = import.meta.env["VITE_AI_BACKEND_URL"] ?? "/api/ai/chat";
    try {
      const res = await fetch(String(endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      if (!res.ok) throw new Error(`Backend responded ${res.status}`);
      return (await res.json()) as AIResponse;
    } catch {
      const fallback = await mockAIProvider.send(request);
      return {
        ...fallback,
        text: `Model unavailable — showing prototype result.\n\n${fallback.text}`,
      };
    }
  },
};
