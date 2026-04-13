import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { HashRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/react'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Missing #root element')

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
if (!publishableKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY')

createRoot(rootEl).render(
  <StrictMode>
    <ClerkProvider publishableKey={publishableKey}>
      <HashRouter>
        <App />
      </HashRouter>
    </ClerkProvider>
  </StrictMode>
)
