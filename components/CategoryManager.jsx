'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function CategoryManager() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  
  const [newCat, setNewCat] = useState({
    name: '',
    type: 'EXPENSE',
    icon: '🏷️',
    color: '#6366f1'
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      setCategories(data)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newCat.name) return
    setAdding(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCat)
      })
      if (!res.ok) throw new Error('Failed to add category')
      const added = await res.json()
      setCategories([...categories, added])
      setNewCat({ name: '', type: 'EXPENSE', icon: '🏷️', color: '#6366f1' })
      toast.success('Category added')
    } catch {
      toast.error('Failed to add category')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category? Associated transactions will lose their category association.')) return
    
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setCategories(categories.filter(c => c.id !== id))
      toast.success('Category deleted')
    } catch {
      toast.error('Failed to delete category')
    }
  }

  if (loading) return <div>Loading categories...</div>

  return (
    <div>
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <select 
          className="form-input" 
          value={newCat.type} 
          onChange={e => setNewCat(p => ({ ...p, type: e.target.value }))}
          style={{ width: 'auto' }}
        >
          <option value="EXPENSE">Expense</option>
          <option value="INCOME">Income</option>
        </select>
        <input 
          type="text" 
          className="form-input" 
          style={{ width: 60 }} 
          placeholder="Icon (e.g. 🍕)" 
          value={newCat.icon}
          onChange={e => setNewCat(p => ({ ...p, icon: e.target.value }))}
        />
        <input 
          type="color" 
          className="form-input" 
          style={{ width: 50, padding: 4 }} 
          value={newCat.color}
          onChange={e => setNewCat(p => ({ ...p, color: e.target.value }))}
        />
        <input 
          type="text" 
          className="form-input" 
          style={{ flex: 1 }} 
          placeholder="Category Name" 
          value={newCat.name}
          onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))}
          required
        />
        <button type="submit" className="btn btn-primary" disabled={adding}>
          {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Add
        </button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
        {categories.map(c => (
          <div key={c.id} style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ background: c.color + '20', width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {c.icon}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{c.type}</div>
              </div>
            </div>
            <button className="btn-ghost" onClick={() => handleDelete(c.id)} style={{ color: 'var(--red)' }}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
