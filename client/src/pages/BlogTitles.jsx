import React, { useState } from 'react'
import { Hash, Sparkles } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '@clerk/react'
import ReactMarkdown from 'react-markdown'
import { GoogleGenerativeAI } from "@google/generative-ai";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const BlogTitles = () => {

  const blogCategories = [
    'General', 'Technology', 'Business', 'Health',
    'Lifestyle', 'Education', 'Travel', 'Food'
  ]

  const [selectedCategory, setSelectedCategory] = useState('General')
  const [input, setInput] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const { getToken } = useAuth()

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!input.trim()) {
      return toast.error("Please enter a keyword")
    }

    try {
      setLoading(true)

      const prompt = `Generate 8 catchy blog titles for "${input}" in ${selectedCategory} category. Return as a numbered list.`

      const { data } = await axios.post(
        '/api/ai/generate-blog-title',
        { prompt },
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
      toast.error(error.response?.data?.message || error.message)
    }

    setLoading(false)
  }

  return (
    <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700'>

      {/* LEFT */}
      <form
        onSubmit={onSubmitHandler}
        className='w-full max-w-lg p-5 bg-white rounded-lg border border-gray-200 space-y-4'
      >

        <div className='flex items-center gap-3'>
          <Sparkles className='w-6 text-[#8E37EB]' />
          <h1 className='text-xl font-semibold'>AI Title Generator</h1>
        </div>

        {/* Keyword */}
        <div>
          <p className='text-sm font-medium'>Keyword</p>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300 focus:ring-2 focus:ring-purple-200'
            placeholder='The future of artificial intelligence...'
            required
          />
        </div>

        {/* Category */}
        <div>
          <p className='text-sm font-medium'>Category</p>

          <div className='flex flex-wrap gap-2 mt-2'>
            {blogCategories.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setSelectedCategory(item)}
                className={`px-3 py-1 text-sm rounded-full border transition
                  ${selectedCategory === item
                    ? 'bg-[#8E37EB] text-white border-[#8E37EB]'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          disabled={loading}
          type="submit"
          className='w-full mt-4 bg-[#C341F6] text-white py-2 rounded-md hover:bg-[#8E37EB] transition flex items-center justify-center gap-2'
        >
          {loading
            ? <span className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></span>
            : <Hash className='w-5' />
          }
          {loading ? "Generating..." : "Generate Title"}
        </button>

      </form>

      {/* RIGHT */}
      <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96'>

        <div className='flex items-center gap-3'>
          <Hash className='w-5 h-5 text-[#8E37EB]' />
          <h1 className='text-xl font-semibold'>Generated Titles</h1>
        </div>

        {!content ? (
          <div className='flex-1 flex justify-center items-center'>
            <div className='text-sm flex flex-col items-center gap-5 text-gray-400 text-center'>
              <Hash className='w-9 h-9' />
              <p>Enter a topic and click "Generate Title"</p>
            </div>
          </div>
        ) : (
          <div className='mt-3 h-full overflow-y-auto text-sm text-slate-700'>
            <div className='prose prose-sm max-w-none'>
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
        )}

      </div>

    </div>
  )
}

export default BlogTitles