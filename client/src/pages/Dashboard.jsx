import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Gem,
  Sparkles,
  Search,
  Filter,
  Loader2,
  ArrowRight,
  Calendar,
  Layers,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import CreationItem from '../components/CreationItem'
import { useUser, useAuth } from '@clerk/react'
import axios from '../utils/api'
import toast from 'react-hot-toast'
import { getClerkAuthToken } from '../utils/auth'
import { AiToolsData } from '../assets/assets'

const TYPE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'article', label: 'Articles' },
  { id: 'blog-title', label: 'Blog Titles' },
  { id: 'image', label: 'Images' },
]

const CACHE_TTL_MS = 60_000

const cacheKeyFor = (userId) => `quickai:dashboard:${userId}`

const readCache = (userId) => {
  try {
    const raw = sessionStorage.getItem(cacheKeyFor(userId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > CACHE_TTL_MS) return null
    return Array.isArray(parsed.creations) ? parsed.creations : null
  } catch {
    return null
  }
}

const writeCache = (userId, creations) => {
  try {
    sessionStorage.setItem(
      cacheKeyFor(userId),
      JSON.stringify({ savedAt: Date.now(), creations })
    )
  } catch {
    /* ignore quota */
  }
}

const StatCard = ({ title, value, subtitle, icon: Icon, gradient }) => (
  <div className="flex justify-between items-center min-w-0 w-full flex-1 p-4 sm:p-5 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
    <div className="text-slate-600">
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className="text-2xl font-bold text-slate-800 mt-1">{value}</h2>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
    <div
      className="w-12 h-12 rounded-xl text-white flex justify-center items-center shadow-lg"
      style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
    >
      <Icon className="w-5 h-5" />
    </div>
  </div>
)

const ListSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    {[1, 2, 3].map((i) => (
      <div key={i} className="h-20 bg-gray-200 rounded-xl" />
    ))}
  </div>
)

const Dashboard = () => {
  const [creations, setCreations] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const isFetchingRef = useRef(false)
  const lastFetchedUserIdRef = useRef(null)

  const getDashboardData = useCallback(async ({ isRefresh = false } = {}) => {
    if (isFetchingRef.current) return
    if (!user?.id) return

    isFetchingRef.current = true
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const token = await getClerkAuthToken(getToken)
      const { data } = await axios.get('/api/user/get-user-creations', {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 40 },
        timeout: 30000,
      })
      if (data.success) {
        const next = data.creations || []
        setCreations(next)
        writeCache(user.id, next)
        lastFetchedUserIdRef.current = user.id
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      const status = error?.response?.status
      const message = error?.response?.data?.message || error.message
      if (status === 429) {
        toast.error('Too many requests. Please wait a moment and refresh.')
      } else {
        toast.error(message)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
      isFetchingRef.current = false
    }
  }, [getToken, user?.id])

  useEffect(() => {
    if (!isLoaded || !user?.id) return

    const cached = readCache(user.id)
    if (cached) {
      setCreations(cached)
      setLoading(false)
      lastFetchedUserIdRef.current = user.id
      // Soft refresh in background if cache is present
      getDashboardData({ isRefresh: true })
      return
    }

    if (lastFetchedUserIdRef.current === user.id) return
    getDashboardData()
  }, [isLoaded, user?.id])

  const userPlan = user?.publicMetadata?.plan?.toLowerCase() || 'free'

  const stats = useMemo(() => {
    const byType = creations.reduce((acc, item) => {
      const key = item?.type || 'other'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const thisWeek = creations.filter(
      (c) => c.created_at && new Date(c.created_at).getTime() > weekAgo
    ).length

    return { byType, thisWeek }
  }, [creations])

  const filteredCreations = useMemo(() => {
    const query = search.trim().toLowerCase()
    return creations.filter((item) => {
      const matchesType = typeFilter === 'all' || item.type === typeFilter
      const matchesSearch =
        !query ||
        item.prompt?.toLowerCase().includes(query) ||
        item.type?.toLowerCase().includes(query)
      return matchesType && matchesSearch
    })
  }, [creations, search, typeFilter])

  if (!isLoaded) return null

  return (
    <div className="min-h-full w-full p-3 sm:p-6 pb-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* Stats + quick actions render immediately — list can still be loading */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Total Creations"
            value={loading && !creations.length ? '—' : creations.length}
            subtitle="Recent (up to 40)"
            icon={Sparkles}
            gradient={{ from: '#3588F2', to: '#0BB0D7' }}
          />
          <StatCard
            title="This Week"
            value={loading && !creations.length ? '—' : stats.thisWeek}
            subtitle="Last 7 days"
            icon={Calendar}
            gradient={{ from: '#20C363', to: '#11B97E' }}
          />
          <StatCard
            title="Content Types"
            value={loading && !creations.length ? '—' : Object.keys(stats.byType).length}
            subtitle="Unique categories"
            icon={Layers}
            gradient={{ from: '#F76C1C', to: '#F04A3C' }}
          />
          <StatCard
            title="Active Plan"
            value={userPlan === 'premium' ? 'Premium' : 'Free'}
            subtitle={userPlan === 'premium' ? 'Unlimited access' : 'Upgrade anytime'}
            icon={Gem}
            gradient={{ from: '#FF61C5', to: '#9E53EE' }}
          />
        </div>

        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {AiToolsData.map((tool) => (
              <Link
                key={tool.path}
                to={tool.path}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all group"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                  style={{
                    background: `linear-gradient(135deg, ${tool.bg.from}, ${tool.bg.to})`,
                  }}
                >
                  <tool.Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-slate-600 text-center group-hover:text-purple-600 transition-colors line-clamp-2">
                  {tool.title}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Recent Creations</h2>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search creations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                {TYPE_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setTypeFilter(f.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all ${
                      typeFilter === f.id
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading && creations.length === 0 ? (
            <ListSkeleton />
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredCreations.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-16 px-6 bg-white rounded-2xl border border-dashed border-gray-300"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-50 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-purple-500" />
                  </div>
                  <p className="text-slate-700 font-medium">
                    {creations.length === 0 ? 'No creations yet' : 'No matches found'}
                  </p>
                  <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">
                    {creations.length === 0
                      ? 'Start by using one of the AI tools above to create your first masterpiece.'
                      : 'Try adjusting your search or filter.'}
                  </p>
                  {creations.length === 0 && (
                    <Link
                      to="/ai/write-article"
                      className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Create your first article
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {filteredCreations.map((item) => (
                    <CreationItem key={item.id} item={item} />
                  ))}
                </div>
              )}
            </AnimatePresence>
          )}
        </section>

        <button
          onClick={() => getDashboardData({ isRefresh: true })}
          disabled={refreshing}
          className="flex items-center gap-2 mx-auto text-sm text-gray-500 hover:text-purple-600 transition-colors disabled:opacity-50"
        >
          <Loader2 className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh dashboard'}
        </button>
      </div>
    </div>
  )
}

export default Dashboard
