import { Edit, Sparkles } from 'lucide-react'
import React, { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '@clerk/clerk-react'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const WriteArticle = () => {

  const articleLength = [
    { length: 800, text: 'Short (500-800 words)' },
    { length: 1200, text: 'Medium (800-1200 words)' },
    { length: 1600, text: 'Long (1200+ words)' }
  ]

  const [selectedLength, setSelectedLength] = useState(800)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')

  const { getToken } = useAuth()

  const onSubmitHandler = async (e) => {
    e.preventDefault()

    if (!input) {
      toast.error("Please enter topic")
      return
    }

    try {
      setLoading(true)

      const selectedText = articleLength.find(
        item => item.length === selectedLength
      )?.text

      const prompt = `Write an article about ${input} in ${selectedText}`

      const { data } = await axios.post(
        '/api/ai/generate-article',
        {
          prompt,
          length: selectedLength
        },
        {
          headers: {
            Authorization: `Bearer ${await getToken()}`
          }
        }
      )

      if (data.success) {
        setContent(data.content)
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700'>

      {/* Input Form */}
      <form onSubmit={onSubmitHandler} className='w-full flex flex-col gap-4'>

        <div className='flex flex-col gap-2'>
          <label className='font-semibold text-sm'>Article Topic</label>
          <input
            type='text'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Enter a topic...'
            className='border border-slate-300 rounded-lg px-4 py-2 outline-none focus:border-blue-400'
          />
        </div>

        <div className='flex flex-col gap-2'>
          <label className='font-semibold text-sm'>Article Length</label>
          <div className='flex gap-3 flex-wrap'>
            {articleLength.map((item) => (
              <button
                key={item.length}
                type='button'
                onClick={() => setSelectedLength(item.length)}
                className={`px-4 py-2 rounded-full border text-sm transition-all ${
                  selectedLength === item.length
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'border-slate-300 hover:border-blue-400'
                }`}
              >
                {item.text}
              </button>
            ))}
          </div>
        </div>

        <button
          type='submit'
          disabled={loading}
          className='flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-2 rounded-lg w-fit transition-all'
        >
          {loading ? (
            <>
              <Sparkles size={16} className='animate-spin' />
              Generating...
            </>
          ) : (
            <>
              <Edit size={16} />
              Generate Article
            </>
          )}
        </button>
      </form>

      {/* Output */}
      {content && (
        <div className='w-full flex flex-col gap-2'>
          <label className='font-semibold text-sm'>Generated Article</label>
          <div className='border border-slate-200 rounded-lg p-4 whitespace-pre-wrap text-sm leading-relaxed bg-slate-50'>
            {content}
          </div>
        </div>
      )}

    </div>
  )
}

export default WriteArticle