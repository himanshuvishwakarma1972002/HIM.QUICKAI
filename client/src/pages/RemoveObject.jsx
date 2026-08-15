import { ScissorsIcon, Sparkles, UploadCloud, X, Download, Copy } from 'lucide-react'
import React, { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '@clerk/react'
import { getClerkAuthToken } from '../utils/auth'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const RemoveObject = () => {

  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [objectText, setObjectText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const { getToken } = useAuth()

  const onSubmitHandler = async (e) => {
    e.preventDefault()

    if (!image) return toast.error('Please upload an image')
    if (!objectText) return toast.error('Please describe what to remove')

    try {
      setLoading(true)

      const formData = new FormData()
      formData.append('image', image)
      formData.append('object', objectText)

      const token = await getClerkAuthToken(getToken)
      const { data } = await axios.post(
        '/api/ai/remove-image-object',
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
      console.error(error)
      toast.error(error.response?.data?.message || error.message)
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

  const downloadImage = () => {
    if (!result) return
    const link = document.createElement('a')
    link.href = result
    link.download = 'edited-image.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Image downloaded!")
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
          <div className='p-2 bg-blue-100 rounded-lg'>
            <Sparkles className='w-5 h-5 text-blue-600'/>
          </div>
          <h1 className='text-lg font-semibold'>Object Remover</h1>
        </div>

        {/* Upload */}
        <div>
          <p className='text-sm font-medium mb-2'>Upload Image</p>

          <label className='relative flex items-center justify-center w-full h-44 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 transition bg-gray-100 overflow-hidden'>

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

            <input type="file" accept="image/*" onChange={handleImageUpload} className='hidden'/>
          </label>
        </div>

        {/* Object Input */}
        <div>
          <p className='text-sm font-medium mb-1'>Describe Object</p>
          <textarea
            value={objectText}
            onChange={(e) => setObjectText(e.target.value)}
            rows={3}
            className='w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none resize-none transition'
            placeholder='e.g. remove person, car, background object...'
            required
          />
        </div>

        {/* Submit */}
        <button
          disabled={loading}
          type="submit"
          className='w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2.5 rounded-lg flex items-center justify-center gap-2 shadow hover:opacity-90 transition'
        >
          {loading
            ? <span className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></span>
            : <ScissorsIcon className='w-4 h-4'/>
          }
          {loading ? "Processing..." : "Remove Object"}
        </button>

      </form>

      {/* RIGHT PANEL */}
      <div className='flex-1 min-w-[300px] p-6 bg-white rounded-2xl shadow-md border border-gray-200 flex flex-col min-h-[600px]'>

        {/* Header */}
        <div className='flex justify-between items-center mb-4 flex-wrap gap-2'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-blue-100 rounded-lg'>
              <ScissorsIcon className='w-5 h-5 text-blue-600'/>
            </div>
            <h1 className='text-lg font-semibold'>Processed Image</h1>
          </div>

          {result && (
            <div className='flex gap-2 flex-wrap'>
              <button
                onClick={downloadImage}
                className='flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition'
              >
                <Download className='w-4'/>
                Download
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(result)
                  toast.success("Copied!")
                }}
                className='flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition'
              >
                <Copy className='w-4'/>
                Copy
              </button>
            </div>
          )}
        </div>

        {/* Result */}
        <div className='flex-1 flex flex-col justify-center items-center gap-4'>

          {result ? (
            <img
              src={result}
              alt="result"
              className='max-h-[400px] object-contain rounded-xl shadow'
              onError={() => {
                toast.error("Failed to load image")
                setResult(null)
              }}
            />
          ) : (
            <div className='text-sm flex flex-col items-center gap-3 text-gray-400 text-center'>
              <ScissorsIcon className='w-10 h-10 opacity-60'/>
              <p>
                Upload image and <span className='text-blue-500 font-medium'>remove object</span>
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  )
}

export default RemoveObject