import { FileTextIcon, Sparkles, UploadCloud, X, Copy } from 'lucide-react'
import React, { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '@clerk/react'
import Markdown from 'react-markdown'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL

const ReviewResume = () => {

  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const { getToken } = useAuth()

  const onSubmitHandler = async (e) => {
    e.preventDefault()

    if (!file) return toast.error('Please upload a resume PDF')

    try {
      setLoading(true)

      const formData = new FormData()
      formData.append('resume', file)

      const token = await getToken()

      const { data } = await axios.post(
        '/api/ai/resume-review',
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
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0]

    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed')
        return
      }

      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
      setResult('')
    }
  }

  const removeFile = () => {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview(null)
    setResult('')
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
          <div className='p-2 bg-green-100 rounded-lg'>
            <Sparkles className='w-5 h-5 text-green-600'/>
          </div>
          <h1 className='text-lg font-semibold'>Resume Analyzer</h1>
        </div>

        {/* Upload */}
        <div>
          <p className='text-sm font-medium mb-2'>Upload Resume</p>

          <label className='relative flex items-center justify-center w-full h-44 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-400 transition bg-gray-100 overflow-hidden'>

            {file ? (
              <>
                <FileTextIcon className='w-10 h-10 text-green-500'/>
                <p className='text-xs mt-2 px-2 text-center'>{file.name}</p>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    removeFile()
                  }}
                  className='absolute top-2 right-2 bg-white/90 p-1.5 rounded-full shadow'
                >
                  <X className='w-4 h-4 text-red-500'/>
                </button>
              </>
            ) : (
              <div className='flex flex-col items-center text-gray-400'>
                <UploadCloud className='w-9 h-9 mb-2'/>
                <p className='text-sm'>Click to Upload</p>
                <span className='text-xs'>PDF only</span>
              </div>
            )}

            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileUpload}
              className='hidden'
            />
          </label>
        </div>

        {/* Submit */}
        <button
          disabled={loading}
          type="submit"
          className='w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2.5 rounded-lg flex items-center justify-center gap-2 shadow hover:opacity-90 transition'
        >
          {loading
            ? <span className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></span>
            : <FileTextIcon className='w-4 h-4'/>
          }
          {loading ? "Analyzing..." : "Review Resume"}
        </button>

      </form>

      {/* RIGHT PANEL */}
      <div className='flex-1 min-w-[300px] p-6 bg-white rounded-2xl shadow-md border border-gray-200 flex flex-col min-h-[600px]'>

        {/* Header */}
        <div className='flex justify-between items-center mb-4 flex-wrap gap-2'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-green-100 rounded-lg'>
              <FileTextIcon className='w-5 h-5 text-green-600'/>
            </div>
            <h1 className='text-lg font-semibold'>Analysis</h1>
          </div>

          {result && (
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
          )}
        </div>

        {/* Result */}
        <div className='flex-1 flex flex-col justify-center items-center gap-4'>

          {result ? (
            <div className='w-full overflow-y-auto max-h-[450px] pr-2'>
              <div className='prose prose-sm max-w-none text-slate-700 leading-relaxed'>
                <Markdown>{result}</Markdown>
              </div>
            </div>
          ) : (
            <div className='text-sm flex flex-col items-center gap-3 text-gray-400 text-center'>
              <FileTextIcon className='w-10 h-10 opacity-60'/>
              <p>
                Upload resume and <span className='text-green-500 font-medium'>analyze it</span>
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  )
}

export default ReviewResume