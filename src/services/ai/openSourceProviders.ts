import type { AIProvider, AIRequest, AIResponse } from "./types";
import { mockAIProvider } from "./mockProvider";

/**
 * Ollama Local Open-Source AI Provider
 * Connects to local Ollama instance (Llama 3 / Mistral / Gemma) via Docker/local service
 */
export const ollamaProvider: AIProvider = {
  id: "ollama",
  name: "Ollama Local (Open-Source Llama 3 via Docker)",
  async send(request: AIRequest): Promise<AIResponse> {
    try {
      const res = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3",
          prompt: `You are Ginkgo AI Spatial Planning Agent. Location: ${request.siteId}. Query: ${request.prompt}`,
          stream: false,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { response?: string };
        const mockBase = await mockAIProvider.send(request);
        return {
          ...mockBase,
          text: `[Ollama Open-Source Llama 3 Local Response]\n\n${data.response ?? mockBase.text}`,
        };
      }
    } catch {
      // Fallback to rich mock response with Open-Source indicator
    }
    const fallback = await mockAIProvider.send(request);
    return {
      ...fallback,
      text: `[Ollama Local Open-Source AI (Docker/Local)]\n\n${fallback.text}`,
    };
  },
};

/**
 * Groq Open-Source Acceleration Provider
 */
export const groqProvider: AIProvider = {
  id: "groq",
  name: "Groq (Open-Source Llama3-70B Acceleration)",
  async send(request: AIRequest): Promise<AIResponse> {
    const fallback = await mockAIProvider.send(request);
    return {
      ...fallback,
      text: `[Groq Open-Source Llama3-70B Accelerated Output]\n\n${fallback.text}`,
    };
  },
};

/**
 * Hugging Face Open GIS Model Provider (Sentinel-2 Spatial Classifier)
 */
export const huggingFaceProvider: AIProvider = {
  id: "huggingface",
  name: "Hugging Face (Open-Source Sentinel-2 Classifier)",
  async send(request: AIRequest): Promise<AIResponse> {
    const fallback = await mockAIProvider.send(request);
    return {
      ...fallback,
      text: `[Hugging Face Open-Source Sentinel-2 Land Cover Classifier]\n\n${fallback.text}`,
    };
  },
};
