import { createChatCompletion } from "../utils/geminiClient.js";

const buildResultsContext = ({ movies = [], youtube = [], web = [] }) => {
  const parts = [];

  if (movies.length) {
    parts.push(
      "MOVIE/TV RESULTS:\n" +
        movies
          .map(
            (m, i) =>
              `${i + 1}. ${m.title} (${m.year || "N/A"}) — ${m.type} — Rating: ${m.rating ?? "N/A"} — ${m.overview?.slice(0, 200) || ""}`
          )
          .join("\n")
    );
  }

  if (youtube.length) {
    parts.push(
      "YOUTUBE RESULTS:\n" +
        youtube
          .map(
            (v, i) =>
              `${i + 1}. ${v.title} — ${v.channel} — ${v.description?.slice(0, 150) || ""}`
          )
          .join("\n")
    );
  }

  if (web.length) {
    parts.push(
      "WEB RESULTS:\n" +
        web
          .map(
            (w, i) =>
              `${i + 1}. ${w.title} (${w.source}) — ${w.snippet?.slice(0, 200) || ""}`
          )
          .join("\n")
    );
  }

  return parts.join("\n\n");
};

export const summarizeSearchResults = async ({
  userQuery,
  language = "en",
  movies = [],
  youtube = [],
  web = [],
}) => {
  const context = buildResultsContext({ movies, youtube, web });
  const totalResults = movies.length + youtube.length + web.length;

  if (!totalResults) {
    return `I couldn't find any results for "${userQuery}". Try rephrasing your search or check back later.`;
  }

  const langInstruction =
    language && language !== "en"
      ? `Respond in the same language as the user's query (language code: ${language}).`
      : "Respond in the same language as the user's query.";

  try {
    const response = await createChatCompletion(
      [
        {
          role: "system",
          content: `You are a helpful AI assistant summarizing search results.
${langInstruction}
Be concise, helpful, and mention key findings. Use markdown when helpful.
Do NOT invent URLs, movie titles, or video links — only reference items from the provided results.`,
        },
        {
          role: "user",
          content: `User query: "${userQuery}"

Search results:
${context}

Write a helpful summary introducing these results.`,
        },
      ],
      1200
    );

    return response?.choices?.[0]?.message?.content || "Here are the search results I found.";
  } catch (error) {
    console.error("SEARCH SUMMARY ERROR:", error.message);
    return "Here are the search results I found for your query.";
  }
};
