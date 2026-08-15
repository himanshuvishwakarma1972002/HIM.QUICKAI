const REQUIRED_ENV = [
  'GEMINI_API_KEY',
  'CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
];

const SEARCH_ENV = {
  WATCHMODE_API_KEY: 'movie search',
  YOUTUBE_API_KEY: 'YouTube search',
  TAVILY_API_KEY: 'web search',
};

export const validateEnv = () => {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]?.trim());

  if (missing.length) {
    console.error(`❌ Missing required env: ${missing.join(', ')}`);
    console.error(
      'On Render → Backend → Environment, set CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY (same Clerk app as the frontend).'
    );
    process.exit(1);
  }

  for (const [key, feature] of Object.entries(SEARCH_ENV)) {
    if (!process.env[key]?.trim()) {
      console.warn(`⚠️  ${key} not set — ${feature} will be unavailable`);
    }
  }

  console.log('✅ Environment variables validated');
};

export const hasEnv = (key) => Boolean(process.env[key]?.trim());
