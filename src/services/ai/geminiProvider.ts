import type { AIProvider, AIRequest, AIResponse } from "./types";

const GEMINI_API_KEY = import.meta.env["VITE_GEMINI_API_KEY"] ?? "";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export const geminiProvider: AIProvider = {
  id: "gemini",
  name: "Google Gemini 2.0 Flash",

  async send(request: AIRequest): Promise<AIResponse> {
    if (!GEMINI_API_KEY) {
      return {
        text: "Gemini API key not configured. Set VITE_GEMINI_API_KEY in your .env file.",
        toolCalls: [],
      };
    }

    const systemPrompt = `You are Ginkgo, an enterprise spatial intelligence assistant for urban planning and land development.
You help planners analyze satellite imagery, assess land suitability, evaluate flood risk, and make evidence-based planning decisions.

Current context:
- Active site: ${request.siteId}
- You have access to spatial analysis results including land cover, flood risk, livability scores, and suitability assessments.

Guidelines:
- Always provide evidence-based recommendations
- Reference specific data points and scores
- Consider planning guidelines (PLANMalaysia / Akta 172)
- Be concise but thorough
- Format responses in clear paragraphs with key findings highlighted`;

    const contents = [
      ...request.history.map((h) => ({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.text }],
      })),
      {
        role: "user",
        parts: [{ text: request.prompt }],
      },
    ];

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("Gemini API error:", err);
        return {
          text: "Unable to connect to Gemini API. Check your API key and try again.",
          toolCalls: [],
        };
      }

      const data = await response.json();
      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ??
        "No response generated.";

      return {
        text,
        toolCalls: [
          { name: "spatialAnalysis", status: "done" },
          { name: "planningAssessment", status: "done" },
        ],
      };
    } catch (error) {
      console.error("Gemini request failed:", error);
      return {
        text: "Connection error — please check your internet and try again.",
        toolCalls: [],
      };
    }
  },
};
