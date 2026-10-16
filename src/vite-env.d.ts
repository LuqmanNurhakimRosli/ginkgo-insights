/// <reference types="vite/client" />

// Only these public, non-secret variables may be read on the client.
// Secrets (GEMINI_API_KEY, GROQ_API_KEY) are server-only — see src/services/ai/llmProxy.ts.
interface ImportMetaEnv {
  readonly VITE_AI_PROVIDER?: string;
  readonly VITE_BACKEND_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
