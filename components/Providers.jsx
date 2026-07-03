'use client'

import { ThemeProvider } from 'next-themes'
import { Toaster } from 'react-hot-toast'

export default function Providers({ children }) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="dark">
      {children}
      <Toaster 
        position="bottom-right" 
        toastOptions={{
          style: {
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)'
          }
        }} 
      />
    </ThemeProvider>
  )
}
