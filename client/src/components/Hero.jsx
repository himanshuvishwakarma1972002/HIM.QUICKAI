'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Bot, Zap, Users, Loader2 } from 'lucide-react' // Removed 'Play' icon
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// AI Theme Typing Code
const codeString = `{
  "task": "Generate Content",
  "model": "Him.Ai-v2",
  "prompt": "Write a catchy blog title",
  "status": "Success",
  "output": [
    "Transform Ideas to Reality",
    "The Future of AI Content"
  ]
}`

export default function Hero() {
  const [typedCode, setTypedCode] = useState('')
  const navigate = useNavigate();
  
  // Typing Effect Logic
  useEffect(() => {
    let i = 0;
    let typing = true;
    let timeout;
    function type() {
      if (typing && i <= codeString.length) {
        setTypedCode(codeString.slice(0, i));
        i++;
        timeout = setTimeout(type, 50); 
      } else if (!typing && i >= 0) {
        setTypedCode(codeString.slice(0, i));
        i--;
        timeout = setTimeout(type, 20);
      } else {
        typing = !typing;
        if (typing) i = 0; else i = codeString.length;
        timeout = setTimeout(type, 800); 
      }
    }
    type();
    return () => clearTimeout(timeout);
  }, []);

  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden min-h-screen flex items-center">
      
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-gradient-to-br from-[#f3e8ff] via-white to-[#e0f2fe]" />
        {/* Subtle grid effect */}
        <svg className="absolute inset-0 w-full h-full opacity-30" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#d8b4fe" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Subtle animated circuit background */}
      <svg className="absolute inset-0 w-full h-full z-0 opacity-40 pointer-events-none" viewBox="0 0 1440 600" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g>
          <motion.path
            d="M 0 500 Q 200 400 400 500 T 800 500 T 1200 500 T 1440 500"
            stroke="#9333ea"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
            filter="url(#glow)"
          />
          <motion.path
            d="M 0 550 Q 300 450 600 550 T 1200 550 T 1440 550"
            stroke="#3b82f6"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut', delay: 0.5 }}
            filter="url(#glow)"
          />
          <motion.path
            d="M 0 580 Q 400 520 800 580 T 1440 580"
            stroke="#d8b4fe"
            strokeWidth="1"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut', delay: 1 }}
            filter="url(#glow)"
          />
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
        </g>
      </svg>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8 max-w-xl lg:max-w-2xl mx-auto lg:mx-0"
          >
            <div className="space-y-4">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="text-5xl md:text-6xl lg:text-7xl font-bold font-display leading-tight tracking-tight text-gray-900 drop-shadow-sm"
              >
                Create amazing <br /> content with <br />
                <span className="bg-gradient-to-r from-purple-600 via-violet-500 to-blue-500 bg-clip-text text-transparent">
                  Him.Ai Tools
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-2xl font-normal"
              >
                Generate articles, blog titles, images, and more. The best way to create content with AI. Transform your ideas into reality.
              </motion.p>
            </div>

            {/* ACTION BUTTON (Only 'Start creating now' is kept) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button 
                onClick={() => navigate('/ai')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl font-medium flex items-center justify-center group shadow-lg shadow-purple-500/30 transition-all duration-300 w-max"
              >
                Start creating now
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex items-center space-x-6 text-sm text-gray-500 font-medium"
            >
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span>Trusted by 10k+</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span>Lightning Fast</span>
              </div>
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-purple-500" />
                <span>Advanced AI</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Visual */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="relative"
          >
            {/* Main Window Frame */}
            <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              
              {/* Removed the top dot bar. 3D Video now starts right from the top */}
              
              {/* 3D Video Section */}
              <div className="relative w-full h-48 sm:h-56 bg-gradient-to-br from-indigo-900 via-purple-900 to-black overflow-hidden group">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                >
                  <source
                    src="https://assets.mixkit.co/videos/preview/mixkit-artificial-intelligence-neural-network-animation-loop-9717-large.mp4"
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>

                {/* AI Core Active Badge */}
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center space-x-2 shadow-lg">
                  <div className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </div>
                  <span className="text-white/90 text-xs font-semibold tracking-wide">AI Core Active</span>
                </div>

                {/* Bottom Gradient Fade */}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-gray-900 to-transparent"></div>
              </div>

              {/* Typing Code Section */}
              <div className="p-6 space-y-4 bg-white/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                    <span className="text-sm font-mono text-gray-600">POST</span>
                    <span className="text-sm font-mono text-purple-600">/api/v1/generate</span>
                  </div>
                  <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded-full border border-green-200">200 OK</span>
                </div>
                
                <div className="bg-gray-900 rounded-lg p-4 shadow-inner border border-gray-800 relative">
                  <pre className="text-xs text-purple-300 font-mono min-h-[140px] whitespace-pre-wrap transition-all duration-300">
                    {typedCode}
                    <span className="animate-pulse text-white">_</span>
                  </pre>
                </div>
              </div>

            </div>
            
            {/* Floating Elements */}
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-6 -right-6 bg-white rounded-xl p-3 shadow-xl border border-gray-100"
            >
              <Bot className="w-8 h-8 text-purple-600" />
            </motion.div>
            
            <motion.div
              animate={{ y: [10, -10, 10] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-6 -left-6 bg-white rounded-xl p-3 shadow-xl border border-gray-100"
            >
              <Sparkles className="w-8 h-8 text-blue-500" />
            </motion.div>

          </motion.div>
        </div>
      </div>
    </section>
  )
}