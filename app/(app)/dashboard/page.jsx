'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDate, formatMonth } from '@/lib/utils'
import TransactionModal from '@/components/TransactionModal'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316']

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '0.8rem',
      }}>
        <div style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, fontWeight: 600 }}>
            {p.name}: {formatCurrency(p.value)}
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/analytics', { cache: 'no-store' })
      const json = await res.json()
      setData(json)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    const handleOpenModal = () => setShowModal(true)
    window.addEventListener('openAddTransactionModal', handleOpenModal)
    return () => window.removeEventListener('openAddTransactionModal', handleOpenModal)
  }, [])

  const stats = data?.stats || {}
  const trend = (data?.monthlyTrend || []).map(m => ({
    ...m, label: formatMonth(m.month),
  }))
  const catData = (data?.categoryBreakdown || []).slice(0, 6)
  const recentTx = data?.recentTransactions || []

  if (loading) return (
    <div>
      <div className="stats-grid">
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-lg)' }} />)}
      </div>
    </div>
  )

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {session?.user?.name?.split(' ')[0]} 👋</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Here&apos;s your financial overview for this month</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} id="add-tx-btn">
          <Plus size={16} /> Add Transaction
        </button>
      </div>

      {/* Stats grid */}
      <div className="stats-grid">
        <div className="stat-card" style={{ '--stat-color': 'var(--accent)', '--stat-bg': 'var(--accent-glow)' }}>
          <div className="stat-info">
            <div className="stat-label">Total Balance</div>
            <div className="stat-value" style={{ color: stats.balance >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {formatCurrency(Math.abs(stats.balance || 0))}
            </div>
            <div className={`stat-change ${stats.balance >= 0 ? 'up' : 'down'}`}>
              {stats.balance >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {stats.balance >= 0 ? 'Positive balance' : 'Deficit this month'}
            </div>
          </div>
          <div className="stat-icon">💰</div>
        </div>

        <div className="stat-card" style={{ '--stat-color': 'var(--green)', '--stat-bg': 'var(--green-light)' }}>
          <div className="stat-info">
            <div className="stat-label">Monthly Income</div>
            <div className="stat-value" style={{ color: 'var(--green)' }}>{formatCurrency(stats.income || 0)}</div>
            <div className="stat-change up"><TrendingUp size={12} /> This month</div>
          </div>
          <div className="stat-icon">📈</div>
        </div>

        <div className="stat-card" style={{ '--stat-color': 'var(--red)', '--stat-bg': 'var(--red-light)' }}>
          <div className="stat-info">
            <div className="stat-label">Monthly Expenses</div>
            <div className="stat-value" style={{ color: 'var(--red)' }}>{formatCurrency(stats.expense || 0)}</div>
            <div className="stat-change down"><TrendingDown size={12} /> This month</div>
          </div>
          <div className="stat-icon">📉</div>
        </div>

        <div className="stat-card" style={{ '--stat-color': 'var(--yellow)', '--stat-bg': 'var(--yellow-light)' }}>
          <div className="stat-info">
            <div className="stat-label">Monthly Savings</div>
            <div className="stat-value" style={{ color: 'var(--yellow)' }}>
              {formatCurrency((stats.income || 0) - (stats.expense || 0))}
            </div>
            <div className="stat-change up"><PiggyBank size={12} /> {stats.savingsRate || 0}% of income saved</div>
          </div>
          <div className="stat-icon">🐷</div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Monthly trend */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Income vs Expenses</div>
              <div className="chart-sub">Last 6 months trend</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trend} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category breakdown */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Expense by Category</div>
              <div className="chart-sub">Current month breakdown</div>
            </div>
          </div>
          {catData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={catData}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%" cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {catData.map((entry, i) => (
                    <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={v => formatCurrency(v)} />
                <Legend
                  formatter={(value) => <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🎯</div>
              <p>No expenses this month yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Pending Recurring Items */}
      {data?.recurringItems && data.recurringItems.length > 0 && (
        <div className="chart-card" style={{ marginBottom: 24, borderLeft: '4px solid var(--accent)' }}>
          <div className="chart-header">
            <div>
              <div className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingDown size={18} color="var(--accent)" /> 
                Pending Recurring Transactions
              </div>
              <div className="chart-sub">You have {data.recurringItems.length} recurring items scheduled. (Mock processing)</div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
              Process All
            </button>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="chart-card">
        <div className="chart-header">
          <div>
            <div className="chart-title">Recent Transactions</div>
            <div className="chart-sub">Your latest activity</div>
          </div>
          <Link href="/transactions" className="btn btn-secondary btn-sm">
            View All <ArrowRight size={14} />
          </Link>
        </div>

        {recentTx.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💸</div>
            <h3>No transactions yet</h3>
            <p>Add your first transaction to get started</p>
          </div>
        ) : (
          <div>
            {recentTx.map(tx => (
              <div key={tx.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                borderBottom: '1px solid var(--border)',
              }}>
                <div className="tx-category-icon" style={{ background: `${tx.category?.color}20` }}>
                  {tx.category?.icon}
                </div>
                <div className="tx-info" style={{ flex: 1 }}>
                  <h4>{tx.description}</h4>
                  <p>{tx.category?.name} • {formatDate(tx.date)}</p>
                </div>
                <div className={tx.type === 'INCOME' ? 'amount-income' : 'amount-expense'}>
                  {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <TransactionModal
          onClose={() => setShowModal(false)}
          onSave={() => fetchData()}
        />
      )}
    </div>
  )
}
