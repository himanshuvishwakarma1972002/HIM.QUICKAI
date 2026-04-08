import { ScissorsIcon, Sparkles, UploadCloud, X } from 'lucide-react'
import React, { useState } from 'react'

const RemoveObject = () => {

  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [objectText, setObjectText] = useState('')

  const onSubmitHandler = (e) => {
    e.preventDefault()
    console.log(image, objectText)
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  // ✅ Remove Image
  const removeImage = () => {
    setImage(null)
    setPreview(null)
  }

  return (
    <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-6 bg-gray-50 text-slate-700'>
      
      {/* Left column */}
      <form 
        onSubmit={onSubmitHandler}
        className='w-full max-w-lg p-6 bg-white rounded-xl border border-gray-200 space-y-5 shadow-sm'
      >

        {/* Header */}
        <div className='flex items-center gap-3'>
          <Sparkles className='w-5 text-blue-600'/>
          <h1 className='text-lg font-semibold'>Object Removal</h1>
        </div>

        {/* ✅ Upload Box */}
        <div>
          <p className='text-sm font-medium mb-2'>Upload Image</p>

          <label className='relative flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition bg-gray-100 overflow-hidden'>
            
            {preview ? (
              <>
                <img 
                  src={preview} 
                  alt="preview" 
                  className='h-full w-full object-contain'
                />

                {/* ❌ Remove Button */}
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
              <div className='flex flex-col items-center justify-center text-gray-400'>
                <UploadCloud className='w-7 h-7 mb-1'/>
                <p className='text-xs'>Click to Upload</p>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className='hidden'
            />
          </label>
        </div>

        {/* Object Description */}
        <div>
          <p className='text-sm font-medium'>Describe Object to Remove</p>
          
          <textarea  
            value={objectText}
            onChange={(e) => setObjectText(e.target.value)}
            rows={3}
            className='w-full p-3 mt-2 outline-none text-sm rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400 resize-none'
            placeholder='e.g., remove person, car, tree...'
            required
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className='w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 rounded-md hover:opacity-90 transition flex items-center justify-center gap-2'
        >
          <ScissorsIcon className='w-4 h-4'/>
          Remove Object
        </button>

      </form>

      {/* Right column */}
      <div className='w-full max-w-lg p-6 bg-white rounded-xl border border-gray-200 min-h-96 flex flex-col'>
        
        <div className='flex items-center gap-3'>
          <ScissorsIcon className='w-5 h-5 text-blue-600'/>
          <h1 className='text-lg font-semibold'>Processed Image</h1>
        </div>

        <div className='flex-1 flex justify-center items-center'>
          <div className='text-sm flex flex-col items-center gap-4 text-gray-400 text-center'>
            <ScissorsIcon className='w-10 h-10 text-blue-300'/>
            <p>Upload an image and describe what to remove</p>
          </div>
        </div>

      </div>

    </div>
  )
}

export default RemoveObject