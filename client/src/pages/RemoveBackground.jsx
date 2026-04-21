import React, { useState } from 'react'
import { EraserIcon, Sparkles, UploadCloud, X } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '@clerk/react'

const RemoveBackground = () => {

  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const { getToken } = useAuth()

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    if (!image) { toast.error('Please upload an image'); return }

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('image', image)

      const { data } = await axios.post(
        '/api/ai/remove-image-background',
        formData,
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      )

      if (data.success) {
        setResult(data.content)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      setPreview(URL.createObjectURL(file))
      setResult(null)
    }
  }

  const removeImage = () => {
    if (preview) URL.revokeObjectURL(preview)
    setImage(null)
    setPreview(null)
    setResult(null)
  }

  return (
    <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-6 bg-gray-50 text-slate-700'>
      
      {/* Left column */}
      <form 
        onSubmit={onSubmitHandler}
        className='w-full max-w-lg p-6 bg-white rounded-xl border border-gray-200 space-y-5 shadow-sm'
      >

        <div className='flex items-center gap-3'>
          <Sparkles className='w-5 text-[#FF4938]'/>
          <h1 className='text-lg font-semibold'>Background Removal</h1>
        </div>

        <div>
          <p className='text-sm font-medium mb-2'>Upload Image</p>
          <label
            htmlFor="bgUpload"
            className='relative flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#FF4938] transition bg-gray-100 overflow-hidden'
          >
            {preview ? (
              <>
                <img src={preview} alt="preview" className='h-full w-full object-contain'/>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); removeImage() }}
                  className='absolute top-2 right-2 z-10 bg-white/90 hover:bg-white p-1.5 rounded-full shadow'
                >
                  <X className='w-4 h-4 text-red-500'/>
                </button>
              </>
            ) : (
              <div className='flex flex-col items-center justify-center text-gray-400'>
                <UploadCloud className='w-7 h-7 mb-1'/>
                <p className='text-xs'>Click to Upload</p>
              </div>
            )}
            <input id="bgUpload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden"/>
          </label>
          <p className='text-xs text-gray-500 mt-2'>Supports JPG, PNG and other formats</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className='w-full bg-gradient-to-r from-[#F6AB41] to-[#FF4938] text-white py-2 rounded-md hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2'
        >
          {loading ? (
            <><Sparkles className='w-4 h-4 animate-spin'/>Processing...</>
          ) : (
            <><EraserIcon className='w-4 h-4'/>Remove Background</>
          )}
        </button>

      </form>

      {/* Right column */}
      <div className='w-full max-w-lg p-6 bg-white rounded-xl border border-gray-200 min-h-96 flex flex-col'>
        
        <div className='flex items-center gap-3'>
          <EraserIcon className='w-5 h-5 text-[#FF4938]'/>
          <h1 className='text-lg font-semibold'>Processed Image</h1>
        </div>

        <div className='flex-1 flex justify-center items-center mt-3'>
          {result ? (
            <img src={result} alt="result" className='max-h-72 object-contain rounded-lg'/>
          ) : (
            <div className='text-sm flex flex-col items-center gap-4 text-gray-400 text-center'>
              <EraserIcon className='w-10 h-10'/>
              <p>Upload an image and click "Remove Background"</p>
            </div>
          )}
        </div>

      </div>

    </div>
  )
}

export default RemoveBackground
