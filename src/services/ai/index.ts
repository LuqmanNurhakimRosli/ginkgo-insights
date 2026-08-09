import { geminiProvider } from "./geminiProvider";
import { mockAIProvider } from "./mockProvider";
import { ollamaProvider, groqProvider, huggingFaceProvider } from "./openSourceProviders";
import type { AIProvider } from "./types";

export type { AIProvider, AIRequest, AIResponse } from "./types";

export const providers: Record<string, AIProvider> = {
  mock: mockAIProvider,
  ollama: ollamaProvider,
  groq: groqProvider,
  huggingface: huggingFaceProvider,
  gemini: geminiProvider,
};

export function getAIProvider(override?: string): AIProvider {
  const key = override ?? import.meta.env["VITE_AI_PROVIDER"] ?? "mock";
  return providers[String(key)] ?? mockAIProvider;
}

export const suggestedPrompts = [
  "Show areas with the highest built-up growth",
  "Where is vegetation loss highest?",
  "Which areas have poor accessibility?",
  "Why is Site A's livability score 84?",
  "Compare Site A and Site B",
  "Where should sustainable development be prioritized?",
  "Generate a planning report",
];
