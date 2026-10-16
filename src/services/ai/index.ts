import { analystProvider, answer, detectIntent } from "./analyst";
import { SYSTEM_PROMPT } from "./context";
import { llmChat, type LlmProviderId } from "./llmProxy";
import type { AIProvider, AIRequest, AIResponse } from "./types";

export type { AIProvider, AIRequest, AIResponse, AnalysisContext, CopilotAction } from "./types";
export { buildContext } from "./context";

/**
 * LLM-backed providers narrate the deterministic analyst's findings. Evidence,
 * flags and map actions always come from the analyst; only `text` is generated.
 */
async function withNarration(
  req: AIRequest,
  engine: string,
  narrate: () => Promise<{
    text?: string | undefined;
    error?: string | undefined;
    configured: boolean;
    model?: string | undefined;
  }>,
): Promise<AIResponse> {
  const base = await analystProvider.send(req);
  if (!req.context) return base;
  try {
    const r = await narrate();
    if (!r.configured) {
      return { ...base, engine: `Ginkgo Analyst · ${engine} not configured on server` };
    }
    if (r.error || !r.text)
      return {
        ...base,
        engine: `Ginkgo Analyst · ${engine} unavailable (${r.error ?? "no text"})`,
      };
    return {
      ...base,
      text: r.text,
      engine: `${engine}${r.model ? ` (${r.model})` : ""} · narrating computed results`,
      toolCalls: [...base.toolCalls, { name: "llmNarrate", status: "done" }],
    };
  } catch (err) {
    return { ...base, engine: `Ginkgo Analyst · ${engine} error (${(err as Error).message})` };
  }
}

function serverLlm(id: LlmProviderId, name: string, description: string): AIProvider {
  return {
    id,
    name,
    description,
    kind: "cloud",
    send: (req) =>
      withNarration(req, name, () =>
        llmChat({
          data: {
            provider: id,
            system: SYSTEM_PROMPT,
            context: JSON.stringify(req.context),
            history: req.history,
            prompt: req.prompt,
          },
        }),
      ),
  };
}

const ollamaProvider: AIProvider = {
  id: "ollama",
  name: "Ollama (local)",
  description:
    "Open-weights model on this computer (http://localhost:11434, model llama3.1). Requires OLLAMA_ORIGINS to allow this site.",
  kind: "local",
  send: (req) =>
    withNarration(req, "Ollama", async () => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 45_000);
      try {
        const res = await fetch("http://localhost:11434/api/chat", {
          method: "POST",
          signal: ctrl.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama3.1",
            stream: false,
            options: { temperature: 0.2 },
            messages: [
              {
                role: "system",
                content: `${SYSTEM_PROMPT}\n\nCONTEXT:\n${JSON.stringify(req.context)}`,
              },
              ...req.history.map((h) => ({ role: h.role, content: h.text })),
              { role: "user", content: req.prompt },
            ],
          }),
        });
        if (!res.ok) return { configured: true, error: `HTTP ${res.status}` };
        const json = (await res.json()) as { message?: { content?: string } };
        return { configured: true, text: json.message?.content, model: "llama3.1" };
      } catch {
        return { configured: true, error: "not reachable on localhost:11434" };
      } finally {
        clearTimeout(timer);
      }
    }),
};

export const providers: Record<string, AIProvider> = {
  analyst: analystProvider,
  gemini: serverLlm(
    "gemini",
    "Google Gemini",
    "Cloud LLM via server-side proxy. Needs GEMINI_API_KEY set on the server.",
  ),
  groq: serverLlm(
    "groq",
    "Groq · Llama 3.3 70B",
    "Open-weights model on Groq via server-side proxy. Needs GROQ_API_KEY on the server.",
  ),
  ollama: ollamaProvider,
};

export const DEFAULT_PROVIDER = (() => {
  const v = import.meta.env.VITE_AI_PROVIDER;
  return v && providers[v] ? v : "analyst";
})();

export function getAIProvider(id: string): AIProvider {
  return providers[id] ?? analystProvider;
}

export { detectIntent, answer };

export const suggestedPrompts = [
  "Why is this area's flood risk rated this way?",
  "Is this area suitable for housing development?",
  "Explain the livability score",
  "What is the land use mix here?",
  "How is AI used to get these results?",
  "Compare with my saved areas",
];
