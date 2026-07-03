'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { User, Mail, Globe, Save } from 'lucide-react'
import { toast } from 'react-hot-toast'
import CategoryManager from '@/components/CategoryManager'
import ShortcutManager from '@/components/ShortcutManager'

const currencies = [
  { code: 'INR', label: '₹ Indian Rupee' },
  { code: 'USD', label: '$ US Dollar' },
  { code: 'EUR', label: '€ Euro' },
  { code: 'GBP', label: '£ British Pound' },
]

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const [form, setForm] = useState({
    name: session?.user?.name || '',
    currency: session?.user?.currency || 'INR',
  })
  const [loading, setLoading] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        await update({ name: form.name, currency: form.currency })
        toast.success('Settings saved successfully!')
      } else {
        toast.error('Failed to save settings')
      }
    } catch {
      toast.error('An error occurred while saving')
    } finally {
      setLoading(false)
    }
  }

  const initials = session?.user?.name
    ? session.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Manage your account preferences</p>
        </div>
      </div>

      {/* Profile card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem', fontWeight: 800, overflow: 'hidden',
          }}>
            {session?.user?.image ? (
              <img src={session.user.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : initials}
          </div>
          <div>
            <h3>{session?.user?.name || 'User'}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{session?.user?.email}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--accent-light)', marginTop: 4 }}>FinTrack Member</p>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="input-icon-wrap">
              <User size={15} className="icon" />
              <input
                type="text"
                className="form-input"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                id="settings-name"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-icon-wrap">
              <Mail size={15} className="icon" />
              <input
                type="email"
                className="form-input"
                value={session?.user?.email || ''}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Default Currency</label>
            <div className="input-icon-wrap">
              <Globe size={15} className="icon" />
              <select
                className="form-input filter-select"
                value={form.currency}
                onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}
                id="settings-currency"
              >
                {currencies.map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} id="save-settings-btn" style={{ alignSelf: 'flex-start' }}>
            <Save size={15} />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3>Custom Categories</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
            Add new categories or delete existing ones.
          </div>
          {/* We will build out a separate CategoryManager component to keep this clean, or just add a simple form here. 
              Let's create a CategoryManager component to inject here. */}
          <CategoryManager />
        </div>
      </div>

      <ShortcutManager />

      {/* App info */}
      <div className="card">
        <h3 style={{ marginBottom: 12 }}>About FinTrack</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <div>Version: <span style={{ color: 'var(--text-primary)' }}>1.0.0</span></div>
          <div>Stack: <span style={{ color: 'var(--text-primary)' }}>Next.js 16 + Prisma + PostgreSQL</span></div>
        </div>
      </div>
    </div>
  )
}
