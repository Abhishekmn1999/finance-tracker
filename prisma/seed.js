const { PrismaClient } = require('@prisma/client')
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./dev.db',
})

const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
})

const DEFAULT_CATEGORIES = [
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

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo user
  const hashedPassword = await bcrypt.hash('Demo@123', 12)
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@fintrack.app' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@fintrack.app',
      password: hashedPassword,
      currency: 'INR',
    },
  })
  console.log('✅ Demo user created:', demoUser.email)

  // Delete existing categories for demo user
  await prisma.category.deleteMany({ where: { userId: demoUser.id } })

  // Create categories
  const categories = await Promise.all(
    DEFAULT_CATEGORIES.map(cat =>
      prisma.category.create({
        data: { ...cat, userId: demoUser.id },
      })
    )
  )
  console.log(`✅ Created ${categories.length} categories`)

  const catMap = Object.fromEntries(categories.map(c => [c.name, c]))

  // Create transactions for last 3 months
  const now = new Date()
  const transactions = []

  for (let m = 2; m >= 0; m--) {
    const year = now.getFullYear()
    const month = now.getMonth() - m

    const d = (day) => new Date(year, month < 0 ? month + 12 : month, day)

    transactions.push(
      // Income
      { type: 'INCOME', amount: 45000, description: 'Monthly Salary', categoryId: catMap['Salary'].id, date: d(1) },
      { type: 'INCOME', amount: 8000, description: 'Freelance Project', categoryId: catMap['Freelance'].id, date: d(5) },
      // Expenses
      { type: 'EXPENSE', amount: 3500, description: 'Grocery Shopping', categoryId: catMap['Food & Dining'].id, date: d(3) },
      { type: 'EXPENSE', amount: 1200, description: 'Uber rides', categoryId: catMap['Transport'].id, date: d(4) },
      { type: 'EXPENSE', amount: 2800, description: 'Online Shopping', categoryId: catMap['Shopping'].id, date: d(7) },
      { type: 'EXPENSE', amount: 1500, description: 'Electricity Bill', categoryId: catMap['Bills & Utilities'].id, date: d(8) },
      { type: 'EXPENSE', amount: 900, description: 'Netflix + Spotify', categoryId: catMap['Entertainment'].id, date: d(10) },
      { type: 'EXPENSE', amount: 2200, description: 'Restaurant visits', categoryId: catMap['Food & Dining'].id, date: d(12) },
      { type: 'EXPENSE', amount: 1800, description: 'Medical checkup', categoryId: catMap['Healthcare'].id, date: d(15) },
      { type: 'EXPENSE', amount: 3000, description: 'Udemy Courses', categoryId: catMap['Education'].id, date: d(18) },
      { type: 'EXPENSE', amount: 500, description: 'Petrol', categoryId: catMap['Transport'].id, date: d(20) },
      { type: 'EXPENSE', amount: 600, description: 'Snacks & Coffee', categoryId: catMap['Food & Dining'].id, date: d(22) },
    )
  }

  await prisma.transaction.deleteMany({ where: { userId: demoUser.id } })
  await prisma.transaction.createMany({
    data: transactions.map(t => ({ ...t, userId: demoUser.id })),
  })
  console.log(`✅ Created ${transactions.length} sample transactions`)

  // Create budgets for current month
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  await prisma.budget.deleteMany({ where: { userId: demoUser.id, month: currentMonth } })

  const budgets = [
    { categoryId: catMap['Food & Dining'].id, amount: 7000 },
    { categoryId: catMap['Transport'].id, amount: 2000 },
    { categoryId: catMap['Shopping'].id, amount: 3000 },
    { categoryId: catMap['Entertainment'].id, amount: 1500 },
    { categoryId: catMap['Bills & Utilities'].id, amount: 2000 },
  ]

  await prisma.budget.createMany({
    data: budgets.map(b => ({ ...b, userId: demoUser.id, month: currentMonth })),
  })
  console.log(`✅ Created ${budgets.length} budgets`)

  console.log('\n🎉 Seed complete!')
  console.log('📧 Demo login: demo@fintrack.app')
  console.log('🔑 Demo password: Demo@123')
}

main()
  .catch(e => { console.error('❌ Seed error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
