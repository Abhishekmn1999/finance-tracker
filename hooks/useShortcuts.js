'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const DEFAULT_SHORTCUTS = {
  dashboard: 'shift+d',
  transactions: 'shift+t',
  analytics: 'shift+a',
  goals: 'shift+g',
  settings: 'shift+s',
  addTransaction: 'shift+n',
}

export function useShortcuts() {
  const router = useRouter()
  const [shortcuts, setShortcuts] = useState(DEFAULT_SHORTCUTS)

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('fintrack_shortcuts')
    if (saved) {
      setShortcuts(JSON.parse(saved))
    }
  }, [])

  // Save to local storage
  const updateShortcuts = (newShortcuts) => {
    setShortcuts(newShortcuts)
    localStorage.setItem('fintrack_shortcuts', JSON.stringify(newShortcuts))
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return

      const key = e.key.toLowerCase()
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

      // Map combo to route
      if (comboStr === shortcuts.addTransaction) window.dispatchEvent(new Event('openAddTransactionModal'))
      else if (comboStr === shortcuts.dashboard) router.push('/dashboard')
      else if (comboStr === shortcuts.transactions) router.push('/transactions')
      else if (comboStr === shortcuts.analytics) router.push('/analytics')
      else if (comboStr === shortcuts.goals) router.push('/goals')
      else if (comboStr === shortcuts.settings) router.push('/settings')
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, router])

  return { shortcuts, updateShortcuts }
}
