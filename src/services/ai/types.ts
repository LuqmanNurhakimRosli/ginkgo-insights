import type { AIToolCall, MapAction, MapFeature } from "@/types";

export interface AIRequest {
  prompt: string;
  siteId: string;
  history: Array<{ role: "user" | "assistant"; text: string }>;
}

export interface AIResponse {
  text: string;
  evidence?: string[];
  constraints?: string[];
  recommendation?: { title: string; actions: string[] };
  toolCalls: AIToolCall[];
  actions?: MapAction[];
  features?: MapFeature[];
}

export interface AIProvider {
  id: "mock" | "gemini";
  name: string;
  /** Streams nothing today; the contract is intentionally provider-agnostic. */
  send(request: AIRequest): Promise<AIResponse>;
}
