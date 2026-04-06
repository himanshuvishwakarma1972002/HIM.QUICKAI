import React, { useState } from 'react'
import Markdown from 'react-markdown'

const CreationItem = ({ item }) => {

    const [expanded, setExpanded] = useState(false)

  return (
    <div onClick={()=> setExpanded(!expanded)} className='p-4 max-w-5xl text-sm bg-white border border-gray-200 rounded-lg cursor-pointer hover:shadow-sm transition'>
      
      <div className='flex justify-between items-center gap-4'>
        
        <div>
          <h2 className='font-medium text-slate-800'>
            {item?.prompt || "No prompt"}
          </h2>

          <p className='text-gray-500 text-xs mt-1'>
            {item?.type} -{" "}
            {item?.created_at
              ? new Date(item.created_at).toLocaleDateString()
              : "No date"}
          </p>
        </div>

        <button className='bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] px-4 py-1 rounded-full text-xs'>
          {item?.type || "N/A"}
        </button>

      </div>
      {
         expanded && (
        <div>
            {item.type === 'image' ? (
              <div>
                <img src={item.content} alt="image" className='mt-3 w-full max-w-md'/>
              </div>
            ) : (
                <div className='mt-3 h-full overflow-y-scroll text-sm text-slate-700'>
                    <div className='reset-tw'>
                        <Markdown>{item.content}</Markdown>
                        
                    </div>

                </div>

            )}
        </div>

         )
      }
    </div>
  )
}

export default CreationItem