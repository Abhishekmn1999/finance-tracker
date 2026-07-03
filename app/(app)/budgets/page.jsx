'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, AlertTriangle, CheckCircle, Target } from 'lucide-react'
import { formatCurrency, calcPercent, getBudgetStatus, getCurrentMonth, formatMonth } from '@/lib/utils'
import BudgetModal from '@/components/BudgetModal'

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [month, setMonth] = useState(getCurrentMonth())

  const fetchBudgets = async () => {
    setLoading(true)
    const res = await fetch(`/api/budgets?month=${month}`, { cache: 'no-store' })
    const data = await res.json()
    setBudgets(data)
    setLoading(false)
  }

  useEffect(() => { fetchBudgets() }, [month])

  const handleDelete = async (id) => {
    await fetch(`/api/budgets/${id}`, { method: 'DELETE' })
    setDeleteId(null)
    fetchBudgets()
  }

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0)
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0)
  const overallPct = calcPercent(totalSpent, totalBudget)
  const overallStatus = getBudgetStatus(totalSpent, totalBudget)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Budgets</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Set and track your monthly spending limits
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            type="month"
            className="filter-select"
            value={month}
            onChange={e => setMonth(e.target.value)}
            id="budget-month-filter"
          />
          <button className="btn btn-primary" onClick={() => setShowModal(true)} id="add-budget-btn">
            <Plus size={16} /> Set Budget
          </button>
        </div>
      </div>

      {/* Overall summary */}
      {budgets.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3>Overall Budget — {formatMonth(month)}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 2 }}>
                {formatCurrency(totalSpent)} of {formatCurrency(totalBudget)} spent ({overallPct}%)
              </p>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              color: overallStatus === 'safe' ? 'var(--green)' : overallStatus === 'warning' ? 'var(--yellow)' : 'var(--red)',
              fontWeight: 700, fontSize: '0.875rem',
            }}>
              {overallStatus === 'safe' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
              {overallStatus === 'safe' ? 'On track' : overallStatus === 'warning' ? 'Watch out' : 'Over budget!'}
            </div>
          </div>
          <div className="progress-wrap">
            <div
              className={`progress-bar progress-${overallStatus}`}
              style={{ width: `${overallPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Budget cards */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : budgets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <h3>No budgets set for {formatMonth(month)}</h3>
          <p>Click &quot;Set Budget&quot; to create your first monthly budget</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {budgets.map(budget => {
            const pct = calcPercent(budget.spent, budget.amount)
            const status = getBudgetStatus(budget.spent, budget.amount)
            const statusColor = status === 'safe' ? 'var(--green)' : status === 'warning' ? 'var(--yellow)' : 'var(--red)'

            return (
              <div key={budget.id} className="budget-card">
                <div className="budget-card-header">
                  <div className="budget-category">
                    <div
                      className="budget-icon"
                      style={{
                        width: 40, height: 40,
                        background: `${budget.category?.color}20`,
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.2rem',
                      }}
                    >
                      {budget.category?.icon}
                    </div>
                    <div>
                      <div className="budget-name">{budget.category?.name}</div>
                      <div style={{ fontSize: '0.7rem', color: statusColor, fontWeight: 600 }}>
                        {pct}% used
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn-ghost"
                    onClick={() => setDeleteId(budget.id)}
                    style={{ color: 'var(--text-muted)' }}
                    id={`del-budget-${budget.id}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="progress-wrap" style={{ marginBottom: 10 }}>
                  <div
                    className={`progress-bar progress-${status}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Spent: <span style={{ color: statusColor, fontWeight: 700 }}>{formatCurrency(budget.spent)}</span>
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Budget: <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{formatCurrency(budget.amount)}</span>
                  </span>
                </div>

                {status === 'danger' && (
                  <div style={{
                    marginTop: 10, padding: '6px 10px',
                    background: 'var(--red-light)', borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem', color: 'var(--red)',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <AlertTriangle size={12} />
                    Over budget by {formatCurrency(budget.spent - budget.amount)}!
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="modal-overlay">
          <div className="modal animate-slide" style={{ maxWidth: 380 }}>
            <div className="modal-header"><h3>Delete Budget</h3></div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)' }}>Remove this budget? Your transactions won&apos;t be affected.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteId)} id="confirm-delete-budget">
                <Trash2 size={14} /> Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <BudgetModal
          onClose={() => setShowModal(false)}
          onSave={() => { fetchBudgets(); setShowModal(false) }}
        />
      )}
    </div>
  )
}
