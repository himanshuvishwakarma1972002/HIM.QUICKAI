import { ScissorsIcon, Sparkles, UploadCloud, X, Download } from 'lucide-react'
import React, { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '@clerk/react'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const RemoveObject = () => {

  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [objectText, setObjectText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const { getToken } = useAuth()

  // ✅ SUBMIT
  const onSubmitHandler = async (e) => {
    e.preventDefault()

    if (!image) return toast.error('Please upload an image')
    if (!objectText) return toast.error('Please describe what to remove')

    try {
      setLoading(true)

      const formData = new FormData()
      formData.append('image', image)
      formData.append('object', objectText)

      const { data } = await axios.post(
        '/api/ai/remove-image-object',
        formData,
        {
          headers: {
            Authorization: `Bearer ${await getToken()}`
          }
        }
      )

      console.log("API RESULT:", data.content)

      if (data.success) {
        // Backend returns a Cloudinary URL; use as-is.
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

  // ✅ IMAGE UPLOAD
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      setPreview(URL.createObjectURL(file))
      setResult(null)
    }
  }

  // ✅ REMOVE IMAGE
  const removeImage = () => {
    setImage(null)
    setPreview(null)
    setResult(null)
  }

  // ✅ DOWNLOAD IMAGE
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
    <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-6 bg-gray-50 text-slate-700'>

      {/* LEFT */}
      <form
        onSubmit={onSubmitHandler}
        className='w-full max-w-lg p-6 bg-white rounded-xl border border-gray-200 space-y-5 shadow-sm'
      >

        <div className='flex items-center gap-3'>
          <Sparkles className='w-5 text-blue-600' />
          <h1 className='text-lg font-semibold'>Object Removal</h1>
        </div>

        {/* Upload */}
        <div>
          <p className='text-sm font-medium mb-2'>Upload Image</p>
          <label className='relative flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition bg-gray-100 overflow-hidden'>
            {preview ? (
              <>
                <img src={preview} alt="preview" className='h-full w-full object-contain' />
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); removeImage() }}
                  className='absolute top-2 right-2 bg-white p-1.5 rounded-full shadow'
                >
                  <X className='w-4 h-4 text-red-500' />
                </button>
              </>
            ) : (
              <div className='flex flex-col items-center text-gray-400'>
                <UploadCloud className='w-7 h-7 mb-1' />
                <p className='text-xs'>Click to Upload</p>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleImageUpload} className='hidden' />
          </label>
        </div>

        {/* Object */}
        <div>
          <p className='text-sm font-medium'>Describe Object</p>
          <textarea
            value={objectText}
            onChange={(e) => setObjectText(e.target.value)}
            rows={3}
            className='w-full p-3 mt-2 border rounded-md focus:ring-2 focus:ring-blue-400'
            placeholder='e.g., remove person, car...'
          />
        </div>

        {/* Submit */}
        <button
          disabled={loading}
          type="submit"
          className='w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 rounded-md flex items-center justify-center gap-2'
        >
          {loading
            ? <><Sparkles className='w-4 h-4 animate-spin' />Processing...</>
            : <><ScissorsIcon className='w-4 h-4' />Remove Object</>
          }
        </button>

      </form>

      {/* RIGHT */}
      <div className='w-full max-w-lg p-6 bg-white rounded-xl border min-h-96 flex flex-col'>

        {/* Header */}
        <div className='flex justify-between items-center'>
          <div className='flex items-center gap-3'>
            <ScissorsIcon className='w-5 text-blue-600' />
            <h1 className='text-lg font-semibold'>Processed Image</h1>
          </div>

          {/* ✅ DOWNLOAD BUTTON */}
          {result && (
            <button
              onClick={downloadImage}
              className='flex items-center gap-1 text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200'
            >
              <Download className='w-4' />
              Download
            </button>
          )}
        </div>

        {/* Result */}
        <div className='flex-1 flex justify-center items-center mt-4'>
          {result ? (
            <img
              src={result}
              alt="result"
              className='max-h-72 object-contain rounded-lg'
              onError={() => {
                toast.error("Failed to load image")
                setResult(null)
              }}
            />
          ) : (
            <div className='text-sm flex flex-col items-center gap-4 text-gray-400 text-center'>
              <ScissorsIcon className='w-10 h-10 text-blue-300' />
              <p>Upload image and remove object</p>
            </div>
          )}
        </div>

      </div>

    </div>
  )
}

export default RemoveObject