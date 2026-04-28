import React, { useState } from 'react'
import { Hash, Sparkles } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '@clerk/react'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const BlogTitles = () => {

  const blogCategories = [
    'General', 'Technology', 'Business', 'Health',
    'Lifestyle', 'Education', 'Travel', 'Food'
  ]

  const [selectedCategory, setSelectedCategory] = useState('General')
  const [input, setInput] = useState('')
  const [titles, setTitles] = useState([])
  const [loading, setLoading] = useState(false)

  const { getToken } = useAuth()

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!input) {
      return toast.error("Enter a keyword");
    }

    try {
      setLoading(true)

      const { data } = await axios.post(
        '/api/ai/generate-blog-title',
        {
          prompt: input,
          blogCategories: selectedCategory
        },
        {
          headers: {
            Authorization: `Bearer ${await getToken()}`
          }
        }
      )

      if (data.success) {
        const list = data.content.split("\n").filter(Boolean);
        setTitles(list);
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
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
          <div className='p-2 rounded-lg bg-purple-100'>
            <Sparkles className='w-5 h-5 text-purple-600' />
          </div>
          <h1 className='text-lg font-semibold'>AI Title Generator</h1>
        </div>

        {/* Keyword */}
        <div>
          <p className='text-sm font-medium mb-1'>Keyword</p>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className='w-full p-3 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-300 outline-none transition'
            placeholder='e.g. Future of AI in business...'
            required
          />
        </div>

        {/* Category */}
        <div>
          <p className='text-sm font-medium mb-2'>Category</p>

          <div className='flex flex-wrap gap-2'>
            {blogCategories.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setSelectedCategory(item)}
                className={`px-4 py-1.5 text-xs rounded-full border transition-all duration-200
                  ${selectedCategory === item
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
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
          className='w-full mt-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-2.5 rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2 shadow'
        >
          {loading
            ? <span className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></span>
            : <Hash className='w-4 h-4' />
          }
          {loading ? "Generating..." : "Generate Titles"}
        </button>

      </form>

      {/* RIGHT PANEL */}
      <div className='flex-1 min-w-[300px] p-6 bg-white rounded-2xl shadow-md border border-gray-200 flex flex-col min-h-[600px]'>

        {/* Header */}
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-2 rounded-lg bg-purple-100'>
            <Hash className='w-5 h-5 text-purple-600' />
          </div>
          <h1 className='text-lg font-semibold'>Generated Titles</h1>
        </div>

        {titles.length === 0 ? (
          <div className='flex-1 flex flex-col justify-center items-center text-gray-400 gap-3 text-center'>
            <Hash className='w-10 h-10 opacity-60' />
            <p className='text-sm'>
              Enter a keyword and click <span className='text-purple-500 font-medium'>Generate Titles</span>
            </p>
          </div>
        ) : (
          <div className='flex-1 overflow-y-auto pr-3 custom-scrollbar'>

            <ul className='space-y-3'>
              {titles.map((title, i) => (
                <li
                  key={i}
                  className='p-4 bg-gray-50 hover:bg-purple-50 transition rounded-lg border text-sm cursor-pointer hover:shadow-sm'
                >
                  {title}
                </li>
              ))}
            </ul>

          </div>
        )}

      </div>

    </div>
  )
}

export default BlogTitles