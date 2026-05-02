// ─── Clients ────────────────────────────────────────────────────────────────
export interface Client {
  id: string          // CLT2026000001
  name: string
  nameAr?: string     // Arabic name / translation
  phone: string
  email: string
  address: string
  taxNumber?: string
  notes: string
  createdAt: string
}

// ─── Projects ───────────────────────────────────────────────────────────────
export type ProjectStatus = 'pending' | 'active' | 'completed' | 'cancelled' | 'on_hold'

export interface Project {
  id: string          // PRJ2026000001
  clientId: string
  name: string
  nameAr?: string     // Arabic project name
  description: string
  status: ProjectStatus
  location: string
  startDate: string
  endDate?: string
  budget: number
  budgetCurrency?: string  // currency for budget field (defaults to app currency)
  notes: string
  createdAt: string
}

// ─── Inventory / Items ───────────────────────────────────────────────────────
export interface Item {
  id: string          // ITM2026000001
  name: string
  nameAr?: string     // Arabic item name
  description: string
  category: string
  sku?: string        // Category-based SKU e.g. ELE-001
  unit: string        // meters, pieces, kg, roll, box, etc.
  minStock: number    // low-stock alert threshold
  costPrice: number
  sellingPrice: number
  supplierId?: string
  imageUrl?: string   // base64 dataUrl for item photo
  brand?: string      // manufacturer / brand name
  specs?: string      // short technical specification
  serialNumber?: string
  /** Currency in which costPrice was recorded (if different from app default) */
  costCurrency?: string
  /** Exchange rate at time of purchase: units of default currency per 1 unit of costCurrency */
  costExchangeRate?: number
  createdAt: string
}

export type StockMovementType = 'in' | 'out' | 'adjustment'

export interface StockMovement {
  id: string          // STK2026000001
  itemId: string
  type: StockMovementType
  quantity: number    // for 'adjustment' this is the NEW absolute value
  projectId?: string
  supplierId?: string
  unitCost?: number
  notes: string
  date: string
}

// ─── Suppliers ───────────────────────────────────────────────────────────────
export interface Supplier {
  id: string          // SUP2026000001
  name: string
  nameAr?: string     // Arabic supplier name
  phone: string
  email: string
  address: string
  notes: string
  createdAt: string
}

// ─── Bank Accounts ───────────────────────────────────────────────────────────
/** a = cash  |  b = current bank  |  c = checks box  |  d = postdated (auto)  |  e = returned checks */
export type BankAccountType = 'cash' | 'current' | 'checks_box' | 'postdated' | 'returned_checks'

export interface BankAccount {
  id: string          // BNK2026000001
  name: string        // e.g. "Main Business Account"
  nameAr?: string     // Arabic account name
  bankName: string    // e.g. "Arab Bank"
  accountNumber: string
  iban?: string
  initialBalance: number
  currency: string
  notes: string
  /** Account category — defaults to 'current' for legacy records */
  accountType: BankAccountType
  /** For 'postdated' type: ID of the parent 'current' bank account */
  linkedBankId?: string
  createdAt: string
}

// ─── Payments ────────────────────────────────────────────────────────────────
export type PaymentType = 'cash' | 'check' | 'bank_transfer'
export type PaymentDirection = 'in' | 'out'

export type PaymentEntityType = 'client' | 'supplier'

export interface Payment {
  id: string          // PAY2026000001
  direction: PaymentDirection   // 'in' = received, 'out' = expense/paid
  type: PaymentType
  amount: number
  currency: string    // ILS, USD, JOD
  entityType?: PaymentEntityType  // must select client or supplier
  projectId?: string
  clientId?: string
  supplierId?: string
  /** Optional: link this payment to a specific purchase invoice (precise reconciliation) */
  purchaseInvoiceId?: string
  /** Multiple purchase invoices linked to this payment (multi-invoice reconciliation) */
  purchaseInvoiceIds?: string[]
  /** Optional: link this payment to a specific sales invoice (when direction='in') */
  salesInvoiceId?: string
  bankAccountId?: string
  checkId?: string
  // Check-specific fields (when type === 'check')
  checkNumber?: string
  checkIssuerName?: string
  checkPayeeName?: string
  checkDueDate?: string
  date: string
  description: string
  notes: string
  attachments?: string[]  // base64 dataUrls for check images / documents
  createdAt: string
}

// ─── Checks ──────────────────────────────────────────────────────────────────
export type CheckStatus = 'pending' | 'deposited' | 'cleared' | 'bounced' | 'cancelled' | 'returned' | 'paid_to'
export type CheckType = 'received' | 'issued'

export interface Check {
  id: string          // CHK2026000001
  checkNumber: string
  type: CheckType     // 'received' from client / 'issued' to supplier
  status: CheckStatus
  amount: number
  currency: string    // ILS, USD, JOD
  bankAccountId?: string
  issuerName: string
  payeeName: string
  issueDate: string
  dueDate: string
  projectId?: string
  clientId?: string
  supplierId?: string
  paymentId?: string  // link back to the payment that created this check
  paidToName?: string // when status is 'paid_to', who it was paid to
  notes: string
  createdAt: string
}

// ─── Bank Transfers ───────────────────────────────────────────────────────────
export interface BankTransfer {
  id: string          // TRF2026000001
  fromAccountId: string
  toAccountId: string
  amount: number
  fee: number
  date: string
  notes: string
  createdAt: string
}

// ─── Receipts ────────────────────────────────────────────────────────────────
export interface ReceiptLineItem {
  id: string
  itemId?: string
  description: string
  unit?: string       // unit of measure — populated from inventory when item is selected
  brand?: string      // manufacturer / brand — auto-filled from item, editable per line
  specs?: string      // technical specs — auto-filled from item, editable per line
  photo?: string      // image ref / base64 — auto-filled from item.imageUrl, editable per line
  quantity: number
  unitPrice: number
  total: number
}

export interface Receipt {
  id: string          // RCP2026000001
  entityType?: PaymentEntityType  // client or supplier (supplier kept for legacy)
  projectId?: string
  clientId?: string
  supplierId?: string
  paymentId?: string
  /** Optional: link to the sales invoice this receipt settles */
  salesInvoiceId?: string
  lineItems: ReceiptLineItem[]
  subtotal: number
  discountPercent: number
  discount: number
  taxPercent: number
  tax: number
  total: number
  currency?: string       // transaction currency; if omitted, uses default
  exchangeRate?: number   // units of default-currency per 1 unit of invoice currency
  /** How the client paid */
  paymentMethod?: 'cash' | 'check' | 'bank_transfer'
  /** ID of the bank/cash account where payment was received */
  receivedAccountId?: string
  date: string
  notes: string
  createdAt: string
}

// ─── Quotations / Estimates ───────────────────────────────────────────────────
export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'

export interface Quotation {
  id: string          // QOT2026000001
  clientId: string
  projectId?: string  // linked after conversion to project
  status: QuotationStatus
  title: string
  lineItems: ReceiptLineItem[]
  subtotal: number
  discountPercent: number
  discount: number
  taxPercent: number
  tax: number
  total: number
  currency?: string       // transaction currency; if omitted, uses default
  exchangeRate?: number   // units of default-currency per 1 unit of quotation currency
  validUntil: string
  notes: string
  createdAt: string
}

// ─── Work Orders ─────────────────────────────────────────────────────────────
export type WorkOrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type WorkOrderPriority = 'low' | 'medium' | 'high'

export interface WorkOrderMaterial {
  id: string
  itemId: string
  quantityNeeded: number
  quantityUsed: number
}

export interface WorkOrder {
  id: string          // WRK2026000001
  projectId: string
  title: string
  description: string
  status: WorkOrderStatus
  priority: WorkOrderPriority
  assignedTo?: string // employee ID
  materials: WorkOrderMaterial[]
  startDate: string
  dueDate?: string
  completedDate?: string
  notes: string
  createdAt: string
}

// ─── Employees ───────────────────────────────────────────────────────────────
export interface Employee {
  id: string          // EMP2026000001
  name: string
  nameAr?: string     // Arabic employee name
  phone: string
  role: string        // electrician, helper, foreman, apprentice
  dailyRate: number
  isActive: boolean
  notes: string
  createdAt: string
}

// ─── Labor Entries ───────────────────────────────────────────────────────────
export interface LaborEntry {
  id: string          // LBR2026000001
  employeeId: string
  projectId: string
  date: string
  hours: number
  dailyRate: number   // snapshot of rate at time of entry
  totalCost: number
  notes: string
  createdAt: string
}

// ─── Warranties ──────────────────────────────────────────────────────────────
export type WarrantyStatus = 'active' | 'expired' | 'claimed'

export interface Warranty {
  id: string          // WRT2026000001
  projectId?: string
  clientId?: string
  itemId?: string     // link to inventory item
  itemDescription: string
  manufacturer: string
  serialNumber: string
  startDate: string
  endDate: string
  status: WarrantyStatus
  notes: string
  createdAt: string
}

// ─── Photo Attachments ───────────────────────────────────────────────────────
export interface PhotoAttachment {
  id: string
  entityType: 'project' | 'work_order' | 'warranty' | 'payment'
  entityId: string
  dataUrl: string     // base64
  caption: string
  date: string
}

// ─── Exchange Rates ───────────────────────────────────────────────────────────
export interface ExchangeRate {
  id: string          // XRT2026000001
  currency: string    // e.g. 'USD', 'EUR', 'JOD'
  rate: number        // units of default currency per 1 unit of this currency (e.g. 3.65 = 1 USD → 3.65 ILS)
  date: string        // effective-from date
  notes: string
  createdAt: string
}

// ─── Purchase Invoices ───────────────────────────────────────────────────────
export type PurchaseInvoiceStatus = 'draft' | 'received' | 'partial' | 'paid'

export interface PurchaseInvoiceLineItem {
  id: string
  itemId?: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface PurchaseInvoice {
  id: string          // PUR2026000001
  supplierId: string
  projectId?: string
  lineItems: PurchaseInvoiceLineItem[]
  subtotal: number
  discountPercent: number
  discount: number
  taxPercent: number
  tax: number
  total: number
  paidAmount: number
  currency?: string       // transaction currency; if omitted, uses default
  exchangeRate?: number   // units of default-currency per 1 unit of invoice currency
  date: string
  dueDate?: string
  status: PurchaseInvoiceStatus
  notes: string
  createdAt: string
}

// ─── App Settings ────────────────────────────────────────────────────────────
export interface AppSettings {
  language: 'en' | 'ar'
  theme: 'dark' | 'light'
  currency: string
  taxRate: number
  companyName: string
  companyPhone: string
  companyAddress: string
}

// ─── Chart of Accounts ───────────────────────────────────────────────────────
export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'

/** Stable string keys that auto-generators ask for. */
export type AccountMappingKey =
  | 'cash'                   // 1100 default cash account
  | 'accounts_receivable'    // 1300
  | 'checks_in_box'          // 1310
  | 'postdated_checks'       // 1320
  | 'inventory'              // 1400
  | 'accounts_payable'       // 2100
  | 'checks_payable'         // 2110
  | 'vat_payable'            // 2200 — output VAT (we owe gov)
  | 'vat_receivable'         // input VAT (recoverable) — falls back to vat_payable if not set
  | 'accrued_salaries'       // 2310
  | 'service_revenue'        // 4100
  | 'sales_revenue'          // 4200
  | 'direct_materials'       // 5110
  | 'direct_labor'           // 5210
  | 'bank_charges'           // 5410

export interface AccountMapping {
  key:       AccountMappingKey
  /** code (preferred) or id of the ChartAccount this key resolves to */
  accountCode: string
}

export interface ChartAccount {
  id: string          // ACC2026000001
  code: string        // '1100', '2200', etc. — must be unique within an org
  nameEn: string
  nameAr: string
  type: AccountType
  /** Parent account code for hierarchy (e.g. '1000' for current assets group) */
  parentCode?: string
  /** System accounts cannot be deleted (seeded baseline) */
  isSystem: boolean
  isActive: boolean
  description?: string
  createdAt: string
}

// ─── Journal Entries ─────────────────────────────────────────────────────────
export interface JournalLine {
  id: string
  accountName: string   // free-text account name (legacy / fallback)
  /** Optional: link to a Chart of Accounts entry */
  accountId?: string
  debit: number
  credit: number
  notes: string
}

/** Where this entry came from. 'manual' = user-entered, others = auto-generated. */
export type JournalEntrySource =
  | 'manual'
  | 'receipt'
  | 'payment'
  | 'sales_invoice'
  | 'purchase_invoice'
  | 'stock_movement'
  | 'labor_entry'
  | 'bank_transfer'
  | 'check_deposit'
  | 'check_cleared'

export interface JournalEntry {
  id: string            // JRN2026000001
  date: string
  reference: string     // description / reference number
  lines: JournalLine[]
  totalDebit: number
  totalCredit: number
  projectId?: string
  clientId?: string
  supplierId?: string
  /** Auto-generated entries set source + sourceId. Manual entries have source='manual' (or undefined). */
  source?: JournalEntrySource
  sourceId?: string
  notes: string
  createdAt: string
}

// ─── ID Counters ─────────────────────────────────────────────────────────────
export interface IDCounters {
  CLT: number
  PRJ: number
  ITM: number
  STK: number
  SUP: number
  BNK: number
  PAY: number
  CHK: number
  TRF: number
  RCP: number
  QOT: number
  WRK: number
  EMP: number
  LBR: number
  WRT: number
  PUR: number
  XRT: number
  JRN: number
  ACC: number
}

// ─── Derived / Calculated types ──────────────────────────────────────────────
export interface BankBalanceInfo {
  id: string
  balance: number
  totalIn: number
  totalOut: number
}

export interface ItemStockInfo {
  id: string
  currentStock: number
  isLow: boolean
}

export interface ProjectFinancials {
  id: string
  totalReceived: number   // payments in
  totalSpent: number      // payments out
  balance: number         // received - spent
  budgetUsed: number      // % of budget spent
}
