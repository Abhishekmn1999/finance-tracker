'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Plus, Pencil, Trash2, Download, Upload } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import TransactionModal from '@/components/TransactionModal'
import { toast } from 'react-hot-toast'
import Papa from 'papaparse'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'add' | transaction object
  const [deleteId, setDeleteId] = useState(null)
  const [filters, setFilters] = useState({
    search: '', type: '', categoryId: '', startDate: '', endDate: ''
  })
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(15)
  const fileInputRef = useRef(null)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page, limit })
    if (filters.search) params.set('search', filters.search)
    if (filters.type) params.set('type', filters.type)
    if (filters.categoryId) params.set('categoryId', filters.categoryId)
    if (filters.startDate) params.set('startDate', filters.startDate)
    if (filters.endDate) params.set('endDate', filters.endDate)

    const res = await fetch(`/api/transactions?${params}`, { cache: 'no-store' })
    const data = await res.json()
    setTransactions(data.transactions || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [filters, page, limit])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])
  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(setCategories)
  }, [])

  useEffect(() => {
    const handleOpenModal = () => setModal('add')
    window.addEventListener('openAddTransactionModal', handleOpenModal)
    return () => window.removeEventListener('openAddTransactionModal', handleOpenModal)
  }, [])

  const handleDelete = async (id) => {
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
    setDeleteId(null)
    fetchTransactions()
  }

  const pages = Math.ceil(total / limit)

  const handleExportCSV = () => {
    if (transactions.length === 0) return
    const headers = ['Date,Description,Category,Type,Amount,Note']
    const rows = transactions.map(tx => {
      const date = new Date(tx.date).toISOString().split('T')[0]
      const desc = `"${tx.description.replace(/"/g, '""')}"`
      const cat = `"${tx.category?.name || ''}"`
      const note = `"${tx.note?.replace(/"/g, '""') || ''}"`
      return `${date},${desc},${cat},${tx.type},${tx.amount},${note}`
    })
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleImportCSV = (e) => {
    const file = e.target.files[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        setLoading(true)
        try {
          const res = await fetch('/api/transactions/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(results.data)
          })
          if (!res.ok) {
            const error = await res.json()
            throw new Error(error.error || 'Import failed')
          }
          toast.success('Transactions imported successfully!')
          fetchTransactions()
        } catch (err) {
          toast.error(err.message)
        } finally {
          setLoading(false)
          if (fileInputRef.current) fileInputRef.current.value = ''
        }
      }
    })
  }

  return (
    <div>
      <div className="page-header" style={{ flexWrap: 'wrap' }}>
        <div>
          <h1>Transactions</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            {total} transaction{total !== 1 ? 's' : ''} found
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <Download size={16} /> Print PDF
          </button>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={16} /> Export CSV
          </button>
          <input
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleImportCSV}
          />
          <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} /> Import CSV
          </button>
          <button className="btn btn-primary" onClick={() => setModal('add')} id="add-tx-btn">
            <Plus size={16} /> Add Transaction
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="search-wrap">
          <Search size={15} />
          <input
            type="text"
            className="form-input"
            placeholder="Search transactions..."
            value={filters.search}
            onChange={e => { setFilters(p => ({ ...p, search: e.target.value })); setPage(1) }}
            id="tx-search"
          />
        </div>

        <select
          className="filter-select"
          value={filters.type}
          onChange={e => { setFilters(p => ({ ...p, type: e.target.value })); setPage(1) }}
          id="filter-type"
        >
          <option value="">All Types</option>
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
        </select>

        <select
          className="filter-select"
          value={filters.categoryId}
          onChange={e => { setFilters(p => ({ ...p, categoryId: e.target.value })); setPage(1) }}
          id="filter-category"
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>

        <input
          type="date"
          className="filter-select"
          title="Start Date"
          value={filters.startDate}
          onChange={e => { setFilters(p => ({ ...p, startDate: e.target.value })); setPage(1) }}
          id="filter-start-date"
        />

        <input
          type="date"
          className="filter-select"
          title="End Date"
          value={filters.endDate}
          onChange={e => { setFilters(p => ({ ...p, endDate: e.target.value })); setPage(1) }}
          id="filter-end-date"
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          <span>Show:</span>
          <select 
            className="filter-select" 
            value={limit} 
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
            style={{ padding: '6px 10px' }}
          >
            <option value={15}>15 per page</option>
            <option value={30}>30 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>

        {(filters.search || filters.type || filters.categoryId || filters.startDate || filters.endDate) && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { setFilters({ search: '', type: '', categoryId: '', startDate: '', endDate: '' }); setPage(1) }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="table-wrap">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No transactions found</h3>
            <p>Try adjusting your filters or add a new transaction</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th>Date</th>
                <th>Type</th>
                <th className="text-right">Amount</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        className="tx-category-icon"
                        style={{ background: `${tx.category?.color}20`, width: 32, height: 32, fontSize: '0.9rem' }}
                      >
                        {tx.category?.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{tx.description}</div>
                        {(tx.note || tx.receiptImage || tx.isRecurring) && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: 4, alignItems: 'center' }}>
                            {tx.isRecurring && <span title={`Recurring: ${tx.recurringInterval}`}>🔄</span>}
                            {tx.receiptImage && <span title="Has Receipt">📎</span>}
                            {tx.note && <span>{tx.note}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge" style={{
                      background: `${tx.category?.color}20`,
                      color: tx.category?.color,
                    }}>
                      {tx.category?.icon} {tx.category?.name}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {formatDate(tx.date)}
                  </td>
                  <td>
                    <span className={`badge badge-${tx.type.toLowerCase()}`}>
                      {tx.type === 'INCOME' ? '↑' : '↓'} {tx.type}
                    </span>
                  </td>
                  <td className={`text-right font-bold ${tx.type === 'INCOME' ? 'amount-income' : 'amount-expense'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </td>
                  <td className="text-right">
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button
                        className="btn-ghost"
                        onClick={() => setModal(tx)}
                        id={`edit-${tx.id}`}
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="btn-ghost"
                        onClick={() => setDeleteId(tx.id)}
                        id={`delete-${tx.id}`}
                        title="Delete"
                        style={{ color: 'var(--red)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              className={`btn ${page === p ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="modal-overlay">
          <div className="modal animate-slide" style={{ maxWidth: 380 }}>
            <div className="modal-header"><h3>Delete Transaction</h3></div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)' }}>
                Are you sure you want to delete this transaction? This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteId)} id="confirm-delete">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <TransactionModal
          transaction={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => fetchTransactions()}
        />
      )}
    </div>
  )
}
