import type { IDCounters } from '../types'

// ─── ID Generation ────────────────────────────────────────────────────────────
export function generateId(prefix: keyof IDCounters, counters: IDCounters): string {
  const year = new Date().getFullYear()
  const next = (counters[prefix] || 0) + 1
  return `${prefix}${year}${String(next).padStart(6, '0')}`
}

export function nextCounter(counters: IDCounters, prefix: keyof IDCounters): IDCounters {
  return { ...counters, [prefix]: (counters[prefix] || 0) + 1 }
}

// ─── Formatting ───────────────────────────────────────────────────────────────
export function formatCurrency(amount: number, currency = 'ILS'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function today(): string {
  return new Date().toISOString().split('T')[0]
}

/** Returns true only if the string is a valid YYYY-MM-DD date */
export function isValidDate(dateStr: string): boolean {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
  const d = new Date(dateStr)
  return !isNaN(d.getTime())
}

export function now(): string {
  return new Date().toISOString()
}

// ─── Status Colors ────────────────────────────────────────────────────────────
export function projectStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending:   'bg-yellow-900 text-yellow-300',
    active:    'bg-green-900 text-green-300',
    completed: 'bg-blue-900 text-blue-300',
    cancelled: 'bg-red-900 text-red-300',
    on_hold:   'bg-gray-700 text-gray-300',
  }
  return map[status] ?? 'bg-gray-700 text-gray-300'
}

export function checkStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending:   'bg-yellow-900 text-yellow-300',
    deposited: 'bg-blue-900 text-blue-300',
    cleared:   'bg-green-900 text-green-300',
    bounced:   'bg-red-900 text-red-300',
    cancelled: 'bg-gray-700 text-gray-300',
    returned:  'bg-orange-900 text-orange-300',
    paid_to:   'bg-purple-900 text-purple-300',
  }
  return map[status] ?? 'bg-gray-700 text-gray-300'
}

export function paymentTypeIcon(type: string): string {
  const map: Record<string, string> = {
    cash: '💵',
    check: '🗒️',
    bank_transfer: '🏦',
  }
  return map[type] ?? '💰'
}

// ─── Unique line-item ID ──────────────────────────────────────────────────────
export function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}
