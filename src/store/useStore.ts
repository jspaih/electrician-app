import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Client, Project, Item, StockMovement, Supplier,
  BankAccount, Payment, Check, BankTransfer, Receipt,
  Quotation, WorkOrder, Employee, LaborEntry, Warranty,
  PurchaseInvoice, ExchangeRate, JournalEntry, ChartAccount,
  AccountMapping, AccountMappingKey,
  PhotoAttachment, AppSettings, IDCounters, CheckStatus,
} from '../types'
import { DEFAULT_CHART_OF_ACCOUNTS } from './chartOfAccountsSeed'
import { generateId, nextCounter, now, uid } from '../utils/helpers'
import {
  onReceiptCreated,
  onPaymentToSupplierCreated,
  onPurchaseInvoiceCreated,
  onSalesInvoiceCreated,
  onStockMovementOut,
  onLaborEntryCreated,
  onBankTransferCreated,
  onCheckDeposited,
  onCheckCleared,
  type AccountResolver,
  type GeneratorContext,
} from '../services/accounting/journalGenerator'

interface AppState {
  // ── Data ──────────────────────────────────────────────────────────────────
  counters:           IDCounters
  clients:            Client[]
  projects:           Project[]
  items:              Item[]
  stockMovements:     StockMovement[]
  suppliers:          Supplier[]
  banks:              BankAccount[]
  payments:           Payment[]
  checks:             Check[]
  transfers:          BankTransfer[]
  receipts:           Receipt[]
  quotations:         Quotation[]
  workOrders:         WorkOrder[]
  employees:          Employee[]
  laborEntries:       LaborEntry[]
  warranties:         Warranty[]
  purchaseInvoices:   PurchaseInvoice[]
  exchangeRates:      ExchangeRate[]
  photos:             PhotoAttachment[]
  chartAccounts:      ChartAccount[]
  accountMappings:    AccountMapping[]
  settings:           AppSettings

  // ── Clients ───────────────────────────────────────────────────────────────
  addClient:    (data: Omit<Client, 'id' | 'createdAt'>) => Client
  updateClient: (id: string, data: Partial<Client>) => void
  deleteClient: (id: string) => void

  // ── Projects ──────────────────────────────────────────────────────────────
  addProject:    (data: Omit<Project, 'id' | 'createdAt'>) => Project
  updateProject: (id: string, data: Partial<Project>) => void
  deleteProject: (id: string) => void

  // ── Items ─────────────────────────────────────────────────────────────────
  addItem:    (data: Omit<Item, 'id' | 'createdAt'>) => Item
  updateItem: (id: string, data: Partial<Item>) => void
  deleteItem: (id: string) => void

  // ── Stock Movements ───────────────────────────────────────────────────────
  addStockMovement: (data: Omit<StockMovement, 'id'>) => StockMovement
  deleteStockMovement: (id: string) => void

  // ── Suppliers ─────────────────────────────────────────────────────────────
  addSupplier:    (data: Omit<Supplier, 'id' | 'createdAt'>) => Supplier
  updateSupplier: (id: string, data: Partial<Supplier>) => void
  deleteSupplier: (id: string) => void

  // ── Banks ─────────────────────────────────────────────────────────────────
  addBank:    (data: Omit<BankAccount, 'id' | 'createdAt'>) => BankAccount
  updateBank: (id: string, data: Partial<BankAccount>) => void
  deleteBank: (id: string) => void

  // ── Payments ──────────────────────────────────────────────────────────────
  addPayment:    (data: Omit<Payment, 'id' | 'createdAt'>) => Payment
  updatePayment: (id: string, data: Partial<Payment>) => void
  deletePayment: (id: string) => void

  // ── Checks ────────────────────────────────────────────────────────────────
  addCheck:    (data: Omit<Check, 'id' | 'createdAt'>) => Check
  updateCheck: (id: string, data: Partial<Check>) => void
  deleteCheck: (id: string) => void
  bulkUpdateCheckStatus: (ids: string[], status: CheckStatus, extra?: Partial<Check>) => void

  // ── Transfers ─────────────────────────────────────────────────────────────
  addTransfer:    (data: Omit<BankTransfer, 'id' | 'createdAt'>) => BankTransfer
  updateTransfer: (id: string, data: Partial<BankTransfer>) => void
  deleteTransfer: (id: string) => void

  // ── Receipts ──────────────────────────────────────────────────────────────
  addReceipt:    (data: Omit<Receipt, 'id' | 'createdAt'>) => Receipt
  updateReceipt: (id: string, data: Partial<Receipt>) => void
  deleteReceipt: (id: string) => void

  // ── Quotations ────────────────────────────────────────────────────────────
  addQuotation:    (data: Omit<Quotation, 'id' | 'createdAt'>) => Quotation
  updateQuotation: (id: string, data: Partial<Quotation>) => void
  deleteQuotation: (id: string) => void
  convertQuotationToProject: (quotationId: string) => Project | null

  // ── Work Orders ───────────────────────────────────────────────────────────
  addWorkOrder:    (data: Omit<WorkOrder, 'id' | 'createdAt'>) => WorkOrder
  updateWorkOrder: (id: string, data: Partial<WorkOrder>) => void
  deleteWorkOrder: (id: string) => void

  // ── Employees ─────────────────────────────────────────────────────────────
  addEmployee:    (data: Omit<Employee, 'id' | 'createdAt'>) => Employee
  updateEmployee: (id: string, data: Partial<Employee>) => void
  deleteEmployee: (id: string) => void

  // ── Labor Entries ─────────────────────────────────────────────────────────
  addLaborEntry:    (data: Omit<LaborEntry, 'id' | 'createdAt'>) => LaborEntry
  updateLaborEntry: (id: string, data: Partial<LaborEntry>) => void
  deleteLaborEntry: (id: string) => void

  // ── Warranties ────────────────────────────────────────────────────────────
  addWarranty:    (data: Omit<Warranty, 'id' | 'createdAt'>) => Warranty
  updateWarranty: (id: string, data: Partial<Warranty>) => void
  deleteWarranty: (id: string) => void

  // ── Journal Entries ───────────────────────────────────────────────────────
  journalEntries:       JournalEntry[]
  addJournalEntry:    (data: Omit<JournalEntry, 'id' | 'createdAt'>) => JournalEntry
  updateJournalEntry: (id: string, data: Partial<JournalEntry>) => void
  deleteJournalEntry: (id: string) => void

  // ── Chart of Accounts ────────────────────────────────────────────────────
  addChartAccount:    (data: Omit<ChartAccount, 'id' | 'createdAt'>) => ChartAccount
  updateChartAccount: (id: string, data: Partial<ChartAccount>) => void
  deleteChartAccount: (id: string) => void
  /** One-time seeder. Idempotent — does nothing if accounts exist. */
  seedChartOfAccounts: () => void

  // ── Account Mappings ─────────────────────────────────────────────────────
  setAccountMapping: (key: AccountMappingKey, accountCode: string) => void
  /** Idempotent — does nothing if mappings exist. Maps each key to its standard code. */
  seedAccountMappings: () => void
  /** Returns the mapped ChartAccount for a key, or undefined if not mapped. */
  getMappedAccount: (key: AccountMappingKey) => ChartAccount | undefined

  // ── Purchase Invoices ─────────────────────────────────────────────────────
  addPurchaseInvoice:    (data: Omit<PurchaseInvoice, 'id' | 'createdAt'>, createMovements?: boolean) => PurchaseInvoice
  updatePurchaseInvoice: (id: string, data: Partial<PurchaseInvoice>) => void
  deletePurchaseInvoice: (id: string) => void

  // ── Exchange Rates ────────────────────────────────────────────────────────
  addExchangeRate:    (data: Omit<ExchangeRate, 'id' | 'createdAt'>) => ExchangeRate
  updateExchangeRate: (id: string, data: Partial<ExchangeRate>) => void
  deleteExchangeRate: (id: string) => void
  getLatestRate:      (currency: string) => number | null

  // ── Photos ────────────────────────────────────────────────────────────────
  addPhoto:    (data: Omit<PhotoAttachment, 'id'>) => PhotoAttachment
  deletePhoto: (id: string) => void
  getPhotos:   (entityType: string, entityId: string) => PhotoAttachment[]

  // ── Settings ──────────────────────────────────────────────────────────────
  updateSettings: (data: Partial<AppSettings>) => void

  // ── Export / Import ───────────────────────────────────────────────────────
  exportData: () => string
  importData: (json: string) => boolean

  // ── Derived Calculations ──────────────────────────────────────────────────
  getBankBalance:       (bankId: string) => number
  getItemStock:         (itemId: string) => number
  getProjectFinancials: (projectId: string) => { received: number; spent: number; laborCost: number; balance: number }
  getLowStockItems:     () => Item[]
  getPendingChecks:     () => Check[]
  getTotalReceivable:   () => number
  getTotalPayable:      () => number
  getExpiringWarranties: () => Warranty[]
  getProjectLaborCost:  (projectId: string) => number
  getMonthlyReport:     (yearMonth: string) => { income: number; expenses: number; labor: number; profit: number }
  getChecksInBoxBalance: (currency: string) => number
  reconcilePurchaseInvoice: (invoiceId: string) => void
  getSupplierBalance:   (supplierId: string) => number
  getClientBalance:     (clientId: string) => number
  /**
   * How much of a sales invoice (Receipt) has been settled.
   * Sums:
   *   - settling Receipts that point at this invoice via salesInvoiceId
   *   - Payments (direction='in') linked via salesInvoiceId
   */
  getSalesInvoicePaid:   (invoiceId: string) => number
  getSalesInvoiceStatus: (invoiceId: string) => 'unpaid' | 'partial' | 'paid'

  /** @internal — builds a journal generator context. Used by store actions only. */
  _journalCtx: () => GeneratorContext
}

const INITIAL_COUNTERS: IDCounters = {
  CLT: 0, PRJ: 0, ITM: 0, STK: 0, SUP: 0,
  BNK: 0, PAY: 0, CHK: 0, TRF: 0, RCP: 0,
  QOT: 0, WRK: 0, EMP: 0, LBR: 0, WRT: 0,
  PUR: 0, XRT: 0, JRN: 0, ACC: 0,
}

const DEFAULT_SETTINGS: AppSettings = {
  language: 'ar',
  theme: 'dark',
  currency: 'ILS',
  taxRate: 16,
  companyName: '',
  companyPhone: '',
  companyAddress: '',
}

/**
 * Detect check status transitions and emit the right journal entry.
 *   pending   → deposited:  DR Postdated  CR Checks in Box
 *   deposited → cleared:    DR Bank       CR Postdated
 *   pending   → cleared:    skip (direct clearance — no postdated step)
 * Only RECEIVED checks generate entries here. Issued checks are handled
 * by the payment generator at issue time.
 */
function generateCheckStatusEntry(
  state: AppState,
  before: Check,
  after:  Check,
): void {
  if (before.type !== 'received') return
  if (before.status === after.status) return

  const today = new Date().toISOString().split('T')[0]
  const ctx   = state._journalCtx()

  try {
    if (before.status === 'pending' && after.status === 'deposited') {
      onCheckDeposited(after, today, ctx)
    } else if (before.status === 'deposited' && after.status === 'cleared') {
      const bankId = after.bankAccountId ?? before.bankAccountId
      if (bankId) onCheckCleared(after, bankId, today, ctx)
    }
  } catch (err) {
    console.error('[journal] check status generator failed:', err)
  }
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      counters:           INITIAL_COUNTERS,
      clients:            [],
      projects:           [],
      items:              [],
      stockMovements:     [],
      suppliers:          [],
      banks:              [],
      payments:           [],
      checks:             [],
      transfers:          [],
      receipts:           [],
      quotations:         [],
      workOrders:         [],
      employees:          [],
      laborEntries:       [],
      warranties:         [],
      journalEntries:     [],
      purchaseInvoices:   [],
      exchangeRates:      [],
      photos:             [],
      chartAccounts:      [],
      accountMappings:    [],
      settings:           DEFAULT_SETTINGS,

      // ── Journal generator context (built lazily per call) ────────────────
      // Builds a fresh GeneratorContext from current state. Each generator
      // call reads the latest mappings + accounts from the live store, so
      // newly-added accounts are immediately resolvable.

      // ── Clients ─────────────────────────────────────────────────────────
      addClient: (data) => {
        const { counters } = get()
        const id = generateId('CLT', counters)
        const client: Client = { ...data, id, createdAt: now() }
        set(s => ({ clients: [...s.clients, client], counters: nextCounter(s.counters, 'CLT') }))
        return client
      },
      updateClient: (id, data) =>
        set(s => ({ clients: s.clients.map(c => c.id === id ? { ...c, ...data } : c) })),
      deleteClient: (id) =>
        set(s => ({ clients: s.clients.filter(c => c.id !== id) })),

      // ── Projects ────────────────────────────────────────────────────────
      addProject: (data) => {
        const { counters } = get()
        const id = generateId('PRJ', counters)
        const project: Project = { ...data, id, createdAt: now() }
        set(s => ({ projects: [...s.projects, project], counters: nextCounter(s.counters, 'PRJ') }))
        return project
      },
      updateProject: (id, data) =>
        set(s => ({ projects: s.projects.map(p => p.id === id ? { ...p, ...data } : p) })),
      deleteProject: (id) =>
        set(s => ({ projects: s.projects.filter(p => p.id !== id) })),

      // ── Items ────────────────────────────────────────────────────────────
      addItem: (data) => {
        const { counters } = get()
        const id = generateId('ITM', counters)
        const item: Item = { ...data, id, createdAt: now() }
        set(s => ({ items: [...s.items, item], counters: nextCounter(s.counters, 'ITM') }))
        return item
      },
      updateItem: (id, data) =>
        set(s => ({ items: s.items.map(i => i.id === id ? { ...i, ...data } : i) })),
      deleteItem: (id) =>
        set(s => ({ items: s.items.filter(i => i.id !== id) })),

      // ── Stock Movements ──────────────────────────────────────────────────
      addStockMovement: (data) => {
        const { counters } = get()
        const id = generateId('STK', counters)
        const mv: StockMovement = { ...data, id }
        set(s => ({ stockMovements: [...s.stockMovements, mv], counters: nextCounter(s.counters, 'STK') }))

        // Auto-generate journal entry only for type='out' (materials used)
        // type='in' is already covered by the purchase-invoice generator.
        // type='adjustment' typically has no financial effect on its own.
        if (data.type === 'out') {
          const item = get().items.find(i => i.id === data.itemId)
          if (item) {
            try {
              onStockMovementOut(mv, item.costPrice, item.name, get()._journalCtx())
            } catch (err) {
              console.error('[journal] stock-out generator failed:', err)
            }
          }
        }

        return mv
      },
      deleteStockMovement: (id) =>
        set(s => ({ stockMovements: s.stockMovements.filter(m => m.id !== id) })),

      // ── Suppliers ────────────────────────────────────────────────────────
      addSupplier: (data) => {
        const { counters } = get()
        const id = generateId('SUP', counters)
        const supplier: Supplier = { ...data, id, createdAt: now() }
        set(s => ({ suppliers: [...s.suppliers, supplier], counters: nextCounter(s.counters, 'SUP') }))
        return supplier
      },
      updateSupplier: (id, data) =>
        set(s => ({ suppliers: s.suppliers.map(s2 => s2.id === id ? { ...s2, ...data } : s2) })),
      deleteSupplier: (id) =>
        set(s => ({ suppliers: s.suppliers.filter(s2 => s2.id !== id) })),

      // ── Banks ────────────────────────────────────────────────────────────
      addBank: (data) => {
        const { counters } = get()
        const id = generateId('BNK', counters)
        const type = data.accountType ?? 'current'
        const bank: BankAccount = { ...data, accountType: type, id, createdAt: now() }

        if (type === 'current') {
          // Auto-create a linked Postdated Checks account
          const counters2 = nextCounter(counters, 'BNK')
          const postdatedId = generateId('BNK', counters2)
          const postdated: BankAccount = {
            id: postdatedId,
            name: `${data.name} — Postdated`,
            bankName: data.bankName,
            accountNumber: '',
            iban: '',
            initialBalance: 0,
            currency: data.currency,
            notes: '',
            accountType: 'postdated',
            linkedBankId: id,
            createdAt: now(),
          }
          set(s => ({
            banks: [...s.banks, bank, postdated],
            counters: nextCounter(nextCounter(s.counters, 'BNK'), 'BNK'),
          }))
        } else {
          set(s => ({ banks: [...s.banks, bank], counters: nextCounter(s.counters, 'BNK') }))
        }
        return bank
      },
      updateBank: (id, data) =>
        set(s => {
          let banks = s.banks.map(b => b.id === id ? { ...b, ...data } : b)
          // Sync postdated account name when a current bank is renamed
          const updated = banks.find(b => b.id === id)
          if ((updated?.accountType ?? 'current') === 'current' && data.name) {
            banks = banks.map(b =>
              b.accountType === 'postdated' && b.linkedBankId === id
                ? { ...b, name: `${data.name} — Postdated`, bankName: data.bankName ?? b.bankName, currency: data.currency ?? b.currency }
                : b
            )
          }
          return { banks }
        }),
      deleteBank: (id) =>
        // Also delete any linked postdated account
        set(s => ({ banks: s.banks.filter(b => b.id !== id && b.linkedBankId !== id) })),

      // ── Payments ─────────────────────────────────────────────────────────
      addPayment: (data) => {
        const { counters } = get()
        const id = generateId('PAY', counters)
        const payment: Payment = { ...data, id, createdAt: now() }
        set(s => ({ payments: [...s.payments, payment], counters: nextCounter(s.counters, 'PAY') }))

        // Auto-create check when payment type is 'check'
        if (data.type === 'check' && data.checkNumber) {
          const check = get().addCheck({
            checkNumber: data.checkNumber,
            type: data.direction === 'in' ? 'received' : 'issued',
            status: 'pending',
            amount: data.amount,
            currency: data.currency || 'ILS',
            bankAccountId: data.bankAccountId,
            issuerName: data.checkIssuerName || '',
            payeeName: data.checkPayeeName || '',
            issueDate: data.date,
            dueDate: data.checkDueDate || data.date,
            projectId: data.projectId,
            clientId: data.clientId,
            supplierId: data.supplierId,
            paymentId: id,
            notes: `Auto-created from payment ${id}`,
          })
          // Link check back to payment
          get().updatePayment(id, { checkId: check.id })
        }
        // Auto-reconcile all purchase invoices for this supplier
        if (data.supplierId && data.direction === 'out') {
          const { purchaseInvoices } = get()
          purchaseInvoices
            .filter(inv => inv.supplierId === data.supplierId)
            .forEach(inv => get().reconcilePurchaseInvoice(inv.id))
        }

        // Auto-generate journal entry (supplier payments only)
        if (data.direction === 'out' && data.entityType === 'supplier') {
          try { onPaymentToSupplierCreated(payment, get()._journalCtx()) }
          catch (err) { console.error('[journal] payment generator failed:', err) }
        }

        return payment
      },
      updatePayment: (id, data) => {
        set(s => ({ payments: s.payments.map(p => p.id === id ? { ...p, ...data } : p) }))
        // Reconcile if supplier payment was updated
        const updated = get().payments.find(p => p.id === id)
        if (updated?.supplierId && (updated.direction === 'out' || data.direction === 'out')) {
          const supplierId = (data as any).supplierId || updated.supplierId
          get().purchaseInvoices
            .filter(inv => inv.supplierId === supplierId)
            .forEach(inv => get().reconcilePurchaseInvoice(inv.id))
        }
      },
      deletePayment: (id) => {
        const toDelete = get().payments.find(p => p.id === id)
        set(s => ({ payments: s.payments.filter(p => p.id !== id) }))
        // Reconcile after deletion
        if (toDelete?.supplierId && toDelete.direction === 'out') {
          get().purchaseInvoices
            .filter(inv => inv.supplierId === toDelete.supplierId)
            .forEach(inv => get().reconcilePurchaseInvoice(inv.id))
        }
      },

      // ── Checks ───────────────────────────────────────────────────────────
      addCheck: (data) => {
        const { counters } = get()
        const id = generateId('CHK', counters)
        const check: Check = { ...data, id, createdAt: now() }
        set(s => ({ checks: [...s.checks, check], counters: nextCounter(s.counters, 'CHK') }))
        return check
      },
      updateCheck: (id, data) => {
        const before = get().checks.find(c => c.id === id)
        set(s => ({ checks: s.checks.map(c => c.id === id ? { ...c, ...data } : c) }))
        const after = get().checks.find(c => c.id === id)
        if (before && after) generateCheckStatusEntry(get(), before, after)
      },
      deleteCheck: (id) =>
        set(s => ({ checks: s.checks.filter(c => c.id !== id) })),
      bulkUpdateCheckStatus: (ids, status, extra) => {
        const before = new Map(get().checks.filter(c => ids.includes(c.id)).map(c => [c.id, c]))
        set(s => ({
          checks: s.checks.map(c =>
            ids.includes(c.id) ? { ...c, status, ...extra } : c
          ),
        }))
        // Generate entries for each transition
        for (const id of ids) {
          const b = before.get(id)
          const a = get().checks.find(c => c.id === id)
          if (b && a) generateCheckStatusEntry(get(), b, a)
        }
      },

      // ── Transfers ────────────────────────────────────────────────────────
      addTransfer: (data) => {
        const { counters } = get()
        const id = generateId('TRF', counters)
        const transfer: BankTransfer = { ...data, id, createdAt: now() }
        set(s => ({ transfers: [...s.transfers, transfer], counters: nextCounter(s.counters, 'TRF') }))

        // Auto-generate journal entry: DR Destination, CR Source + Bank Charges (if fee)
        try { onBankTransferCreated(transfer, get()._journalCtx()) }
        catch (err) { console.error('[journal] transfer generator failed:', err) }

        return transfer
      },
      updateTransfer: (id, data) =>
        set(s => ({ transfers: s.transfers.map(t => t.id === id ? { ...t, ...data } : t) })),
      deleteTransfer: (id) =>
        set(s => ({ transfers: s.transfers.filter(t => t.id !== id) })),

      // ── Receipts ─────────────────────────────────────────────────────────
      addReceipt: (data) => {
        const { counters } = get()
        const id = generateId('RCP', counters)
        const receipt: Receipt = { ...data, id, createdAt: now() }
        set(s => ({ receipts: [...s.receipts, receipt], counters: nextCounter(s.counters, 'RCP') }))

        // Auto-generate journal entries:
        //   - With line items (sales invoice): DR AR, CR Revenue + VAT
        //   - Without line items (simple cash receipt): DR Cash/Bank, CR AR
        try {
          const ctx = get()._journalCtx()
          if (receipt.lineItems && receipt.lineItems.length > 0) {
            onSalesInvoiceCreated(receipt, ctx)
          } else {
            onReceiptCreated(receipt, ctx)
          }
        } catch (err) {
          console.error('[journal] receipt generator failed:', err)
        }

        return receipt
      },
      updateReceipt: (id, data) =>
        set(s => ({ receipts: s.receipts.map(r => r.id === id ? { ...r, ...data } : r) })),
      deleteReceipt: (id) =>
        set(s => ({ receipts: s.receipts.filter(r => r.id !== id) })),

      // ── Quotations ───────────────────────────────────────────────────────
      addQuotation: (data) => {
        const { counters } = get()
        const id = generateId('QOT', counters)
        const quotation: Quotation = { ...data, id, createdAt: now() }
        set(s => ({ quotations: [...s.quotations, quotation], counters: nextCounter(s.counters, 'QOT') }))
        return quotation
      },
      updateQuotation: (id, data) =>
        set(s => ({ quotations: s.quotations.map(q => q.id === id ? { ...q, ...data } : q) })),
      deleteQuotation: (id) =>
        set(s => ({ quotations: s.quotations.filter(q => q.id !== id) })),
      convertQuotationToProject: (quotationId) => {
        const { quotations, clients } = get()
        const q = quotations.find(q => q.id === quotationId)
        if (!q || q.status !== 'accepted') return null
        const project = get().addProject({
          clientId: q.clientId,
          name: q.title,
          description: `Created from quotation ${q.id}`,
          status: 'pending',
          location: '',
          startDate: new Date().toISOString().split('T')[0],
          budget: q.total,
          notes: q.notes,
        })
        get().updateQuotation(quotationId, { projectId: project.id })
        return project
      },

      // ── Work Orders ──────────────────────────────────────────────────────
      addWorkOrder: (data) => {
        const { counters } = get()
        const id = generateId('WRK', counters)
        const wo: WorkOrder = { ...data, id, createdAt: now() }
        set(s => ({ workOrders: [...s.workOrders, wo], counters: nextCounter(s.counters, 'WRK') }))

        // If a work order is created with quantityUsed already > 0
        // (uncommon but possible), record the stock-out movements.
        if (data.materials) {
          for (const m of data.materials) {
            if (m.quantityUsed && m.quantityUsed > 0) {
              get().addStockMovement({
                itemId:    m.itemId,
                type:      'out',
                quantity:  m.quantityUsed,
                projectId: data.projectId,
                notes:     `Used on work order ${id}`,
                date:      data.startDate,
              })
            }
          }
        }

        return wo
      },
      updateWorkOrder: (id, data) => {
        // Snapshot before for material-usage diff
        const before = get().workOrders.find(w => w.id === id)
        set(s => ({ workOrders: s.workOrders.map(w => w.id === id ? { ...w, ...data } : w) }))
        const after = get().workOrders.find(w => w.id === id)

        // Diff materials.quantityUsed and emit stock-out movements for the delta.
        // We never deduct on adds (purchase invoices handle stock-in); only on
        // increases to quantityUsed.
        if (before && after && after.materials) {
          const beforeUsed = new Map<string, number>()
          for (const m of (before.materials || [])) beforeUsed.set(m.itemId, m.quantityUsed || 0)

          for (const m of after.materials) {
            const prior = beforeUsed.get(m.itemId) ?? 0
            const cur   = m.quantityUsed || 0
            const delta = cur - prior
            if (delta > 0) {
              get().addStockMovement({
                itemId:    m.itemId,
                type:      'out',
                quantity:  delta,
                projectId: after.projectId,
                notes:     `Used on work order ${id}`,
                date:      new Date().toISOString().split('T')[0],
              })
            }
            // Note: we don't reverse on negative deltas. If the user
            // mistakenly recorded too much, they should record an
            // adjustment movement explicitly.
          }
        }
      },
      deleteWorkOrder: (id) =>
        set(s => ({ workOrders: s.workOrders.filter(w => w.id !== id) })),

      // ── Employees ────────────────────────────────────────────────────────
      addEmployee: (data) => {
        const { counters } = get()
        const id = generateId('EMP', counters)
        const emp: Employee = { ...data, id, createdAt: now() }
        set(s => ({ employees: [...s.employees, emp], counters: nextCounter(s.counters, 'EMP') }))
        return emp
      },
      updateEmployee: (id, data) =>
        set(s => ({ employees: s.employees.map(e => e.id === id ? { ...e, ...data } : e) })),
      deleteEmployee: (id) =>
        set(s => ({ employees: s.employees.filter(e => e.id !== id) })),

      // ── Labor Entries ────────────────────────────────────────────────────
      addLaborEntry: (data) => {
        const { counters } = get()
        const id = generateId('LBR', counters)
        const entry: LaborEntry = { ...data, id, createdAt: now() }
        set(s => ({ laborEntries: [...s.laborEntries, entry], counters: nextCounter(s.counters, 'LBR') }))

        // Auto-generate journal entry: DR Direct Labor, CR Accrued Salaries
        const employee = get().employees.find(e => e.id === data.employeeId)
        if (employee) {
          try { onLaborEntryCreated(entry, employee.name, get()._journalCtx()) }
          catch (err) { console.error('[journal] labor generator failed:', err) }
        }

        return entry
      },
      updateLaborEntry: (id, data) =>
        set(s => ({ laborEntries: s.laborEntries.map(l => l.id === id ? { ...l, ...data } : l) })),
      deleteLaborEntry: (id) =>
        set(s => ({ laborEntries: s.laborEntries.filter(l => l.id !== id) })),

      // ── Warranties ───────────────────────────────────────────────────────
      addWarranty: (data) => {
        const { counters } = get()
        const id = generateId('WRT', counters)
        const warranty: Warranty = { ...data, id, createdAt: now() }
        set(s => ({ warranties: [...s.warranties, warranty], counters: nextCounter(s.counters, 'WRT') }))
        return warranty
      },
      updateWarranty: (id, data) =>
        set(s => ({ warranties: s.warranties.map(w => w.id === id ? { ...w, ...data } : w) })),
      deleteWarranty: (id) =>
        set(s => ({ warranties: s.warranties.filter(w => w.id !== id) })),

      // ── Journal Entries ──────────────────────────────────────────────────
      addJournalEntry: (data) => {
        const { counters } = get()
        const id = generateId('JRN', counters)
        const entry: JournalEntry = { ...data, id, createdAt: now() }
        set(s => ({ journalEntries: [...s.journalEntries, entry], counters: nextCounter(s.counters, 'JRN') }))
        return entry
      },
      updateJournalEntry: (id, data) =>
        set(s => ({ journalEntries: s.journalEntries.map(e => e.id === id ? { ...e, ...data } : e) })),
      deleteJournalEntry: (id) =>
        set(s => ({ journalEntries: s.journalEntries.filter(e => e.id !== id) })),

      // ── Chart of Accounts ────────────────────────────────────────────────
      addChartAccount: (data) => {
        const { counters } = get()
        const id = generateId('ACC', counters)
        const account: ChartAccount = { ...data, id, createdAt: now() }
        set(s => ({
          chartAccounts: [...s.chartAccounts, account],
          counters: nextCounter(s.counters, 'ACC'),
        }))
        return account
      },
      updateChartAccount: (id, data) =>
        set(s => ({
          chartAccounts: s.chartAccounts.map(a => a.id === id ? { ...a, ...data } : a),
        })),
      deleteChartAccount: (id) =>
        set(s => {
          // Don't allow deleting system accounts
          const target = s.chartAccounts.find(a => a.id === id)
          if (!target || target.isSystem) return s
          return { chartAccounts: s.chartAccounts.filter(a => a.id !== id) }
        }),
      seedChartOfAccounts: () => {
        const { chartAccounts, counters } = get()
        if (chartAccounts.length > 0) return  // already seeded — idempotent

        let nextCounters = counters
        const seeded: ChartAccount[] = DEFAULT_CHART_OF_ACCOUNTS.map(row => {
          const id = generateId('ACC', nextCounters)
          nextCounters = nextCounter(nextCounters, 'ACC')
          return { ...row, id, createdAt: now() }
        })
        set({ chartAccounts: seeded, counters: nextCounters })

        // Auto-seed default mappings against the freshly seeded accounts
        get().seedAccountMappings()
      },

      // ── Account Mappings ─────────────────────────────────────────────────
      setAccountMapping: (key, accountCode) =>
        set(s => {
          const existing = s.accountMappings.find(m => m.key === key)
          if (existing) {
            return {
              accountMappings: s.accountMappings.map(m =>
                m.key === key ? { ...m, accountCode } : m,
              ),
            }
          }
          return { accountMappings: [...s.accountMappings, { key, accountCode }] }
        }),

      seedAccountMappings: () => {
        const { accountMappings, chartAccounts } = get()
        if (accountMappings.length > 0) return  // idempotent
        if (chartAccounts.length === 0) return  // need accounts first

        // Standard mapping: key → CoA code (matches DEFAULT_CHART_OF_ACCOUNTS)
        const DEFAULTS: Array<[AccountMappingKey, string]> = [
          ['cash',                '1100'],
          ['accounts_receivable', '1300'],
          ['checks_in_box',       '1310'],
          ['postdated_checks',    '1320'],
          ['inventory',           '1400'],
          ['accounts_payable',    '2100'],
          ['checks_payable',      '2110'],
          ['vat_payable',         '2200'],
          ['vat_receivable',      '2200'],   // same account both sides until separated
          ['accrued_salaries',    '2310'],
          ['service_revenue',     '4100'],
          ['sales_revenue',       '4200'],
          ['direct_materials',    '5110'],
          ['direct_labor',        '5210'],
          ['bank_charges',        '5410'],
        ]

        const validCodes = new Set(chartAccounts.map(a => a.code))
        const mappings = DEFAULTS
          .filter(([, code]) => validCodes.has(code))
          .map(([key, accountCode]) => ({ key, accountCode }))

        set({ accountMappings: mappings })
      },

      getMappedAccount: (key) => {
        const { accountMappings, chartAccounts } = get()
        const m = accountMappings.find(x => x.key === key)
        if (!m) return undefined
        return chartAccounts.find(a => a.code === m.accountCode)
      },

      // ── Purchase Invoices ────────────────────────────────────────────────
      addPurchaseInvoice: (data, createMovements = true) => {
        const { counters } = get()
        const id = generateId('PUR', counters)
        const invoice: PurchaseInvoice = { ...data, id, createdAt: now() }
        set(s => ({ purchaseInvoices: [...s.purchaseInvoices, invoice], counters: nextCounter(s.counters, 'PUR') }))
        // Auto-create stock-in movements for each line that has an itemId
        if (createMovements) {
          for (const line of data.lineItems) {
            if (line.itemId && line.quantity > 0) {
              get().addStockMovement({
                itemId: line.itemId,
                type: 'in',
                quantity: line.quantity,
                projectId: data.projectId,
                supplierId: data.supplierId,
                unitCost: line.unitPrice,
                notes: `Auto from purchase invoice ${id}`,
                date: data.date,
              })
            }
          }
        }

        // Auto-generate journal entry: DR Inventory + VAT, CR AP
        try { onPurchaseInvoiceCreated(invoice, get()._journalCtx()) }
        catch (err) { console.error('[journal] purchase invoice generator failed:', err) }

        return invoice
      },
      updatePurchaseInvoice: (id, data) =>
        set(s => ({ purchaseInvoices: s.purchaseInvoices.map(p => p.id === id ? { ...p, ...data } : p) })),
      deletePurchaseInvoice: (id) =>
        set(s => ({ purchaseInvoices: s.purchaseInvoices.filter(p => p.id !== id) })),

      // ── Exchange Rates ────────────────────────────────────────────────────
      addExchangeRate: (data) => {
        const { counters } = get()
        const id = generateId('XRT', counters)
        const xr: ExchangeRate = { ...data, id, createdAt: now() }
        set(s => ({ exchangeRates: [...s.exchangeRates, xr], counters: nextCounter(s.counters, 'XRT') }))
        return xr
      },
      updateExchangeRate: (id, data) =>
        set(s => ({ exchangeRates: s.exchangeRates.map(x => x.id === id ? { ...x, ...data } : x) })),
      deleteExchangeRate: (id) =>
        set(s => ({ exchangeRates: s.exchangeRates.filter(x => x.id !== id) })),
      getLatestRate: (currency) => {
        const rates = get().exchangeRates
          .filter(x => x.currency === currency)
          .sort((a, b) => b.date.localeCompare(a.date))
        return rates.length > 0 ? rates[0].rate : null
      },

      // ── Photos ───────────────────────────────────────────────────────────
      addPhoto: (data) => {
        const photo: PhotoAttachment = { ...data, id: uid() }
        set(s => ({ photos: [...s.photos, photo] }))
        return photo
      },
      deletePhoto: (id) =>
        set(s => ({ photos: s.photos.filter(p => p.id !== id) })),
      getPhotos: (entityType, entityId) =>
        get().photos.filter(p => p.entityType === entityType && p.entityId === entityId),

      // ── Settings ─────────────────────────────────────────────────────────
      updateSettings: (data) =>
        set(s => ({ settings: { ...s.settings, ...data } })),

      // ── Export / Import ──────────────────────────────────────────────────
      exportData: () => {
        const s = get()
        return JSON.stringify({
          counters: s.counters, clients: s.clients, projects: s.projects,
          items: s.items, stockMovements: s.stockMovements, suppliers: s.suppliers,
          banks: s.banks, payments: s.payments, checks: s.checks,
          transfers: s.transfers, receipts: s.receipts, quotations: s.quotations,
          workOrders: s.workOrders, employees: s.employees, laborEntries: s.laborEntries,
          warranties: s.warranties, purchaseInvoices: s.purchaseInvoices,
          exchangeRates: s.exchangeRates, journalEntries: s.journalEntries,
          chartAccounts: s.chartAccounts,
          accountMappings: s.accountMappings,
          photos: s.photos, settings: s.settings,
        }, null, 2)
      },
      importData: (json) => {
        try {
          const data = JSON.parse(json)
          set({
            counters: data.counters ?? INITIAL_COUNTERS,
            clients: data.clients ?? [],
            projects: data.projects ?? [],
            items: data.items ?? [],
            stockMovements: data.stockMovements ?? [],
            suppliers: data.suppliers ?? [],
            banks: data.banks ?? [],
            payments: data.payments ?? [],
            checks: data.checks ?? [],
            transfers: data.transfers ?? [],
            receipts: data.receipts ?? [],
            quotations: data.quotations ?? [],
            workOrders: data.workOrders ?? [],
            employees: data.employees ?? [],
            laborEntries: data.laborEntries ?? [],
            warranties: data.warranties ?? [],
            purchaseInvoices: data.purchaseInvoices ?? [],
            exchangeRates: data.exchangeRates ?? [],
            journalEntries: data.journalEntries ?? [],
            chartAccounts: data.chartAccounts ?? [],
            accountMappings: data.accountMappings ?? [],
            photos: data.photos ?? [],
            settings: { ...DEFAULT_SETTINGS, ...data.settings },
          })
          return true
        } catch {
          return false
        }
      },

      // ── Derived: Bank Balance ─────────────────────────────────────────────
      getBankBalance: (bankId) => {
        const { banks, payments, transfers, checks } = get()
        const bank = banks.find(b => b.id === bankId)
        if (!bank) return 0
        const type = bank.accountType ?? 'current'

        // ── a. Cash account ──────────────────────────────────────────────────
        if (type === 'cash') {
          let balance = bank.initialBalance
          for (const p of payments) {
            if (p.bankAccountId === bankId) {
              balance += p.direction === 'in' ? p.amount : -p.amount
            }
          }
          return balance
        }

        // ── b. Current bank account ──────────────────────────────────────────
        if (type === 'current') {
          let balance = bank.initialBalance
          for (const p of payments) {
            if (p.bankAccountId === bankId && p.type !== 'cash') {
              balance += p.direction === 'in' ? p.amount : -p.amount
            }
          }
          for (const t of transfers) {
            if (t.fromAccountId === bankId) balance -= (t.amount + t.fee)
            if (t.toAccountId   === bankId) balance += t.amount
          }
          // Only 'cleared' checks count toward the current account balance.
          // 'deposited' checks stay in the linked postdated account until cleared.
          for (const c of checks) {
            if (c.bankAccountId === bankId && c.status === 'cleared') {
              balance += c.type === 'received' ? c.amount : -c.amount
            }
          }
          return balance
        }

        // ── c. Checks box ────────────────────────────────────────────────────
        // All received checks physically in hand (status = pending, no bank assigned yet)
        if (type === 'checks_box') {
          return checks
            .filter(c => c.type === 'received' && c.status === 'pending')
            .reduce((s, c) => s + c.amount, 0)
        }

        // ── d. Postdated checks account ──────────────────────────────────────
        // Received checks deposited to the linked bank but not yet cleared.
        // When a check status → 'cleared', the amount moves to the current bank account.
        if (type === 'postdated') {
          const linkedId = bank.linkedBankId
          return checks
            .filter(c => c.bankAccountId === linkedId && c.type === 'received' && c.status === 'deposited')
            .reduce((s, c) => s + c.amount, 0)
        }

        // ── e. Returned checks account ───────────────────────────────────────
        // Sum of received checks that were returned/bounced.
        if (type === 'returned_checks') {
          return checks
            .filter(c => c.type === 'received' && (c.status === 'bounced' || c.status === 'returned'))
            .reduce((s, c) => s + c.amount, 0)
        }

        return 0
      },

      // ── Derived: Stock Level ──────────────────────────────────────────────
      getItemStock: (itemId) => {
        const { stockMovements } = get()
        let stock = 0
        const sorted = [...stockMovements]
          .filter(m => m.itemId === itemId)
          .sort((a, b) => a.date.localeCompare(b.date))
        for (const m of sorted) {
          if (m.type === 'in')         stock += m.quantity
          else if (m.type === 'out')   stock -= m.quantity
          else if (m.type === 'adjustment') stock = m.quantity
        }
        return stock
      },

      // ── Derived: Project Financials ───────────────────────────────────────
      getProjectFinancials: (projectId) => {
        const { payments, laborEntries } = get()
        const pp = payments.filter(p => p.projectId === projectId)
        const received  = pp.filter(p => p.direction === 'in').reduce((s, p) => s + p.amount, 0)
        const spent     = pp.filter(p => p.direction === 'out').reduce((s, p) => s + p.amount, 0)
        const laborCost = laborEntries.filter(l => l.projectId === projectId).reduce((s, l) => s + l.totalCost, 0)
        return { received, spent, laborCost, balance: received - spent - laborCost }
      },

      // ── Derived: Low Stock ────────────────────────────────────────────────
      getLowStockItems: () => {
        const { items, getItemStock } = get()
        return items.filter(i => getItemStock(i.id) <= i.minStock)
      },

      // ── Derived: Pending Checks ───────────────────────────────────────────
      getPendingChecks: () => get().checks.filter(c => c.status === 'pending'),

      getTotalReceivable: () =>
        get().checks.filter(c => c.type === 'received' && c.status === 'pending').reduce((s, c) => s + c.amount, 0),

      getTotalPayable: () =>
        get().checks.filter(c => c.type === 'issued' && c.status === 'pending').reduce((s, c) => s + c.amount, 0),

      // ── Derived: Expiring Warranties ──────────────────────────────────────
      getExpiringWarranties: () => {
        const { warranties } = get()
        const in30Days = new Date()
        in30Days.setDate(in30Days.getDate() + 30)
        return warranties.filter(w =>
          w.status === 'active' && new Date(w.endDate) <= in30Days
        )
      },

      // ── Derived: Project Labor Cost ───────────────────────────────────────
      getProjectLaborCost: (projectId) =>
        get().laborEntries.filter(l => l.projectId === projectId).reduce((s, l) => s + l.totalCost, 0),

      // ── Derived: Monthly Report ───────────────────────────────────────────
      getMonthlyReport: (yearMonth) => {
        const { payments, laborEntries } = get()
        const mp = payments.filter(p => p.date.startsWith(yearMonth))
        const income   = mp.filter(p => p.direction === 'in').reduce((s, p) => s + p.amount, 0)
        const expenses = mp.filter(p => p.direction === 'out').reduce((s, p) => s + p.amount, 0)
        const labor    = laborEntries.filter(l => l.date.startsWith(yearMonth)).reduce((s, l) => s + l.totalCost, 0)
        return { income, expenses, labor, profit: income - expenses - labor }
      },

      // ── Derived: Checks-in-Box Balance ───────────────────────────────────
      // Returns the total value of received checks that are still in the box
      // (status === 'pending') for a given currency.
      getChecksInBoxBalance: (currency) => {
        const { checks } = get()
        return checks
          .filter(c => c.type === 'received' && c.status === 'pending' && c.currency === currency)
          .reduce((sum, c) => sum + c.amount, 0)
      },

      // ── Reconcile Purchase Invoice ────────────────────────────────────────
      // Precise reconciliation: prefer payments explicitly linked via
      // `purchaseInvoiceId`. If none of this supplier's payments are linked
      // (legacy data), fall back to the supplier-sum approach for backward
      // compatibility — capped at this invoice's outstanding balance, with
      // earlier invoices for the same supplier consuming payments first.
      reconcilePurchaseInvoice: (invoiceId) => {
        const { purchaseInvoices, payments } = get()
        const inv = purchaseInvoices.find(p => p.id === invoiceId)
        if (!inv) return

        // Precise: payments linked to this exact invoice (single or multi-invoice link)
        const linkedPaid = payments
          .filter(p =>
            p.direction === 'out' &&
            (p.purchaseInvoiceId === invoiceId ||
              p.purchaseInvoiceIds?.includes(invoiceId))
          )
          .reduce((s, p) => s + p.amount, 0)

        // Are there any linked payments for this supplier at all?
        const supplierHasLinks = payments.some(p =>
          p.direction === 'out' &&
          p.supplierId === inv.supplierId &&
          (p.purchaseInvoiceId || (p.purchaseInvoiceIds && p.purchaseInvoiceIds.length > 0))
        )

        let newPaid: number
        if (supplierHasLinks) {
          // Modern path: only count precisely linked payments
          newPaid = Math.min(linkedPaid, inv.total)
        } else {
          // Legacy fallback: FIFO allocation across this supplier's invoices
          // (oldest invoice gets paid first, capped at its total)
          const supplierInvoices = [...purchaseInvoices]
            .filter(p => p.supplierId === inv.supplierId)
            .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))

          let remaining = payments
            .filter(p => p.supplierId === inv.supplierId && p.direction === 'out')
            .reduce((s, p) => s + p.amount, 0)

          newPaid = 0
          for (const si of supplierInvoices) {
            if (si.id === invoiceId) {
              newPaid = Math.min(remaining, inv.total)
              break
            }
            remaining = Math.max(0, remaining - si.total)
          }
        }

        let status: PurchaseInvoice['status'] = inv.status
        if (newPaid >= inv.total) status = 'paid'
        else if (newPaid > 0)     status = 'partial'
        else                      status = 'received'

        get().updatePurchaseInvoice(invoiceId, { paidAmount: newPaid, status })
      },

      // ── Derived: Supplier Balance ─────────────────────────────────────────
      // Total owed to a supplier = sum of purchase invoice totals – payments out to them
      getSupplierBalance: (supplierId) => {
        const { purchaseInvoices, payments } = get()
        const invoiced = purchaseInvoices
          .filter(i => i.supplierId === supplierId)
          .reduce((s, i) => s + i.total, 0)
        const paid = payments
          .filter(p => p.supplierId === supplierId && p.direction === 'out')
          .reduce((s, p) => s + p.amount, 0)
        return invoiced - paid
      },

      // ── Derived: Client Balance ───────────────────────────────────────────
      // Total owed by a client = sum of sales receipts – payments in from them
      getClientBalance: (clientId) => {
        const { receipts, payments } = get()
        const invoiced = receipts
          .filter(r => r.clientId === clientId)
          .reduce((s, r) => s + r.total, 0)
        const received = payments
          .filter(p => p.clientId === clientId && p.direction === 'in')
          .reduce((s, p) => s + p.amount, 0)
        return invoiced - received
      },

      // ── Derived: Sales Invoice Paid Amount ────────────────────────────────
      // Sums everything that has been applied against this sales invoice:
      //   - other Receipts that explicitly settle it (salesInvoiceId === id)
      //   - Payments directed in with salesInvoiceId === id
      getSalesInvoicePaid: (invoiceId) => {
        const { receipts, payments } = get()
        const fromReceipts = receipts
          .filter(r => r.salesInvoiceId === invoiceId)
          .reduce((s, r) => s + (r.total || 0), 0)
        const fromPayments = payments
          .filter(p => p.direction === 'in' && p.salesInvoiceId === invoiceId)
          .reduce((s, p) => s + p.amount, 0)
        return fromReceipts + fromPayments
      },

      // ── Derived: Sales Invoice Status ─────────────────────────────────────
      getSalesInvoiceStatus: (invoiceId) => {
        const { receipts, getSalesInvoicePaid } = get()
        const inv = receipts.find(r => r.id === invoiceId)
        if (!inv) return 'unpaid'
        const paid = getSalesInvoicePaid(invoiceId)
        if (paid >= inv.total) return 'paid'
        if (paid > 0)          return 'partial'
        return 'unpaid'
      },

      // ── Internal: build a journal-generator context ──────────────────────
      // Resolves account mapping keys + bank-account IDs to ChartAccount IDs,
      // and exposes addJournalEntry so generators stay decoupled from the store.
      _journalCtx: () => {
        const resolver: AccountResolver = {
          byKey: (key) => {
            const mapping = get().accountMappings.find(m => m.key === key)
            if (!mapping) return undefined
            const account = get().chartAccounts.find(a => a.code === mapping.accountCode)
            return account?.id
          },
          forBankAccount: (bankAccountId) => {
            // Until a per-bank CoA account exists, route by accountType:
            //   cash       → mapping 'cash' (1100)
            //   current    → CoA code '1210' if seeded, else 'cash' fallback
            //   checks_box → mapping 'checks_in_box' (1310)
            //   postdated  → mapping 'postdated_checks' (1320)
            //   returned   → uses 'cash' as fallback (no dedicated account yet)
            const bank = get().banks.find(b => b.id === bankAccountId)
            if (!bank) return undefined
            const type = bank.accountType ?? 'current'

            // Try direct CoA code lookup for current accounts first
            if (type === 'current') {
              const coaCurrent = get().chartAccounts.find(a => a.code === '1210')
              if (coaCurrent) return coaCurrent.id
            }

            const key: AccountMappingKey =
              type === 'cash'        ? 'cash'
            : type === 'checks_box'  ? 'checks_in_box'
            : type === 'postdated'   ? 'postdated_checks'
            :                          'cash'
            const mapping = get().accountMappings.find(m => m.key === key)
            if (!mapping) return undefined
            return get().chartAccounts.find(a => a.code === mapping.accountCode)?.id
          },
        }
        return {
          resolver,
          addJournalEntry: (data) => get().addJournalEntry(data),
        }
      },
    }),
    { name: 'electrician-manager-v1' }
  )
)
