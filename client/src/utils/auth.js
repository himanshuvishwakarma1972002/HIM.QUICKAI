/** Get Clerk session token for API calls. Throws if not signed in. */
export async function getClerkAuthToken(getToken, { skipCache = false } = {}) {
  // Prefer cached token for fast reads (dashboard). Use skipCache on writes / long sessions if needed.
  const token = await getToken(skipCache ? { skipCache: true } : undefined)
  if (!token) {
    throw new Error('Please sign in to continue.')
  }
  return token
}
