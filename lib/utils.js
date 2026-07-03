/**
 * Format currency amount to INR or user's preferred currency
 */
export function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format a date to a readable string
 */
export function formatDate(date, options = {}) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(new Date(date))
}

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Get last N months in YYYY-MM format
 */
export function getLastNMonths(n = 6) {
  const months = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}

/**
 * Format YYYY-MM to readable month name
 */
export function formatMonth(yearMonth) {
  const [year, month] = yearMonth.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, 1)
  return date.toLocaleString('en-IN', { month: 'short', year: 'numeric' })
}

/**
 * Calculate percentage safely
 */
export function calcPercent(value, total) {
  if (!total) return 0
  return Math.min(Math.round((value / total) * 100), 100)
}

/**
 * Get budget status color
 */
export function getBudgetStatus(spent, budget) {
  const pct = calcPercent(spent, budget)
  if (pct >= 90) return 'danger'
  if (pct >= 70) return 'warning'
  return 'safe'
}

/**
 * Default categories for new users
 */
export const DEFAULT_CATEGORIES = [
  { name: 'Salary', icon: '💰', color: '#10b981', type: 'INCOME' },
  { name: 'Freelance', icon: '💼', color: '#06b6d4', type: 'INCOME' },
  { name: 'Investment', icon: '📈', color: '#8b5cf6', type: 'INCOME' },
  { name: 'Other Income', icon: '🎁', color: '#f59e0b', type: 'INCOME' },
  { name: 'Food & Dining', icon: '🍔', color: '#ef4444', type: 'EXPENSE' },
  { name: 'Transport', icon: '🚗', color: '#f97316', type: 'EXPENSE' },
  { name: 'Shopping', icon: '🛍️', color: '#ec4899', type: 'EXPENSE' },
  { name: 'Bills & Utilities', icon: '⚡', color: '#eab308', type: 'EXPENSE' },
  { name: 'Entertainment', icon: '🎮', color: '#6366f1', type: 'EXPENSE' },
  { name: 'Healthcare', icon: '🏥', color: '#14b8a6', type: 'EXPENSE' },
  { name: 'Education', icon: '📚', color: '#3b82f6', type: 'EXPENSE' },
  { name: 'Other Expense', icon: '📦', color: '#94a3b8', type: 'EXPENSE' },
]
