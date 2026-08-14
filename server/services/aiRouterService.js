import { createChatCompletion, parseJsonFromAi } from "../utils/geminiClient.js";
import { detectHeuristicIntent, correctRoutedIntents } from "../utils/intentHeuristics.js";

const VALID_INTENTS = new Set([
  "chat",
  "web_search",
  "movie_search",
  "youtube_search",
  "image_generation",
  "video_generation",
  "file_analysis",
]);

const ROUTER_SYSTEM = `You are an intent router for a multimodal AI assistant.
Analyze the user's latest message and return ONLY valid JSON (no markdown fences).

Possible intents:
- chat: general knowledge, explanations, coding help, conversations (no live web data needed)
- web_search: latest news, current events, recent articles, live/recent information from the internet
- movie_search: find movies, TV shows, films, series, recommendations, ratings
- youtube_search: find YouTube videos, tutorials, trailers, how-to videos on YouTube
- image_generation: user wants to CREATE/GENERATE a new image (not find existing images)
- video_generation: user wants to CREATE/GENERATE a new AI video (not find/watch existing videos)
- file_analysis: user uploaded files and wants them analyzed

Rules:
- "Find videos/tutorials on YouTube" → youtube_search (NOT video_generation)
- "Create/generate/make a video of..." → video_generation (NOT youtube_search)
- "Generate/create/draw an image of..." → image_generation
- "Latest news", "current", "today", "2025 updates" → web_search
- "Give/show/find latest bollywood movies" → movie_search (NOT video_generation)
- "give me movies", "latest films", "best bollywood movies" → movie_search
- video_generation ONLY when user explicitly wants to CREATE/GENERATE an AI video scene
- NEVER use video_generation for finding/watching/listing movies
- "Explain Java", "what is React" (timeless knowledge) → chat
- Detect the user's language and set "language" to ISO 639-1 code (en, hi, ta, es, etc.)
- Extract a clean search/generation query in "query"
- For combined requests (e.g. "Marvel movies and their trailers"), return multiple intents in "intents" array

Single intent response:
{
  "intent": "movie_search",
  "query": "best action movies from 2025",
  "language": "en",
  "filters": {}
}

Multi-intent response:
{
  "intents": [
    { "intent": "movie_search", "query": "latest Marvel movies", "language": "en", "filters": {} },
    { "intent": "youtube_search", "query": "Marvel movie trailers", "language": "en", "filters": {} }
  ],
  "language": "en"
}`;

const normalizeIntentItem = (item) => {
  if (!item || typeof item !== "object") return null;
  const intent = String(item.intent || "").toLowerCase();
  if (!VALID_INTENTS.has(intent)) return null;
  return {
    intent,
    query: String(item.query || "").trim(),
    language: String(item.language || "en").slice(0, 5),
    filters: item.filters && typeof item.filters === "object" ? item.filters : {},
  };
};

export const routeUserIntent = async ({
  userText,
  hasFiles = false,
  forcedMode = "auto",
}) => {
  const mode = (forcedMode || "auto").toLowerCase();
  const text = String(userText || "").trim();

  if (hasFiles) {
    return [{ intent: "file_analysis", query: text, language: "en", filters: {} }];
  }

  if (mode === "image") {
    return [{ intent: "image_generation", query: text, language: "en", filters: {} }];
  }

  if (mode === "video") {
    return [{ intent: "video_generation", query: text, language: "en", filters: {} }];
  }

  if (mode === "chat") {
    return [{ intent: "chat", query: text, language: "en", filters: {} }];
  }

  if (!text) {
    return [{ intent: "chat", query: text, language: "en", filters: {} }];
  }

  const heuristicFirst = detectHeuristicIntent(text);
  if (heuristicFirst && mode === "auto") {
    return [heuristicFirst];
  }

  if (mode === "search") {
    const searchHeuristic = detectHeuristicIntent(text);
    if (searchHeuristic && ["movie_search", "youtube_search", "web_search"].includes(searchHeuristic.intent)) {
      return [searchHeuristic];
    }
    if (/\b(movie|movies|film|bollywood|hollywood|cinema|series)\b/i.test(text)) {
      return [{ intent: "movie_search", query: text, language: "en", filters: {} }];
    }
  }

  try {
    const response = await createChatCompletion(
      [
        { role: "system", content: ROUTER_SYSTEM },
        {
          role: "user",
          content: `User message: "${text}"\nMode: ${mode}\nHas attached files: ${hasFiles}`,
        },
      ],
      600
    );

    const raw = response?.choices?.[0]?.message?.content || "";
    const parsed = parseJsonFromAi(raw);

    let items = [];
    if (Array.isArray(parsed.intents)) {
      items = parsed.intents.map(normalizeIntentItem).filter(Boolean);
    } else {
      const single = normalizeIntentItem(parsed);
      if (single) items = [single];
    }

    if (mode === "search") {
      const searchIntents = new Set(["web_search", "movie_search", "youtube_search"]);
      items = items.filter((i) => searchIntents.has(i.intent));
      if (!items.length) {
        items = [{ intent: "web_search", query: text, language: parsed.language || "en", filters: {} }];
      }
    }

    if (!items.length) {
      items = [{ intent: "chat", query: text, language: "en", filters: {} }];
    }

    items = correctRoutedIntents(text, items);

    return items;
  } catch (error) {
    console.error("ROUTER ERROR:", error.message);
    return fallbackRoute(text, mode);
  }
};

const fallbackRoute = (text, mode) => {
  const heuristic = detectHeuristicIntent(text);
  if (heuristic) {
    if (mode === "search" && !["movie_search", "youtube_search", "web_search"].includes(heuristic.intent)) {
      return [{ intent: "web_search", query: text, language: "en", filters: {} }];
    }
    return [heuristic];
  }

  const t = text.toLowerCase().replace(/\bmoview\b/g, "movie");

  if (mode === "search") {
    return [{ intent: "web_search", query: text, language: "en", filters: {} }];
  }

  return [{ intent: "chat", query: text, language: "en", filters: {} }];
};
