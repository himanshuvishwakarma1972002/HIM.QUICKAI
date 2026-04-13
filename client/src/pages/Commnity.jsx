import { Heart } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { dummyPublishedCreationData } from '../assets/assets'

const Commnity = () => {

  const [creations, setCreations] = useState([])

  // Dummy fallback (remove if using real auth)
  const user = { id: "123" }

  const fetchCreations = async () => {
    // Replace with API later
    setCreations(dummyPublishedCreationData)
  }

  useEffect(() => {
    if (user) {
      fetchCreations()
    }
  }, [user])

  return (
    <div className='flex-1 h-full flex flex-col gap-4 p-6'> 
        
      <h1 className='text-xl font-semibold'>Creations</h1>

      <div className='bg-white h-full w-full rounded-xl overflow-y-scroll p-3'>
        
        {/* ✅ Grid Layout */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          
          {creations.map((creation, index) => (

            <div key={index} className='relative group'>
              
              <img 
                src={creation.content} 
                alt='' 
                className='w-full h-60 object-cover rounded-lg'
              />

              {/* Overlay */}
              <div className='absolute inset-0 flex flex-col justify-end p-3 rounded-lg bg-gradient-to-b from-transparent to-black/70 opacity-0 group-hover:opacity-100 transition'>
                
                <p className='text-sm text-white mb-2'>
                  {creation.prompt}
                </p>

                <div className='flex justify-between items-center text-white'>
                  
                  <p>{creation.likes.length} likes</p>

                  <Heart 
                    className={`w-5 h-5 cursor-pointer transition transform hover:scale-110 
                    ${creation.likes?.includes(user?.id) 
                      ? 'fill-red-500 text-red-500' 
                      : 'text-white'}`}
                  />
                </div>

              </div>

            </div>

          ))}

        </div>

      </div>  

    </div>
  )
}

export default Commnity