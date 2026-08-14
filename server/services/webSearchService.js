import axios from "axios";
import { hasEnv } from "../configs/env.js";

const extractDomain = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const normalizeResult = (item) => ({
  title: item.title || "Untitled",
  url: item.url || "",
  snippet: (item.content || item.snippet || "").slice(0, 300),
  content: (item.content || "").slice(0, 800),
  source: item.source || extractDomain(item.url || ""),
});

export const searchWeb = async (query) => {
  if (!hasEnv("TAVILY_API_KEY")) {
    return {
      success: false,
      message: "Web search is temporarily unavailable.",
      results: [],
    };
  }

  if (!query?.trim()) {
    return { success: false, message: "Search query is required", results: [] };
  }

  try {
    const { data } = await axios.post(
      "https://api.tavily.com/search",
      {
        api_key: process.env.TAVILY_API_KEY,
        query: query.trim(),
        search_depth: "basic",
        include_answer: false,
        max_results: 8,
      },
      { timeout: 20000 }
    );

    const results = (data.results || [])
      .map(normalizeResult)
      .filter((r) => r.url);

    return { success: true, results, query: query.trim() };
  } catch (error) {
    console.error("TAVILY ERROR:", error.response?.data || error.message);
    return {
      success: false,
      message: "Web search is temporarily unavailable.",
      results: [],
    };
  }
};
