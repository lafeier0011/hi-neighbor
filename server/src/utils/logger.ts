import { getCollection } from './cloudbase'
import type { Context } from 'hono'

export type LogType = 'create' | 'update' | 'delete' | 'login' | 'sell' | 'admin'

interface LogEntry {
  operatorId: string
  operatorName: string
  type: LogType
  content: string
  targetId?: string
  ip?: string
  createdAt: Date
}

export async function writeLog(c: Context, entry: Omit<LogEntry, 'ip' | 'createdAt'>) {
  try {
    await getCollection('admin_logs').add({
      ...entry,
      ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
      createdAt: new Date(),
    })
  } catch (e) {
    console.error('Failed to write log:', e)
  }
}

export async function writeLogDirect(entry: Omit<LogEntry, 'ip' | 'createdAt'>) {
  try {
    await getCollection('admin_logs').add({
      ...entry,
      ip: 'server',
      createdAt: new Date(),
    })
  } catch (e) {
    console.error('Failed to write log:', e)
  }
}
