const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://him-quickai-frontend.onrender.com',
];

/** Frontend origins allowed for CORS + Clerk authorizedParties */
export const getFrontendOrigins = () => {
  const fromEnv = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return [...new Set([...DEFAULT_ORIGINS, ...fromEnv])];
};
