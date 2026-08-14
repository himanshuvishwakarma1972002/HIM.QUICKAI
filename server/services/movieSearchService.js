import axios from "axios";
import { hasEnv } from "../configs/env.js";

const WATCHMODE_BASE = "https://api.watchmode.com/v1";

const fetchTitleDetails = async (titleId, apiKey) => {
  try {
    const { data } = await axios.get(`${WATCHMODE_BASE}/title/${titleId}/details/`, {
      params: { apiKey },
      timeout: 15000,
    });
    return data;
  } catch {
    return null;
  }
};

const normalizeMovie = (item, details = null) => {
  const id = item.id ?? item.title_id ?? details?.id;
  const title = item.name || item.title || details?.title || "Unknown";
  const type = item.type || details?.type || "movie";
  const year = item.year || details?.release_date?.slice(0, 4) || null;
  const overview = details?.plot_overview || details?.overview || item.overview || "";
  const rating =
    details?.user_rating ??
    details?.critics_rating ??
    details?.tmdb_rating ??
    item.user_rating ??
    null;
  const poster = details?.poster || item.poster || null;
  const backdrop = details?.backdrop || item.backdrop || null;
  const releaseDate = details?.release_date || item.release_date || null;
  const genres = details?.genre_names || details?.genres?.map((g) => g.name || g) || [];

  let url = null;
  if (details?.tmdb_id && details?.tmdb_type) {
    url = `https://www.themoviedb.org/${details.tmdb_type}/${details.tmdb_id}`;
  } else if (item.imdb_id) {
    url = `https://www.imdb.com/title/${item.imdb_id}`;
  } else if (id) {
    url = `https://www.watchmode.com/title/${id}`;
  }

  return {
    id,
    title,
    type,
    year,
    overview: overview?.slice(0, 400) || "",
    rating,
    poster,
    backdrop,
    releaseDate,
    genres: Array.isArray(genres) ? genres : [],
    url,
  };
};

export const searchMovies = async (query, language = "en") => {
  if (!hasEnv("WATCHMODE_API_KEY")) {
    return {
      success: false,
      message: "Movie search is temporarily unavailable. Please try again.",
      results: [],
    };
  }

  if (!query?.trim()) {
    return { success: false, message: "Search query is required", results: [] };
  }

  try {
    const apiKey = process.env.WATCHMODE_API_KEY;

    const { data } = await axios.get(`${WATCHMODE_BASE}/search/`, {
      params: {
        apiKey,
        search_field: "name",
        search_value: query.trim(),
        types: "movie,tv_series",
      },
      timeout: 15000,
    });

    const titleResults = (data.title_results || []).slice(0, 8);

    if (!titleResults.length) {
      return { success: true, results: [], query: query.trim() };
    }

    const detailed = await Promise.all(
      titleResults.map(async (item) => {
        const details = await fetchTitleDetails(item.id, apiKey);
        return normalizeMovie(item, details);
      })
    );

    return {
      success: true,
      results: detailed,
      query: query.trim(),
      language,
    };
  } catch (error) {
    console.error("WATCHMODE ERROR:", error.response?.data || error.message);
    return {
      success: false,
      message: "Movie search is temporarily unavailable. Please try again.",
      results: [],
    };
  }
};
