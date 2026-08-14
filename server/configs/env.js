const REQUIRED_ENV = ["GEMINI_API_KEY"];

const SEARCH_ENV = {
  WATCHMODE_API_KEY: "movie search",
  YOUTUBE_API_KEY: "YouTube search",
  TAVILY_API_KEY: "web search",
};

export const validateEnv = () => {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]?.trim());

  if (missing.length) {
    console.error(`❌ Missing required env: ${missing.join(", ")}`);
    process.exit(1);
  }

  for (const [key, feature] of Object.entries(SEARCH_ENV)) {
    if (!process.env[key]?.trim()) {
      console.warn(`⚠️  ${key} not set — ${feature} will be unavailable`);
    }
  }

  console.log("✅ Environment variables validated");
};

export const hasEnv = (key) => Boolean(process.env[key]?.trim());
