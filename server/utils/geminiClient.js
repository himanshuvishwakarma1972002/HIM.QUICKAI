import OpenAI from "openai";

const AI = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
});

const GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-2.0-flash")
  .replace(/"/g, "")
  .trim();

const FALLBACK_MODELS = [
  ...new Set([
    GEMINI_MODEL,
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-001",
    "gemini-flash-latest",
    "gemini-1.5-flash",
    "gemini-1.5-flash-002",
  ]),
];

export const createChatCompletion = async (messages, maxTokens = 1500) => {
  let lastError;
  for (const model of FALLBACK_MODELS) {
    try {
      return await AI.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: maxTokens,
      });
    } catch (error) {
      console.warn(`GEMINI MODEL FAILED (${model}):`, error?.message || error);
      lastError = error;
    }
  }
  throw lastError;
};

export const parseJsonFromAi = (raw = "") => {
  const trimmed = String(raw).trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error("Could not parse AI JSON response");
  }
};
