import { Heart } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useUser, useAuth } from '@clerk/react'
import axios from 'axios'
import toast from 'react-hot-toast'

const Community = () => {

  const [creations, setCreations] = useState([])
  const [likeLoading, setLikeLoading] = useState(null)

  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()

  const fetchCreations = async () => {
    try {
      const { data } = await axios.get('/api/user/get-published-creations')
      if (data.success) {
        setCreations(data.creations)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const toggleLike = async (creationId) => {
    if (!user) return toast.error('Please sign in to like creations')
    if (likeLoading === creationId) return

    try {
      setLikeLoading(creationId)

      // Optimistic UI update
      setCreations(prev =>
        prev.map(c => {
          if (c.id !== creationId) return c
          const likes = c.likes || []
          const userId = user.id.toString()
          const updated = likes.includes(userId)
            ? likes.filter(u => u !== userId)
            : [...likes, userId]
          return { ...c, likes: updated }
        })
      )

      const token = await getToken()
      const { data } = await axios.post(
        '/api/user/toggle-like-creations',
        { id: creationId },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (!data.success) {
        toast.error(data.message)
        // Revert optimistic update on failure
        fetchCreations()
      }
    } catch (error) {
      toast.error(error.message)
      fetchCreations()
    } finally {
      setLikeLoading(null)
    }
  }

  useEffect(() => {
    fetchCreations()
  }, [])

  if (!isLoaded) return null

  return (
    <div className='flex-1 h-full flex flex-col gap-4 p-6'>

      <h1 className='text-xl font-semibold'>Community Creations</h1>

      <div className='bg-white h-full w-full rounded-xl overflow-y-scroll p-3'>

        {creations.length === 0 ? (
          <p className='text-sm text-gray-400 p-4'>
            No published creations yet. Be the first to share!
          </p>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>

            {creations.map((creation) => {
              const likes = creation.likes || []
              const isLiked = user ? likes.includes(user.id.toString()) : false

              return (
                <div key={creation.id} className='relative group'>

                  <img
                    src={creation.content}
                    alt={creation.prompt || 'Creation'}
                    className='w-full h-60 object-cover rounded-lg'
                  />

                  {/* Overlay */}
                  <div className='absolute inset-0 flex flex-col justify-end p-3 rounded-lg bg-gradient-to-b from-transparent to-black/70 opacity-0 group-hover:opacity-100 transition'>

                    <p className='text-sm text-white mb-2 line-clamp-2'>
                      {creation.prompt}
                    </p>

                    <div className='flex justify-between items-center text-white'>

                      <p>{likes.length} {likes.length === 1 ? 'like' : 'likes'}</p>

                      <button
                        onClick={() => toggleLike(creation.id)}
                        disabled={likeLoading === creation.id}
                        className='focus:outline-none'
                      >
                        <Heart
                          className={`w-5 h-5 cursor-pointer transition transform hover:scale-110
                          ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}
                          ${likeLoading === creation.id ? 'opacity-50' : ''}`}
                        />
                      </button>

                    </div>

                  </div>

                </div>
              )
            })}

          </div>
        )}

      </div>

    </div>
  )
}

export default Community
