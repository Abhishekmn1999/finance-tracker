'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, IndianRupee } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { NumericFormat } from 'react-number-format'

export default function GoalModal({ goal, onClose, onSave }) {
  const [mounted, setMounted] = useState(false)
  const [form, setForm] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '', // Used when adding funds
    deadline: '',
    color: '#6366f1',
    icon: '🎯'
  })
  const [loading, setLoading] = useState(false)
  const [isAddFundsMode, setIsAddFundsMode] = useState(false)
  const [fundAmount, setFundAmount] = useState('')

  useEffect(() => {
    setMounted(true)
    if (goal) {
      setForm({
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        deadline: goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '',
        color: goal.color,
        icon: goal.icon
      })
    }
  }, [goal])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.targetAmount) {
      toast.error('Please fill required fields')
      return
    }
    setLoading(true)

    const method = goal ? 'PUT' : 'POST'
    const url = goal ? `/api/goals/${goal.id}` : '/api/goals'

    let payload = { ...form }
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to save')
      const saved = await res.json()
      toast.success(goal ? 'Goal updated' : 'Goal created')
      onSave(saved)
      onClose()
    } catch {
      toast.error('Failed to save goal')
    } finally {
      setLoading(false)
    }
  }

  const handleAddFunds = async (e) => {
    e.preventDefault()
    if (!fundAmount) return
    setLoading(true)
    
    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addFundsAmount: parseFloat(fundAmount) })
      })
      if (!res.ok) throw new Error('Failed to add funds')
      const saved = await res.json()
      toast.success('Funds added successfully')
      onSave(saved)
      onClose()
    } catch {
      toast.error('Failed to add funds')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted || typeof document === 'undefined') return null

  return createPortal(
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-slide">
        <div className="modal-header">
          <h3>
            {goal ? (isAddFundsMode ? 'Add Funds' : 'Edit Goal') : 'Create Savings Goal'}
          </h3>
          <button className="btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>

        {goal && !isAddFundsMode && (
          <div style={{ padding: '0 20px', marginTop: 10 }}>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', background: 'var(--green)' }}
              onClick={() => setIsAddFundsMode(true)}
            >
              💰 Add Funds to this Goal
            </button>
          </div>
        )}

        {isAddFundsMode ? (
          <form onSubmit={handleAddFunds}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Amount to Add (₹)</label>
                <div className="input-icon-wrap">
                  <IndianRupee size={15} className="icon" />
                  <NumericFormat
                    className="form-input"
                    placeholder="1,000"
                    allowNegative={false}
                    thousandSeparator={true}
                    value={fundAmount}
                    onValueChange={(values) => {
                      const { floatValue } = values;
                      setFundAmount(floatValue || '')
                    }}
                    required
                    autoFocus
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsAddFundsMode(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Adding...' : 'Add Funds'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Goal Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. New Laptop"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>
                <div style={{ width: 60 }}>
                  <label className="form-label">Icon</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.icon}
                    onChange={e => setForm(p => ({ ...p, icon: e.target.value }))}
                  />
                </div>
                <div style={{ width: 50 }}>
                  <label className="form-label">Color</label>
                  <input
                    type="color"
                    className="form-input"
                    style={{ padding: 4 }}
                    value={form.color}
                    onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Target Amount (₹) *</label>
                <div className="input-icon-wrap">
                  <IndianRupee size={15} className="icon" />
                  <NumericFormat
                    className="form-input"
                    placeholder="50,000"
                    allowNegative={false}
                    thousandSeparator={true}
                    value={form.targetAmount}
                    onValueChange={(values) => {
                      const { floatValue } = values;
                      setForm(p => ({ ...p, targetAmount: floatValue || '' }))
                    }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Target Date (Optional)</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.deadline}
                  onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Goal'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  )
}
