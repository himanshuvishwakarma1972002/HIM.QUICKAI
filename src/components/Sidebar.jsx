import { useUser } from '@clerk/react'
import React from 'react'

const Sidebar = ({ Sidebar }) => {
    const { user } = useUser()


  return (
    <div className={`w-60 bg-white border-r border-gray-200 flex flex-col justify-between items-center max-sm:absolute top-14 bottom-0 ${Sidebar ? 'translate-x-0' : 'max-sm:-translate-x-full'} transition-all duration-300 ease-in-out`}>
        
<div className='my-7 w-full'>
    <img src={user?.imageUrl} alt='User avatar' className='w-13 rounded-full mx-auto'/>
    <h1 className='mt-1 text-center'>{user?.fullName}</h1>
</div>

    </div>
  )
}

export default Sidebar 