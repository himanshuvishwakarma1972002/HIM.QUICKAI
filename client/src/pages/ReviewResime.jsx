import {
  Briefcase,
  Building2,
  ClipboardCheck,
  Copy,
  FileTextIcon,
  Sparkles,
  Target,
  UploadCloud,
  Wand2,
  X,
} from 'lucide-react'
import React, { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '@clerk/react'
import Markdown from 'react-markdown'
import { getClerkAuthToken } from '../utils/auth'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL

const ACCEPTED_RESUME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
])

const ACCEPTED_RESUME_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt']

const TABS = [
  {
    id: 'review',
    label: 'Resume Review',
    icon: FileTextIcon,
    description: 'Get expert feedback on strengths & improvements',
  },
  {
    id: 'ats',
    label: 'ATS Checker',
    icon: Target,
    description: 'Score your resume against a job description',
  },
  {
    id: 'tailor',
    label: 'Tailored Resume',
    icon: Wand2,
    description: 'Build a resume customized for a company role',
  },
]

const isAcceptedResumeFile = (file) => {
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  return (
    ACCEPTED_RESUME_TYPES.has(file.type) ||
    ACCEPTED_RESUME_EXTENSIONS.includes(ext)
  )
}

const getScoreColor = (score) => {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-amber-500'
  return 'text-red-500'
}

const getScoreRing = (score) => {
  if (score >= 80) return 'border-green-500 text-green-600'
  if (score >= 60) return 'border-amber-500 text-amber-500'
  return 'border-red-500 text-red-500'
}

const ReviewResume = () => {
  const [activeTab, setActiveTab] = useState('review')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [companyName, setCompanyName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [profileInfo, setProfileInfo] = useState('')
  const [result, setResult] = useState('')
  const [atsScore, setAtsScore] = useState(null)
  const [loading, setLoading] = useState(false)

  const { getToken } = useAuth()

  const resetResult = () => {
    setResult('')
    setAtsScore(null)
  }

  const switchTab = (tabId) => {
    setActiveTab(tabId)
    resetResult()
  }

  const onSubmitHandler = async (e) => {
    e.preventDefault()

    if (activeTab === 'review' && !file) {
      return toast.error('Please upload a resume file')
    }

    if (activeTab === 'ats') {
      if (!file) return toast.error('Please upload your resume')
      if (!jobDescription.trim()) return toast.error('Please paste the job description')
    }

    if (activeTab === 'tailor') {
      if (!jobDescription.trim()) return toast.error('Please paste the job description')
      if (!companyName.trim() && !jobTitle.trim()) {
        return toast.error('Enter the company name or job title')
      }
      if (!file && !profileInfo.trim()) {
        return toast.error('Upload a resume or fill in your background details')
      }
    }

    try {
      setLoading(true)
      resetResult()

      const formData = new FormData()
      formData.append('mode', activeTab)
      if (file) formData.append('resume', file)
      if (companyName.trim()) formData.append('companyName', companyName.trim())
      if (jobTitle.trim()) formData.append('jobTitle', jobTitle.trim())
      if (jobDescription.trim()) formData.append('jobDescription', jobDescription.trim())
      if (profileInfo.trim()) formData.append('profileInfo', profileInfo.trim())

      const token = await getClerkAuthToken(getToken)

      const { data } = await axios.post('/api/ai/resume-review', formData, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 120000,
      })

      if (data.success) {
        setResult(data.content)
        setAtsScore(data.atsScore ?? null)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      const message =
        error.code === 'ECONNABORTED'
          ? 'Request timed out. Try a smaller file or check your connection.'
          : error.response?.data?.message || error.message
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0]

    if (selectedFile) {
      if (!isAcceptedResumeFile(selectedFile)) {
        toast.error('Only PDF, DOC, DOCX, and TXT files are allowed')
        return
      }

      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File too large (max 5MB)')
        return
      }

      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
      resetResult()
    }
  }

  const removeFile = () => {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview(null)
    resetResult()
  }

  const submitLabels = {
    review: 'Analyze Resume',
    ats: 'Run ATS Check',
    tailor: 'Generate Tailored Resume',
  }

  const loadingLabels = {
    review: 'Analyzing...',
    ats: 'Scanning ATS...',
    tailor: 'Building Resume...',
  }

  const resultTitles = {
    review: 'Review Results',
    ats: 'ATS Report',
    tailor: 'Your Tailored Resume',
  }

  const ActiveTabIcon = TABS.find((t) => t.id === activeTab)?.icon || FileTextIcon

  const fileRequired = activeTab === 'review' || activeTab === 'ats'
  const fileOptional = activeTab === 'tailor'
  const showJobFields = activeTab === 'ats' || activeTab === 'tailor'
  const showProfileField = activeTab === 'tailor'

  return (
    <div className='h-full overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 bg-gradient-to-br from-gray-50 to-gray-100'>

      {/* Page header */}
      <div className='flex items-center gap-3'>
        <div className='p-2.5 bg-green-100 rounded-xl'>
          <Sparkles className='w-5 h-5 text-green-600' />
        </div>
        <div>
          <h1 className='text-xl font-semibold text-gray-900'>Resume Studio</h1>
          <p className='text-sm text-gray-500'>Review, ATS-check, and build job-tailored resumes</p>
        </div>
      </div>

      {/* Tabs */}
      <div className='flex flex-wrap gap-2'>
        {TABS.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type='button'
              onClick={() => switchTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition border
                ${active
                  ? 'bg-green-600 text-white border-green-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-700'
                }`}
            >
              <Icon className='w-4 h-4' />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className='flex flex-wrap gap-6 flex-1'>

        {/* LEFT PANEL */}
        <form
          onSubmit={onSubmitHandler}
          className='w-full lg:w-[440px] p-6 bg-white rounded-2xl shadow-md border border-gray-200 space-y-5'
        >
          <p className='text-sm text-gray-500'>
            {TABS.find((t) => t.id === activeTab)?.description}
          </p>

          {/* Job fields */}
          {showJobFields && (
            <div className='space-y-4 p-4 rounded-xl bg-gray-50 border border-gray-100'>
              <p className='text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5'>
                <Briefcase className='w-3.5 h-3.5' />
                Target Role
              </p>

              <div>
                <label className='text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-1.5'>
                  <Building2 className='w-3.5 h-3.5 text-gray-400' />
                  Company Name {activeTab === 'tailor' && <span className='text-red-400'>*</span>}
                </label>
                <input
                  type='text'
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder='e.g. Google, Amazon, TCS'
                  className='w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/40 focus:border-green-400'
                />
              </div>

              <div>
                <label className='text-sm font-medium text-gray-700 mb-1.5 block'>
                  Job Title {activeTab === 'tailor' && <span className='text-red-400'>*</span>}
                </label>
                <input
                  type='text'
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder='e.g. Frontend Developer, Data Analyst'
                  className='w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/40 focus:border-green-400'
                />
              </div>

              <div>
                <label className='text-sm font-medium text-gray-700 mb-1.5 block'>
                  Job Description <span className='text-red-400'>*</span>
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder='Paste the full job description here — responsibilities, requirements, skills...'
                  rows={6}
                  className='w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400/40 focus:border-green-400'
                />
              </div>
            </div>
          )}

          {/* Profile info for tailor without resume */}
          {showProfileField && (
            <div>
              <label className='text-sm font-medium text-gray-700 mb-1.5 block'>
                Your Background {!file && <span className='text-red-400'>*</span>}
                {file && <span className='text-gray-400 font-normal'> (optional)</span>}
              </label>
              <textarea
                value={profileInfo}
                onChange={(e) => setProfileInfo(e.target.value)}
                placeholder='Name, email, years of experience, skills, education, past roles, achievements...'
                rows={5}
                className='w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400/40 focus:border-green-400'
              />
              <p className='text-xs text-gray-400 mt-1'>
                Fill this if you don&apos;t have a resume file to upload
              </p>
            </div>
          )}

          {/* File upload */}
          <div>
            <p className='text-sm font-medium mb-2'>
              {fileRequired ? (
                <>Upload Resume <span className='text-red-400'>*</span></>
              ) : (
                <>Upload Existing Resume <span className='text-gray-400 font-normal'>(optional)</span></>
              )}
            </p>

            <label className='relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-400 transition bg-gray-50 overflow-hidden'>

              {file ? (
                <>
                  <FileTextIcon className='w-9 h-9 text-green-500' />
                  <p className='text-xs mt-2 px-3 text-center text-gray-600 truncate max-w-full'>
                    {file.name}
                  </p>
                  <button
                    type='button'
                    onClick={(e) => {
                      e.preventDefault()
                      removeFile()
                    }}
                    className='absolute top-2 right-2 bg-white/90 p-1.5 rounded-full shadow'
                  >
                    <X className='w-4 h-4 text-red-500' />
                  </button>
                </>
              ) : (
                <div className='flex flex-col items-center text-gray-400'>
                  <UploadCloud className='w-8 h-8 mb-2' />
                  <p className='text-sm'>Click to Upload</p>
                  <span className='text-xs mt-0.5'>PDF, DOC, DOCX, TXT · max 5MB</span>
                </div>
              )}

              <input
                type='file'
                accept='.pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain'
                onChange={handleFileUpload}
                className='hidden'
              />
            </label>

            {fileOptional && !file && (
              <p className='text-xs text-amber-600 mt-1.5 flex items-center gap-1'>
                <ClipboardCheck className='w-3.5 h-3.5' />
                No file? Fill in your background above instead
              </p>
            )}
          </div>

          <button
            disabled={loading}
            type='submit'
            className='w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2.5 rounded-lg flex items-center justify-center gap-2 shadow hover:opacity-90 transition disabled:opacity-60'
          >
            {loading ? (
              <span className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
            ) : (
              <ActiveTabIcon className='w-4 h-4' />
            )}
            {loading ? loadingLabels[activeTab] : submitLabels[activeTab]}
          </button>
        </form>

        {/* RIGHT PANEL */}
        <div className='flex-1 min-w-[300px] p-6 bg-white rounded-2xl shadow-md border border-gray-200 flex flex-col min-h-[560px]'>

          <div className='flex justify-between items-center mb-4 flex-wrap gap-2'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-green-100 rounded-lg'>
                <FileTextIcon className='w-5 h-5 text-green-600' />
              </div>
              <h2 className='text-lg font-semibold'>{resultTitles[activeTab]}</h2>
            </div>

            {result && (
              <button
                type='button'
                onClick={() => {
                  navigator.clipboard.writeText(result)
                  toast.success('Copied!')
                }}
                className='flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition'
              >
                <Copy className='w-4 h-4' />
                Copy
              </button>
            )}
          </div>

          {/* ATS Score badge */}
          {atsScore !== null && (
            <div className='flex items-center gap-4 mb-5 p-4 rounded-xl bg-gray-50 border border-gray-100'>
              <div
                className={`w-16 h-16 rounded-full border-4 flex items-center justify-center font-bold text-lg ${getScoreRing(atsScore)}`}
              >
                {atsScore}
              </div>
              <div>
                <p className='text-sm font-semibold text-gray-800'>ATS Compatibility Score</p>
                <p className={`text-sm font-medium ${getScoreColor(atsScore)}`}>
                  {atsScore >= 80
                    ? 'Great match — minor tweaks recommended'
                    : atsScore >= 60
                      ? 'Moderate match — add missing keywords'
                      : 'Low match — significant tailoring needed'}
                </p>
              </div>
            </div>
          )}

          <div className='flex-1 flex flex-col'>

            {result ? (
              <div className='w-full overflow-y-auto flex-1 pr-2'>
                <div className='prose prose-sm max-w-none text-slate-700 leading-relaxed'>
                  <Markdown>{result}</Markdown>
                </div>
              </div>
            ) : (
              <div className='flex-1 flex flex-col justify-center items-center gap-4 text-gray-400 text-center px-4'>
                {activeTab === 'review' && (
                  <>
                    <FileTextIcon className='w-12 h-12 opacity-50' />
                    <p className='text-sm'>
                      Upload your resume to get <span className='text-green-600 font-medium'>expert feedback</span> on strengths, weaknesses, and improvements
                    </p>
                  </>
                )}
                {activeTab === 'ats' && (
                  <>
                    <Target className='w-12 h-12 opacity-50' />
                    <p className='text-sm'>
                      Upload resume + paste job description to get an <span className='text-green-600 font-medium'>ATS compatibility score</span>, keyword analysis, and fixes
                    </p>
                  </>
                )}
                {activeTab === 'tailor' && (
                  <>
                    <Wand2 className='w-12 h-12 opacity-50' />
                    <p className='text-sm'>
                      Enter company details and job description to <span className='text-green-600 font-medium'>generate a tailored resume</span> optimized for that role
                    </p>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

export default ReviewResume
