import React, { useState } from 'react'
import { EraserIcon, Sparkles, UploadCloud, X, Download, Copy } from 'lucide-react'
import axios from '../utils/api'
import toast from 'react-hot-toast'
import { useAuth } from '@clerk/react'
import { getClerkAuthToken } from '../utils/auth'

const RemoveBackground = () => {

  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const { getToken } = useAuth()

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    if (!image) {
      toast.error('Please upload an image')
      return
    }

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('image', image)

      const token = await getClerkAuthToken(getToken)
      const { data } = await axios.post(
        '/api/ai/remove-image-background',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
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
    <div className='h-full overflow-y-auto p-6 flex flex-wrap gap-6 bg-gradient-to-br from-gray-50 to-gray-100'>

      {/* LEFT PANEL */}
      <form
        onSubmit={onSubmitHandler}
        className='w-full lg:w-[420px] p-6 bg-white rounded-2xl shadow-md border border-gray-200 space-y-6'
      >

        {/* Header */}
        <div className='flex items-center gap-3'>
          <div className='p-2 bg-red-100 rounded-lg'>
            <Sparkles className='w-5 h-5 text-red-500'/>
          </div>
          <h1 className='text-lg font-semibold'>Background Remover</h1>
        </div>

        {/* Upload Box */}
        <div>
          <p className='text-sm font-medium mb-2'>Upload Image</p>

          <label
            htmlFor="bgUpload"
            className='relative flex items-center justify-center w-full h-44 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-red-400 transition bg-gray-100 overflow-hidden'
          >
            {preview ? (
              <>
                <img src={preview} alt="preview" className='h-full w-full object-contain'/>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    removeImage()
                  }}
                  className='absolute top-2 right-2 bg-white/90 hover:bg-white p-1.5 rounded-full shadow'
                >
                  <X className='w-4 h-4 text-red-500'/>
                </button>
              </>
            ) : (
              <div className='flex flex-col items-center text-gray-400'>
                <UploadCloud className='w-9 h-9 mb-2'/>
                <p className='text-sm'>Click to Upload</p>
                <span className='text-xs'>PNG, JPG supported</span>
              </div>
            )}

            <input
              id="bgUpload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className='w-full bg-gradient-to-r from-orange-400 to-red-500 text-white py-2.5 rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2 shadow'
        >
          {loading
            ? <span className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></span>
            : <EraserIcon className='w-4 h-4'/>
          }
          {loading ? "Processing..." : "Remove Background"}
        </button>

      </form>

      {/* RIGHT PANEL */}
      <div className='flex-1 min-w-[300px] p-6 bg-white rounded-2xl shadow-md border border-gray-200 flex flex-col min-h-[600px]'>

        {/* Header */}
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-2 bg-red-100 rounded-lg'>
            <EraserIcon className='w-5 h-5 text-red-500'/>
          </div>
          <h1 className='text-lg font-semibold'>Processed Image</h1>
        </div>

        <div className='flex-1 flex flex-col justify-center items-center gap-4'>

          {result ? (
            <>
              <img
                src={result}
                alt="result"
                className='max-h-[400px] object-contain rounded-xl shadow'
              />

              {/* Actions */}
              <div className='flex gap-3 mt-3 flex-wrap justify-center'>

                {/* Download */}
                <a
                  href={result}
                  download
                  className='flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition'
                >
                  <Download className='w-4 h-4'/>
                  Download
                </a>

                {/* Copy URL */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result)
                    toast.success("Copied!")
                  }}
                  className='flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition'
                >
                  <Copy className='w-4 h-4'/>
                  Copy URL
                </button>

              </div>
            </>
          ) : (
            <div className='text-sm flex flex-col items-center gap-3 text-gray-400 text-center'>
              <EraserIcon className='w-10 h-10 opacity-60'/>
              <p>
                Upload image and click <span className='text-red-500 font-medium'>Remove Background</span>
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  )
}

export default RemoveBackground