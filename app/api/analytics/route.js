import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getLastNMonths } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const months = getLastNMonths(6)

  // Current month date range
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const [totalIncome, totalExpense, recentTx, categoryBreakdown, monthlyTrend, recurringItems] = await Promise.all([
    // Current month income
    prisma.transaction.aggregate({
      where: { userId, type: 'INCOME', date: { gte: monthStart, lt: monthEnd } },
      _sum: { amount: true },
    }),
    // Current month expense
    prisma.transaction.aggregate({
      where: { userId, type: 'EXPENSE', date: { gte: monthStart, lt: monthEnd } },
      _sum: { amount: true },
    }),
    // Recent transactions
    prisma.transaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { date: 'desc' },
      take: 8,
    }),
    // Expense by category (current month)
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, type: 'EXPENSE', date: { gte: monthStart, lt: monthEnd } },
      _sum: { amount: true },
    }),
    // Monthly income/expense for last 6 months
    Promise.all(months.map(async (month) => {
      const [y, m] = month.split('-').map(Number)
      const start = new Date(y, m - 1, 1)
      const end = new Date(y, m, 1)
      const [inc, exp] = await Promise.all([
        prisma.transaction.aggregate({
          where: { userId, type: 'INCOME', date: { gte: start, lt: end } },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: { userId, type: 'EXPENSE', date: { gte: start, lt: end } },
          _sum: { amount: true },
        }),
      ])
      return { month, income: inc._sum.amount || 0, expense: exp._sum.amount || 0 }
    })),
    // Pending recurring items (mock check for dashboard)
    prisma.transaction.findMany({
      where: { userId, isRecurring: true },
      take: 3,
      orderBy: { date: 'desc' }
    })
  ])

  // Enrich category breakdown with category details
  const categoryIds = categoryBreakdown.map(c => c.categoryId)
  const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } } })
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))

  const enrichedCategories = categoryBreakdown.map(c => ({
    ...catMap[c.categoryId],
    amount: c._sum.amount || 0,
  })).sort((a, b) => b.amount - a.amount)

  // Find savings categories in memory (SQLite compatibility)
  const allUserCategories = await prisma.category.findMany({ where: { userId } })
  const savingsCatIds = allUserCategories
    .filter(c => c.name.toLowerCase().includes('saving'))
    .map(c => c.id)

  const savingsContrib = categoryBreakdown
    .filter(c => savingsCatIds.includes(c.categoryId))
    .reduce((sum, c) => sum + (c._sum.amount || 0), 0)

  const income = totalIncome._sum.amount || 0
  const totalExp = totalExpense._sum.amount || 0
  const regularExpense = totalExp - savingsContrib
  
  const balance = income - totalExp
  const actualSavings = income - regularExpense
  const savingsRate = income > 0 ? Math.round((actualSavings / income) * 100) : 0

  return NextResponse.json({
    stats: { income, expense: regularExpense, balance, savingsRate },
    recentTransactions: recentTx,
    categoryBreakdown: enrichedCategories,
    monthlyTrend,
    recurringItems,
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  })
}
