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
        className='w-full max-w-lg p-6 bg-white rounded-2xl shadow-md border space-y-6'
      >

        {/* Header */}
        <div className='flex items-center gap-3'>
          <div className='p-2 rounded-lg bg-green-100'>
            <Sparkles className='w-5 h-5 text-green-600'/>
          </div>
          <h1 className='text-lg font-semibold'>Resume Analyzer</h1>
        </div>

        {/* Upload Box */}
        <label className='relative flex flex-col items-center justify-center h-44 border-2 border-dashed rounded-xl cursor-pointer bg-gray-100 hover:border-green-400 transition'>

          {file ? (
            <>
              <FileTextIcon className='w-10 h-10 text-green-500 mb-2'/>
              <p className='text-xs text-center px-2'>{file.name}</p>

              <button
                onClick={(e)=>{e.preventDefault(); removeFile()}}
                className='absolute top-2 right-2 bg-white p-1 rounded-full shadow'
              >
                <X className='w-4 text-red-500'/>
              </button>
            </>
          ) : (
            <>
              <UploadCloud className='w-8 text-gray-400 mb-1'/>
              <p className='text-sm text-gray-500'>Upload Resume</p>
              <span className='text-xs text-gray-400'>PDF only</span>
            </>
          )}

          <input type="file" accept="application/pdf"
            onChange={handleFileUpload}
            className='hidden'/>
        </label>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className='w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2.5 rounded-lg flex items-center justify-center gap-2 shadow'
        >
          {loading
            ? <span className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></span>
            : <FileTextIcon className='w-4 h-4'/>
          }
          {loading ? "Analyzing..." : "Review Resume"}
        </button>

      </form>

      {/* RIGHT PANEL */}
      <div className='w-full max-w-lg p-6 bg-white rounded-2xl shadow-md border flex flex-col min-h-[520px]'>

        {/* Header */}
        <div className='flex justify-between items-center mb-4'>
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
              className='flex items-center gap-1 text-sm bg-gray-100 px-3 py-1.5 rounded hover:bg-gray-200'
            >
              <Copy className='w-4'/>
              Copy
            </button>
          )}
        </div>

        {/* Content */}
        {!result ? (
          <div className='flex-1 flex flex-col justify-center items-center text-gray-400 text-center gap-3'>
            <FileTextIcon className='w-10 h-10 opacity-60'/>
            <p className='text-sm'>
              Upload your resume and click <span className='text-green-500 font-medium'>Review Resume</span>
            </p>
          </div>
        ) : (
          <div className='flex-1 overflow-y-auto pr-2 custom-scrollbar'>

            <div className='prose prose-sm max-w-none text-slate-700 leading-relaxed'>
              <Markdown>{result}</Markdown>
            </div>

          </div>
        )}

      </div>

    </div>
  )
}

export default ReviewResume