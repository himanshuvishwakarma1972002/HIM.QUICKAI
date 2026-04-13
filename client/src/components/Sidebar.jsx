import { SignOutButton, useUser, useClerk } from '@clerk/react'
import { Eraser, FileText, Hash, House, Image, LogOut, Scissors, SquarePen, Users } from 'lucide-react'
import React, { useEffect } from 'react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/ai', label: 'Dashboard', icon: House },
  { to: '/ai/write-article', label: 'Write Article', icon: SquarePen },
  { to: '/ai/blog-titles', label: 'Blog Titles', icon: Hash },
  { to: '/ai/generate-images', label: 'Generate Images', icon: Image },
  { to: '/ai/remove-background', label: 'Remove Background', icon: Eraser },
  { to: '/ai/remove-object', label: 'Remove Object', icon: Scissors },
  { to: '/ai/review-resume', label: 'Review Resume', icon: FileText },
  { to: '/ai/community', label: 'Community', icon: Users },
]

const Sidebar = ({ sidebar, setSidebar }) => {
  const { user, isLoaded } = useUser()
  const { openUserProfile } = useClerk()

  // ✅ Force latest data from Clerk
  useEffect(() => {
    if (user) {
      user.reload()
    }
  }, [user])

  // ✅ Safe + case-insensitive plan check
  const userPlan = user?.publicMetadata?.plan?.toLowerCase() || 'free'

  // ✅ Wait until Clerk loads
  if (!isLoaded) return null

  return (
    <div
      className={`w-60 bg-white border-r border-gray-200 flex flex-col max-sm:absolute top-14 bottom-0 left-0 z-10
      ${sidebar ? 'translate-x-0' : 'max-sm:-translate-x-full'}
      transition-all duration-300 ease-in-out`}
    >

      {/* User Section */}
      <div className="my-7 w-full px-3 flex flex-col items-center">
        <img
          src={user?.imageUrl}
          alt="User avatar"
          className="w-16 h-16 rounded-full"
        />
        <h1 className="mt-2 text-center text-sm font-medium text-slate-800 truncate max-w-full px-2">
          {user?.fullName || "Guest"}
        </h1>
      </div>

      {/* Nav Links */}
      <div className='px-3 flex-1'>
        <nav className="w-full flex flex-col gap-1">
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
                    className: `w-4 h-4 ${isActive ? 'text-white' : ''}`,
                  })}
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className='w-full border-t border-gray-200 p-4 flex items-center justify-between'>
        
        {/* Profile */}
        <div 
          onClick={openUserProfile} 
          className='flex gap-2 items-center cursor-pointer'
        >
          <img src={user?.imageUrl} className='w-8 rounded-full' alt='' />

          <div>
            <h1 className='text-sm font-medium'>
              {user?.fullName}
            </h1>

            {/* ✅ FINAL PLAN DISPLAY */}
            <p className="text-xs">
              <span
                className={`font-medium ${
                  userPlan === 'premium'
                    ? 'text-green-600'
                    : 'text-gray-500'
                }`}
              >
                {userPlan === 'premium' ? 'Premium' : 'Free'}
              </span>{' '}
              Plan
            </p>
          </div>
        </div>

        {/* Logout */}
        <SignOutButton>
          <LogOut className='w-5 text-gray-400 hover:text-gray-700 transition cursor-pointer'/>
        </SignOutButton>

      </div>

    </div>
  )
}

export default Sidebar