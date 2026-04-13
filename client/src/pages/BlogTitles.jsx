import React, { useState } from 'react'
import { Hash, Sparkles } from 'lucide-react'

const BlogTitles = () => {

  const blogCategories = [
    'General', 'Technology', 'Business', 'Health',
    'Lifestyle', 'Education', 'Travel', 'Food'
  ]

  const [selectedCategory, setSelectedCategory] = useState('General')
  const [input, setInput] = useState('')

  const onSubmitHandler = (e) => {
    e.preventDefault()
    console.log(input, selectedCategory)
  }

  return (
    <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700'>
      
      {/* Left column */}
      <form 
        onSubmit={onSubmitHandler}
        className='w-full max-w-lg p-5 bg-white rounded-lg border border-gray-200 space-y-4'
      >

        {/* Header */}
        <div className='flex items-center gap-3'>
          <Sparkles className='w-6 text-[#8E37EB]'/>
          <h1 className='text-xl font-semibold'>AI Title Generator</h1>
        </div>

        {/* Keyword */}
        <div>
          <p className='text-sm font-medium'>Keyword</p>
          <input  
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300 focus:ring-2 focus:ring-purple-200'
            placeholder='The future of artificial intelligence is...'
            required
          />
        </div>

        {/* Category */}
        <div>
          <p className='text-sm font-medium'>Category</p>

          <div className='flex flex-wrap gap-2 mt-2'>
            {blogCategories.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setSelectedCategory(item)}
                className={`px-3 py-1 text-sm rounded-full border transition
                  ${selectedCategory === item
                    ? 'bg-[#8E37EB] text-white border-[#8E37EB]'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className='w-full mt-4 bg-[#C341F6] text-white py-2 rounded-md hover:bg-[#8E37EB] transition flex items-center justify-center gap-2'
        >
          <Hash className='w-4 h-4'/>
          Generate Title
        </button>

      </form>

      {/* Right column */}
      <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96'>
        
        <div className='flex items-center gap-3'>
          <Hash className='w-5 h-5 text-[#8E37EB]'/>
          <h1 className='text-xl font-semibold'>Generated Titles</h1>
        </div>

        <div className='flex-1 flex justify-center items-center'>
          <div className='text-sm flex flex-col items-center gap-5 text-gray-400 text-center'>
            <Hash className='w-9 h-9'/>
            <p>Enter a topic and click "Generate Title" to get started</p>
          </div>
        </div>

      </div>

    </div>
  )
}

export default BlogTitles