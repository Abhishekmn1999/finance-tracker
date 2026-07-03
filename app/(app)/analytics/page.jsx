'use client'

import { useState, useEffect } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts'
import { Download } from 'lucide-react'
import { formatCurrency, formatMonth, getLastNMonths } from '@/lib/utils'

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

export default function AnalyticsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [])

  const trend = (data?.monthlyTrend || []).map(m => ({
    ...m,
    label: formatMonth(m.month),
    savings: Math.max(0, m.income - m.expense),
  }))

  const catData = data?.categoryBreakdown || []
  const topCats = catData.slice(0, 5)

  if (loading) return (
    <div style={{ display: 'grid', gap: 20 }}>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 280, borderRadius: 'var(--radius-lg)' }} />)}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1>Analytics</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Visualize your financial trends over time
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => window.print()}>
          <Download size={16} /> Print PDF
        </button>
      </div>

      {/* Income vs Expense Bar Chart */}
      <div className="chart-card">
        <div className="chart-header">
          <div>
            <div className="chart-title">📊 Income vs Expenses</div>
            <div className="chart-sub">Last 6 months comparison</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={trend} barGap={6} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={(v) => <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{v}</span>} />
            <Bar dataKey="income" name="Income" fill="#10b981" radius={[6,6,0,0]} />
            <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Savings Trend */}
      <div className="chart-card">
        <div className="chart-header">
          <div>
            <div className="chart-title">💰 Savings Trend</div>
            <div className="chart-sub">Monthly savings over time</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={trend}>
            <defs>
              <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="savings" name="Savings" stroke="#6366f1"
              strokeWidth={2.5} fill="url(#savingsGrad)" dot={{ fill: '#6366f1', r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Category breakdown */}
      <div className="grid-2">
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">🍩 Expense Categories</div>
              <div className="chart-sub">Current month breakdown</div>
            </div>
          </div>
          {catData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={catData}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%" cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {catData.map((entry, i) => (
                    <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={v => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <p>No expense data available</p>
            </div>
          )}
        </div>

        {/* Top spending categories list */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">🏆 Top Spending Categories</div>
              <div className="chart-sub">Current month</div>
            </div>
          </div>
          {topCats.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎯</div>
              <p>No spending this month</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
              {topCats.map((cat, i) => {
                const maxAmt = topCats[0].amount
                const pct = Math.round((cat.amount / maxAmt) * 100)
                return (
                  <div key={cat.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          width: 20, height: 20, borderRadius: '50%',
                          background: cat.color, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '0.7rem',
                        }}>
                          {i + 1}
                        </span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{cat.icon} {cat.name}</span>
                      </div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--red)' }}>
                        {formatCurrency(cat.amount)}
                      </span>
                    </div>
                    <div className="progress-wrap">
                      <div className="progress-bar" style={{ width: `${pct}%`, background: cat.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
