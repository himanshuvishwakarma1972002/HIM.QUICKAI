import { Download, Heart, Info, Mail, User, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useUser, useAuth } from '@clerk/react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { getClerkAuthToken } from '../utils/auth'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL

const Community = () => {
  const [creations, setCreations] = useState([])
  const [likeLoading, setLikeLoading] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [selectedCreation, setSelectedCreation] = useState(null)
  const [detailsData, setDetailsData] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)

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

      const token = await getClerkAuthToken(getToken)
      const { data } = await axios.post(
        '/api/user/toggle-like-creations',
        { id: creationId },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (!data.success) {
        toast.error(data.message)
        fetchCreations()
      }
    } catch (error) {
      toast.error(error.message)
      fetchCreations()
    } finally {
      setLikeLoading(null)
    }
  }

  const downloadImage = async (creation) => {
    if (downloadingId === creation.id) return

    const filename = `him-ai-${creation.id}.png`
    const imageUrl = creation.content?.includes('cloudinary.com')
      ? creation.content.replace('/upload/', '/upload/fl_attachment/')
      : creation.content

    try {
      setDownloadingId(creation.id)

      try {
        const response = await fetch(imageUrl, { mode: 'cors' })
        if (!response.ok) throw new Error('fetch failed')
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
      } catch {
        const link = document.createElement('a')
        link.href = imageUrl
        link.download = filename
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        document.body.appendChild(link)
        link.click()
        link.remove()
      }

      toast.success('Image downloaded')
    } catch {
      toast.error('Download failed. Try again.')
    } finally {
      setDownloadingId(null)
    }
  }

  const openDetails = async (creation) => {
    if (!user) return toast.error('Please sign in to view details')

    setSelectedCreation(creation)
    setDetailsOpen(true)
    setDetailsLoading(true)
    setDetailsData(null)

    try {
      const token = await getClerkAuthToken(getToken)
      const { data } = await axios.get(
        `/api/user/get-creation-likes/${creation.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        setDetailsData(data)
      } else {
        toast.error(data.message)
        setDetailsOpen(false)
      }
    } catch (error) {
      toast.error(error.message)
      setDetailsOpen(false)
    } finally {
      setDetailsLoading(false)
    }
  }

  const closeDetails = () => {
    setDetailsOpen(false)
    setSelectedCreation(null)
    setDetailsData(null)
  }

  const formatDate = (date) => {
    if (!date) return 'Unknown date'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
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
                <div key={creation.id} className='relative group rounded-lg overflow-hidden border border-gray-100 shadow-sm'>

                  <img
                    src={creation.content}
                    alt={creation.prompt || 'Creation'}
                    className='w-full h-60 object-cover'
                  />

                  {/* Visual gradient only — must not block clicks */}
                  <div className='absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/75 opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 transition pointer-events-none' />

                  {/* Top action buttons — always above overlay */}
                  <div className='absolute top-2 right-2 z-20 flex gap-1.5 pointer-events-auto'>
                    <button
                      type='button'
                      onClick={(e) => {
                        e.stopPropagation()
                        downloadImage(creation)
                      }}
                      disabled={downloadingId === creation.id}
                      title='Download image'
                      className='p-2 rounded-full bg-white shadow-md hover:bg-white hover:scale-105 transition disabled:opacity-50'
                    >
                      <Download className='w-4 h-4 text-gray-700' />
                    </button>

                    <button
                      type='button'
                      onClick={(e) => {
                        e.stopPropagation()
                        openDetails(creation)
                      }}
                      title='View details & likes'
                      className='p-2 rounded-full bg-white shadow-md hover:bg-white hover:scale-105 transition'
                    >
                      <Info className='w-4 h-4 text-gray-700' />
                    </button>
                  </div>

                  {/* Bottom overlay content */}
                  <div className='absolute inset-x-0 bottom-0 z-10 p-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition pointer-events-auto'>

                    <p className='text-sm text-white mb-2 line-clamp-2 drop-shadow'>
                      {creation.prompt}
                    </p>

                    <div className='flex justify-between items-center text-white'>

                      <button
                        type='button'
                        onClick={(e) => {
                          e.stopPropagation()
                          openDetails(creation)
                        }}
                        className='text-sm hover:underline'
                      >
                        {likes.length} {likes.length === 1 ? 'like' : 'likes'}
                      </button>

                      <button
                        type='button'
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleLike(creation.id)
                        }}
                        disabled={likeLoading === creation.id}
                        className='focus:outline-none p-1'
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

      {detailsOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50'
          onClick={closeDetails}
        >
          <div
            className='bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-center justify-between p-4 border-b border-gray-100'>
              <h2 className='text-lg font-semibold'>Creation Details</h2>
              <button
                type='button'
                onClick={closeDetails}
                className='p-1.5 rounded-lg hover:bg-gray-100 transition'
              >
                <X className='w-5 h-5 text-gray-500' />
              </button>
            </div>

            <div className='overflow-y-auto p-4 space-y-5'>

              {selectedCreation && (
                <img
                  src={selectedCreation.content}
                  alt={selectedCreation.prompt || 'Creation'}
                  className='w-full h-48 object-cover rounded-xl'
                />
              )}

              {detailsLoading ? (
                <div className='flex justify-center py-8'>
                  <span className='w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin' />
                </div>
              ) : detailsData ? (
                <>
                  <div className='space-y-2'>
                    <p className='text-xs font-medium text-gray-400 uppercase tracking-wide'>Prompt</p>
                    <p className='text-sm text-gray-700 leading-relaxed'>
                      {detailsData.creation?.prompt || 'No prompt'}
                    </p>
                    <p className='text-xs text-gray-400'>
                      Published {formatDate(detailsData.creation?.created_at)}
                    </p>
                  </div>

                  <div className='space-y-2'>
                    <p className='text-xs font-medium text-gray-400 uppercase tracking-wide'>Creator</p>
                    <div className='flex items-center gap-3 p-3 rounded-xl bg-gray-50'>
                      {detailsData.creator?.image ? (
                        <img
                          src={detailsData.creator.image}
                          alt={detailsData.creator.name}
                          className='w-10 h-10 rounded-full object-cover'
                        />
                      ) : (
                        <div className='w-10 h-10 rounded-full bg-green-100 flex items-center justify-center'>
                          <User className='w-5 h-5 text-green-600' />
                        </div>
                      )}
                      <div className='min-w-0'>
                        <p className='text-sm font-medium text-gray-800 truncate'>
                          {detailsData.creator?.name}
                        </p>
                        <p className='text-xs text-gray-500 flex items-center gap-1 truncate'>
                          <Mail className='w-3 h-3 shrink-0' />
                          {detailsData.creator?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <p className='text-xs font-medium text-gray-400 uppercase tracking-wide'>
                      Liked by ({detailsData.likers?.length || 0})
                    </p>

                    {detailsData.likers?.length > 0 ? (
                      <ul className='space-y-2 max-h-48 overflow-y-auto'>
                        {detailsData.likers.map((liker) => (
                          <li
                            key={liker.id}
                            className='flex items-center gap-3 p-3 rounded-xl bg-gray-50'
                          >
                            {liker.image ? (
                              <img
                                src={liker.image}
                                alt={liker.name}
                                className='w-9 h-9 rounded-full object-cover'
                              />
                            ) : (
                              <div className='w-9 h-9 rounded-full bg-green-100 flex items-center justify-center'>
                                <User className='w-4 h-4 text-green-600' />
                              </div>
                            )}
                            <div className='min-w-0'>
                              <p className='text-sm font-medium text-gray-800 truncate'>
                                {liker.name}
                              </p>
                              <p className='text-xs text-gray-500 flex items-center gap-1 truncate'>
                                <Mail className='w-3 h-3 shrink-0' />
                                {liker.email}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className='text-sm text-gray-400 py-2'>No likes yet</p>
                    )}
                  </div>

                  {selectedCreation && (
                    <button
                      type='button'
                      onClick={() => downloadImage(selectedCreation)}
                      disabled={downloadingId === selectedCreation.id}
                      className='w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50'
                    >
                      <Download className='w-4 h-4' />
                      {downloadingId === selectedCreation.id ? 'Downloading...' : 'Download Image'}
                    </button>
                  )}
                </>
              ) : null}

            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Community
