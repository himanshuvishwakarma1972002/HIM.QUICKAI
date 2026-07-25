import React, { useEffect, useRef } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Layout from './pages/Layout'
import Dashboard from './pages/Dashboard'
import WriteArticle from './pages/WriteArticle'
import BlogTitles from './pages/BlogTitles'
import GenerateImages from './pages/GenerateImages'
import RemoveBackground from './pages/RemoveBackground'
import RemoveObject from './pages/RemoveObject'
import ReviewResime from './pages/ReviewResime'
import Commnity from './pages/Commnity'
import AiChat from './pages/AiChat.jsx'
import { Toaster } from 'react-hot-toast'
import { useAuth } from '@clerk/react'

const App = () => {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const tokenLoggedRef = useRef(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || tokenLoggedRef.current) return

    tokenLoggedRef.current = true
    getToken()
      .then((token) => {
        if (token) {
          console.log('[Clerk] Session token:', token)
        }
      })
      .catch((err) => {
        console.error('[Clerk] Failed to get token:', err?.message || err)
      })
  }, [isLoaded, isSignedIn])

  return (
    <div>
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={10}
        containerStyle={{
          top: 80,
          right: 16,
          zIndex: 99999,
        }}
        toastOptions={{
          duration: 4500,
          style: {
            maxWidth: 360,
            fontSize: 13,
            padding: '10px 14px',
          },
          error: {
            duration: 6000,
            style: {
              maxWidth: 380,
            },
          },
        }}
      />

      <Routes>
        <Route path='/' element={<Home />} />

        <Route path='/ai' element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path='write-article' element={<WriteArticle />} />
          <Route path='blog-titles' element={<BlogTitles />} />
          <Route path='generate-images' element={<GenerateImages />} />
          <Route path='remove-background' element={<RemoveBackground />} />
          <Route path='remove-object' element={<RemoveObject />} />
          <Route path='review-resume' element={<ReviewResime />} />
          <Route path='community' element={<Commnity />} />

          {/* ✅ GPT / AI CHAT PAGE */}
          <Route path='gpt' element={<AiChat />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App