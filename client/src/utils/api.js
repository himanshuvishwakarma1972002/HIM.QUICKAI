import axios from 'axios'

/** Single place for API base URL — trims spaces / trailing slash (common .env mistake) */
export const API_BASE_URL = String(import.meta.env.VITE_BASE_URL || '')
  .trim()
  .replace(/\/$/, '')

if (!API_BASE_URL) {
  console.error('[api] Missing VITE_BASE_URL in .env')
} else {
  console.log('[api] Base URL:', API_BASE_URL)
}

axios.defaults.baseURL = API_BASE_URL
// Render free tier cold start can take ~30–60s
axios.defaults.timeout = 120000

export default axios
