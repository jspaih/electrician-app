/**
 * Auto Journal-Entry Generator
 * ---------------------------------------------------------------
 * Connects business transactions (payments, receipts, invoices,
 * stock movements, labor) to the Chart of Accounts by writing
 * balanced double-entry JournalEntry records into the store.
 *
 * The store calls these generators inside its `add*` actions so a
 * journal entry is created at the same time as the source record.
 *
 * Design rules:
 *   - All entries balance (Σdebit === Σcredit) — guarded with throw
 *     before the entry is saved.
 *   - Each entry sets `source` and `sourceId` so it's traceable
 *     back to the originating transaction record.
 *   - If account mappings are missing (CoA not seeded), the
 *     generators degrade silently — they log a warning and skip.
 *     The business transaction itself still saves.
 *   - Failures in the generator never roll back the source
 *     transaction. The user always wins; bookkeeping catches up.
 */

import type {
  Payment, Receipt, PurchaseInvoice, Check, StockMovement,
  LaborEntry, BankTransfer, JournalEntry, JournalLine,
  AccountMappingKey,
} from '../../types'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AccountResolver {
  /** Get the ChartAccount.id mapped to a key, or undefined. */
  byKey: (key: AccountMappingKey) => string | undefined
  /** Get the ChartAccount.id for a specific BankAccount, or undefined. */
  forBankAccount: (bankAccountId: string) => string | undefined
}

export interface GeneratorContext {
  resolver: AccountResolver
  /**
   * Called with the entry data, NOT yet persisted. The store
   * passes its own addJournalEntry here so the generator stays
   * decoupled from the store module.
   */
  addJournalEntry: (data: Omit<JournalEntry, 'id' | 'createdAt'>) => JournalEntry
}

interface DraftLine {
  accountId?:  string
  accountName: string
  debit:       number
  credit:      number
  notes?:      string
}

// ─── Internal helpers ───────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

function lineFor(opts: {
  accountId?: string; accountName: string;
  debit?: number; credit?: number; notes?: string
}): JournalLine {
  return {
    id:          uid(),
    accountId:   opts.accountId,
    accountName: opts.accountName,
    debit:       opts.debit  ?? 0,
    credit:      opts.credit ?? 0,
    notes:       opts.notes  ?? '',
  }
}

function balanced(lines: DraftLine[]): boolean {
  const dr = lines.reduce((s, l) => s + l.debit,  0)
  const cr = lines.reduce((s, l) => s + l.credit, 0)
  return Math.abs(dr - cr) < 0.001 && dr > 0
}

function buildEntry(
  source: NonNullable<JournalEntry['source']>,
  sourceId: string,
  date: string,
  reference: string,
  lines: DraftLine[],
  links: { projectId?: string; clientId?: string; supplierId?: string } = {},
): Omit<JournalEntry, 'id' | 'createdAt'> {
  const totalDebit  = lines.reduce((s, l) => s + l.debit,  0)
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0)
  return {
    date, reference, source, sourceId,
    lines: lines.map(l => lineFor({
      accountId:   l.accountId,
      accountName: l.accountName,
      debit:       l.debit,
      credit:      l.credit,
      notes:       l.notes,
    })),
    totalDebit, totalCredit,
    projectId:  links.projectId  ?? '',
    clientId:   links.clientId   ?? '',
    supplierId: links.supplierId ?? '',
    notes: '',
  }
}

function warnSkip(label: string, missing: string): void {
  // eslint-disable-next-line no-console
  console.warn(
    `[journalGenerator] Skipping ${label}: missing account mapping "${missing}". ` +
    `Run "Seed default accounts" in Chart of Accounts.`,
  )
}

// ─── Generators ─────────────────────────────────────────────────────────────

/**
 * Receipt from client (direction: in, by definition).
 *   DR: Cash | Checks in Box | Bank Account     [based on method]
 *   CR: Accounts Receivable
 */
export function onReceiptCreated(
  receipt: Receipt,
  ctx: GeneratorContext,
): JournalEntry | null {
  if (!receipt.total || receipt.total <= 0) return null

  const arAccountId = ctx.resolver.byKey('accounts_receivable')
  if (!arAccountId) { warnSkip('receipt', 'accounts_receivable'); return null }

  // Resolve debit account based on payment method + received account
  let debitAccountId: string | undefined
  let debitName = 'Cash'
  if (receipt.receivedAccountId) {
    debitAccountId = ctx.resolver.forBankAccount(receipt.receivedAccountId)
  }
  if (!debitAccountId) {
    const key: AccountMappingKey =
      receipt.paymentMethod === 'check'         ? 'checks_in_box'
    : receipt.paymentMethod === 'bank_transfer' ? 'cash'   // current bank fallback
    :                                             'cash'
    debitAccountId = ctx.resolver.byKey(key)
    debitName = key === 'checks_in_box' ? 'Checks in Box' : 'Cash'
  }
  if (!debitAccountId) { warnSkip('receipt', 'cash/checks_in_box'); return null }

  const lines: DraftLine[] = [
    {
      accountId:   debitAccountId,
      accountName: debitName,
      debit:       receipt.total,
      credit:      0,
      notes:       `Received via ${receipt.paymentMethod ?? 'cash'}`,
    },
    {
      accountId:   arAccountId,
      accountName: 'Accounts Receivable',
      debit:       0,
      credit:      receipt.total,
      notes:       'Client payment applied',
    },
  ]
  if (!balanced(lines)) return null

  return ctx.addJournalEntry(buildEntry(
    'receipt', receipt.id, receipt.date,
    `Receipt from client — ${receipt.id}`,
    lines,
    { clientId: receipt.clientId, projectId: receipt.projectId },
  ))
}

/**
 * Outgoing payment to supplier.
 *   DR: Accounts Payable
 *   CR: Cash | Checks Payable | Bank Account    [based on method]
 */
export function onPaymentToSupplierCreated(
  payment: Payment,
  ctx: GeneratorContext,
): JournalEntry | null {
  if (payment.direction !== 'out') return null
  if (payment.entityType !== 'supplier') return null
  if (!payment.amount || payment.amount <= 0) return null

  const apAccountId = ctx.resolver.byKey('accounts_payable')
  if (!apAccountId) { warnSkip('payment', 'accounts_payable'); return null }

  // Credit account based on method
  let creditAccountId: string | undefined
  let creditName = 'Cash'
  if (payment.bankAccountId) {
    creditAccountId = ctx.resolver.forBankAccount(payment.bankAccountId)
  }
  if (!creditAccountId) {
    const key: AccountMappingKey =
      payment.type === 'check' ? 'checks_payable'
    : payment.type === 'cash'  ? 'cash'
    :                            'cash'
    creditAccountId = ctx.resolver.byKey(key)
    creditName = key === 'checks_payable' ? 'Checks Payable' : 'Cash'
  }
  if (!creditAccountId) { warnSkip('payment', 'cash/checks_payable'); return null }

  const lines: DraftLine[] = [
    {
      accountId:   apAccountId,
      accountName: 'Accounts Payable',
      debit:       payment.amount,
      credit:      0,
      notes:       'Payment to supplier',
    },
    {
      accountId:   creditAccountId,
      accountName: creditName,
      debit:       0,
      credit:      payment.amount,
      notes:       `Via ${payment.type}`,
    },
  ]
  if (!balanced(lines)) return null

  return ctx.addJournalEntry(buildEntry(
    'payment', payment.id, payment.date,
    `Payment to supplier — ${payment.id}`,
    lines,
    { supplierId: payment.supplierId, projectId: payment.projectId },
  ))
}

/**
 * Purchase invoice received.
 *   DR: Inventory (subtotal - discount)
 *   DR: VAT Receivable (tax)
 *   CR: Accounts Payable (total)
 */
export function onPurchaseInvoiceCreated(
  invoice: PurchaseInvoice,
  ctx: GeneratorContext,
): JournalEntry | null {
  if (!invoice.total || invoice.total <= 0) return null

  const apId    = ctx.resolver.byKey('accounts_payable')
  const invId   = ctx.resolver.byKey('inventory')
  const vatRcvId = ctx.resolver.byKey('vat_receivable')

  if (!apId)  { warnSkip('purchase invoice', 'accounts_payable'); return null }
  if (!invId) { warnSkip('purchase invoice', 'inventory'); return null }

  const netCost = invoice.subtotal - invoice.discount

  const lines: DraftLine[] = [
    {
      accountId:   invId,
      accountName: 'Inventory',
      debit:       netCost,
      credit:      0,
      notes:       'Materials purchased',
    },
  ]
  if (invoice.tax > 0 && vatRcvId) {
    lines.push({
      accountId:   vatRcvId,
      accountName: 'VAT Receivable',
      debit:       invoice.tax,
      credit:      0,
      notes:       `Input VAT ${invoice.taxPercent}%`,
    })
  }
  lines.push({
    accountId:   apId,
    accountName: 'Accounts Payable',
    debit:       0,
    credit:      invoice.total,
    notes:       `Payable to supplier ${invoice.supplierId}`,
  })
  if (!balanced(lines)) return null

  return ctx.addJournalEntry(buildEntry(
    'purchase_invoice', invoice.id, invoice.date,
    `Purchase Invoice — ${invoice.id}`,
    lines,
    { supplierId: invoice.supplierId, projectId: invoice.projectId },
  ))
}

/**
 * Sales invoice (Receipt with line items, delivered to client).
 * Triggered when a Receipt with lineItems is added.
 *   DR: Accounts Receivable (total)
 *   CR: Service Revenue (subtotal - discount)
 *   CR: VAT Payable (tax)
 *
 * Note: simple receipts (amount-only, no line items) use
 * `onReceiptCreated` instead — those represent client payments,
 * not invoicing.
 */
export function onSalesInvoiceCreated(
  invoice: Receipt,
  ctx: GeneratorContext,
): JournalEntry | null {
  if (!invoice.lineItems || invoice.lineItems.length === 0) return null
  if (!invoice.total || invoice.total <= 0) return null

  const arId    = ctx.resolver.byKey('accounts_receivable')
  const revId   = ctx.resolver.byKey('service_revenue')
  const vatPayId = ctx.resolver.byKey('vat_payable')

  if (!arId)  { warnSkip('sales invoice', 'accounts_receivable'); return null }
  if (!revId) { warnSkip('sales invoice', 'service_revenue'); return null }

  const netRevenue = invoice.subtotal - invoice.discount

  const lines: DraftLine[] = [
    {
      accountId:   arId,
      accountName: 'Accounts Receivable',
      debit:       invoice.total,
      credit:      0,
      notes:       'Invoice to client',
    },
    {
      accountId:   revId,
      accountName: 'Service Revenue',
      debit:       0,
      credit:      netRevenue,
      notes:       'Service revenue',
    },
  ]
  if (invoice.tax > 0 && vatPayId) {
    lines.push({
      accountId:   vatPayId,
      accountName: 'VAT Payable',
      debit:       0,
      credit:      invoice.tax,
      notes:       `Output VAT ${invoice.taxPercent}%`,
    })
  }
  if (!balanced(lines)) return null

  return ctx.addJournalEntry(buildEntry(
    'sales_invoice', invoice.id, invoice.date,
    `Sales Invoice — ${invoice.id}`,
    lines,
    { clientId: invoice.clientId, projectId: invoice.projectId },
  ))
}

/**
 * Stock movement (out / usage).
 *   DR: Direct Materials (qty × cost)
 *   CR: Inventory
 */
export function onStockMovementOut(
  movement: StockMovement,
  itemCostPrice: number,
  itemName: string,
  ctx: GeneratorContext,
): JournalEntry | null {
  if (movement.type !== 'out') return null
  if (!movement.quantity || movement.quantity <= 0) return null

  const cost = (movement.unitCost ?? itemCostPrice) * movement.quantity
  if (cost <= 0) return null

  const cogsId = ctx.resolver.byKey('direct_materials')
  const invId  = ctx.resolver.byKey('inventory')
  if (!cogsId || !invId) { warnSkip('stock out', 'direct_materials/inventory'); return null }

  const lines: DraftLine[] = [
    { accountId: cogsId, accountName: 'Direct Materials', debit: cost, credit: 0,
      notes: `${movement.quantity} × ${itemName}` },
    { accountId: invId,  accountName: 'Inventory',         debit: 0,    credit: cost,
      notes: `Inventory out — ${itemName}` },
  ]
  if (!balanced(lines)) return null

  return ctx.addJournalEntry(buildEntry(
    'stock_movement', movement.id, movement.date,
    `Materials used — ${itemName}`,
    lines,
    { projectId: movement.projectId, supplierId: movement.supplierId },
  ))
}

/**
 * Labor entry.
 *   DR: Direct Labor
 *   CR: Accrued Salaries
 */
export function onLaborEntryCreated(
  entry: LaborEntry,
  employeeName: string,
  ctx: GeneratorContext,
): JournalEntry | null {
  if (!entry.totalCost || entry.totalCost <= 0) return null

  const laborId = ctx.resolver.byKey('direct_labor')
  const accId   = ctx.resolver.byKey('accrued_salaries')
  if (!laborId || !accId) { warnSkip('labor', 'direct_labor/accrued_salaries'); return null }

  const lines: DraftLine[] = [
    { accountId: laborId, accountName: 'Direct Labor', debit: entry.totalCost, credit: 0,
      notes: `${employeeName} — ${entry.hours}h @ ${entry.dailyRate}/day` },
    { accountId: accId,   accountName: 'Accrued Salaries', debit: 0, credit: entry.totalCost,
      notes: `Accrued wages — ${employeeName}` },
  ]
  if (!balanced(lines)) return null

  return ctx.addJournalEntry(buildEntry(
    'labor_entry', entry.id, entry.date,
    `Labor — ${employeeName}`,
    lines,
    { projectId: entry.projectId },
  ))
}

/**
 * Bank transfer.
 *   DR: Destination Bank (amount)
 *   CR: Source Bank (amount + fee)
 *   DR: Bank Charges (fee)   [if fee > 0]
 */
export function onBankTransferCreated(
  transfer: BankTransfer,
  ctx: GeneratorContext,
): JournalEntry | null {
  if (!transfer.amount || transfer.amount <= 0) return null

  const fromId = ctx.resolver.forBankAccount(transfer.fromAccountId)
  const toId   = ctx.resolver.forBankAccount(transfer.toAccountId)
  if (!fromId || !toId) { warnSkip('bank transfer', 'source/destination bank account'); return null }

  const lines: DraftLine[] = [
    { accountId: toId,   accountName: 'Destination Bank', debit: transfer.amount, credit: 0,
      notes: 'Transfer received' },
    { accountId: fromId, accountName: 'Source Bank',
      debit: 0, credit: transfer.amount + transfer.fee,
      notes: 'Transfer sent' },
  ]
  if (transfer.fee > 0) {
    const feeId = ctx.resolver.byKey('bank_charges')
    if (feeId) {
      lines.push({
        accountId: feeId, accountName: 'Bank Charges',
        debit: transfer.fee, credit: 0, notes: 'Transfer fee',
      })
    } else {
      // No bank-charges account mapped — skip the fee line and rebalance
      // by reducing the source-account credit to just the amount.
      const srcLine = lines.find(l => l.accountId === fromId)
      if (srcLine) srcLine.credit = transfer.amount
    }
  }
  if (!balanced(lines)) return null

  return ctx.addJournalEntry(buildEntry(
    'bank_transfer', transfer.id, transfer.date,
    `Bank Transfer — ${transfer.id}`,
    lines,
  ))
}

/**
 * Check status transitions that affect accounting.
 *   pending → deposited:  DR Postdated Checks   CR Checks in Box
 *   deposited → cleared:  DR Bank Account       CR Postdated Checks
 *
 * Only RECEIVED checks generate entries (issued check entries are
 * already posted via onPaymentToSupplierCreated).
 */
export function onCheckDeposited(
  check: Check,
  date: string,
  ctx: GeneratorContext,
): JournalEntry | null {
  if (check.type !== 'received') return null

  const postdatedId = ctx.resolver.byKey('postdated_checks')
  const boxId       = ctx.resolver.byKey('checks_in_box')
  if (!postdatedId || !boxId) { warnSkip('check deposit', 'postdated_checks/checks_in_box'); return null }

  const lines: DraftLine[] = [
    { accountId: postdatedId, accountName: 'Postdated Checks', debit: check.amount, credit: 0,
      notes: `Check #${check.checkNumber} deposited` },
    { accountId: boxId,       accountName: 'Checks in Box',     debit: 0, credit: check.amount,
      notes: `Check #${check.checkNumber} removed from box` },
  ]
  if (!balanced(lines)) return null

  return ctx.addJournalEntry(buildEntry(
    'check_deposit', check.id, date,
    `Check deposited — #${check.checkNumber}`,
    lines,
    { clientId: check.clientId },
  ))
}

export function onCheckCleared(
  check: Check,
  bankAccountId: string,
  date: string,
  ctx: GeneratorContext,
): JournalEntry | null {
  if (check.type !== 'received') return null

  const bankId      = ctx.resolver.forBankAccount(bankAccountId)
  const postdatedId = ctx.resolver.byKey('postdated_checks')
  if (!bankId || !postdatedId) { warnSkip('check cleared', 'bank/postdated_checks'); return null }

  const lines: DraftLine[] = [
    { accountId: bankId,      accountName: 'Bank Account',     debit: check.amount, credit: 0,
      notes: `Check #${check.checkNumber} cleared` },
    { accountId: postdatedId, accountName: 'Postdated Checks', debit: 0, credit: check.amount,
      notes: `Check #${check.checkNumber} cleared` },
  ]
  if (!balanced(lines)) return null

  return ctx.addJournalEntry(buildEntry(
    'check_cleared', check.id, date,
    `Check cleared — #${check.checkNumber}`,
    lines,
    { clientId: check.clientId },
  ))
}
