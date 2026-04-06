import React, { useEffect, useState } from 'react'
import { dummyCreationData } from '../assets/assets'
import { Gem, Sparkles } from 'lucide-react'
import CreationItem from '../components/CreationItem'
import { useUser } from '@clerk/react'

const Dashboard = () => {

  const [creations, setCreations] = useState([])
  const { user, isLoaded } = useUser()

  const getDashboardData = async () => {
    setCreations(dummyCreationData)
  }

  useEffect(() => {
    getDashboardData()
  }, [])

  // ✅ Plan check
  const userPlan = user?.publicMetadata?.plan?.toLowerCase() || 'free'

  // ✅ Wait for Clerk
  if (!isLoaded) return null

  return (
    <div className='h-full overflow-y-scroll p-6'> 

      <div className='flex justify-start gap-4 flex-wrap'>

        {/* Total Creations card */}
        <div className='flex justify-between items-center w-72 p-4 px-6 bg-white rounded-xl border border-gray-200'>
          <div className='text-slate-600'>
            <p className='text-sm'>Total Creations</p>
            <h2 className='text-xl font-semibold'>{creations.length}</h2>
          </div>

          <div className='w-10 h-10 rounded-lg bg-gradient-to-br from-[#3588F2] to-[#0BB0D7] text-white flex justify-center items-center'>
            <Sparkles className='w-5 text-white'/>
          </div>
        </div>

        {/* Active Plan card */}
        <div className='flex justify-between items-center w-72 p-4 px-6 bg-white rounded-xl border border-gray-200'>
          <div className='text-slate-600'>
            <p className='text-sm'>Active Plan</p>

            <h2 className='text-xl font-semibold'>
              <span className={userPlan === 'premium' ? 'text-green-600' : 'text-gray-500'}>
                {userPlan === 'premium' ? 'Premium' : 'Free'}
              </span>
            </h2>
          </div>

          <div className='w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF61C5] to-[#9E53EE] text-white flex justify-center items-center'>
            <Gem className='w-5 text-white'/>
          </div>
        </div>

      </div>

      {/* Recent Creations */}
      <div className='space-y-3'>
        <p className='mt-6 mb-4'>Recent Creations</p>

        {
          creations.map((item) => (
            <CreationItem key={item.id} item={item} />
          ))
        }
      </div>
    
    </div>
  )
}

export default Dashboard