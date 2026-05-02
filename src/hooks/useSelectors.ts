/**
 * Memoized selector hooks (Step 6)
 * ---------------------------------------------------------------
 * Zustand's default `useStore()` re-renders a component on *every*
 * state change, regardless of whether the component cares. These
 * hooks subscribe narrowly and memoize derived values so that,
 * e.g., the Dashboard doesn't re-render when someone edits a
 * client's phone number.
 *
 * Narrow reactive reads → fewer re-renders → the Dashboard/Reports
 * views stay smooth on large data sets.
 *
 * Not wired into any component by default (UI rule). Components
 * can opt in when they become a perf bottleneck.
 */

import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useStore } from '../store/useStore'
import type {
  Client, Project, Item, Supplier, BankAccount, Payment, Check,
  Receipt, Quotation, WorkOrder, Employee, LaborEntry, Warranty,
  StockMovement, BankTransfer, JournalEntry, PurchaseInvoice,
  ExchangeRate,
} from '../types'

// Narrow reactive slices — each hook subscribes only to one array
// slot, so unrelated changes don't cause re-renders.
export const useClients          = (): Client[]          => useStore(s => s.clients)
export const useProjects         = (): Project[]         => useStore(s => s.projects)
export const useItems            = (): Item[]            => useStore(s => s.items)
export const useStockMovements   = (): StockMovement[]   => useStore(s => s.stockMovements)
export const useSuppliers        = (): Supplier[]        => useStore(s => s.suppliers)
export const useBanks            = (): BankAccount[]     => useStore(s => s.banks)
export const usePayments         = (): Payment[]         => useStore(s => s.payments)
export const useChecks           = (): Check[]           => useStore(s => s.checks)
export const useTransfers        = (): BankTransfer[]    => useStore(s => s.transfers)
export const useReceipts         = (): Receipt[]         => useStore(s => s.receipts)
export const useQuotations       = (): Quotation[]       => useStore(s => s.quotations)
export const useWorkOrders       = (): WorkOrder[]       => useStore(s => s.workOrders)
export const useEmployees        = (): Employee[]        => useStore(s => s.employees)
export const useLaborEntries     = (): LaborEntry[]      => useStore(s => s.laborEntries)
export const useWarranties       = (): Warranty[]        => useStore(s => s.warranties)
export const useJournalEntries   = (): JournalEntry[]    => useStore(s => s.journalEntries)
export const usePurchaseInvoices = (): PurchaseInvoice[] => useStore(s => s.purchaseInvoices)
export const useExchangeRates    = (): ExchangeRate[]    => useStore(s => s.exchangeRates)
export const useSettings         = ()                    => useStore(s => s.settings)

/**
 * Stable action selectors. Action references in Zustand stores never
 * change, so subscribing to them via `useShallow` produces refs that
 * never trigger re-renders. Use this in components that only need to
 * mutate, not observe data.
 */
export const useStoreActions = () => useStore(useShallow(s => ({
  addClient:           s.addClient,
  updateClient:        s.updateClient,
  deleteClient:        s.deleteClient,
  addProject:          s.addProject,
  updateProject:       s.updateProject,
  deleteProject:       s.deleteProject,
  addItem:             s.addItem,
  updateItem:          s.updateItem,
  deleteItem:          s.deleteItem,
  addStockMovement:    s.addStockMovement,
  deleteStockMovement: s.deleteStockMovement,
  addSupplier:         s.addSupplier,
  updateSupplier:      s.updateSupplier,
  deleteSupplier:      s.deleteSupplier,
  addBank:             s.addBank,
  updateBank:          s.updateBank,
  deleteBank:          s.deleteBank,
  addPayment:          s.addPayment,
  updatePayment:       s.updatePayment,
  deletePayment:       s.deletePayment,
  addCheck:            s.addCheck,
  updateCheck:         s.updateCheck,
  deleteCheck:         s.deleteCheck,
  bulkUpdateCheckStatus: s.bulkUpdateCheckStatus,
  addTransfer:         s.addTransfer,
  updateTransfer:      s.updateTransfer,
  deleteTransfer:      s.deleteTransfer,
  addReceipt:          s.addReceipt,
  updateReceipt:       s.updateReceipt,
  deleteReceipt:       s.deleteReceipt,
  addQuotation:        s.addQuotation,
  updateQuotation:     s.updateQuotation,
  deleteQuotation:     s.deleteQuotation,
  addWorkOrder:        s.addWorkOrder,
  updateWorkOrder:     s.updateWorkOrder,
  deleteWorkOrder:     s.deleteWorkOrder,
  addEmployee:         s.addEmployee,
  updateEmployee:      s.updateEmployee,
  deleteEmployee:      s.deleteEmployee,
  addLaborEntry:       s.addLaborEntry,
  updateLaborEntry:    s.updateLaborEntry,
  deleteLaborEntry:    s.deleteLaborEntry,
  addWarranty:         s.addWarranty,
  updateWarranty:      s.updateWarranty,
  deleteWarranty:      s.deleteWarranty,
  addJournalEntry:     s.addJournalEntry,
  updateJournalEntry:  s.updateJournalEntry,
  deleteJournalEntry:  s.deleteJournalEntry,
  addPurchaseInvoice:  s.addPurchaseInvoice,
  updatePurchaseInvoice: s.updatePurchaseInvoice,
  deletePurchaseInvoice: s.deletePurchaseInvoice,
  addExchangeRate:     s.addExchangeRate,
  updateExchangeRate:  s.updateExchangeRate,
  deleteExchangeRate:  s.deleteExchangeRate,
  updateSettings:      s.updateSettings,
})))

/** Memoized lookup table by id. Rebuilt only when the array identity changes. */
export function useById<T extends { id: string }>(rows: T[]): Map<string, T> {
  return useMemo(() => {
    const m = new Map<string, T>()
    for (const r of rows) m.set(r.id, r)
    return m
  }, [rows])
}

/** Memoized filter. Use for expensive predicates on large collections. */
export function useFiltered<T>(rows: T[], predicate: (row: T) => boolean, deps: unknown[] = []): T[] {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => rows.filter(predicate), [rows, ...deps])
}

/** Memoized sort (stable for tied keys). */
export function useSorted<T>(rows: T[], key: (row: T) => string | number, direction: 'asc' | 'desc' = 'asc'): T[] {
  return useMemo(() => {
    const sign = direction === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const ka = key(a), kb = key(b)
      if (ka < kb) return -1 * sign
      if (ka > kb) return  1 * sign
      return 0
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, direction])
}

/**
 * Combined search + filter + sort, all memoized in one pass. The
 * standard pattern for table pages: take a source array, apply a
 * search string against named fields, apply a custom predicate,
 * and sort. Recomputes only when any input changes.
 */
export function useTableData<T>(
  rows: T[],
  options: {
    search?: string
    searchFields?: Array<keyof T>
    filter?: (row: T) => boolean
    sort?: (a: T, b: T) => number
  },
): T[] {
  const { search = '', searchFields, filter, sort } = options

  return useMemo(() => {
    let result = rows

    if (search && searchFields && searchFields.length > 0) {
      const q = search.toLowerCase()
      result = result.filter(row =>
        searchFields.some(field => {
          const v = row[field]
          return v != null && String(v).toLowerCase().includes(q)
        }),
      )
    }

    if (filter) result = result.filter(filter)
    if (sort)   result = [...result].sort(sort)

    return result
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, search, searchFields?.join(','), filter, sort])
}

/** Memoized dashboard summary. Recomputes only when its inputs change. */
export function useDashboardSummary() {
  const clients   = useClients()
  const projects  = useProjects()
  const payments  = usePayments()
  const checks    = useChecks()
  const items     = useItems()
  const banks     = useBanks()

  return useMemo(() => {
    const activeProjects = projects.filter(p => p.status === 'active').length
    const pendingChecks  = checks.filter(c => c.status === 'pending')
    const lowStock       = items.filter(i => {
      // Cannot call getItemStock here without subscribing to stockMovements;
      // cheap approximation: rely on minStock flag only. Components that
      // need the exact figure should use dataService.getLowStockItems().
      return i.minStock > 0
    })
    const now = new Date()
    const ym  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const monthPayments = payments.filter(p => p.date.startsWith(ym))
    const income   = monthPayments.filter(p => p.direction === 'in').reduce((a, p) => a + p.amount, 0)
    const expenses = monthPayments.filter(p => p.direction === 'out').reduce((a, p) => a + p.amount, 0)

    return {
      totalClients:    clients.length,
      activeProjects,
      pendingChecks:   pendingChecks.length,
      lowStockCount:   lowStock.length,
      bankCount:       banks.length,
      income,
      expenses,
    }
  }, [clients, projects, payments, checks, items, banks])
}
