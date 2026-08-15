import React, { useState } from 'react'
import { ImageIcon, Sparkles, Download, Copy } from 'lucide-react'
import axios from '../utils/api'
import toast from 'react-hot-toast'
import { useAuth } from '@clerk/react'
import { getClerkAuthToken } from '../utils/auth'

const GenerateImages = () => {

  const imageStyles = [
    'Realistic', 'Ghibli Style', 'Anime Style', 'Cartoon Style',
    'Fantasy Style', '3D Style', 'Portrait Style'
  ]

  const [selectedCategory, setSelectedCategory] = useState('Realistic')
  const [input, setInput] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState('')

  const { getToken } = useAuth()

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    if (!input) { toast.error('Please describe your image'); return }

    try {
      setLoading(true)
      const prompt = `Generate an image of ${input} in the style ${selectedCategory}.`
      const token = await getClerkAuthToken(getToken)
      const { data } = await axios.post(
        '/api/ai/generate-image',
        { prompt, publish: isPublic },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (data.success) {
        setImageUrl(data.content)
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
    <div className='h-full overflow-y-auto p-6 flex flex-wrap gap-6 bg-gradient-to-br from-gray-50 to-gray-100'>

      {/* LEFT PANEL */}
      <form
        onSubmit={onSubmitHandler}
        className='w-full lg:w-[420px] p-6 bg-white rounded-2xl shadow-md border border-gray-200 space-y-6'
      >

        {/* Header */}
        <div className='flex items-center gap-3'>
          <div className='p-2 rounded-lg bg-green-100'>
            <Sparkles className='w-5 h-5 text-green-600' />
          </div>
          <h1 className='text-lg font-semibold'>AI Image Generator</h1>
        </div>

        {/* Prompt */}
        <div>
          <p className='text-sm font-medium mb-1'>Describe Your Image</p>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
            className='w-full p-3 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 outline-none resize-none transition'
            placeholder='e.g. A futuristic city with flying cars at sunset...'
            required
          />
        </div>

        {/* Styles */}
        <div>
          <p className='text-sm font-medium mb-2'>Style</p>
          <div className='flex flex-wrap gap-2'>
            {imageStyles.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setSelectedCategory(item)}
                className={`px-4 py-1.5 text-xs rounded-full border transition-all duration-200
                  ${selectedCategory === item
                    ? 'bg-green-600 text-white border-green-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-green-50'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Toggle */}
        <div className='flex items-center justify-between'>
          <p className='text-sm font-medium'>Make Image Public</p>
          <button
            type="button"
            onClick={() => setIsPublic(!isPublic)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition
              ${isPublic ? 'bg-green-600' : 'bg-gray-300'}`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow transform transition
                ${isPublic ? 'translate-x-6' : 'translate-x-0'}`}
            />
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className='w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2.5 rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2 shadow'
        >
          {loading
            ? <span className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></span>
            : <ImageIcon className='w-4 h-4' />
          }
          {loading ? "Generating..." : "Generate Image"}
        </button>

      </form>

      {/* RIGHT PANEL */}
      <div className='flex-1 min-w-[300px] p-6 bg-white rounded-2xl shadow-md border border-gray-200 flex flex-col min-h-[600px]'>

        {/* Header */}
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-2 rounded-lg bg-green-100'>
            <ImageIcon className='w-5 h-5 text-green-600' />
          </div>
          <h1 className='text-lg font-semibold'>Generated Image</h1>
        </div>

        <div className='flex-1 flex flex-col justify-center items-center gap-4'>

          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt='Generated'
                className='max-w-full max-h-[400px] rounded-xl object-contain shadow'
              />

              {/* Actions */}
              <div className='flex gap-3 mt-3 flex-wrap justify-center'>

                {/* Download */}
                <a
                  href={imageUrl}
                  download
                  className='flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition'
                >
                  <Download className='w-4 h-4' />
                  Download
                </a>

                {/* Copy URL */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(imageUrl)
                    toast.success("Image URL copied!")
                  }}
                  className='flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition'
                >
                  <Copy className='w-4 h-4' />
                  Copy URL
                </button>

              </div>
            </>
          ) : (
            <div className='text-sm flex flex-col items-center gap-3 text-gray-400 text-center'>
              <ImageIcon className='w-10 h-10 opacity-60' />
              <p>
                Describe an image and click <span className='text-green-500 font-medium'>Generate Image</span>
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  )
}

export default GenerateImages