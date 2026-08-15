import React, { useState, useRef, useEffect } from 'react'
import {
  Send,
  Bot,
  User,
  Sparkles,
  Copy,
  Check,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  UploadCloud,
  Video,
  MessageSquare,
  Download,
  Search,
  Pause,
  Pencil,
} from 'lucide-react'
import axios from '../utils/api'
import toast from 'react-hot-toast'
import { useAuth } from '@clerk/react'
import { getClerkAuthToken } from '../utils/auth'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import MovieResultCard from '../components/MovieResultCard'
import YouTubeResultCard from '../components/YouTubeResultCard'
import WebResultCard from '../components/WebResultCard'

const MAX_FILES = 5
const MAX_FILE_SIZE_MB = 10

const MODES = [
  { id: 'auto', label: 'Auto', icon: Sparkles, hint: 'Detects chat / search / image / video' },
  { id: 'chat', label: 'Chat', icon: MessageSquare, hint: 'Text answers only' },
  { id: 'search', label: 'Search', icon: Search, hint: 'Web, movies, or YouTube search' },
  { id: 'image', label: 'Image', icon: ImageIcon, hint: 'Force image generation' },
  { id: 'video', label: 'Video', icon: Video, hint: 'Force video generation' },
]

const getLoadingLabel = (mode) => {
  if (mode === 'video') return 'Generating video (this can take 1–3 min)…'
  if (mode === 'image') return 'Generating image…'
  if (mode === 'search') return 'Searching…'
  return 'Thinking…'
}

const buildAssistantMessage = (data) => {
  if (data.type === 'search') {
    if (!data.success) {
      return {
        role: 'assistant',
        content: data.message || 'Search failed. Please try again.',
        mediaType: 'text',
        isError: true,
      }
    }

    return {
      role: 'assistant',
      content: data.content || data.answer || '',
      type: 'search',
      searchType: data.searchType || 'web',
      results: data.results || [],
      movieResults: data.movieResults || [],
      youtubeResults: data.youtubeResults || [],
      webResults: data.webResults || [],
      mediaType: 'text',
    }
  }

  return {
    role: 'assistant',
    content: data.content,
    mediaType: data.mediaType || 'text',
    mediaUrl: data.mediaUrl || null,
  }
}

const SearchResultsBlock = ({ msg }) => {
  const movies =
    msg.searchType === 'combined' || msg.movieResults?.length
      ? msg.movieResults?.length
        ? msg.movieResults
        : msg.searchType === 'movies'
          ? msg.results
          : []
      : msg.searchType === 'movies'
        ? msg.results
        : []
  const youtube =
    msg.searchType === 'combined' || msg.youtubeResults?.length
      ? msg.youtubeResults?.length
        ? msg.youtubeResults
        : msg.searchType === 'youtube'
          ? msg.results
          : []
      : msg.searchType === 'youtube'
        ? msg.results
        : []
  const web =
    msg.searchType === 'combined'
      ? msg.webResults
      : msg.searchType === 'web'
        ? msg.results
        : []

  const hasMovies = movies?.length > 0
  const hasYoutube = youtube?.length > 0
  const hasWeb = web?.length > 0

  if (!hasMovies && !hasYoutube && !hasWeb) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
        No results found for this search.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {hasMovies && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Movies & TV</p>
          <div className="grid gap-2">
            {movies.map((item, idx) => (
              <MovieResultCard key={item.id || `movie-${idx}`} item={item} />
            ))}
          </div>
        </div>
      )}

      {hasYoutube && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">YouTube</p>
          <div className="grid gap-2">
            {youtube.map((item, idx) => (
              <YouTubeResultCard key={item.videoId || `yt-${idx}`} item={item} />
            ))}
          </div>
        </div>
      )}

      {hasWeb && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Web results</p>
          <div className="grid gap-2">
            {web.map((item, idx) => (
              <WebResultCard key={item.url || `web-${idx}`} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const WebSources = ({ msg }) => {
  const sources =
    msg.searchType === 'combined'
      ? msg.webResults
      : msg.searchType === 'web'
        ? msg.results
        : []

  if (!sources?.length) return null

  return (
    <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
      <p className="mb-1.5 text-xs font-semibold text-slate-600">Sources</p>
      <ul className="space-y-1">
        {sources.map((item, idx) =>
          item.url ? (
            <li key={item.url || idx}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-violet-600 underline underline-offset-2 hover:text-violet-800"
              >
                {item.title || item.source || item.url}
              </a>
            </li>
          ) : null
        )}
      </ul>
    </div>
  )
}

const getFileMeta = (file) => {
  const type = file.type || ''
  const name = file.name || ''
  const ext = name.split('.').pop()?.toLowerCase()

  if (type.startsWith('image/')) return { icon: ImageIcon, label: 'Image' }
  if (
    type === 'application/pdf' ||
    ext === 'pdf' ||
    ext === 'doc' ||
    ext === 'docx' ||
    ext === 'txt'
  ) {
    return { icon: FileText, label: ext?.toUpperCase() || 'File' }
  }

  return { icon: FileText, label: 'File' }
}

const isAllowedFile = (file) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ]
  const allowedImage = file.type.startsWith('image/')
  const ext = file.name.split('.').pop()?.toLowerCase()

  return (
    allowedImage ||
    allowedTypes.includes(file.type) ||
    ['pdf', 'doc', 'docx', 'txt'].includes(ext)
  )
}

const AiChat = () => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('auto')
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [editingMessageIndex, setEditingMessageIndex] = useState(null)

  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const abortControllerRef = useRef(null)

  const { getToken, isSignedIn } = useAuth()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const autoResize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`
  }

  useEffect(() => {
    autoResize()
  }, [input])

  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      toast.success('Copied')
      setTimeout(() => setCopiedIndex(null), 1200)
    } catch {
      toast.error('Copy failed')
    }
  }

  const handleFiles = (files) => {
    const incoming = Array.from(files || [])
    if (!incoming.length) return

    const valid = []
    for (const file of incoming) {
      const fileSizeMB = file.size / (1024 * 1024)
      if (!isAllowedFile(file)) {
        toast.error(`${file.name} is not supported`)
        continue
      }
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        toast.error(`${file.name} is larger than ${MAX_FILE_SIZE_MB}MB`)
        continue
      }
      valid.push(file)
    }

    if (!valid.length) return

    if (attachments.length + valid.length > MAX_FILES) {
      toast.error(`You can attach up to ${MAX_FILES} files`)
      valid.splice(MAX_FILES - attachments.length)
    }

    setAttachments((prev) => [...prev, ...valid])
  }

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const onFileChange = (e) => {
    handleFiles(e.target.files)
    e.target.value = ''
  }

  const handlePaste = (e) => {
    const items = e.clipboardData?.items
    if (!items?.length) return

    const pastedFiles = []
    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile()
        if (file) pastedFiles.push(file)
      }
    }

    if (pastedFiles.length) handleFiles(pastedFiles)
  }

  const applySuggestion = (text, nextMode = 'auto') => {
    setMode(nextMode)
    setInput(text)
    setEditingMessageIndex(null)
    inputRef.current?.focus()
  }

  const getLastUserMessageIndex = (list) => {
    for (let i = list.length - 1; i >= 0; i -= 1) {
      if (list[i].role === 'user') return i
    }
    return -1
  }

  const pauseGeneration = () => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setLoading(false)
    toast('Response paused')
  }

  const editMessage = (index) => {
    const msg = messages[index]
    if (!msg || msg.role !== 'user') return

    if (loading) pauseGeneration()

    const text = msg.content === 'Attached files' ? '' : msg.content
    setInput(text)
    setMessages((prev) => prev.slice(0, index))
    setAttachments([])
    setEditingMessageIndex(index)
    inputRef.current?.focus()
    toast('Message loaded — edit and send again')
  }

  const sendMessage = async (e) => {
    e?.preventDefault?.()
    if ((!input.trim() && attachments.length === 0) || loading) return

    if (!isSignedIn) {
      return toast.error('Please sign in first')
    }

    setLoading(true)
    setEditingMessageIndex(null)

    const userText = input.trim()
    const currentAttachments = [...attachments]
    const historyForRequest = [...messages, { role: 'user', content: userText }]

    const userMessage = {
      role: 'user',
      content: userText || 'Attached files',
      files: currentAttachments.map((file) => ({
        name: file.name,
        type: file.type,
      })),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setAttachments([])

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const token = await getClerkAuthToken(getToken)

      const formData = new FormData()
      formData.append('messages', JSON.stringify(historyForRequest))
      formData.append(
        'mode',
        mode === 'video' && /[?]|(what|why|how|who|explain|tell me|define)/i.test(userText)
          ? 'auto'
          : mode
      )

      currentAttachments.forEach((file) => {
        formData.append('files', file)
      })

      const timeout = mode === 'video' || /video|clip|reel|animation/i.test(userText)
        ? 360000
        : 120000

      const { data } = await axios.post('/api/ai/chat', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout,
        signal: controller.signal,
      })

      if (data.success) {
        setMessages((prev) => [...prev, buildAssistantMessage(data)])
        if (data.switchToMode === 'auto' || data.videoQuotaExceeded) {
          setMode('auto')
          toast('Video generation quota exceeded — switched to Auto chat')
        } else if (data.warning) {
          toast(data.warning, {
            icon: '⚠️',
            duration: 5000,
          })
        }
      } else {
        const errText =
          typeof data.message === 'string' && data.message.length > 220
            ? 'Generation failed due to API limits. Try Image or Chat mode, or wait and retry.'
            : data.message || 'Something went wrong'

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `⚠️ **Couldn't complete that request**\n\n${errText}`,
            mediaType: 'text',
            isError: true,
          },
        ])
      }
    } catch (error) {
      if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
        return
      }

      const raw =
        error.code === 'ECONNABORTED'
          ? 'Request timed out. Video generation can take a few minutes — try again.'
          : error.response?.data?.message || error.message || 'Server error'

      const errText =
        typeof raw === 'string' && (/quota|429|RESOURCE_EXHAUSTED/i.test(raw) || raw.length > 220)
          ? 'Gemini API quota exceeded for video. Try again later, or switch to **Image** mode.'
          : raw

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Couldn't complete that request**\n\n${errText}`,
          mediaType: 'text',
          isError: true,
        },
      ])
    } finally {
      abortControllerRef.current = null
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(e)
    }
  }

  const dropFiles = (e) => {
    e.preventDefault()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const placeholder =
    mode === 'image'
      ? 'Describe the image to generate...'
      : mode === 'video'
        ? 'Describe the video scene to generate...'
        : mode === 'search'
          ? 'Search the web, movies, or YouTube...'
          : 'Ask anything — chat, search, generate images/videos, or upload files'

  return (
    <div className="flex h-full min-h-0 flex-col bg-gradient-to-br from-slate-50 via-white to-violet-50 text-slate-800">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col px-2 sm:px-4 md:px-6 lg:px-8">
        <header className="sticky top-0 z-20 shrink-0 border-b border-white/60 bg-white/90 px-4 py-3 backdrop-blur-md sm:px-6 rounded-b-2xl shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-200">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold sm:text-lg">AI Studio Chat</h1>
                <p className="text-xs text-slate-500 sm:text-sm">
                  Chat · search · generate images · generate videos · upload docs
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {MODES.map((item) => {
                const Icon = item.icon
                const active = mode === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    title={item.hint}
                    onClick={() => setMode(item.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>
          {mode === 'video' && (
            <p className="mt-2 text-xs text-amber-700">
              Video mode is on — this uses Veo and can hit quota. Switch to <strong>Auto</strong> or <strong>Chat</strong> for normal GPT answers.
            </p>
          )}
        </header>

        <main className="min-h-0 flex-1 overflow-hidden">
          <div className="flex h-full flex-col overflow-y-auto px-1 py-4 sm:px-2 md:px-4">
            <div className="flex-1 space-y-4 sm:space-y-5">
              {messages.length === 0 && (
                <div className="flex min-h-[48vh] flex-col items-center justify-center px-4 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-100 text-violet-600 shadow-sm">
                    <Bot className="h-8 w-8" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-700 sm:text-2xl">
                    What do you want to create?
                  </h2>
                  <p className="mt-2 max-w-lg text-sm text-slate-500 sm:text-base">
                    Works like Gemini — ask questions, upload files, or generate images and videos from a prompt.
                  </p>

                  <div className="mt-6 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() =>
                        applySuggestion('What is the latest React.js news?', 'search')
                      }
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-50"
                    >
                      <span className="mb-1 flex items-center gap-2 font-medium text-violet-700">
                        <Search className="h-4 w-4" /> Search
                      </span>
                      What is the latest React.js news?
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        applySuggestion('Generate an image of a futuristic city at sunset', 'image')
                      }
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-50"
                    >
                      <span className="mb-1 flex items-center gap-2 font-medium text-violet-700">
                        <ImageIcon className="h-4 w-4" /> Image
                      </span>
                      Generate an image of a futuristic city at sunset
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        applySuggestion(
                          'Create a video of ocean waves crashing on rocks at golden hour',
                          'video'
                        )
                      }
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-50"
                    >
                      <span className="mb-1 flex items-center gap-2 font-medium text-violet-700">
                        <Video className="h-4 w-4" /> Video
                      </span>
                      Create a video of ocean waves at golden hour
                    </button>
                  </div>
                </div>
              )}

              {messages.map((msg, i) => {
                const lastUserIndex = getLastUserMessageIndex(messages)
                const canEditUser =
                  msg.role === 'user' && (!loading || i === lastUserIndex)

                return (
                <div
                  key={i}
                  className={`flex items-end gap-2 sm:gap-3 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                      <Bot className="h-5 w-5" />
                    </div>
                  )}

                  <div
                    className={`group max-w-[92%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm md:text-[15px] ${
                      msg.role === 'user'
                        ? 'rounded-br-md bg-violet-600 text-white'
                        : msg.isError
                          ? 'rounded-bl-md border border-amber-200 bg-amber-50 text-amber-950'
                          : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="relative space-y-3">
                        {msg.mediaType === 'image' && msg.mediaUrl && (
                          <div className="overflow-hidden rounded-xl border border-slate-200">
                            <img
                              src={msg.mediaUrl}
                              alt="Generated"
                              className="max-h-[420px] w-full object-contain bg-slate-50"
                            />
                            <a
                              href={msg.mediaUrl}
                              target="_blank"
                              rel="noreferrer"
                              download
                              className="flex items-center justify-center gap-1.5 border-t border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 hover:bg-slate-100"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Open / Download image
                            </a>
                          </div>
                        )}

                        {msg.mediaType === 'video' && msg.mediaUrl && (
                          <div className="overflow-hidden rounded-xl border border-slate-200">
                            <video
                              src={msg.mediaUrl}
                              controls
                              className="max-h-[420px] w-full bg-black"
                            />
                            <a
                              href={msg.mediaUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-center gap-1.5 border-t border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 hover:bg-slate-100"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Open / Download video
                            </a>
                          </div>
                        )}

                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="mb-2 list-disc pl-5">{children}</ul>,
                            ol: ({ children }) => <ol className="mb-2 list-decimal pl-5">{children}</ol>,
                            li: ({ children }) => <li className="mb-1">{children}</li>,
                            a: ({ children, href }) => (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-violet-600 underline underline-offset-2"
                              >
                                {children}
                              </a>
                            ),
                            code({ inline, children }) {
                              return inline ? (
                                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[13px] text-slate-800">
                                  {children}
                                </code>
                              ) : (
                                <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs text-emerald-400">
                                  <code>{children}</code>
                                </pre>
                              )
                            },
                          }}
                        >
                          {(msg.content || '')
                            .replace(/```(\w+)?/g, '\n```$1\n')
                            .replace(/\n{3,}/g, '\n\n')}
                        </ReactMarkdown>

                        {msg.type === 'search' && (
                          <>
                            <SearchResultsBlock msg={msg} />
                            {(msg.searchType === 'web' || msg.searchType === 'combined') && (
                              <WebSources msg={msg} />
                            )}
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => copyToClipboard(msg.content, i)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600 transition hover:bg-slate-100"
                        >
                          {copiedIndex === i ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        {msg.files?.length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {msg.files.map((file, idx) => {
                              const meta = getFileMeta(file)
                              const Icon = meta.icon
                              return (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs text-white ring-1 ring-white/20"
                                >
                                  <Icon className="h-3.5 w-3.5" />
                                  {file.name}
                                </span>
                              )
                            })}
                          </div>
                        ) : null}
                        {canEditUser && (
                          <div className="mt-2 flex justify-end gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => editMessage(i)}
                              className="inline-flex items-center gap-1 rounded-lg bg-white/15 px-2 py-1 text-[11px] text-white ring-1 ring-white/25 transition hover:bg-white/25"
                            >
                              <Pencil className="h-3 w-3" />
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-200 text-slate-600">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                </div>
              )})}

              {loading && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-violet-500 [animation-delay:-0.2s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-violet-500 [animation-delay:-0.1s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-violet-500" />
                      </span>
                      {getLoadingLabel(mode)}
                    </span>
                    <button
                      type="button"
                      onClick={pauseGeneration}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 transition hover:bg-amber-100"
                    >
                      <Pause className="h-3.5 w-3.5" />
                      Pause
                    </button>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>
        </main>

        <footer className="sticky bottom-0 z-20 shrink-0 border-t border-slate-200 bg-white/95 px-2 py-3 backdrop-blur-md sm:px-4">
          <form
            onSubmit={sendMessage}
            onDragOver={(e) => {
              e.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={dropFiles}
            className={`mx-auto max-w-4xl rounded-2xl border bg-white p-2 shadow-sm transition sm:p-3 ${
              dragActive ? 'border-violet-500 ring-2 ring-violet-200' : 'border-slate-200'
            }`}
          >
            {attachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachments.map((file, index) => {
                  const meta = getFileMeta(file)
                  const Icon = meta.icon
                  return (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="max-w-32 truncate sm:max-w-48">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="rounded-full p-0.5 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {editingMessageIndex !== null && (
              <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-800">
                <span className="inline-flex items-center gap-1.5">
                  <Pencil className="h-3.5 w-3.5" />
                  Editing message — change text below and press Enter to resend
                </span>
                <button
                  type="button"
                  onClick={() => setEditingMessageIndex(null)}
                  className="rounded-lg px-2 py-0.5 text-violet-600 hover:bg-violet-100"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="flex items-end gap-2 sm:gap-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,image/*"
                onChange={onFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 sm:h-12 sm:w-12"
              >
                <Paperclip className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="hidden sm:flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-600 transition hover:bg-slate-100"
              >
                <UploadCloud className="h-4 w-4" />
                Upload
              </button>

              <textarea
                ref={(el) => {
                  inputRef.current = el
                  textareaRef.current = el
                }}
                rows="1"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="max-h-56 min-h-[44px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200 sm:text-base"
              />

              {loading ? (
                <button
                  type="button"
                  onClick={pauseGeneration}
                  title="Pause response"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-white transition hover:bg-amber-600 sm:h-12 sm:w-12"
                >
                  <Pause className="h-5 w-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim() && attachments.length === 0}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 sm:w-12"
                >
                  <Send className="h-5 w-5" />
                </button>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-slate-400">
              <span>
                Mode: <span className="font-medium text-slate-600">{mode}</span> · Auto routes chat/search/image/video · PDF/DOC/TXT/images
              </span>
              <span>{attachments.length}/{MAX_FILES} files</span>
            </div>
          </form>
        </footer>
      </div>
    </div>
  )
}

export default AiChat
