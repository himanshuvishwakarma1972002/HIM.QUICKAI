import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '@clerk/react'
import { getClerkAuthToken } from '../utils/auth'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const Gpt = () => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const { getToken, isSignedIn } = useAuth()

  // ✅ Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ✅ Auto focus
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

    // ✅ FIX: create updatedMessages FIRST
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
      toast.error(
        error.response?.data?.message || 'Server error'
      )
    }

    setLoading(false)
  }

  // ✅ Enter key support
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
            {/* AI */}
            {msg.role === 'assistant' && (
              <div className="p-2 rounded-lg bg-purple-100 shadow-sm">
                <Bot className="w-5 h-5 text-purple-600" />
              </div>
            )}

            {/* MESSAGE */}
            <div
              className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm
              ${msg.role === 'user'
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-br-none'
                : 'bg-white border text-gray-700 rounded-bl-none'}`}
            >
              {msg.content}
            </div>

            {/* USER */}
            {msg.role === 'user' && (
              <div className="p-2 rounded-lg bg-gray-200 shadow-sm">
                <User className="w-5 h-5 text-gray-700" />
              </div>
            )}
          </div>
        ))}

        {/* LOADING */}
        {loading && (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Bot className="w-5 h-5 text-purple-600" />
            </div>

            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></span>
            </div>
          </div>
        )}

        <div ref={bottomRef}></div>
      </div>

      {/* INPUT */}
      <form
        onSubmit={sendMessage}
        className="p-4 bg-white border-t sticky bottom-0"
      >
        <div className="flex items-center gap-3 max-w-4xl mx-auto bg-gray-100 border rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-purple-300 transition">

          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            type="text"
            placeholder="Ask anything..."
            className="flex-1 bg-transparent outline-none text-sm px-2"
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2 bg-purple-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition"
          >
            <Send className="w-4 h-4" />
          </button>

        </div>
      </form>

    </div>
  )
}

export default Gpt