import { Menu, X } from 'lucide-react'
import React, { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import Sidebar from '../components/Sidebar'
import { SignIn, useUser } from '@clerk/react'

const Layout = () => {
  const navigate = useNavigate()
  const [sidebar, setSidebar] = useState(false)
  const { user } = useUser()

  return user ? (
    <div className='flex flex-col h-screen bg-[#F4F7FB]'>

      {/* Navbar */}
      <nav className='flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200'>
        
        {/* Logo */}
        <img 
          src={assets.logo} 
          alt='logo' 
          className='w-32 cursor-pointer'
          onClick={() => navigate('/')} 
        />

        {/* Menu Icon */}
        {
          sidebar ? (
            <X 
              className='w-6 h-6 text-gray-600 sm:hidden cursor-pointer'
              onClick={() => setSidebar(false)}
            />
          ) : (
            <Menu 
              className='w-6 h-6 text-gray-600 sm:hidden cursor-pointer'
              onClick={() => setSidebar(true)}
            />
          )
        }
      </nav>

      {/* Main Layout */}
      <div className='flex flex-1 w-full min-h-0 h-[calc(100vh-64px)]'>
        
        {/* Sidebar */}
        <Sidebar 
          sidebar={sidebar} 
          setSidebar={setSidebar} 
          user={user} 
        />

        {/* Content */}
        <div className='flex-1 min-w-0 overflow-auto bg-[#F4F7FB]'>
          <Outlet />
        </div>

      </div>

    </div>
  ) : (
    <div className='flex items-center justify-center h-screen'>
      <SignIn />
    </div>
  )
}

export default Layout