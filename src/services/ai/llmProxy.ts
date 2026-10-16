import { createServerFn } from "@tanstack/react-start";

/**
 * Server-side LLM proxy. API keys live only in server environment variables
 * (GEMINI_API_KEY, GROQ_API_KEY) and never reach the browser bundle.
 * Returns { configured: false } when the provider has no key so the client can
 * fall back to the on-device analyst.
 */

export type LlmProviderId = "gemini" | "groq";

interface LlmInput {
  provider: LlmProviderId;
  system: string;
  context: string;
  history: Array<{ role: "user" | "assistant"; text: string }>;
  prompt: string;
}

export interface LlmResult {
  configured: boolean;
  text?: string;
  model?: string;
  error?: string;
}

const MAX_PROMPT = 4000;
const MAX_CONTEXT = 16_000;

function validate(input: unknown): LlmInput {
  const d = input as Partial<LlmInput> | null;
  if (!d || (d.provider !== "gemini" && d.provider !== "groq")) throw new Error("Invalid provider");
  if (typeof d.prompt !== "string" || !d.prompt.trim()) throw new Error("Empty prompt");
  if (typeof d.system !== "string" || typeof d.context !== "string")
    throw new Error("Invalid context");
  const history = Array.isArray(d.history) ? d.history : [];
  return {
    provider: d.provider,
    system: d.system.slice(0, 4000),
    context: d.context.slice(0, MAX_CONTEXT),
    prompt: d.prompt.slice(0, MAX_PROMPT),
    history: history
      .filter(
        (h) => h && (h.role === "user" || h.role === "assistant") && typeof h.text === "string",
      )
      .slice(-10)
      .map((h) => ({ role: h.role, text: h.text.slice(0, 2000) })),
  };
}

function env(name: string): string | undefined {
  try {
    const v = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
      ?.env?.[name];
    return v && v.trim() ? v.trim() : undefined;
  } catch {
    return undefined;
  }
}

async function callGemini(d: LlmInput, key: string): Promise<LlmResult> {
  const model = env("GEMINI_MODEL") ?? "gemini-2.5-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: `${d.system}\n\nCONTEXT:\n${d.context}` }] },
        contents: [
          ...d.history.map((h) => ({
            role: h.role === "assistant" ? "model" : "user",
            parts: [{ text: h.text }],
          })),
          { role: "user", parts: [{ text: d.prompt }] },
        ],
        generationConfig: { temperature: 0.2, maxOutputTokens: 900 },
      }),
    },
  );
  if (!res.ok) return { configured: true, model, error: `Gemini HTTP ${res.status}` };
  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  return text
    ? { configured: true, model, text }
    : { configured: true, model, error: "Empty response" };
}

async function callGroq(d: LlmInput, key: string): Promise<LlmResult> {
  const model = env("GROQ_MODEL") ?? "llama-3.3-70b-versatile";
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 900,
      messages: [
        { role: "system", content: `${d.system}\n\nCONTEXT:\n${d.context}` },
        ...d.history.map((h) => ({ role: h.role, content: h.text })),
        { role: "user", content: d.prompt },
      ],
    }),
  });
  if (!res.ok) return { configured: true, model, error: `Groq HTTP ${res.status}` };
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = json.choices?.[0]?.message?.content ?? "";
  return text
    ? { configured: true, model, text }
    : { configured: true, model, error: "Empty response" };
}

export const llmChat = createServerFn({ method: "POST" })
  .validator(validate)
  .handler(async ({ data }): Promise<LlmResult> => {
    try {
      if (data.provider === "gemini") {
        const key = env("GEMINI_API_KEY");
        return key ? await callGemini(data, key) : { configured: false };
      }
      const key = env("GROQ_API_KEY");
      return key ? await callGroq(data, key) : { configured: false };
    } catch (err) {
      return { configured: true, error: (err as Error).message || "LLM request failed" };
    }
  });

/** Lets the Settings page show which server-side providers are configured (booleans only). */
export const llmStatus = createServerFn({ method: "GET" }).handler(async () => ({
  gemini: !!env("GEMINI_API_KEY"),
  groq: !!env("GROQ_API_KEY"),
}));
