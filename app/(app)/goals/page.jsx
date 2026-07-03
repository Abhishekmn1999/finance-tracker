'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Pencil, Target } from 'lucide-react'
import GoalModal from '@/components/GoalModal'
import { formatCurrency } from '@/lib/utils'

export default function GoalsPage() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'add' | goal object
  const [deleteId, setDeleteId] = useState(null)

  const fetchGoals = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/goals', { cache: 'no-store' })
      const data = await res.json()
      setGoals(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGoals()
  }, [])

  const handleDelete = async (id) => {
    await fetch(`/api/goals/${id}`, { method: 'DELETE' })
    setDeleteId(null)
    fetchGoals()
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Savings Goals</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Track progress towards your financial targets
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>
          <Plus size={16} /> New Goal
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : goals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <h3>No goals set</h3>
          <p>Create a savings goal to start tracking your progress.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {goals.map(goal => {
            const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
            const isCompleted = pct >= 100
            
            return (
              <div key={goal.id} className="card" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ 
                      width: 48, height: 48, borderRadius: '50%', background: `${goal.color}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem'
                    }}>
                      {goal.icon}
                    </div>
                    <div>
                      <h3 style={{ margin: 0 }}>{goal.name}</h3>
                      {goal.deadline && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Target: {new Date(goal.deadline).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn-ghost" onClick={() => setModal(goal)}>
                      <Pencil size={14} />
                    </button>
                    <button className="btn-ghost" onClick={() => setDeleteId(goal.id)} style={{ color: 'var(--red)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{formatCurrency(goal.currentAmount)}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>of {formatCurrency(goal.targetAmount)}</span>
                  </div>
                  
                  <div className="progress-wrap" style={{ height: 12, background: 'var(--border)' }}>
                    <div 
                      className="progress-bar" 
                      style={{ 
                        width: `${pct}%`, 
                        background: isCompleted ? 'var(--green)' : goal.color,
                        height: '100%',
                        borderRadius: 6
                      }} 
                    />
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.8rem', fontWeight: 600 }}>
                    <span style={{ color: isCompleted ? 'var(--green)' : 'var(--text)' }}>
                      {isCompleted ? '🎉 Goal Completed!' : `${pct}% reached`}
                    </span>
                    {!isCompleted && (
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {formatCurrency(goal.targetAmount - goal.currentAmount)} left
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="modal-overlay">
          <div className="modal animate-slide" style={{ maxWidth: 380 }}>
            <div className="modal-header"><h3>Delete Goal</h3></div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)' }}>
                Are you sure you want to delete this goal? This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteId)}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <GoalModal
          goal={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => fetchGoals()}
        />
      )}
    </div>
  )
}
