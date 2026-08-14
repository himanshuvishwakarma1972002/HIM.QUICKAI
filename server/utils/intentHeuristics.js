const normalizeText = (text = "") =>
  String(text)
    .toLowerCase()
    .replace(/\bmoview\b/g, "movie")
    .replace(/\bfilms?\b/g, (m) => m)
    .trim();

export const wantsVideoGeneration = (t) =>
  /\b(text[\s-]?to[\s-]?video)\b/.test(t) ||
  /\b(generate|create|make|render|produce|animate)\b.{0,50}\b(an?\s+)?(ai\s+)?(video|clip|reel|animation|mp4)\b/.test(t) ||
  /\b(video|clip|reel|animation)\b.{0,20}\b(generate|create|make|render|produce|animate)\b/.test(t);

export const wantsImageGeneration = (t) =>
  /\b(text[\s-]?to[\s-]?image)\b/.test(t) ||
  /\b(generate|create|make|draw|design|paint|imagine|render)\b.{0,50}\b(an?\s+)?(image|picture|photo|illustration|artwork|logo|poster|thumbnail)\b/.test(t) ||
  /\b(image|picture|photo|illustration|logo)\b.{0,20}\b(generate|create|make|draw|design)\b/.test(t);

export const isMovieSearchQuery = (text = "") => {
  const t = normalizeText(text);
  if (wantsVideoGeneration(t) || wantsImageGeneration(t)) return false;

  return (
    /\b(movie|movies|film|films|cinema|bollywood|hollywood|tollywood|kollywood|web series|tv series|tv show|series|netflix|disney|marvel|dc)\b/.test(t) &&
    /\b(latest|best|top|new|recent|give|show|find|search|recommend|list|similar|like|action|comedy|drama|horror|thriller|202[0-9])\b/.test(t)
  ) || /\b(give|show|find|search|latest|best|top|new|recent)\b.{0,40}\b(movie|movies|film|films|bollywood|hollywood|series)\b/.test(t);
};

export const isYouTubeSearchQuery = (text = "") => {
  const t = normalizeText(text);
  if (wantsVideoGeneration(t)) return false;

  return (
    /\b(youtube|yt)\b/.test(t) ||
    (/\b(tutorial|tutorials|trailer|trailers|how to|walkthrough)\b/.test(t) &&
      /\b(find|search|show|best|top|watch|on youtube)\b/.test(t))
  );
};

export const isWebSearchQuery = (text = "") => {
  const t = normalizeText(text);
  if (isMovieSearchQuery(text) || isYouTubeSearchQuery(text)) return false;
  if (wantsVideoGeneration(t) || wantsImageGeneration(t)) return false;

  return /\b(latest|news|current|today|recent|update|happening|202[0-9])\b/.test(t);
};

export const isVisualGenerationPrompt = (text = "") => {
  const t = normalizeText(text);
  if (isMovieSearchQuery(text) || isYouTubeSearchQuery(text) || isWebSearchQuery(text)) {
    return false;
  }
  return wantsVideoGeneration(t) || wantsImageGeneration(t);
};

export const isExplicitVideoRequest = (text = "", mode = "auto") =>
  (mode || "").toLowerCase() === "video" || wantsVideoGeneration(normalizeText(text));

export const isExplicitImageRequest = (text = "", mode = "auto") =>
  (mode || "").toLowerCase() === "image" || wantsImageGeneration(normalizeText(text));

export const detectHeuristicIntent = (text = "") => {
  const t = normalizeText(text);
  if (!t) return null;

  if (isMovieSearchQuery(text)) {
    return { intent: "movie_search", query: text.trim(), language: "en", filters: {} };
  }
  if (isYouTubeSearchQuery(text)) {
    return { intent: "youtube_search", query: text.trim(), language: "en", filters: {} };
  }
  if (isWebSearchQuery(text)) {
    return { intent: "web_search", query: text.trim(), language: "en", filters: {} };
  }
  if (wantsVideoGeneration(t)) {
    return { intent: "video_generation", query: text.trim(), language: "en", filters: {} };
  }
  if (wantsImageGeneration(t)) {
    return { intent: "image_generation", query: text.trim(), language: "en", filters: {} };
  }

  return null;
};

export const correctRoutedIntents = (text = "", items = []) => {
  const heuristic = detectHeuristicIntent(text);
  const t = normalizeText(text);

  let next = Array.isArray(items) ? [...items] : [];

  if (heuristic) {
    const hasWrongMedia = next.some((i) =>
      ["video_generation", "image_generation"].includes(i.intent)
    );
    const hasSearch = next.some((i) =>
      ["movie_search", "youtube_search", "web_search"].includes(i.intent)
    );

    if (hasWrongMedia && !hasSearch && ["movie_search", "youtube_search", "web_search"].includes(heuristic.intent)) {
      return [heuristic];
    }
  }

  next = next.map((item) => {
    if (item.intent === "video_generation" && !wantsVideoGeneration(t)) {
      return { ...item, intent: "chat" };
    }
    if (item.intent === "image_generation" && !wantsImageGeneration(t)) {
      return { ...item, intent: "chat" };
    }
    return item;
  });

  return next.length ? next : [{ intent: "chat", query: text.trim(), language: "en", filters: {} }];
};
