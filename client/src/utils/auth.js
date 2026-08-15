/** Get Clerk session token for API calls. Throws if not signed in. */
export async function getClerkAuthToken(getToken) {
  // Fresh token avoids stale/expired JWT after tab sleep (common on mobile / Render)
  const token = await getToken({ skipCache: true })
  if (!token) {
    throw new Error('Please sign in to continue.')
  }
  return token
}
