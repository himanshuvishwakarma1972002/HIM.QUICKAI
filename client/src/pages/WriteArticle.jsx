import React, { useState } from 'react'
import { Edit, Sparkles } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '@clerk/react'
import Markdown from 'react-markdown'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const WriteArticle = () => {

  const articleLength = [
    { length: 800, text: 'Short (500-800 words)' },
    { length: 1200, text: 'Medium (800-1200 words)' },
    { length: 1600, text: 'Long (1200+ words)' }
  ]

  const [selectedLength, setSelectedLength] = useState(articleLength[0].length)
  const [input, setInput] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const { getToken } = useAuth()

  const onSubmitHandler = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)

      const selectedText = articleLength.find(item => item.length === selectedLength)?.text
      const prompt = `Write an article about ${input} in ${selectedText}`

      const { data } = await axios.post(
        '/api/ai/generate-article',
        { prompt, length: selectedLength },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      )

      if (data.success) {
        setContent(data.content)
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      toast.error(error.message)
    }

    setLoading(false)
  }

  return (
    <div className='h-full overflow-y-auto p-6 flex flex-wrap gap-6 bg-gradient-to-br from-gray-50 to-gray-100'>

      {/* LEFT PANEL */}
      <form
        onSubmit={onSubmitHandler}
        className='w-full lg:w-[420px] p-6 bg-white rounded-2xl shadow-md border border-gray-200 space-y-6'
      >

        {/* Header */}
        <div className='flex items-center gap-3'>
          <div className='p-2 rounded-lg bg-blue-100'>
            <Sparkles className='w-5 h-5 text-blue-600' />
          </div>
          <h1 className='text-lg font-semibold'>AI Article Generator</h1>
        </div>

        {/* Topic */}
        <div>
          <p className='text-sm font-medium mb-1'>Topic</p>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className='w-full p-3 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-300 outline-none transition'
            placeholder='The future of artificial intelligence is...'
            required
          />
        </div>

        {/* Length */}
        <div>
          <p className='text-sm font-medium mb-2'>Article Length</p>

          <div className='flex flex-wrap gap-2'>
            {articleLength.map((item) => (
              <button
                type="button"
                key={item.length}
                onClick={() => setSelectedLength(item.length)}
                className={`px-4 py-1.5 text-xs rounded-full border transition-all duration-200
                  ${selectedLength === item.length
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`}
              >
                {item.text}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className='w-full mt-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2.5 rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2 shadow'
        >
          {loading
            ? <span className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></span>
            : <Edit className='w-4 h-4' />
          }
          {loading ? "Generating..." : "Generate Article"}
        </button>

      </form>

      {/* RIGHT PANEL */}
      <div className='flex-1 min-w-[300px] p-6 bg-white rounded-2xl shadow-md border border-gray-200 flex flex-col min-h-[600px]'>

        {/* Header */}
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-2 rounded-lg bg-blue-100'>
            <Edit className='w-5 h-5 text-blue-600' />
          </div>
          <h1 className='text-lg font-semibold'>Generated Article</h1>
        </div>

        {!content ? (
          <div className='flex-1 flex flex-col justify-center items-center text-gray-400 gap-3 text-center'>
            <Edit className='w-10 h-10 opacity-60' />
            <p className='text-sm'>
              Enter a topic and click <span className='text-blue-500 font-medium'>Generate Article</span>
            </p>
          </div>
        ) : (
          <div className='flex-1 overflow-y-auto pr-3 custom-scrollbar'>

            <div className='prose max-w-none text-sm text-slate-700 leading-relaxed'>
              <Markdown>{content}</Markdown>
            </div>

          </div>
        )}

      </div>

    </div>
  )
}

export default WriteArticle