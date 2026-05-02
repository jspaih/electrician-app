/**
 * Normalized Relation Selectors (Step 4)
 * ---------------------------------------------------------------
 * The data model is already ID-normalized: every entity references
 * related entities by `id` strings only. No entity stores a
 * denormalized copy of another entity's fields. This file is the
 * sanctioned API for *resolving* those IDs back to entities.
 *
 * Why this exists:
 *   - Components today call `clients.find(c => c.id === id)` inline.
 *     That's correct but fragile: if someone ever reaches for a
 *     shortcut like "store the client name on the project too",
 *     normalization breaks and every derived value drifts.
 *   - Centralizing resolution here makes the invariant visible and
 *     gives us one place to optimize (Step 6 adds memoization).
 *
 * Normalization invariants (DO NOT BREAK):
 *   1. Relations are stored as foreign-key IDs, never as embedded
 *      objects. Adding `clientName` to Project would be a bug.
 *   2. Labels like company/client name are resolved at render time,
 *      not baked into child entities.
 *   3. Cross-entity totals (project financials, bank balance,
 *      monthly report) are computed on the fly from normalized
 *      source data. They are not cached on the parent entity.
 */

import type {
  Client, Project, Payment, Check, Receipt, Supplier,
  BankAccount, Quotation, WorkOrder, LaborEntry, Warranty,
  Employee, Item, StockMovement,
} from '../types'
import { dataService } from './dataService'

// ─── Primary resolvers ───────────────────────────────────────────

export const resolveClient   = (id?: string): Client      | undefined => id ? dataService.getClient(id)   : undefined
export const resolveProject  = (id?: string): Project     | undefined => id ? dataService.getProject(id)  : undefined
export const resolveSupplier = (id?: string): Supplier    | undefined => id ? dataService.getSupplier(id) : undefined
export const resolveBank     = (id?: string): BankAccount | undefined => id ? dataService.getBank(id)     : undefined
export const resolveEmployee = (id?: string): Employee    | undefined => id ? dataService.getEmployee(id) : undefined
export const resolveItem     = (id?: string): Item        | undefined => id ? dataService.getItem(id)     : undefined

// ─── Safe label helpers (for render) ─────────────────────────────
// Components should use these instead of inlining `.find()?.name ?? '—'`.

export const clientName   = (id?: string) => resolveClient(id)?.name   ?? '—'
export const projectName  = (id?: string) => resolveProject(id)?.name  ?? '—'
export const supplierName = (id?: string) => resolveSupplier(id)?.name ?? '—'
export const bankName     = (id?: string) => resolveBank(id)?.name     ?? '—'
export const employeeName = (id?: string) => resolveEmployee(id)?.name ?? '—'
export const itemName     = (id?: string) => resolveItem(id)?.name     ?? '—'

// ─── Reverse lookups (children-by-parent) ────────────────────────

export const projectsByClient = (clientId: string): Project[] =>
  dataService.listProjects().filter(p => p.clientId === clientId)

export const paymentsByProject = (projectId: string): Payment[] =>
  dataService.listPayments().filter(p => p.projectId === projectId)

export const paymentsByClient = (clientId: string): Payment[] =>
  dataService.listPayments().filter(p => p.clientId === clientId)

export const paymentsBySupplier = (supplierId: string): Payment[] =>
  dataService.listPayments().filter(p => p.supplierId === supplierId)

export const checksByBank = (bankId: string): Check[] =>
  dataService.listChecks().filter(c => c.bankAccountId === bankId)

export const checksByProject = (projectId: string): Check[] =>
  dataService.listChecks().filter(c => c.projectId === projectId)

export const receiptsByClient = (clientId: string): Receipt[] =>
  dataService.listReceipts().filter(r => r.clientId === clientId)

export const quotationsByClient = (clientId: string): Quotation[] =>
  dataService.listQuotations().filter(q => q.clientId === clientId)

export const workOrdersByProject = (projectId: string): WorkOrder[] =>
  dataService.listWorkOrders().filter(w => w.projectId === projectId)

export const laborByProject = (projectId: string): LaborEntry[] =>
  dataService.listLaborEntries().filter(l => l.projectId === projectId)

export const laborByEmployee = (employeeId: string): LaborEntry[] =>
  dataService.listLaborEntries().filter(l => l.employeeId === employeeId)

export const warrantiesByClient = (clientId: string): Warranty[] =>
  dataService.listWarranties().filter(w => w.clientId === clientId)

export const stockMovementsByItem = (itemId: string): StockMovement[] =>
  dataService.listStockMovements().filter(m => m.itemId === itemId)

// ─── Integrity checks ────────────────────────────────────────────
// Utilities to verify normalization invariants at runtime (useful
// for the migration runner in Step 7 and for tests).

export interface IntegrityIssue {
  entity: string
  id: string
  field: string
  referenced: string
  missing: string
}

/**
 * Walk every relation and verify the referenced entity exists.
 * Returns an array of dangling foreign-key references. An empty
 * array means the data is referentially clean.
 */
export function checkReferentialIntegrity(): IntegrityIssue[] {
  const issues: IntegrityIssue[] = []

  const clientIds   = new Set(dataService.listClients().map(c => c.id))
  const projectIds  = new Set(dataService.listProjects().map(p => p.id))
  const supplierIds = new Set(dataService.listSuppliers().map(s => s.id))
  const bankIds     = new Set(dataService.listBanks().map(b => b.id))
  const itemIds     = new Set(dataService.listItems().map(i => i.id))
  const employeeIds = new Set(dataService.listEmployees().map(e => e.id))

  const report = (
    entity: string, id: string, field: string, referenced: string, missing: string,
  ) => issues.push({ entity, id, field, referenced, missing })

  for (const p of dataService.listProjects()) {
    if (p.clientId && !clientIds.has(p.clientId))
      report('Project', p.id, 'clientId', 'Client', p.clientId)
  }
  for (const pay of dataService.listPayments()) {
    if (pay.clientId    && !clientIds.has(pay.clientId))     report('Payment', pay.id, 'clientId',    'Client',   pay.clientId)
    if (pay.projectId   && !projectIds.has(pay.projectId))   report('Payment', pay.id, 'projectId',   'Project',  pay.projectId)
    if (pay.supplierId  && !supplierIds.has(pay.supplierId)) report('Payment', pay.id, 'supplierId',  'Supplier', pay.supplierId)
    if (pay.bankAccountId && !bankIds.has(pay.bankAccountId)) report('Payment', pay.id, 'bankAccountId', 'Bank', pay.bankAccountId)
  }
  for (const c of dataService.listChecks()) {
    if (c.bankAccountId && !bankIds.has(c.bankAccountId)) report('Check', c.id, 'bankAccountId', 'Bank',    c.bankAccountId)
    if (c.projectId     && !projectIds.has(c.projectId))  report('Check', c.id, 'projectId',     'Project', c.projectId)
    if (c.clientId      && !clientIds.has(c.clientId))    report('Check', c.id, 'clientId',      'Client',  c.clientId)
    if (c.supplierId    && !supplierIds.has(c.supplierId))report('Check', c.id, 'supplierId',    'Supplier',c.supplierId)
  }
  for (const m of dataService.listStockMovements()) {
    if (m.itemId && !itemIds.has(m.itemId)) report('StockMovement', m.id, 'itemId', 'Item', m.itemId)
  }
  for (const l of dataService.listLaborEntries()) {
    if (l.employeeId && !employeeIds.has(l.employeeId)) report('LaborEntry', l.id, 'employeeId', 'Employee', l.employeeId)
    if (l.projectId  && !projectIds.has(l.projectId))   report('LaborEntry', l.id, 'projectId',  'Project',  l.projectId)
  }

  return issues
}
