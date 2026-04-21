import React, { useState } from 'react'
import { ImageIcon, Sparkles } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '@clerk/react'

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
      const { data } = await axios.post(
        '/api/ai/generate-image',
        { prompt, publish: isPublic },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
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
    <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-6 bg-gray-50 text-slate-700'>
      
      {/* Left column */}
      <form 
        onSubmit={onSubmitHandler}
        className='w-full max-w-lg p-6 bg-white rounded-xl border border-gray-200 space-y-5 shadow-sm'
      >

        <div className='flex items-center gap-3'>
          <Sparkles className='w-5 text-green-600'/>
          <h1 className='text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent'>
            AI Image Generator
          </h1>
        </div>

        <div>
          <p className='text-sm font-medium'>Describe Your Image</p>
          <textarea  
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
            className='w-full p-3 mt-2 outline-none text-sm rounded-md border border-gray-300 focus:ring-2 focus:ring-green-400 resize-none'
            placeholder='Describe what you want to see in the image...'
            required
          />
        </div>

        <div>
          <p className='text-sm font-medium'>Style</p>
          <div className='flex flex-wrap gap-2 mt-2'>
            {imageStyles.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setSelectedCategory(item)}
                className={`px-3 py-1 text-sm rounded-md border transition
                  ${selectedCategory === item
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-none shadow'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-green-50'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        
        <div className='flex items-center justify-between mt-4'>
          <p className='text-sm font-medium'>Make Image Public</p>
          <button
            type="button"
            onClick={() => setIsPublic(!isPublic)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition
              ${isPublic ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gray-300'}`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow transform transition
                ${isPublic ? 'translate-x-6' : 'translate-x-0'}`}
            />
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className='w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 rounded-md hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow'
        >
          {loading ? (
            <><Sparkles className='w-4 h-4 animate-spin'/>Generating...</>
          ) : (
            <><ImageIcon className='w-4 h-4'/>Generate Image</>
          )}
        </button>

      </form>

      {/* Right column */}
      <div className='w-full max-w-lg p-5 bg-white rounded-xl flex flex-col border border-gray-200 min-h-96 shadow-sm'>
        
        <div className='flex items-center gap-3'>
          <ImageIcon className='w-5 h-5 text-green-600'/>
          <h1 className='text-lg font-semibold text-gray-800'>Generated Image</h1>
        </div>

        <div className='flex-1 flex justify-center items-center mt-3'>
          {imageUrl ? (
            <img src={imageUrl} alt='Generated' className='max-w-full max-h-80 rounded-lg object-contain' />
          ) : (
            <div className='text-sm flex flex-col items-center gap-4 text-gray-400 text-center'>
              <ImageIcon className='w-8 h-8 text-green-300'/>
              <p>Describe an image and click "Generate Image"</p>
            </div>
          )}
        </div>

      </div>

    </div>
  )
}

export default GenerateImages
