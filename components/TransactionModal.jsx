'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Calendar, IndianRupee, Image as ImageIcon } from 'lucide-react'
import { NumericFormat } from 'react-number-format'
import { toast } from 'react-hot-toast'

export default function TransactionModal({ transaction, onClose, onSave }) {
  const [mounted, setMounted] = useState(false)
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    description: '',
    amount: '',
    categoryId: '',
    type: 'EXPENSE',
    date: new Date().toISOString().split('T')[0],
    note: '',
    receiptImage: '',
    isRecurring: false,
    recurringInterval: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setMounted(true)
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => {
        setCategories(data)
        if (!transaction && data.length > 0) {
          const expCats = data.filter(c => c.type === 'EXPENSE')
          if (expCats.length > 0) setForm(p => ({ ...p, categoryId: expCats[0].id }))
        }
      })
  }, [])

  useEffect(() => {
    if (transaction) {
      setForm({
        description: transaction.description,
        amount: transaction.amount,
        categoryId: transaction.categoryId,
        type: transaction.type,
        date: new Date(transaction.date).toISOString().split('T')[0],
        note: transaction.note || '',
        receiptImage: transaction.receiptImage || '',
        isRecurring: transaction.isRecurring || false,
        recurringInterval: transaction.recurringInterval || ''
      })
    }
  }, [transaction])

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        const MAX = 800
        if (width > height && width > MAX) {
          height *= MAX / width
          width = MAX
        } else if (height > MAX) {
          width *= MAX / height
          height = MAX
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        const base64 = canvas.toDataURL('image/jpeg', 0.6)
        setForm(p => ({ ...p, receiptImage: base64 }))
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.amount || !form.categoryId || !form.description) {
      setError('Please fill all required fields')
      return
    }
    setLoading(true)

    const method = transaction ? 'PUT' : 'POST'
    const url = transaction ? `/api/transactions/${transaction.id}` : '/api/transactions'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to save transaction')
      const saved = await res.json()
      toast.success(transaction ? 'Transaction updated' : 'Transaction added')
      onSave(saved)
      onClose()
    } catch (err) {
      toast.error(err.message || 'Error saving transaction')
      setError(err.message || 'Failed to save transaction. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filteredCategories = categories.filter(c => c.type === form.type)

  if (!mounted || typeof document === 'undefined') return null

  return createPortal(
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-slide">
        <div className="modal-header">
          <h3>{transaction ? 'Edit Transaction' : 'New Transaction'}</h3>
          <button className="btn-ghost" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className="modal-body">
            <div className="tx-type-selector">
              <button
                type="button"
                className={`tx-type-btn ${form.type === 'EXPENSE' ? 'expense' : ''}`}
                onClick={() => {
                  setForm(p => ({ ...p, type: 'EXPENSE', categoryId: categories.find(c => c.type === 'EXPENSE')?.id || '' }))
                }}
              >
                Expense
              </button>
              <button
                type="button"
                className={`tx-type-btn ${form.type === 'INCOME' ? 'income' : ''}`}
                onClick={() => {
                  setForm(p => ({ ...p, type: 'INCOME', categoryId: categories.find(c => c.type === 'INCOME')?.id || '' }))
                }}
              >
                Income
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Amount (₹) *</label>
              <div className="input-icon-wrap">
                <IndianRupee size={15} className="icon" />
                <NumericFormat
                  className="form-input"
                  placeholder="10,000"
                  allowNegative={false}
                  thousandSeparator={true}
                  value={form.amount}
                  onValueChange={(values) => {
                    const { floatValue } = values;
                    setForm(p => ({ ...p, amount: floatValue || '' }))
                  }}
                  required
                  id="tx-amount"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Groceries"
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                required
                id="tx-description"
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  className="form-input filter-select"
                  value={form.categoryId}
                  onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}
                  required
                  id="tx-category"
                >
                  <option value="">Select category</option>
                  {filteredCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Date *</label>
                <div className="input-icon-wrap">
                  <Calendar size={15} className="icon" />
                  <input
                    type="date"
                    className="form-input"
                    value={form.date}
                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    required
                    id="tx-date"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Receipt Image (Optional)</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                  <ImageIcon size={16} /> Upload Receipt
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>
                {form.receiptImage && (
                  <div style={{ position: 'relative' }}>
                    <img src={form.receiptImage} alt="Receipt Preview" style={{ height: 40, borderRadius: 4 }} />
                    <button 
                      type="button" 
                      onClick={() => setForm(p => ({ ...p, receiptImage: '' }))}
                      style={{ position: 'absolute', top: -5, right: -5, background: 'var(--red)', color: 'white', borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 2 }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={form.isRecurring} onChange={e => setForm(p => ({ ...p, isRecurring: e.target.checked }))} />
                  Make this recurring
                </label>
              </div>
              {form.isRecurring && (
                <div className="form-group">
                  <select
                    className="form-input filter-select"
                    value={form.recurringInterval}
                    onChange={e => setForm(p => ({ ...p, recurringInterval: e.target.value }))}
                    required={form.isRecurring}
                  >
                    <option value="">Select interval</option>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Note (Optional)</label>
              <textarea
                className="form-input"
                placeholder="Add a note..."
                rows={2}
                value={form.note}
                onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                id="tx-note"
              />
            </div>

            {error && <div className="error-msg">{error}</div>}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} id="save-tx-btn">
              {loading ? 'Saving...' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
