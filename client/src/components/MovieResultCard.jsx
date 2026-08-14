import { ExternalLink, Star, Film, Tv } from 'lucide-react'

const MovieResultCard = ({ item }) => {
  if (!item) return null

  const TypeIcon = item.type === 'tv_series' || item.type === 'tv' ? Tv : Film

  return (
    <article className="flex gap-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80 p-3 transition hover:border-violet-200 hover:bg-violet-50/40">
      <div className="h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-200">
        {item.poster ? (
          <img
            src={item.poster}
            alt={item.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <TypeIcon className="h-8 w-8" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="truncate text-sm font-semibold text-slate-800">{item.title}</h4>
          {item.year && (
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600">
              {item.year}
            </span>
          )}
          {item.rating != null && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              {Number(item.rating).toFixed(1)}
            </span>
          )}
        </div>

        <p className="mt-1 text-[11px] uppercase tracking-wide text-violet-600">
          {item.type === 'tv_series' || item.type === 'tv' ? 'TV Series' : 'Movie'}
        </p>

        {item.genres?.length > 0 && (
          <p className="mt-1 truncate text-xs text-slate-500">
            {item.genres.slice(0, 3).join(' · ')}
          </p>
        )}

        {item.overview && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600">
            {item.overview}
          </p>
        )}

        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-violet-700"
          >
            View details
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </article>
  )
}

export default MovieResultCard
