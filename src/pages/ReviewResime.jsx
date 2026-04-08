import { FileTextIcon, Sparkles, UploadCloud, X } from 'lucide-react'
import React, { useState } from 'react'

const ReviewResime = () => {

  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)

  const onSubmitHandler = (e) => {
    e.preventDefault()
    console.log(file)
  }

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
    }
  }

  const removeFile = () => {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
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
          <Sparkles className='w-5 text-[#00DA83]'/>
          <h1 className='text-lg font-semibold'>Resume Review</h1>
        </div>

        {/* Upload Box */}
        <div>
          <p className='text-sm font-medium mb-2'>Upload Resume</p>

          <label
            htmlFor="resumeUpload"
            className='relative flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#00DA83] transition bg-gray-100 overflow-hidden'
          >
            {file ? (
              <>
                <div className='flex flex-col items-center justify-center text-center px-2'>
                  <FileTextIcon className='w-8 h-8 text-[#00DA83]'/>
                  <p className='text-xs mt-1 truncate max-w-[200px]'>{file.name}</p>
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    removeFile()
                  }}
                  className='absolute top-2 right-2 z-10 bg-white/90 hover:bg-white p-1.5 rounded-full shadow'
                >
                  <X className='w-4 h-4 text-red-500'/>
                </button>
              </>
            ) : (
              <div className='flex flex-col items-center justify-center text-gray-400'>
                <UploadCloud className='w-7 h-7 mb-1'/>
                <p className='text-xs'>Upload PDF</p>
              </div>
            )}

            <input
              id="resumeUpload"
              type="file"
              accept="application/pdf"
              onChange={handleFileUpload}
              className="hidden"
              required
            />
          </label>

          <p className='text-xs text-gray-500 mt-2'>
            Supports PDF resume only.
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className='w-full bg-gradient-to-r from-[#00DA83] to-[#00B86B] text-white py-2 rounded-md hover:opacity-90 transition flex items-center justify-center gap-2'
        >
          <FileTextIcon className='w-4 h-4'/>
          Review Resume
        </button>

      </form>

      {/* Right column */}
      <div className='w-full max-w-lg p-6 bg-white rounded-xl border border-gray-200 min-h-96 flex flex-col'>
        
        <div className='flex items-center gap-3'>
          <FileTextIcon className='w-5 h-5 text-[#00DA83]'/>
          <h1 className='text-lg font-semibold'>Analysis Results</h1>
        </div>

        <div className='flex-1 flex justify-center items-center'>
          {preview ? (
            <iframe
              src={preview}
              title="PDF Preview"
              className='w-full h-80 rounded-md border'
            />
          ) : (
            <div className='text-sm flex flex-col items-center gap-4 text-gray-400 text-center'>
              <FileTextIcon className='w-10 h-10'/>
              <p>Upload a resume and click "Review Resume"</p>
            </div>
          )}
        </div>

      </div>

    </div>
  )
}

export default ReviewResime