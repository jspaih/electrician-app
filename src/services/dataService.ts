/**
 * Data Service Layer (Step 2)
 * ---------------------------------------------------------------
 * Purpose:
 *   A single, stable API the UI uses to read & write business data.
 *   The UI should import from here INSTEAD of `useStore`.
 *
 *   Today: all calls delegate to the Zustand store (unchanged).
 *   Tomorrow (Step 3): the internals are swapped to a provider
 *     abstraction so we can flip to a remote backend without
 *     touching any component.
 *
 * Two surfaces are exposed:
 *   1. `dataService` — imperative, non-reactive. For writes,
 *      one-off reads, migrations, and non-React callers.
 *   2. `useData()` — a React hook returning the reactive shape
 *      consumers need (data arrays + derived getters).
 *
 * Rules honored:
 *   - UI flow & rendering are NOT changed by this file. It is a
 *     pure re-export layer.
 *   - Mutations are wrapped in try/catch so Step 8 can plug in
 *     error reporting / fallback restore without another rewrite.
 *   - Export/Import route through the Step-1 backup service so
 *     every restore is preceded by an automatic safety snapshot.
 *   - No new dependencies. No behavior changes to the store.
 */

import { useStore } from '../store/useStore'
import type {
  Client, Project, Item, StockMovement, Supplier,
  BankAccount, Payment, Check, BankTransfer, Receipt,
  Quotation, WorkOrder, Employee, LaborEntry, Warranty,
  PhotoAttachment, AppSettings, CheckStatus,
} from '../types'
import {
  backupData,
  createBackupSnapshot,
  restoreData as restoreSnapshot,
} from './backup'
import { reportError } from './errorSafety'

// ─────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────

/** Reach into the store imperatively (non-reactive). */
function s() {
  return useStore.getState()
}

/**
 * Wrap a mutation so any thrown error is caught, logged, and
 * rethrown. Step 8 will expand this with a fallback-restore path;
 * for now the wrapper exists so every mutation already flows
 * through a single choke-point.
 */
function guard<T>(label: string, fn: () => T): T {
  try {
    return fn()
  } catch (err) {
    // Step 8: route every mutation failure through the central
    // error reporter. Still rethrows so callers know the write
    // didn't land — but the ring-buffer log and any future
    // telemetry hook get it for free.
    reportError(`dataService:${label}`, err)
    throw err
  }
}

// ─────────────────────────────────────────────────────────────────
// Imperative API
// ─────────────────────────────────────────────────────────────────

export const dataService = {
  // ── Clients ────────────────────────────────────────────────────
  listClients:   () => s().clients,
  getClient:     (id: string) => s().clients.find(c => c.id === id),
  addClient:     (data: Omit<Client, 'id' | 'createdAt'>) => guard('addClient',    () => s().addClient(data)),
  updateClient:  (id: string, data: Partial<Client>)      => guard('updateClient', () => s().updateClient(id, data)),
  deleteClient:  (id: string)                             => guard('deleteClient', () => s().deleteClient(id)),

  // ── Projects ───────────────────────────────────────────────────
  listProjects:  () => s().projects,
  getProject:    (id: string) => s().projects.find(p => p.id === id),
  addProject:    (data: Omit<Project, 'id' | 'createdAt'>) => guard('addProject',    () => s().addProject(data)),
  updateProject: (id: string, data: Partial<Project>)      => guard('updateProject', () => s().updateProject(id, data)),
  deleteProject: (id: string)                              => guard('deleteProject', () => s().deleteProject(id)),

  // ── Items ──────────────────────────────────────────────────────
  listItems:   () => s().items,
  getItem:     (id: string) => s().items.find(i => i.id === id),
  addItem:     (data: Omit<Item, 'id' | 'createdAt'>) => guard('addItem',    () => s().addItem(data)),
  updateItem:  (id: string, data: Partial<Item>)      => guard('updateItem', () => s().updateItem(id, data)),
  deleteItem:  (id: string)                           => guard('deleteItem', () => s().deleteItem(id)),

  // ── Stock Movements ────────────────────────────────────────────
  listStockMovements:  () => s().stockMovements,
  addStockMovement:    (data: Omit<StockMovement, 'id'>) => guard('addStockMovement',    () => s().addStockMovement(data)),
  deleteStockMovement: (id: string)                      => guard('deleteStockMovement', () => s().deleteStockMovement(id)),

  // ── Suppliers ──────────────────────────────────────────────────
  listSuppliers:  () => s().suppliers,
  getSupplier:    (id: string) => s().suppliers.find(x => x.id === id),
  addSupplier:    (data: Omit<Supplier, 'id' | 'createdAt'>) => guard('addSupplier',    () => s().addSupplier(data)),
  updateSupplier: (id: string, data: Partial<Supplier>)      => guard('updateSupplier', () => s().updateSupplier(id, data)),
  deleteSupplier: (id: string)                               => guard('deleteSupplier', () => s().deleteSupplier(id)),

  // ── Banks ──────────────────────────────────────────────────────
  listBanks:  () => s().banks,
  getBank:    (id: string) => s().banks.find(b => b.id === id),
  addBank:    (data: Omit<BankAccount, 'id' | 'createdAt'>) => guard('addBank',    () => s().addBank(data)),
  updateBank: (id: string, data: Partial<BankAccount>)      => guard('updateBank', () => s().updateBank(id, data)),
  deleteBank: (id: string)                                  => guard('deleteBank', () => s().deleteBank(id)),

  // ── Payments ───────────────────────────────────────────────────
  listPayments:  () => s().payments,
  getPayment:    (id: string) => s().payments.find(p => p.id === id),
  addPayment:    (data: Omit<Payment, 'id' | 'createdAt'>) => guard('addPayment',    () => s().addPayment(data)),
  updatePayment: (id: string, data: Partial<Payment>)      => guard('updatePayment', () => s().updatePayment(id, data)),
  deletePayment: (id: string)                              => guard('deletePayment', () => s().deletePayment(id)),

  // ── Checks ─────────────────────────────────────────────────────
  listChecks:            () => s().checks,
  getCheck:              (id: string) => s().checks.find(c => c.id === id),
  addCheck:              (data: Omit<Check, 'id' | 'createdAt'>) => guard('addCheck',              () => s().addCheck(data)),
  updateCheck:           (id: string, data: Partial<Check>)      => guard('updateCheck',           () => s().updateCheck(id, data)),
  deleteCheck:           (id: string)                            => guard('deleteCheck',           () => s().deleteCheck(id)),
  bulkUpdateCheckStatus: (ids: string[], status: CheckStatus, extra?: Partial<Check>) =>
    guard('bulkUpdateCheckStatus', () => s().bulkUpdateCheckStatus(ids, status, extra)),

  // ── Transfers ──────────────────────────────────────────────────
  listTransfers:  () => s().transfers,
  addTransfer:    (data: Omit<BankTransfer, 'id' | 'createdAt'>) => guard('addTransfer',    () => s().addTransfer(data)),
  updateTransfer: (id: string, data: Partial<BankTransfer>)      => guard('updateTransfer', () => s().updateTransfer(id, data)),
  deleteTransfer: (id: string)                                   => guard('deleteTransfer', () => s().deleteTransfer(id)),

  // ── Receipts ───────────────────────────────────────────────────
  listReceipts:  () => s().receipts,
  getReceipt:    (id: string) => s().receipts.find(r => r.id === id),
  addReceipt:    (data: Omit<Receipt, 'id' | 'createdAt'>) => guard('addReceipt',    () => s().addReceipt(data)),
  updateReceipt: (id: string, data: Partial<Receipt>)      => guard('updateReceipt', () => s().updateReceipt(id, data)),
  deleteReceipt: (id: string)                              => guard('deleteReceipt', () => s().deleteReceipt(id)),

  // ── Quotations ─────────────────────────────────────────────────
  listQuotations:  () => s().quotations,
  getQuotation:    (id: string) => s().quotations.find(q => q.id === id),
  addQuotation:    (data: Omit<Quotation, 'id' | 'createdAt'>) => guard('addQuotation',    () => s().addQuotation(data)),
  updateQuotation: (id: string, data: Partial<Quotation>)      => guard('updateQuotation', () => s().updateQuotation(id, data)),
  deleteQuotation: (id: string)                                => guard('deleteQuotation', () => s().deleteQuotation(id)),
  convertQuotationToProject: (quotationId: string) =>
    guard('convertQuotationToProject', () => s().convertQuotationToProject(quotationId)),

  // ── Work Orders ────────────────────────────────────────────────
  listWorkOrders:  () => s().workOrders,
  getWorkOrder:    (id: string) => s().workOrders.find(w => w.id === id),
  addWorkOrder:    (data: Omit<WorkOrder, 'id' | 'createdAt'>) => guard('addWorkOrder',    () => s().addWorkOrder(data)),
  updateWorkOrder: (id: string, data: Partial<WorkOrder>)      => guard('updateWorkOrder', () => s().updateWorkOrder(id, data)),
  deleteWorkOrder: (id: string)                                => guard('deleteWorkOrder', () => s().deleteWorkOrder(id)),

  // ── Employees ──────────────────────────────────────────────────
  listEmployees:  () => s().employees,
  getEmployee:    (id: string) => s().employees.find(e => e.id === id),
  addEmployee:    (data: Omit<Employee, 'id' | 'createdAt'>) => guard('addEmployee',    () => s().addEmployee(data)),
  updateEmployee: (id: string, data: Partial<Employee>)      => guard('updateEmployee', () => s().updateEmployee(id, data)),
  deleteEmployee: (id: string)                               => guard('deleteEmployee', () => s().deleteEmployee(id)),

  // ── Labor Entries ──────────────────────────────────────────────
  listLaborEntries:  () => s().laborEntries,
  addLaborEntry:     (data: Omit<LaborEntry, 'id' | 'createdAt'>) => guard('addLaborEntry',    () => s().addLaborEntry(data)),
  updateLaborEntry:  (id: string, data: Partial<LaborEntry>)      => guard('updateLaborEntry', () => s().updateLaborEntry(id, data)),
  deleteLaborEntry:  (id: string)                                 => guard('deleteLaborEntry', () => s().deleteLaborEntry(id)),

  // ── Warranties ─────────────────────────────────────────────────
  listWarranties:  () => s().warranties,
  getWarranty:     (id: string) => s().warranties.find(w => w.id === id),
  addWarranty:     (data: Omit<Warranty, 'id' | 'createdAt'>) => guard('addWarranty',    () => s().addWarranty(data)),
  updateWarranty:  (id: string, data: Partial<Warranty>)      => guard('updateWarranty', () => s().updateWarranty(id, data)),
  deleteWarranty:  (id: string)                               => guard('deleteWarranty', () => s().deleteWarranty(id)),

  // ── Photos ─────────────────────────────────────────────────────
  listPhotos:   () => s().photos,
  addPhoto:     (data: Omit<PhotoAttachment, 'id'>) => guard('addPhoto',    () => s().addPhoto(data)),
  deletePhoto:  (id: string)                        => guard('deletePhoto', () => s().deletePhoto(id)),
  getPhotos:    (entityType: string, entityId: string) => s().getPhotos(entityType, entityId),

  // ── Settings ───────────────────────────────────────────────────
  getSettings:    () => s().settings,
  updateSettings: (data: Partial<AppSettings>) => guard('updateSettings', () => s().updateSettings(data)),

  // ── Derived ────────────────────────────────────────────────────
  getBankBalance:        (bankId: string)    => s().getBankBalance(bankId),
  getItemStock:          (itemId: string)    => s().getItemStock(itemId),
  getProjectFinancials:  (projectId: string) => s().getProjectFinancials(projectId),
  getProjectLaborCost:   (projectId: string) => s().getProjectLaborCost(projectId),
  getLowStockItems:      () => s().getLowStockItems(),
  getPendingChecks:      () => s().getPendingChecks(),
  getTotalReceivable:    () => s().getTotalReceivable(),
  getTotalPayable:       () => s().getTotalPayable(),
  getExpiringWarranties: () => s().getExpiringWarranties(),
  getMonthlyReport:      (yearMonth: string) => s().getMonthlyReport(yearMonth),

  // ── Backup / Restore (wired to Step-1 backup service) ──────────
  /** Trigger a full-localStorage JSON download. */
  exportBackup: () => guard('exportBackup', () => backupData()),

  /** Snapshot the store's domain data only (legacy shape). */
  exportStoreJson: () => s().exportData(),

  /**
   * Restore from a full-localStorage backup file (recommended path).
   * Validates + rolls back on failure. Caller should reload after.
   */
  restoreBackup: (json: string) =>
    guard('restoreBackup', () => restoreSnapshot(json)),

  /**
   * Legacy path: import a store-only JSON blob (the shape produced
   * by `exportStoreJson`). Takes an automatic pre-import safety
   * snapshot first. Returns true on success, false on invalid JSON
   * (mirrors the store's original contract).
   */
  importStoreJson: (json: string): boolean => {
    const safety = createBackupSnapshot()
    try {
      const ok = s().importData(json)
      if (!ok) return false
      return true
    } catch (err) {
      // Roll back localStorage to the pre-import snapshot.
      try {
        localStorage.clear()
        for (const [k, v] of Object.entries(safety.localStorage)) {
          localStorage.setItem(k, v)
        }
      } catch {
        // swallow — original error is the important one
      }
      // eslint-disable-next-line no-console
      console.error('[dataService] importStoreJson failed, rolled back:', err)
      return false
    }
  },

  /** Nuke persisted store state. Caller should reload after. */
  wipeStore: () => guard('wipeStore', () => {
    localStorage.removeItem('electrician-manager-v1')
  }),
}

export type DataService = typeof dataService

// ─────────────────────────────────────────────────────────────────
// Reactive hook
// ─────────────────────────────────────────────────────────────────

/**
 * React hook that returns the reactive store shape. Components
 * should prefer this over `useStore()` directly — it's the same
 * object today, but the indirection lets Step 3 swap providers
 * without touching callers.
 *
 * Note: returning the entire store means the caller re-renders on
 * any state change, matching today's `useStore()` behavior exactly.
 * Step 6 introduces narrow, memoized selectors for perf.
 */
export function useData() {
  return useStore()
}
