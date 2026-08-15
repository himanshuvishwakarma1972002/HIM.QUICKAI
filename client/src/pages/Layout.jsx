import { Menu, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import Sidebar from '../components/Sidebar'
import { SignIn, useUser } from '@clerk/react'

const Layout = () => {
  const navigate = useNavigate()
  const [sidebar, setSidebar] = useState(false)
  const { user, isLoaded } = useUser()

  useEffect(() => {
    const closeOnResize = () => {
      if (window.innerWidth >= 640) setSidebar(false)
    }
    window.addEventListener('resize', closeOnResize)
    return () => window.removeEventListener('resize', closeOnResize)
  }, [])

  useEffect(() => {
    document.body.style.overflow = sidebar ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebar])

  // Wait for Clerk before deciding signed-in vs SignIn (avoids broken session/token)
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F4F7FB] text-gray-500 text-sm">
        Loading…
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <SignIn forceRedirectUrl="/ai" fallbackRedirectUrl="/ai" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-[#F4F7FB] overflow-hidden">
      <nav className="relative z-50 flex h-14 shrink-0 items-center justify-between px-4 bg-white border-b border-gray-200">
        <img
          src={assets.logo}
          alt="Him.Ai logo"
          className="h-8 w-auto max-w-[140px] sm:max-w-[176px] cursor-pointer object-contain"
          onClick={() => navigate('/')}
        />

        <button
          type="button"
          aria-label={sidebar ? 'Close menu' : 'Open menu'}
          className="sm:hidden p-2 -mr-2 rounded-lg text-gray-600 hover:bg-gray-100"
          onClick={() => setSidebar((prev) => !prev)}
        >
          {sidebar ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      <div className="relative flex flex-1 min-h-0 w-full">
        {sidebar && (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 top-14 z-30 bg-black/40 sm:hidden"
            onClick={() => setSidebar(false)}
          />
        )}

        <Sidebar sidebar={sidebar} setSidebar={setSidebar} />

        <main className="flex-1 min-w-0 w-full overflow-y-auto overflow-x-hidden bg-[#F4F7FB]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
