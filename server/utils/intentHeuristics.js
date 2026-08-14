const normalizeText = (text = "") =>
  String(text)
    .toLowerCase()
    .replace(/\bmoview\b/g, "movie")
    .replace(/\bfilms?\b/g, (m) => m)
    .trim();

const wantsVideoGeneration = (t) =>
  /\b(generate|create|make|render|produce|animate|text[\s-]?to[\s-]?video)\b.{0,40}\b(video|clip|reel|animation|mp4)\b/.test(t) ||
  /\b(video|clip|reel|animation)\b.{0,40}\b(generate|create|make|of|about|showing)\b/.test(t);

const wantsImageGeneration = (t) =>
  /\b(generate|create|make|draw|design|paint|imagine|render|text[\s-]?to[\s-]?image)\b.{0,40}\b(image|picture|photo|illustration|artwork|logo|poster|thumbnail)\b/.test(t) ||
  /\b(image|picture|photo|illustration|logo)\b.{0,40}\b(of|about|showing|with)\b/.test(t);

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
  return wantsVideoGeneration(t) || wantsImageGeneration(t) || !/\b(movie|movies|film|bollywood|news|tutorial|search|find|show|give|latest)\b/.test(t);
};

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
  if (!heuristic) return items;

  const hasWrongMedia = items.some((i) =>
    ["video_generation", "image_generation"].includes(i.intent)
  );
  const hasSearch = items.some((i) =>
    ["movie_search", "youtube_search", "web_search"].includes(i.intent)
  );

  if (hasWrongMedia && !hasSearch && ["movie_search", "youtube_search", "web_search"].includes(heuristic.intent)) {
    return [heuristic];
  }

  return items;
};
