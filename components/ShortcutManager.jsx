'use client'

import { useState, useEffect } from 'react'
import { Command } from 'lucide-react'
import { useShortcuts } from '@/hooks/useShortcuts'

export default function ShortcutManager() {
  const { shortcuts, updateShortcuts } = useShortcuts()
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    if (!editing) return

    const handleKeyDown = (e) => {
      e.preventDefault()
      
      const key = e.key.toLowerCase()
      if (key === 'escape') {
        setEditing(null)
        return
      }

      const isShift = e.shiftKey
      const isCtrl = e.ctrlKey
      const isAlt = e.altKey

      let combo = []
      if (isCtrl) combo.push('ctrl')
      if (isAlt) combo.push('alt')
      if (isShift) combo.push('shift')
      if (key !== 'shift' && key !== 'control' && key !== 'alt') {
        combo.push(key)
      }

      const comboStr = combo.join('+')
      
      // Only set if an actual character was pressed with/without modifiers
      if (combo.length > 0 && !['shift', 'ctrl', 'alt'].includes(comboStr)) {
        updateShortcuts({ ...shortcuts, [editing]: comboStr })
        setEditing(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editing, shortcuts, updateShortcuts])

  const routes = [
    { id: 'dashboard', label: 'Go to Dashboard' },
    { id: 'transactions', label: 'Go to Transactions' },
    { id: 'analytics', label: 'Go to Analytics' },
    { id: 'goals', label: 'Go to Goals' },
    { id: 'settings', label: 'Go to Settings' },
    { id: 'addTransaction', label: 'Add Transaction Modal' },
  ]

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Command size={20} color="var(--accent)" />
        <h3 style={{ margin: 0 }}>Keyboard Shortcuts</h3>
      </div>
      
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
        Click on a shortcut to change it, then press your desired key combination. Press <kbd>Esc</kbd> to cancel.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {routes.map(route => (
          <div key={route.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px', background: 'var(--bg-input)',
            borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)'
          }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{route.label}</span>
            <button
              className={`btn ${editing === route.id ? 'btn-primary' : 'btn-secondary btn-sm'}`}
              onClick={() => setEditing(route.id)}
              style={{ minWidth: 100, justifyContent: 'center' }}
            >
              {editing === route.id ? 'Listening...' : shortcuts[route.id].toUpperCase()}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
