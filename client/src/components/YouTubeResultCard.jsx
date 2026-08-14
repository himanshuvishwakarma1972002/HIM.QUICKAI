import { ExternalLink, Play } from 'lucide-react'

const formatDate = (dateStr) => {
  if (!dateStr) return null
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return null
  }
}

const YouTubeResultCard = ({ item }) => {
  if (!item) return null

  const published = formatDate(item.publishedAt)

  return (
    <article className="flex gap-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80 p-3 transition hover:border-red-200 hover:bg-red-50/30">
      <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg bg-slate-900">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-red-400">
            <Play className="h-8 w-8" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h4 className="line-clamp-2 text-sm font-semibold text-slate-800">{item.title}</h4>
        <p className="mt-1 text-xs text-slate-500">{item.channel}</p>
        {published && (
          <p className="mt-0.5 text-[11px] text-slate-400">Published {published}</p>
        )}
        {item.description && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600">
            {item.description}
          </p>
        )}
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-red-700"
          >
            <Play className="h-3 w-3" />
            Watch
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </article>
  )
}

export default YouTubeResultCard
