import { SignOutButton, useUser, useClerk } from '@clerk/react'
import { Eraser, FileText, Hash, House, Image, LogOut, Scissors, SquarePen, Users, MessageSquare } from 'lucide-react'
import React, { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/ai', label: 'Dashboard', icon: House },
  { to: '/ai/write-article', label: 'Write Article', icon: SquarePen },
  { to: '/ai/blog-titles', label: 'Blog Titles', icon: Hash },
  { to: '/ai/generate-images', label: 'Generate Images', icon: Image },
  { to: '/ai/remove-background', label: 'Remove Background', icon: Eraser },
  { to: '/ai/remove-object', label: 'Remove Object', icon: Scissors },
  { to: '/ai/review-resume', label: 'Resume Studio', icon: FileText },
  { to: '/ai/community', label: 'Community', icon: Users },
  { to: '/ai/gpt', label: 'GPT', icon: MessageSquare },
]

const Sidebar = ({ sidebar, setSidebar }) => {
  const { user, isLoaded } = useUser()
  const { openUserProfile } = useClerk()
  const hasReloadedRef = useRef(false)

  useEffect(() => {
    if (isLoaded && user && !hasReloadedRef.current) {
      hasReloadedRef.current = true
      user.reload()
    }
  }, [isLoaded, user])

  const userPlan = user?.publicMetadata?.plan?.toLowerCase() || 'free'

  if (!isLoaded) return null

  return (
    <aside
      className={`
        shrink-0 w-64 max-w-[85vw] bg-white border-r border-gray-200 flex flex-col
        fixed sm:static left-0 z-40 overflow-hidden
        top-14 bottom-0 sm:top-auto sm:bottom-auto sm:h-full
        transition-transform duration-300 ease-in-out shadow-xl sm:shadow-none
        ${sidebar ? 'translate-x-0' : '-translate-x-full'}
        sm:translate-x-0
      `}
    >
      {/* User Section — image + name (mobile + desktop) */}
      <div className="py-4 sm:py-5 px-3 flex flex-col items-center shrink-0 border-b border-gray-100 sm:border-none">
        <img
          src={user?.imageUrl}
          alt="User avatar"
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover"
        />
        <h1 className="mt-2 text-center text-sm font-medium text-slate-800 truncate max-w-full px-2">
          {user?.fullName || 'Guest'}
        </h1>
      </div>

      {/* Nav Links — scrollable middle section */}
      <div className="px-3 py-3 sm:py-2 flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <nav className="w-full flex flex-col gap-1 pb-2">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/ai'}
              onClick={() => setSidebar(false)}
              className={({ isActive }) =>
                `px-3.5 py-2.5 flex items-center gap-3 rounded-md text-sm
                ${isActive
                  ? 'bg-gradient-to-r from-[#3C81F6] to-[#0234EA] text-white'
                  : 'text-gray-700 hover:bg-gray-100'}`
              }
            >
              {({ isActive }) => (
                <>
                  {React.createElement(icon, {
                    className: `w-4 h-4 shrink-0 ${isActive ? 'text-white' : ''}`,
                  })}
                  <span className="truncate">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Section — always pinned on mobile */}
      <div className="mt-auto w-full border-t border-gray-200 p-3 sm:p-4 flex items-center justify-between gap-2 shrink-0 bg-white pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div
          onClick={openUserProfile}
          className="flex gap-2 items-center cursor-pointer min-w-0 flex-1"
        >
          <img
            src={user?.imageUrl}
            className="w-9 h-9 sm:w-8 sm:h-8 rounded-full shrink-0 object-cover"
            alt=""
          />
          <div className="min-w-0">
            <h1 className="text-sm font-medium truncate">{user?.fullName}</h1>
            <p className="text-xs">
              <span
                className={`font-medium ${
                  userPlan === 'premium' ? 'text-green-600' : 'text-gray-500'
                }`}
              >
                {userPlan === 'premium' ? 'Premium' : 'Free'}
              </span>{' '}
              Plan
            </p>
          </div>
        </div>

        <SignOutButton>
          <LogOut className="w-5 h-5 shrink-0 text-gray-400 hover:text-gray-700 transition cursor-pointer" />
        </SignOutButton>
      </div>
    </aside>
  )
}

export default Sidebar
