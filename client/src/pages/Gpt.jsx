import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '@clerk/react'
import { getClerkAuthToken } from '../utils/auth'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const Gpt = () => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const { getToken, isSignedIn } = useAuth()

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto focus
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const sendMessage = async (e) => {
    e.preventDefault()

    if (!input.trim()) return

    if (!isSignedIn) {
      return toast.error('Please sign in first')
    }

    const userMessage = { role: 'user', content: input }
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
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (data.success) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: data.content }
        ])
      } else {
        toast.error(data.message || 'Something went wrong')
      }

    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message || 'Server error')
    }

    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(e)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 via-white to-gray-100">

      {/* HEADER */}
      <div className="px-6 py-4 border-b bg-white/70 backdrop-blur sticky top-0 z-10">
        <h1 className="text-lg font-semibold text-gray-800">AI Chat</h1>
        <p className="text-xs text-gray-500">Ask anything and get instant answers</p>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto px-4 md:px-10 py-6 space-y-6">

        {messages.length === 0 && (
          <div className="h-full flex flex-col justify-center items-center text-center text-gray-400">
            <Bot className="w-14 h-14 mb-4 opacity-60" />
            <h2 className="text-lg font-medium">How can I help you today?</h2>
            <p className="text-sm">Start a conversation with AI</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'justify-end' : ''
            }`}
          >
            {/* AI ICON */}
            {msg.role === 'assistant' && (
              <div className="p-2 rounded-lg bg-purple-100 shadow-sm">
                <Bot className="w-5 h-5 text-purple-600" />
              </div>
            )}

            {/* MESSAGE */}
            <div
              className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm overflow-x-auto
              ${msg.role === 'user'
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-br-none'
                : 'bg-white border text-gray-800 rounded-bl-none'}`}
            >
              {msg.role === 'assistant' ? (
                <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ inline, children }) {
                    return inline ? (
                      <code className="bg-gray-200 px-1 py-0.5 rounded">
                        {children}
                      </code>
                    ) : (
                      <pre className="bg-black text-green-400 p-3 rounded-lg overflow-x-auto text-xs">
                        <code>{children}</code>
                      </pre>
                    )
                  }
                }}
              >
                {msg.content
                  .replace(/```(\w+)?/g, '\n```$1\n') // ✅ fix both start + end
                  .replace(/\n{3,}/g, '\n\n')         // ✅ remove extra breaks
                }
              </ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>

            {/* USER ICON */}
            {msg.role === 'user' && (
              <div className="p-2 rounded-lg bg-gray-200 shadow-sm">
                <User className="w-5 h-5 text-gray-600" />
              </div>
            )}
          </div>
        ))}

        {/* LOADING */}
        {loading && (
          <div className="text-sm text-gray-400 animate-pulse">
            AI is typing...
          </div>
        )}

        <div ref={bottomRef}></div>
      </div>

      {/* INPUT */}
      <form
        onSubmit={sendMessage}
        className="p-4 border-t bg-white flex items-center gap-3"
      >
        <textarea
          ref={inputRef}
          rows="1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-1 resize-none border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  )
}

export default Gpt