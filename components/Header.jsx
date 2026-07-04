'use client'

import { useState, useEffect } from 'react'
import { Menu, Bell, Sun, Moon } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useTheme } from 'next-themes'

const pageInfo = {
  '/dashboard': { title: 'Dashboard', desc: 'Your financial overview' },
  '/transactions': { title: 'Transactions', desc: 'All your income & expenses' },
  '/budgets': { title: 'Budgets', desc: 'Set and track monthly budgets' },
  '/analytics': { title: 'Analytics', desc: 'Trends and insights' },
  '/settings': { title: 'Settings', desc: 'Account preferences' },
}

export default function Header({ pathname, onMenuClick }) {
  const info = pageInfo[pathname] || { title: 'FinTrack', desc: '' }
  const today = formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          className="btn-ghost"
          onClick={onMenuClick}
          id="menu-toggle"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
        <div className="header-title">
          <h2>{info.title}</h2>
          <p>{info.desc}</p>
        </div>
      </div>

      <div className="header-actions">
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {today}
        </div>
        <button 
          className="btn-ghost" 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle Theme"
        >
          {mounted ? (theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />) : <div style={{ width: 18, height: 18 }} />}
        </button>
        <button className="btn-ghost" id="notifications-btn" aria-label="Notifications">
          <Bell size={18} />
        </button>
      </div>
    </header>
  )
}
