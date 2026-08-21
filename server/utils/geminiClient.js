import OpenAI from "openai";

const AI = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
  timeout: 20_000,
  maxRetries: 0,
});

const GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-flash-lite-latest")
  .replace(/"/g, "")
  .trim();

/** Prefer models known to work on current Gemini keys; avoid retired 1.5/2.0/2.5 IDs that 404. */
const CANDIDATE_MODELS = [
  ...new Set([
    GEMINI_MODEL,
    "gemini-flash-lite-latest",
    "gemini-3-flash-preview",
    "gemini-flash-latest",
  ]),
];

/** Models that returned 404/not-found this process — skip forever (saves multi-second cascades). */
const deadModels = new Set();

/** Last model that succeeded — try first on subsequent calls. */
let preferredModel = null;

const getStatus = (error) =>
  error?.status ||
  error?.code ||
  error?.response?.status ||
  error?.error?.code ||
  null;

const isNotFound = (error) => {
  const status = getStatus(error);
  const msg = String(error?.message || error?.error?.message || "");
  return status === 404 || /not found|is not found|NOT_FOUND/i.test(msg);
};

const isQuotaOrAuth = (error) => {
  const status = getStatus(error);
  const msg = String(error?.message || error?.error?.message || "");
  return (
    status === 429 ||
    status === 401 ||
    status === 403 ||
    /RESOURCE_EXHAUSTED|exceeded your current quota|rate.?limit|PERMISSION_DENIED|API key/i.test(
      msg
    )
  );
};

const orderedModels = () => {
  const list = [];
  if (preferredModel && !deadModels.has(preferredModel)) {
    list.push(preferredModel);
  }
  for (const model of CANDIDATE_MODELS) {
    if (!deadModels.has(model) && !list.includes(model)) {
      list.push(model);
    }
  }
  return list;
};

export const createChatCompletion = async (messages, maxTokens = 1500) => {
  const models = orderedModels();
  if (!models.length) {
    throw new Error(
      "No Gemini chat models available for this API key. Set GEMINI_MODEL to gemini-flash-lite-latest or gemini-3-flash-preview."
    );
  }

  let lastError;
  for (const model of models) {
    try {
      const response = await AI.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: maxTokens,
      });
      preferredModel = model;
      return response;
    } catch (error) {
      console.warn(`GEMINI MODEL FAILED (${model}):`, error?.message || error);
      lastError = error;

      if (isNotFound(error)) {
        deadModels.add(model);
        continue;
      }

      // Quota / auth failures apply to the whole key — do not burn time on siblings.
      if (isQuotaOrAuth(error)) {
        throw error;
      }

      // 503 / transient: try next model quickly; do not retry the same one.
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
