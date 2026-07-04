import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import fs from 'fs'
import path from 'path'

const globalForPrisma = globalThis

function createPrismaClient() {
  let dbUrl = process.env.DATABASE_URL || 'file:./dev.db'

  // On serverless platforms like Vercel (/var/task is read-only), copy SQLite db to /tmp
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    try {
      const tmpDbPath = path.join('/tmp', 'dev.db')
      if (!fs.existsSync(tmpDbPath)) {
        const localDbPath = path.join(process.cwd(), 'dev.db')
        if (fs.existsSync(localDbPath)) {
          fs.copyFileSync(localDbPath, tmpDbPath)
        } else {
          fs.writeFileSync(tmpDbPath, '')
        }
      }
      dbUrl = `file:${tmpDbPath}`
    } catch (err) {
      console.error('Failed to prepare writable database in /tmp:', err)
    }
  }

  const adapter = new PrismaBetterSqlite3({
    url: dbUrl,
  })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
