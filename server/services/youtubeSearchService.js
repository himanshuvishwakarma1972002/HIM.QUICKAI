import axios from "axios";
import { hasEnv } from "../configs/env.js";

const YOUTUBE_BASE = "https://www.googleapis.com/youtube/v3";

const normalizeVideo = (item) => {
  const videoId = item.id?.videoId;
  const snippet = item.snippet || {};

  return {
    videoId,
    title: snippet.title || "Untitled",
    description: (snippet.description || "").slice(0, 300),
    channel: snippet.channelTitle || "Unknown channel",
    thumbnail:
      snippet.thumbnails?.high?.url ||
      snippet.thumbnails?.medium?.url ||
      snippet.thumbnails?.default?.url ||
      null,
    publishedAt: snippet.publishedAt || null,
    url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : null,
  };
};

export const searchYouTube = async (query) => {
  if (!hasEnv("YOUTUBE_API_KEY")) {
    return {
      success: false,
      message: "Unable to search YouTube right now. Please try again.",
      results: [],
    };
  }

  if (!query?.trim()) {
    return { success: false, message: "Search query is required", results: [] };
  }

  try {
    const { data } = await axios.get(`${YOUTUBE_BASE}/search`, {
      params: {
        part: "snippet",
        q: query.trim(),
        type: "video",
        maxResults: 8,
        key: process.env.YOUTUBE_API_KEY,
        safeSearch: "moderate",
        relevanceLanguage: "en",
      },
      timeout: 15000,
    });

    const results = (data.items || [])
      .map(normalizeVideo)
      .filter((v) => v.videoId);

    return { success: true, results, query: query.trim() };
  } catch (error) {
    console.error("YOUTUBE ERROR:", error.response?.data || error.message);
    return {
      success: false,
      message: "Unable to search YouTube right now. Please try again.",
      results: [],
    };
  }
};
