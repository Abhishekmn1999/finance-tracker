'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, Receipt, PieChart, Target,
  Settings, LogOut, X,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: Receipt },
  { href: '/analytics', label: 'Analytics', icon: PieChart },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ user, mobileOpen, onClose }) {
  const pathname = usePathname()

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 99, backdropFilter: 'blur(4px)',
          }}
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Logo */}
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">💰</div>
            <span className="sidebar-logo-text">FinTrack</span>
          {/* Mobile close */}
          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ marginLeft: 'auto', display: 'none' }}
            id="sidebar-close"
          >
            <X size={18} />
          </button>
        </div>
        </Link>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">Main Menu</div>
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`nav-item ${pathname === href || pathname.startsWith(href + '/') ? 'active' : ''}`}
              onClick={onClose}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="sidebar-footer">
          <div className="user-card" style={{ marginBottom: 8 }}>
            <div className="user-avatar">
              {user?.image ? <img src={user.image} alt={user.name} /> : initials}
            </div>
            <div className="user-info">
              <div className="user-name">{user?.name || 'User'}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="btn btn-secondary w-full"
            style={{ justifyContent: 'center', gap: 8, fontSize: '0.8rem', padding: '8px' }}
            id="logout-btn"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
