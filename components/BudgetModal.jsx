'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, IndianRupee } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { NumericFormat } from 'react-number-format'
import { getCurrentMonth } from '@/lib/utils'

export default function BudgetModal({ budget, onClose, onSave }) {
  const [mounted, setMounted] = useState(false)
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    categoryId: '',
    amount: '',
    month: getCurrentMonth(),
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setMounted(true)
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => {
        const expCats = data.filter(c => c.type === 'EXPENSE')
        setCategories(expCats)
        if (!budget && expCats.length > 0) {
          setForm(p => ({ ...p, categoryId: expCats[0].id }))
        }
      })
  }, [])

  useEffect(() => {
    if (budget) {
      setForm({
        categoryId: budget.categoryId,
        amount: budget.amount,
        month: budget.month,
      })
    }
  }, [budget])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.categoryId || !form.amount || !form.month) {
      setError('Please fill all fields')
      return
    }
    setLoading(true)

    const method = budget ? 'PUT' : 'POST'
    const url = budget ? `/api/budgets/${budget.id}` : '/api/budgets'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }
      const saved = await res.json()
      toast.success(budget ? 'Budget updated' : 'Budget added')
      onSave(saved)
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to save budget')
      setError(err.message || 'Failed to save budget. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted || typeof document === 'undefined') return null

  return createPortal(
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-slide">
        <div className="modal-header">
          <h3>{budget ? 'Edit Budget' : 'Set Budget'}</h3>
          <button className="btn-ghost" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Month</label>
              <input
                type="month"
                className="form-input"
                value={form.month}
                onChange={e => setForm(p => ({ ...p, month: e.target.value }))}
                required
                id="budget-month"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category (Expense)</label>
              <select
                className="form-input filter-select"
                value={form.categoryId}
                onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}
                required
                id="budget-category"
              >
                <option value="">Select category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Budget Amount (₹) *</label>
              <div className="input-icon-wrap">
                <IndianRupee size={15} className="icon" />
                <NumericFormat
                  className="form-input"
                  placeholder="5,000"
                  allowNegative={false}
                  thousandSeparator={true}
                  value={form.amount}
                  onValueChange={(values) => {
                    const { floatValue } = values;
                    setForm(p => ({ ...p, amount: floatValue || '' }))
                  }}
                  required
                  id="budget-amount"
                />
              </div>
            </div>

            {error && <div className="error-msg">{error}</div>}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} id="save-budget-btn">
              {loading ? 'Saving...' : 'Save Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
