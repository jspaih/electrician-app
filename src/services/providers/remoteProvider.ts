/**
 * remoteProvider — MOCK backend.
 *
 * Simulates the shape of a real REST/GraphQL adapter so we can
 * develop Step 4+ features against an async backend without
 * actually needing a server. Data lives in an in-memory map keyed
 * by entity name.
 *
 * Characteristics:
 *   - All methods are async with ~60–150ms simulated latency.
 *   - IDs are generated client-side using a simple counter per
 *     entity namespace (mirrors the store's prefix scheme).
 *   - Has NO persistence. A page reload wipes everything.
 *   - Returns deep clones so callers can't mutate the "remote"
 *     state by accident.
 *
 * When a real backend lands:
 *   - Replace the in-memory `db` object with fetch()/axios calls.
 *   - Keep the method signatures identical.
 *   - Swap USE_REMOTE to true (or wire it to an env var). No
 *     component, service, or hook needs to change.
 *
 * What this file does NOT do:
 *   - Does NOT touch localStorage or the Zustand store.
 *   - Is NOT reached by any UI path today (USE_REMOTE = false).
 */

import type {
  Client, Project, Item, StockMovement, Supplier,
  BankAccount, Payment, Check, BankTransfer, Receipt,
  Quotation, WorkOrder, Employee, LaborEntry, Warranty,
  PhotoAttachment, AppSettings, CheckStatus,
} from '../../types'
import type { DataProvider } from './types'

// ─────────────────────────────────────────────────────────────────
// Simulated network
// ─────────────────────────────────────────────────────────────────

const MIN_LATENCY_MS = 60
const MAX_LATENCY_MS = 150

function latency(): Promise<void> {
  const ms = MIN_LATENCY_MS + Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS)
  return new Promise(r => setTimeout(r, ms))
}

async function respond<T>(value: T): Promise<T> {
  await latency()
  // Deep clone so callers can't mutate internal state.
  return JSON.parse(JSON.stringify(value))
}

// ─────────────────────────────────────────────────────────────────
// In-memory DB
// ─────────────────────────────────────────────────────────────────

interface RemoteDb {
  clients:        Client[]
  projects:       Project[]
  items:          Item[]
  stockMovements: StockMovement[]
  suppliers:      Supplier[]
  banks:          BankAccount[]
  payments:       Payment[]
  checks:         Check[]
  transfers:      BankTransfer[]
  receipts:       Receipt[]
  quotations:     Quotation[]
  workOrders:     WorkOrder[]
  employees:      Employee[]
  laborEntries:   LaborEntry[]
  warranties:     Warranty[]
  photos:         PhotoAttachment[]
  settings:       AppSettings
  counters:       Record<string, number>
}

const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  currency: 'ILS',
  taxRate: 16,
  companyName: '',
  companyPhone: '',
  companyAddress: '',
}

const db: RemoteDb = {
  clients: [], projects: [], items: [], stockMovements: [], suppliers: [],
  banks: [], payments: [], checks: [], transfers: [], receipts: [],
  quotations: [], workOrders: [], employees: [], laborEntries: [], warranties: [],
  photos: [], settings: { ...DEFAULT_SETTINGS }, counters: {},
}

function nextId(prefix: string): string {
  const n = (db.counters[prefix] ?? 0) + 1
  db.counters[prefix] = n
  return `${prefix}-${String(n).padStart(4, '0')}`
}

function nowIso(): string {
  return new Date().toISOString()
}

// ─────────────────────────────────────────────────────────────────
// Generic CRUD factory
// ─────────────────────────────────────────────────────────────────

type HasId = { id: string }

function makeCrud<T extends HasId, CreateInput>(
  collectionKey: keyof RemoteDb,
  idPrefix: string,
  stamp: (data: CreateInput, id: string) => T,
) {
  return {
    list: async (): Promise<T[]> => {
      const arr = db[collectionKey] as unknown as T[]
      return respond(arr)
    },
    get: async (id: string): Promise<T | undefined> => {
      const arr = db[collectionKey] as unknown as T[]
      return respond(arr.find(x => x.id === id))
    },
    create: async (data: CreateInput): Promise<T> => {
      await latency()
      const id = nextId(idPrefix)
      const entity = stamp(data, id)
      ;(db[collectionKey] as unknown as T[]).push(entity)
      return JSON.parse(JSON.stringify(entity))
    },
    update: async (id: string, data: Partial<T>): Promise<void> => {
      await latency()
      const arr = db[collectionKey] as unknown as T[]
      const idx = arr.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`${String(collectionKey)}/${id} not found`)
      arr[idx] = { ...arr[idx], ...data }
    },
    remove: async (id: string): Promise<void> => {
      await latency()
      const arr = db[collectionKey] as unknown as T[]
      const idx = arr.findIndex(x => x.id === id)
      if (idx !== -1) arr.splice(idx, 1)
    },
  }
}

// Stamp helpers: produce a full entity from CreateInput + id.
const stampWithTimestamp =
  <T>(data: Omit<T, 'id' | 'createdAt'>, id: string): T =>
    ({ ...(data as object), id, createdAt: nowIso() } as T)

// ─────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────

export const remoteProvider: DataProvider = {
  name: 'remote',

  clients:      makeCrud<Client,      Omit<Client,      'id' | 'createdAt'>>('clients',    'CLT', stampWithTimestamp),
  projects:     makeCrud<Project,     Omit<Project,     'id' | 'createdAt'>>('projects',   'PRJ', stampWithTimestamp),
  items:        makeCrud<Item,        Omit<Item,        'id' | 'createdAt'>>('items',      'ITM', stampWithTimestamp),
  suppliers:    makeCrud<Supplier,    Omit<Supplier,    'id' | 'createdAt'>>('suppliers',  'SUP', stampWithTimestamp),
  banks:        makeCrud<BankAccount, Omit<BankAccount, 'id' | 'createdAt'>>('banks',      'BNK', stampWithTimestamp),
  payments:     makeCrud<Payment,     Omit<Payment,     'id' | 'createdAt'>>('payments',   'PAY', stampWithTimestamp),
  checks:       makeCrud<Check,       Omit<Check,       'id' | 'createdAt'>>('checks',     'CHK', stampWithTimestamp),
  transfers:    makeCrud<BankTransfer,Omit<BankTransfer,'id' | 'createdAt'>>('transfers',  'TRF', stampWithTimestamp),
  receipts:     makeCrud<Receipt,     Omit<Receipt,     'id' | 'createdAt'>>('receipts',   'RCP', stampWithTimestamp),
  quotations:   makeCrud<Quotation,   Omit<Quotation,   'id' | 'createdAt'>>('quotations', 'QOT', stampWithTimestamp),
  workOrders:   makeCrud<WorkOrder,   Omit<WorkOrder,   'id' | 'createdAt'>>('workOrders', 'WRK', stampWithTimestamp),
  employees:    makeCrud<Employee,    Omit<Employee,    'id' | 'createdAt'>>('employees',  'EMP', stampWithTimestamp),
  laborEntries: makeCrud<LaborEntry,  Omit<LaborEntry,  'id' | 'createdAt'>>('laborEntries','LBR', stampWithTimestamp),
  warranties:   makeCrud<Warranty,    Omit<Warranty,    'id' | 'createdAt'>>('warranties', 'WRT', stampWithTimestamp),

  stockMovements: {
    list:   async () => respond(db.stockMovements),
    create: async (data) => {
      await latency()
      const id = nextId('STK')
      const mv: StockMovement = { ...data, id }
      db.stockMovements.push(mv)
      return JSON.parse(JSON.stringify(mv))
    },
    remove: async (id) => {
      await latency()
      const idx = db.stockMovements.findIndex(m => m.id === id)
      if (idx !== -1) db.stockMovements.splice(idx, 1)
    },
  },

  photos: {
    list:   async () => respond(db.photos),
    create: async (data) => {
      await latency()
      const id = `ph-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const photo: PhotoAttachment = { ...data, id }
      db.photos.push(photo)
      return JSON.parse(JSON.stringify(photo))
    },
    remove: async (id) => {
      await latency()
      const idx = db.photos.findIndex(p => p.id === id)
      if (idx !== -1) db.photos.splice(idx, 1)
    },
    listFor: async (entityType, entityId) =>
      respond(db.photos.filter(p => p.entityType === entityType && p.entityId === entityId)),
  },

  checksBulk: {
    updateStatus: async (ids, status, extra) => {
      await latency()
      for (const c of db.checks) {
        if (ids.includes(c.id)) Object.assign(c, { status, ...extra })
      }
    },
  },

  settings: {
    get:    async ()     => respond(db.settings),
    update: async (data) => { await latency(); db.settings = { ...db.settings, ...data } },
  },

  convertQuotationToProject: async (quotationId) => {
    await latency()
    const q = db.quotations.find(q => q.id === quotationId)
    if (!q || q.status !== 'accepted') return null
    const id = nextId('PRJ')
    const project: Project = {
      id,
      clientId: q.clientId,
      name: q.title,
      description: `Created from quotation ${q.id}`,
      status: 'pending',
      location: '',
      startDate: new Date().toISOString().split('T')[0],
      budget: q.total,
      notes: q.notes,
      createdAt: nowIso(),
    }
    db.projects.push(project)
    const qIdx = db.quotations.findIndex(x => x.id === quotationId)
    if (qIdx !== -1) db.quotations[qIdx] = { ...db.quotations[qIdx], projectId: id }
    return JSON.parse(JSON.stringify(project))
  },
}
