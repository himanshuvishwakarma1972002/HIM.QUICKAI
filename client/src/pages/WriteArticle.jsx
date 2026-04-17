import React, { useState } from 'react'
import { Edit, Sparkles } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '@clerk/react'

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

  const {getToken} = useAuth()

  const onSubmitHandler = async (e) => {
    e.preventDefault()

   

    try {
      setLoading(true)

      const selectedText = articleLength.find(item => item.length === selectedLength)?.text
      const prompt = `Write an article about ${input} in ${selectedText}`

      const { data } = await axios.post('/api/ai/generate-article', {
        prompt,
        length: selectedLength }, {
          headers: {Authorization: `Bearer ${await getToken()}`}
        })

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
    <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700'>

      {/* LEFT */}
      <form
        onSubmit={onSubmitHandler}
        className='w-full max-w-lg p-5 bg-white rounded-lg border border-gray-200 space-y-4'
      >

        {/* Header */}
        <div className='flex items-center gap-3'>
          <Sparkles className='w-6 text-blue-500' />
          <h1 className='text-xl font-semibold'>AI Article Generator</h1>
        </div>

        {/* Topic */}
        <div>
          <p className='text-sm font-medium'>Topic</p>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-200'
            placeholder='The future of artificial intelligence is...'
          />
        </div>

        {/* Length */}
        <div>
          <p className='text-sm font-medium'>Article Length</p>

          <div className='flex flex-wrap gap-2 mt-2'>
            {articleLength.map((item) => (
              <button
                type="button"
                key={item.length}
                onClick={() => setSelectedLength(item.length)}
                className={`px-3 py-1 text-sm rounded-full border transition
                  ${selectedLength === item.length
                    ? 'bg-blue-500 text-white border-blue-500'
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
          className='w-full mt-4 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition flex items-center justify-center gap-2'
        >
          <Edit className='w-4 h-4' />
          {loading ? "Generating..." : "Generate Article"}
        </button>

      </form>

      {/* RIGHT */}
      <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96'>

        <div className='flex items-center gap-3'>
          <Edit className='w-5 h-5 text-blue-500' />
          <h1 className='text-xl font-semibold'>Generated Article</h1>
        </div>

        <div className='flex-1 flex justify-center items-center'>
          {content ? (
            <p className='text-sm whitespace-pre-line text-left p-2'>
              {content}
            </p>
          ) : (
            <div className='text-sm flex flex-col items-center gap-5 text-gray-400 text-center'>
              <Edit className='w-9 h-9' />
              <p>Enter a topic and click "Generate Article"</p>
            </div>
          )}
        </div>

      </div>

    </div>
  )
}

export default WriteArticle