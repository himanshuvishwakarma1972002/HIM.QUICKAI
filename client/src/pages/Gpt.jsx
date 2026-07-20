import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, Copy, Check } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '@clerk/react'
import { getClerkAuthToken } from '../utils/auth'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL

const Gpt = () => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState(null)

  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const textareaRef = useRef(null)

  const { getToken, isSignedIn } = useAuth()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const autoResize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
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

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    if (!isSignedIn) {
      return toast.error('Please sign in first')
    }

    const userMessage = { role: 'user', content: input.trim() }
    const updatedMessages = [...messages, userMessage]

    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const token = await getClerkAuthToken(getToken)

      const { data } = await axios.post(
        '/api/ai/chat',
        { messages: updatedMessages },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.content },
        ])
      } else {
        toast.error(data.message || 'Something went wrong')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Server error')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(e)
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-white to-violet-50 text-slate-800">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-2 sm:px-4 md:px-6 lg:px-8">
        <header className="sticky top-0 z-30 border-b border-white/60 bg-white/80 px-4 py-3 backdrop-blur-md sm:px-6 rounded-b-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold sm:text-lg">AI Chat</h1>
              <p className="text-xs text-slate-500 sm:text-sm">
                Ask anything and get instant answers
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          <div className="flex h-[calc(100dvh-140px)] flex-col overflow-y-auto px-1 py-4 sm:px-2 md:px-4">
            <div className="flex-1 space-y-4 sm:space-y-5">
              {messages.length === 0 && (
                <div className="flex min-h-[55vh] flex-col items-center justify-center px-4 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-100 text-violet-600 shadow-sm">
                    <Bot className="h-8 w-8" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-700 sm:text-2xl">
                    How can I help you today?
                  </h2>
                  <p className="mt-2 max-w-md text-sm text-slate-500 sm:text-base">
                    Start a conversation with AI. You can ask questions, generate content, or get help with code.
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
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
                        : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="relative">
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
                                rel="noreferrer"
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
                          {msg.content
                            .replace(/```(\w+)?/g, '\n```$1\n')
                            .replace(/\n{3,}/g, '\n\n')}
                        </ReactMarkdown>

                        <button
                          type="button"
                          onClick={() => copyToClipboard(msg.content, i)}
                          className="mt-2 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600 opacity-100 transition hover:bg-slate-100 sm:opacity-0 sm:group-hover:opacity-100"
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
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-200 text-slate-600">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-violet-500 [animation-delay:-0.2s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-violet-500 [animation-delay:-0.1s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-violet-500" />
                    </span>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>
        </main>

        <footer className="sticky bottom-0 z-30 border-t border-slate-200 bg-white/90 px-2 py-3 backdrop-blur-md sm:px-4">
          <form
            onSubmit={sendMessage}
            className="mx-auto flex max-w-4xl items-end gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:gap-3 sm:p-3"
          >
            <textarea
              ref={(el) => {
                inputRef.current = el
                textareaRef.current = el
              }}
              rows="1"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="max-h-40 min-h-[44px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200 sm:text-base"
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 sm:w-12"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </footer>
      </div>
    </div>
  )
}

export default Gpt