import { Edit, Sparkles } from 'lucide-react'
import React, { useState } from 'react'

const WriteArticle = () => {

  const articleLength = [
    { length: 800, text: 'Short (500-800 words)' },
    { length: 1200, text: 'Medium (800-1200 words)' },
    { length: 1600, text: 'Long (1200+ words)' }
  ]

  const [selectedLength, setSelectedLength] = useState(800)
  const [input, setInput] = useState('')

  const onSubmitHandler = async (e)=> {
    e.preventDefault()
  }



  return (
    <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700'>
      
      {/* Left column */}
      <form className='w-full max-w-lg p-5 bg-white rounded-lg border border-gray-200 space-y-4'>

        {/* Header */}
        <div className='flex items-center gap-3'>
          <Sparkles className='w-6 text-[#4A7AFF]'/>
          <h1 className='text-xl font-semibold'>Article Configuration</h1>
        </div>

        {/* Topic */}
        <div>
          <p className='text-sm font-medium'>Article Topic</p>
          <input  
            type="text"
            className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-200'
            placeholder='The future of artificial intelligence is...'
            required
          />
        </div>

        {/* Length */}
        <div>
          <p className='text-sm font-medium'>Article Length</p>

          <div className='flex flex-wrap gap-2 mt-2'>
            {articleLength.map((item) => (
              <button
                type="button"
                key={item.length}
                onClick={() => setSelectedLength(item.length)}
                className={`px-3 py-1 text-sm rounded-full border transition
                  ${selectedLength === item.length
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`}
              >
                {item.text}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className='w-full mt-4 bg-[#4A7AFF] text-white py-2 rounded-md hover:bg-[#3a63d8] transition'
        >
          Generate Article
        </button>

      </form>

      {/* Right column (output area) */}
      <div className='w-full max-w-lg pg-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 max-h-[600px]'>
        <div className='flex items-center gap-3'>
          <Edit className='w-5 h-5 text-[#4A7AFF]'/>
          <h1 className='text-xl font-semibold'>Generated article </h1>
        </div>
        <div className='flex-1 flex justify-center items-center'>
          <div className='text-sm flex flex-col items-center gap-5 text-gray-400'>
          <Edit className='w-9 h-9'/>
          <p>Enter a topic and click "Generatr articlr" to get started</p>
          </div>

        </div>
      </div>

    </div>
  )
}

export default WriteArticle