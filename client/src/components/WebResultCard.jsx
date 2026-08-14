import { ExternalLink, Globe } from 'lucide-react'

const WebResultCard = ({ item }) => {
  if (!item) return null

  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 transition hover:border-violet-200 hover:bg-violet-50/30">
      <div className="flex items-start gap-2">
        <Globe className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
        <div className="min-w-0 flex-1">
          <h4 className="line-clamp-2 text-sm font-semibold text-slate-800">{item.title}</h4>
          {item.source && (
            <p className="mt-0.5 text-[11px] text-slate-500">{item.source}</p>
          )}
          {item.snippet && (
            <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-slate-600">
              {item.snippet}
            </p>
          )}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
            >
              Open
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

export default WebResultCard
