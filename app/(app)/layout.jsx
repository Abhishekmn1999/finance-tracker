'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { SessionProvider, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { useShortcuts } from '@/hooks/useShortcuts'

function AppLayoutInner({ children }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  
  useShortcuts()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: 'var(--text-secondary)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>💰</div>
          <div>Loading FinTrack...</div>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="app-layout">
      <Sidebar
        user={session.user}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="main-content">
        <Header pathname={pathname} onMenuClick={() => setMobileOpen(true)} />
        <main key={pathname} className="page-content animate-page-enter">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function AppLayout({ children }) {
  return (
    <SessionProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </SessionProvider>
  )
}
