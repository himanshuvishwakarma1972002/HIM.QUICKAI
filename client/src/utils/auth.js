/** Get Clerk session token for API calls. Throws if not signed in. */
export async function getClerkAuthToken(getToken) {
  const token = await getToken()
  if (!token) {
    throw new Error('Please sign in to continue.')
  }
  return token
}
