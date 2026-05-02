import { useState, useRef, useCallback, memo, useMemo, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { formatCurrency, formatDate, paymentTypeIcon, today, isValidDate } from '../utils/helpers'
import { Plus, Pencil, Trash2, X, Search, CreditCard, Paperclip, Image, ChevronDown, ChevronUp } from 'lucide-react'
import { useT } from '../hooks/useT'
import {
  usePayments, useSuppliers, useProjects, useBanks,
  usePurchaseInvoices, useStoreActions, useById, useTableData,
} from '../hooks/useSelectors'
import { usePagination } from '../hooks/usePagination'
import { PaginationControls } from './PaginationControls'
import type { Payment, PaymentType, Supplier, BankAccount, Check } from '../types'
import { useStore } from '../store/useStore'

const CURRENCIES = ['ILS', 'USD', 'JOD']

const L = {
  en: {
    title: 'Payments Out',
    newPayment: 'New Payment',
    totalPaid: 'Total Paid',
    searchPlaceholder: 'Search payments…',
    noPayments: 'No payments',
    colId: 'ID',
    colDescription: 'Description',
    colDate: 'Date',
    colType: 'Method',
    colLinkedTo: 'Supplier',
    colAmount: 'Amount',
    modalEdit: 'Edit Payment',
    modalNew: 'New Payment',
    toSupplier: 'To Supplier *',
    totalDue: 'Total Outstanding',
    project: 'Project',
    reconcileInvoices: 'Link to Invoices (optional)',
    invoiceOutstanding: 'outstanding',
    invoicesSelected: 'selected',
    noInvoices: 'No outstanding invoices',
    choose: '-- Select --',
    none: '-- None --',
    amount: 'Amount *',
    currency: 'Currency',
    date: 'Date',
    paymentMethod: 'Payment Method',
    cash: 'Cash',
    check: 'Check',
    bankTransfer: 'Bank Transfer',
    paidFrom: 'Paid From *',
    chooseCashBox: '-- Cash account --',
    chooseBankAcc: '-- Bank account --',
    // Multi-check sections
    newChecksSection: 'New Checks to Issue',
    addNewCheck: '+ Add Check',
    fromBoxSection: 'Use Checks from Box',
    addFromBox: '+ Pick from Box',
    checksPaymentTotal: 'Payment Total (all checks)',
    bankForCheck: 'Bank Account *',
    checkNumber: 'Check # *',
    checkDueDate: 'Due Date *',
    issuerName: 'Issuer Name',
    payeeName: 'Payee Name *',
    fromBoxPick: 'Received check *',
    fromBoxNone: '-- Select --',
    boxCheckUsedHint: 'Will be marked as used (paid to supplier)',
    description: 'Description *',
    descriptionPlaceholder: 'Payment for project, material purchase…',
    notes: 'Notes',
    attachments: 'Attachments',
    attachButton: 'Attach image / document',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    addPayment: 'Add Payment',
    checkNumberLabel: 'Check #',
    filesLabel: 'files',
    confirmDelete: 'Delete this payment?',
    currentAccLabel: 'Current Bank Accounts',
    checksBoxLabel: 'Checks Box Accounts',
    editOnlyNotes: 'Only notes can be edited after saving.',
    checksOnRecord: 'Checks on Record',
    issuedChecks: 'Issued Checks',
    usedBoxChecks: 'Used from Box',
    checkDue: 'due',
  },
  ar: {
    title: 'مدفوعات صادرة',
    newPayment: 'دفعة جديدة',
    totalPaid: 'إجمالي المدفوع',
    searchPlaceholder: 'بحث في المدفوعات...',
    noPayments: 'لا توجد مدفوعات',
    colId: 'المعرّف',
    colDescription: 'الوصف',
    colDate: 'التاريخ',
    colType: 'الطريقة',
    colLinkedTo: 'المورد',
    colAmount: 'المبلغ',
    modalEdit: 'تعديل الدفعة',
    modalNew: 'دفعة جديدة',
    toSupplier: 'إلى المورد *',
    totalDue: 'إجمالي المستحق',
    project: 'المشروع',
    reconcileInvoices: 'ربط بالفواتير (اختياري)',
    invoiceOutstanding: 'متبقي',
    invoicesSelected: 'محدد',
    noInvoices: 'لا توجد فواتير مستحقة',
    choose: '-- اختر --',
    none: '-- لا يوجد --',
    amount: 'المبلغ *',
    currency: 'العملة',
    date: 'التاريخ',
    paymentMethod: 'طريقة الدفع',
    cash: 'نقدي',
    check: 'شيك',
    bankTransfer: 'تحويل بنكي',
    paidFrom: 'مدفوع من *',
    chooseCashBox: '-- الصندوق النقدي --',
    chooseBankAcc: '-- الحساب البنكي --',
    // Multi-check sections
    newChecksSection: 'شيكات صادرة جديدة',
    addNewCheck: '+ إضافة شيك',
    fromBoxSection: 'استخدام شيكات من الصندوق',
    addFromBox: '+ إضافة من الصندوق',
    checksPaymentTotal: 'إجمالي الدفعة (جميع الشيكات)',
    bankForCheck: 'الحساب البنكي *',
    checkNumber: 'رقم الشيك *',
    checkDueDate: 'تاريخ الاستحقاق *',
    issuerName: 'اسم الساحب',
    payeeName: 'اسم المستفيد *',
    fromBoxPick: 'الشيك المستلم *',
    fromBoxNone: '-- اختر --',
    boxCheckUsedHint: 'سيُعلَّم كمستخدم (مدفوع للمورد)',
    description: 'الوصف *',
    descriptionPlaceholder: 'دفعة لمشروع، شراء مواد...',
    notes: 'ملاحظات',
    attachments: 'المرفقات',
    attachButton: 'إرفاق صورة / مستند',
    cancel: 'إلغاء',
    saveChanges: 'حفظ التغييرات',
    addPayment: 'إضافة دفعة',
    checkNumberLabel: 'شيك رقم',
    filesLabel: 'ملف',
    confirmDelete: 'حذف هذه الدفعة؟',
    currentAccLabel: 'الحسابات البنكية الجارية',
    checksBoxLabel: 'صناديق الشيكات',
    editOnlyNotes: 'يمكن تعديل الملاحظات فقط بعد الحفظ.',
    checksOnRecord: 'الشيكات المسجلة',
    issuedChecks: 'الشيكات الصادرة',
    usedBoxChecks: 'مستخدم من الصندوق',
    checkDue: 'استحقاق',
  },
} as const

const PAYMENT_TYPE_KEY: Record<PaymentType, keyof typeof L.en> = {
  cash: 'cash',
  check: 'check',
  bank_transfer: 'bankTransfer',
}

// ── Local check-entry types (modal state only) ────────────────────────────────

interface NewCheckEntry {
  uid: string
  bankAccountId: string
  checkNumber: string
  dueDate: string
  issuerName: string
  payeeName: string   // mandatory; defaults to supplier name
  amount: number
  currency: string
}

interface BoxCheckEntry {
  uid: string
  boxCheckId: string  // id of the pending received check
  amount: number      // auto-filled from check
  currency: string    // auto-filled from check
}

const mkNewCheck = (payeeName = '', currency = 'ILS'): NewCheckEntry => ({
  uid: Math.random().toString(36).slice(2),
  bankAccountId: '',
  checkNumber: '',
  dueDate: '',
  issuerName: '',
  payeeName,
  amount: 0,
  currency,
})

const mkBoxCheck = (): BoxCheckEntry => ({
  uid: Math.random().toString(36).slice(2),
  boxCheckId: '',
  amount: 0,
  currency: 'ILS',
})

const EMPTY: Omit<Payment, 'id' | 'createdAt'> = {
  direction: 'out', type: 'cash', amount: 0, currency: 'ILS',
  entityType: 'supplier', projectId: '', clientId: '',
  supplierId: '', purchaseInvoiceId: '', purchaseInvoiceIds: [],
  bankAccountId: '', checkId: '',
  checkNumber: '', checkIssuerName: '', checkPayeeName: '', checkDueDate: '',
  date: today(), description: '', notes: '', attachments: [],
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function Modal({
  initial, paymentId, onSave, onClose,
}: {
  initial: Omit<Payment, 'id' | 'createdAt'>
  paymentId?: string
  onSave: (
    d: Omit<Payment, 'id' | 'createdAt'>,
    newCheckEntries: NewCheckEntry[],
    boxCheckEntries: BoxCheckEntry[],
  ) => void
  onClose: () => void
}) {
  const t = useT(L)
  const projects         = useProjects()
  const banks            = useBanks()
  const suppliers        = useSuppliers()
  const purchaseInvoices = usePurchaseInvoices()
  const allChecks        = useStore(s => s.checks)

  // Edit-mode flags — when paymentId is set, only notes can be changed
  const isEdit = !!paymentId
  const editIssuedChecks: Check[] = isEdit
    ? allChecks.filter((c: Check) => c.paymentId === paymentId && c.type === 'issued')
    : []
  const editBoxChecks: Check[] = isEdit
    ? allChecks.filter((c: Check) => c.paymentId === paymentId && c.type === 'received' && c.status === 'paid_to')
    : []

  const [form, setForm]  = useState(initial)
  const set = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }))

  // Multi-invoice reconciliation
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>(
    initial.purchaseInvoiceIds?.length
      ? initial.purchaseInvoiceIds
      : initial.purchaseInvoiceId
      ? [initial.purchaseInvoiceId]
      : []
  )
  const [invoicesPanelOpen, setInvoicesPanelOpen] = useState(false)

  // Multi-check state
  const [newCheckEntries, setNewCheckEntries] = useState<NewCheckEntry[]>([])
  const [boxCheckEntries, setBoxCheckEntries] = useState<BoxCheckEntry[]>([])

  const fileRef = useRef<HTMLInputElement>(null)

  // ── Derived ────────────────────────────────────────────────────────────────

  const cashAccounts    = banks.filter(b => b.accountType === 'cash')
  const currentAccounts = banks.filter(b => (b.accountType ?? 'current') === 'current')
  const checksBoxAccs   = banks.filter(b => b.accountType === 'checks_box')

  const sourceAccounts = form.type === 'cash' ? cashAccounts : currentAccounts

  // Supplier outstanding invoices
  const supplierInvoices = useMemo(() =>
    form.supplierId
      ? purchaseInvoices
          .filter(inv => inv.supplierId === form.supplierId && inv.status !== 'paid')
          .sort((a, b) => a.date.localeCompare(b.date))
      : []
  , [form.supplierId, purchaseInvoices])

  // Supplier total due
  const supplierTotalDue = useMemo(() =>
    supplierInvoices.reduce((sum, inv) => sum + Math.max(0, inv.total - (inv.paidAmount || 0)), 0)
  , [supplierInvoices])

  // Selected invoices total
  const selectedInvoicesTotal = useMemo(() =>
    supplierInvoices
      .filter(inv => selectedInvoiceIds.includes(inv.id))
      .reduce((sum, inv) => sum + Math.max(0, inv.total - (inv.paidAmount || 0)), 0)
  , [supplierInvoices, selectedInvoiceIds])

  // Pending received checks available in the box
  const pendingBoxChecks = allChecks.filter(
    (c: Check) => c.type === 'received' && c.status === 'pending'
  )
  // IDs already picked in this payment (avoid double-picking)
  const pickedBoxIds = new Set(boxCheckEntries.map(e => e.boxCheckId).filter(Boolean))

  // Check payment total
  const checksTotal =
    newCheckEntries.reduce((s, e) => s + e.amount, 0) +
    boxCheckEntries.reduce((s, e) => s + e.amount, 0)

  // Current supplier name (for auto-filling payee)
  const currentSupplier = suppliers.find(s => s.id === form.supplierId)

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleSupplierChange(supplierId: string) {
    setForm(f => ({ ...f, supplierId, purchaseInvoiceId: '' }))
    setSelectedInvoiceIds([])
    // Auto-fill payeeName in all new check entries
    const sName = suppliers.find(s => s.id === supplierId)?.name || ''
    setNewCheckEntries(es => es.map(e => ({ ...e, payeeName: e.payeeName || sName })))
  }

  function handleTypeChange(pt: PaymentType) {
    setForm(f => ({ ...f, type: pt, bankAccountId: '' }))
    // Seed one blank entry when switching to check
    if (pt === 'check' && newCheckEntries.length === 0 && boxCheckEntries.length === 0) {
      setNewCheckEntries([mkNewCheck(currentSupplier?.name || '')])
    }
  }

  // Invoice toggle
  function toggleInvoice(id: string) {
    setSelectedInvoiceIds(ids =>
      ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]
    )
  }

  // New check entries
  function addNewCheck() {
    setNewCheckEntries(es => {
      const last = es[es.length - 1]
      if (!last) return [...es, mkNewCheck(currentSupplier?.name || '')]

      // ── Sequential check number ──────────────────────────────────────────
      // Parse trailing digits, increment, pad to same width
      const nextCheckNumber = (() => {
        const match = last.checkNumber.match(/^(\D*)(\d+)(\D*)$/)
        if (!match) return last.checkNumber
        const [, prefix, digits, suffix] = match
        const next = String(parseInt(digits, 10) + 1).padStart(digits.length, '0')
        return prefix + next + suffix
      })()

      // ── Same calendar day, next month ────────────────────────────────────
      const nextDueDate = (() => {
        if (!last.dueDate) return ''
        const d = new Date(last.dueDate + 'T00:00:00')  // avoid TZ shift
        const targetDay = d.getDate()
        const next = new Date(d.getFullYear(), d.getMonth() + 1, targetDay)
        // If month overflow (e.g. Jan 31 → Mar 3), clamp to last day of target month
        if (next.getMonth() !== ((d.getMonth() + 1) % 12)) {
          next.setDate(0) // last day of the intended month
        }
        return next.toISOString().split('T')[0]
      })()

      return [...es, {
        uid: Math.random().toString(36).slice(2),
        bankAccountId: last.bankAccountId,
        checkNumber: nextCheckNumber,
        dueDate: nextDueDate,
        issuerName: last.issuerName,
        payeeName: last.payeeName,
        amount: last.amount,
        currency: last.currency,
      }]
    })
  }
  function updateNewCheck(uid: string, field: keyof NewCheckEntry, value: string | number) {
    setNewCheckEntries(es => es.map(e => e.uid === uid ? { ...e, [field]: value } : e))
  }
  function removeNewCheck(uid: string) {
    setNewCheckEntries(es => es.filter(e => e.uid !== uid))
  }

  // Box check entries
  function addBoxCheck() {
    setBoxCheckEntries(es => [...es, mkBoxCheck()])
  }
  function selectBoxCheck(uid: string, checkId: string) {
    const check = allChecks.find((c: Check) => c.id === checkId)
    setBoxCheckEntries(es => es.map(e =>
      e.uid === uid
        ? { ...e, boxCheckId: checkId, amount: check?.amount ?? 0, currency: check?.currency ?? 'ILS' }
        : e
    ))
  }
  function removeBoxCheck(uid: string) {
    setBoxCheckEntries(es => es.filter(e => e.uid !== uid))
  }

  // File attachments
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setForm(f => ({ ...f, attachments: [...(f.attachments || []), reader.result as string] }))
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }
  function removeAttachment(idx: number) {
    setForm(f => ({ ...f, attachments: (f.attachments || []).filter((_, i) => i !== idx) }))
  }

  // ── Validation ────────────────────────────────────────────────────────────

  const isCheck = form.type === 'check'

  const canSave = (() => {
    if (isEdit) return true   // edit mode: only notes change, always valid
    if (!form.supplierId || !form.description.trim() || !isValidDate(form.date)) return false
    if (isCheck) {
      if (newCheckEntries.length === 0 && boxCheckEntries.length === 0) return false
      if (checksTotal <= 0) return false
      if (newCheckEntries.some(e =>
        !e.checkNumber.trim() || !e.payeeName.trim() || !e.bankAccountId || !e.dueDate || !isValidDate(e.dueDate)
      )) return false
      if (boxCheckEntries.some(e => !e.boxCheckId)) return false
      return true
    }
    return form.amount > 0
  })()

  // ── Save ──────────────────────────────────────────────────────────────────

  function handleSave() {
    if (!canSave) return
    const finalAmount  = isCheck ? checksTotal : form.amount
    // Primary bank: first new check's bank, or the box account of first box check (for display)
    const firstNewBank = newCheckEntries[0]?.bankAccountId || ''
    const finalBankId  = isCheck
      ? firstNewBank
      : form.bankAccountId
    onSave(
      {
        ...form,
        direction: 'out',
        entityType: 'supplier',
        clientId: '',
        amount: finalAmount,
        bankAccountId: finalBankId,
        checkNumber: '',          // no single-check auto-creation; we handle it manually
        checkPayeeName: newCheckEntries[0]?.payeeName || '',
        purchaseInvoiceIds: selectedInvoiceIds,
        purchaseInvoiceId: selectedInvoiceIds[0] || '',
      },
      newCheckEntries,
      boxCheckEntries,
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-xl shadow-2xl max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
          <h2 className="font-semibold text-white">{initial.description ? t.modalEdit : t.modalNew}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5">

          {/* Edit-mode notice */}
          {isEdit && (
            <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg px-4 py-2.5 text-xs text-yellow-300">
              {t.editOnlyNotes}
            </div>
          )}

          {/* ══ All fields except notes are locked in edit mode ══ */}
          <fieldset disabled={isEdit} className={isEdit ? 'space-y-5 opacity-60 pointer-events-none select-none' : 'space-y-5'}>

            {/* ── Supplier ── */}
            <div>
              <label className="label">{t.toSupplier}</label>
              <select
                className="input"
                value={form.supplierId}
                onChange={e => handleSupplierChange(e.target.value)}
              >
                <option value="">{t.choose}</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>

              {/* Total due badge */}
              {form.supplierId && supplierTotalDue > 0 && (
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-xs text-gray-500">{t.totalDue}:</span>
                  <span className="text-xs font-bold text-red-400">{formatCurrency(supplierTotalDue)}</span>
                </div>
              )}
            </div>

            {/* ── Invoice multi-select ── */}
            {form.supplierId && supplierInvoices.length > 0 && (
              <div>
                <button
                  type="button"
                  className="flex items-center gap-2 w-full text-left"
                  onClick={() => setInvoicesPanelOpen(o => !o)}
                >
                  <label className="label cursor-pointer flex-1 mb-0">{t.reconcileInvoices}</label>
                  {selectedInvoiceIds.length > 0 && (
                    <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full">
                      {selectedInvoiceIds.length} {t.invoicesSelected}
                    </span>
                  )}
                  {invoicesPanelOpen
                    ? <ChevronUp className="w-4 h-4 text-gray-500" />
                    : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </button>

                {invoicesPanelOpen && (
                  <div className="mt-2 max-h-44 overflow-y-auto bg-gray-900/60 rounded-xl border border-gray-700 divide-y divide-gray-700/50">
                    {supplierInvoices.map(inv => {
                      const outstanding = Math.max(0, inv.total - (inv.paidAmount || 0))
                      const checked = selectedInvoiceIds.includes(inv.id)
                      return (
                        <label
                          key={inv.id}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-700/40 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleInvoice(inv.id)}
                            className="w-4 h-4 rounded accent-yellow-500"
                          />
                          <span className="flex-1 text-xs text-gray-300 font-mono">{inv.id}</span>
                          <span className="text-xs text-gray-500">{formatDate(inv.date)}</span>
                          <span className="text-xs font-semibold text-red-400">
                            {formatCurrency(outstanding, inv.currency || 'ILS')}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                )}

                {selectedInvoiceIds.length > 0 && selectedInvoicesTotal > 0 && (
                  <p className="text-xs text-gray-400 mt-1.5 text-right">
                    {selectedInvoiceIds.length} {t.invoicesSelected} ·{' '}
                    <span className="text-yellow-400 font-medium">{formatCurrency(selectedInvoicesTotal)}</span>
                  </p>
                )}
              </div>
            )}

            {/* ── Project ── */}
            {projects.length > 0 && (
              <div>
                <label className="label">{t.project}</label>
                <select className="input" value={form.projectId} onChange={e => set('projectId', e.target.value)}>
                  <option value="">{t.none}</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}

            {/* ── Amount + Currency + Date (cash/bank_transfer) ── */}
            {!isCheck && (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">{t.amount}</label>
                  <input className="input" type="number" min={0} step="0.01"
                    value={form.amount || ''}
                    onChange={e => set('amount', parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="label">{t.currency}</label>
                  <select className="input" value={form.currency} onChange={e => set('currency', e.target.value)}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">{t.date}</label>
                  <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
                </div>
              </div>
            )}

            {/* Date only for check payments */}
            {isCheck && (
              <div className="w-48">
                <label className="label">{t.date}</label>
                <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
              </div>
            )}

            {/* ── Payment Method ── */}
            <div>
              <label className="label">{t.paymentMethod}</label>
              <div className="grid grid-cols-3 gap-2">
                {(['cash', 'check', 'bank_transfer'] as PaymentType[]).map(pt => (
                  <button key={pt} type="button"
                    onClick={() => handleTypeChange(pt)}
                    className={`py-2 rounded-lg border text-sm transition-colors ${
                      form.type === pt
                        ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                        : 'border-gray-600 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {paymentTypeIcon(pt)} {t[PAYMENT_TYPE_KEY[pt]]}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Paid From (cash / bank_transfer) ── */}
            {!isCheck && (
              <div>
                <label className="label">{t.paidFrom}</label>
                <select
                  className="input"
                  value={form.bankAccountId}
                  onChange={e => set('bankAccountId', e.target.value)}
                >
                  <option value="">{form.type === 'cash' ? t.chooseCashBox : t.chooseBankAcc}</option>
                  {sourceAccounts.map(b => (
                    <option key={b.id} value={b.id}>{b.name}{b.bankName ? ` (${b.bankName})` : ''}</option>
                  ))}
                </select>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════
                CHECK PAYMENT — two sections: new checks + from box
                In edit mode: show read-only check cards instead
                ══════════════════════════════════════════════════════ */}
            {isCheck && !isEdit && (
              <div className="space-y-4">

                {/* Section A: New Issued Checks */}
                <div className="bg-gray-900/50 rounded-xl border border-gray-700/60 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900/60 border-b border-gray-700/60">
                    <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wide">
                      ✎ {t.newChecksSection}
                    </p>
                    <button
                      type="button"
                      onClick={addNewCheck}
                      className="text-xs text-yellow-400 hover:text-yellow-300 font-medium"
                    >{t.addNewCheck}</button>
                  </div>

                  {newCheckEntries.length === 0 ? (
                    <p className="text-xs text-gray-600 text-center py-4">{t.addNewCheck}</p>
                  ) : (
                    <div className="divide-y divide-gray-700/50">
                      {newCheckEntries.map((entry, idx) => (
                        <div key={entry.uid} className="p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-500 font-medium">#{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => removeNewCheck(entry.uid)}
                              className="text-red-500 hover:text-red-400"
                            ><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>

                          {/* Bank account + Check number */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="label text-[10px]">{t.bankForCheck}</label>
                              <select
                                className="input text-xs py-1.5"
                                value={entry.bankAccountId}
                                onChange={e => updateNewCheck(entry.uid, 'bankAccountId', e.target.value)}
                              >
                                <option value="">{t.choose}</option>
                                {currentAccounts.map(b => (
                                  <option key={b.id} value={b.id}>
                                    {b.name}{b.bankName ? ` (${b.bankName})` : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="label text-[10px]">{t.checkNumber}</label>
                              <input
                                className="input text-xs py-1.5"
                                value={entry.checkNumber}
                                placeholder="123456"
                                onChange={e => updateNewCheck(entry.uid, 'checkNumber', e.target.value)}
                              />
                            </div>
                          </div>

                          {/* Amount + Currency + Due Date */}
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="label text-[10px]">{t.amount}</label>
                              <input
                                className="input text-xs py-1.5"
                                type="number" min={0} step="0.01"
                                value={entry.amount || ''}
                                onChange={e => updateNewCheck(entry.uid, 'amount', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div>
                              <label className="label text-[10px]">{t.currency}</label>
                              <select
                                className="input text-xs py-1.5"
                                value={entry.currency}
                                onChange={e => updateNewCheck(entry.uid, 'currency', e.target.value)}
                              >
                                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="label text-[10px]">{t.checkDueDate}</label>
                              <input
                                className="input text-xs py-1.5"
                                type="date"
                                value={entry.dueDate}
                                onChange={e => updateNewCheck(entry.uid, 'dueDate', e.target.value)}
                              />
                            </div>
                          </div>

                          {/* Payee Name (mandatory) + Issuer */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="label text-[10px]">{t.payeeName}</label>
                              <input
                                className={`input text-xs py-1.5 ${!entry.payeeName.trim() ? 'border-red-500/60' : ''}`}
                                value={entry.payeeName}
                                placeholder={currentSupplier?.name || ''}
                                onChange={e => updateNewCheck(entry.uid, 'payeeName', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="label text-[10px]">{t.issuerName}</label>
                              <input
                                className="input text-xs py-1.5"
                                value={entry.issuerName}
                                onChange={e => updateNewCheck(entry.uid, 'issuerName', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section B: From Checks Box */}
                <div className="bg-gray-900/50 rounded-xl border border-gray-700/60 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900/60 border-b border-gray-700/60">
                    <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
                      📥 {t.fromBoxSection}
                    </p>
                    <button
                      type="button"
                      onClick={addBoxCheck}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                    >{t.addFromBox}</button>
                  </div>

                  {boxCheckEntries.length === 0 ? (
                    <p className="text-xs text-gray-600 text-center py-4">{t.addFromBox}</p>
                  ) : (
                    <div className="divide-y divide-gray-700/50">
                      {boxCheckEntries.map((entry, idx) => {
                        const selectedCheck = entry.boxCheckId
                          ? allChecks.find((c: Check) => c.id === entry.boxCheckId)
                          : null
                        return (
                          <div key={entry.uid} className="p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-gray-500 font-medium">#{idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => removeBoxCheck(entry.uid)}
                                className="text-red-500 hover:text-red-400"
                              ><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>

                            <div>
                              <label className="label text-[10px]">{t.fromBoxPick}</label>
                              <select
                                className="input text-xs py-1.5"
                                value={entry.boxCheckId}
                                onChange={e => selectBoxCheck(entry.uid, e.target.value)}
                              >
                                <option value="">{t.fromBoxNone}</option>
                                {pendingBoxChecks
                                  .filter((c: Check) => c.id === entry.boxCheckId || !pickedBoxIds.has(c.id))
                                  .map((c: Check) => (
                                    <option key={c.id} value={c.id}>
                                      #{c.checkNumber} — {c.issuerName} — {c.amount.toFixed(2)} {c.currency} (due {c.dueDate})
                                    </option>
                                  ))
                                }
                              </select>
                            </div>

                            {selectedCheck && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-blue-400">{t.boxCheckUsedHint}</span>
                                <span className="font-semibold text-white">
                                  {formatCurrency(entry.amount, entry.currency)}
                                </span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Checks total */}
                {(newCheckEntries.length > 0 || boxCheckEntries.length > 0) && (
                  <div className="flex items-center justify-between border-t border-gray-700 pt-3">
                    <span className="text-xs text-gray-400 uppercase tracking-wide">{t.checksPaymentTotal}</span>
                    <span className={`text-lg font-bold ${checksTotal > 0 ? 'text-yellow-400' : 'text-gray-600'}`}>
                      {formatCurrency(checksTotal)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ── Description ── */}
            <div>
              <label className="label">{t.description}</label>
              <input
                className="input"
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder={t.descriptionPlaceholder}
              />
            </div>

            {/* ── Attachments ── */}
            <div>
              <label className="label">{t.attachments}</label>
              <button type="button" className="btn-secondary flex items-center gap-2 text-xs"
                onClick={() => fileRef.current?.click()}>
                <Paperclip className="w-3.5 h-3.5" /> {t.attachButton}
              </button>
              <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} />
              {(form.attachments?.length ?? 0) > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {form.attachments!.map((att, idx) => (
                    <div key={idx} className="relative group">
                      {att.startsWith('data:image') ? (
                        <img src={att} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-600" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-700 border border-gray-600 flex items-center justify-center">
                          <Paperclip className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <button type="button"
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeAttachment(idx)}
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </fieldset>

          {/* ── Read-only check cards (edit mode, check payment) ── */}
          {isEdit && isCheck && (editIssuedChecks.length > 0 || editBoxChecks.length > 0) && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.checksOnRecord}</p>

              {editIssuedChecks.length > 0 && (
                <div className="bg-gray-900/50 rounded-xl border border-yellow-700/30 overflow-hidden">
                  <p className="px-4 py-2 text-[10px] font-semibold text-yellow-400 uppercase tracking-wide bg-gray-900/40 border-b border-yellow-700/20">
                    ✎ {t.issuedChecks}
                  </p>
                  <div className="divide-y divide-gray-700/40">
                    {editIssuedChecks.map((c, idx) => (
                      <div key={c.id} className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
                        <span className="text-gray-500">#{idx + 1}</span>
                        <span className="font-mono text-yellow-300">#{c.checkNumber}</span>
                        <span className="text-gray-400 flex-1 truncate">{c.payeeName}</span>
                        <span className="text-gray-500">{t.checkDue}: {formatDate(c.dueDate)}</span>
                        <span className="font-semibold text-white">{formatCurrency(c.amount, c.currency)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {editBoxChecks.length > 0 && (
                <div className="bg-gray-900/50 rounded-xl border border-blue-700/30 overflow-hidden">
                  <p className="px-4 py-2 text-[10px] font-semibold text-blue-400 uppercase tracking-wide bg-gray-900/40 border-b border-blue-700/20">
                    📥 {t.usedBoxChecks}
                  </p>
                  <div className="divide-y divide-gray-700/40">
                    {editBoxChecks.map((c, idx) => (
                      <div key={c.id} className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
                        <span className="text-gray-500">#{idx + 1}</span>
                        <span className="font-mono text-blue-300">#{c.checkNumber}</span>
                        <span className="text-gray-400 flex-1 truncate">{c.issuerName}</span>
                        <span className="text-gray-500">{t.checkDue}: {formatDate(c.dueDate)}</span>
                        <span className="font-semibold text-white">{formatCurrency(c.amount, c.currency)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Notes — always editable ── */}
          <div>
            <label className="label">{t.notes}</label>
            <textarea className="input resize-none" rows={2}
              value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-700 sticky bottom-0 bg-gray-800">
          <button className="btn-secondary" onClick={onClose}>{t.cancel}</button>
          <button
            className={`btn-primary ${!canSave ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleSave}
            disabled={!canSave}
          >
            {initial.description ? t.saveChanges : t.addPayment}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Memoized table row ────────────────────────────────────────────────────────

interface RowProps {
  payment:    Payment
  supplier?:  Supplier
  bank?:      BankAccount
  checkLabel: string
  filesLabel: string
  typeLabel:  string
  onEdit:     () => void
  onDelete:   () => void
}
const PaymentRow = memo(function PaymentRow({
  payment, supplier, checkLabel, filesLabel, typeLabel, onEdit, onDelete,
}: RowProps) {
  return (
    <tr className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
      <td className="px-5 py-3 font-mono text-xs text-yellow-500">{payment.id}</td>
      <td className="px-5 py-3">
        <p className="font-medium text-white">{payment.description}</p>
        {payment.checkNumber && <p className="text-xs text-gray-500">{checkLabel} {payment.checkNumber}</p>}
        {payment.notes && <p className="text-xs text-gray-500 truncate">{payment.notes}</p>}
        {(payment.attachments?.length ?? 0) > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-blue-400 mt-0.5">
            <Image className="w-3 h-3" /> {payment.attachments!.length} {filesLabel}
          </span>
        )}
      </td>
      <td className="px-5 py-3 text-gray-400 hidden md:table-cell">{formatDate(payment.date)}</td>
      <td className="px-5 py-3 hidden lg:table-cell">
        <span className="text-gray-300">{paymentTypeIcon(payment.type)} {typeLabel}</span>
      </td>
      <td className="px-5 py-3 hidden lg:table-cell text-purple-400 text-xs">
        {supplier?.name ?? '—'}
      </td>
      <td className="px-5 py-3 text-right">
        <span className="font-bold text-red-400">
          -{formatCurrency(payment.amount, payment.currency || 'ILS')}
        </span>
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-2 justify-end">
          <button className="text-gray-500 hover:text-yellow-400" onClick={onEdit}>
            <Pencil className="w-4 h-4" />
          </button>
          <button className="text-gray-500 hover:text-red-400" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  )
})

// ── Payments page ─────────────────────────────────────────────────────────────

export default function Payments() {
  const t = useT(L)
  const location  = useLocation()
  const navigate  = useNavigate()

  const payments  = usePayments()
  const suppliers = useSuppliers()

  const { addPayment, updatePayment, deletePayment } = useStoreActions()
  const addCheck    = useStore(s => s.addCheck)
  const updateCheck = useStore(s => s.updateCheck)

  const supplierById = useById(suppliers)

  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState<{ open: boolean; payment?: Payment }>({ open: false })
  // Supplier pre-fill from "Make Payment" shortcut on Suppliers page
  const [quickSupplierId, setQuickSupplierId] = useState('')

  // Auto-open modal when navigated from Suppliers "Make Payment" button
  useEffect(() => {
    const state = location.state as { supplierId?: string; supplierName?: string } | null
    if (state?.supplierId) {
      setQuickSupplierId(state.supplierId)
      setModal({ open: true })
      // Clear state so re-visits don't re-trigger
      navigate(location.pathname, { replace: true, state: null })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const outFiltered = useTableData(payments, {
    search,
    searchFields: ['id', 'description', 'notes'],
    filter: useCallback((p: Payment) => p.direction === 'out', []),
    sort:   useCallback((a: Payment, b: Payment) => b.date.localeCompare(a.date), []),
  })

  const {
    items: pageItems,
    page, pageCount, pageSize, hasNext, hasPrev,
    setPage, setPageSize,
  } = usePagination(outFiltered, { initialPageSize: 25 })

  const totalOut = useTableData(payments, {
    filter: useCallback((p: Payment) => p.direction === 'out', []),
  }).reduce((s, p) => s + p.amount, 0)

  function handleSave(
    data: Omit<Payment, 'id' | 'createdAt'>,
    newCheckEntries: NewCheckEntry[],
    boxCheckEntries: BoxCheckEntry[],
  ) {
    if (modal.payment) {
      // Edit mode: only notes may change
      updatePayment(modal.payment.id, { notes: data.notes })
    } else {
      // Create the payment (checkNumber='' so no auto-creation by store)
      const payment = addPayment(data)

      // Create issued check records for each new check entry
      for (const entry of newCheckEntries) {
        addCheck({
          checkNumber: entry.checkNumber,
          type: 'issued',
          status: 'pending',
          amount: entry.amount,
          currency: entry.currency,
          bankAccountId: entry.bankAccountId,
          issuerName: entry.issuerName,
          payeeName: entry.payeeName,
          issueDate: data.date,
          dueDate: entry.dueDate || data.date,
          projectId: data.projectId,
          supplierId: data.supplierId,
          clientId: '',
          paymentId: payment.id,
          notes: `Issued via payment ${payment.id}`,
        })
      }

      // Mark from-box checks as paid_to and link them to this payment
      const supplier = suppliers.find(s => s.id === data.supplierId)
      for (const entry of boxCheckEntries) {
        if (entry.boxCheckId) {
          updateCheck(entry.boxCheckId, {
            status: 'paid_to',
            paidToName: supplier?.name ?? data.description,
            paymentId: payment.id,
          })
        }
      }
    }
    setModal({ open: false })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t.title}</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal({ open: true })}>
          <Plus className="w-4 h-4" /> {t.newPayment}
        </button>
      </div>

      {/* Summary */}
      <div className="card py-3">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{t.totalPaid}</p>
        <p className="text-xl font-bold text-red-400 mt-1">{formatCurrency(totalOut)}</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input className="input pl-9" placeholder={t.searchPlaceholder} value={search}
          onChange={e => setSearch(e.target.value)} />
      </div>

      {outFiltered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <CreditCard className="w-12 h-12 text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">{t.noPayments}</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colId}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colDescription}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">{t.colDate}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">{t.colType}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">{t.colLinkedTo}</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colAmount}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {pageItems.map(p => (
                <PaymentRow
                  key={p.id}
                  payment={p}
                  supplier={supplierById.get(p.supplierId ?? '')}
                  checkLabel={t.checkNumberLabel}
                  filesLabel={t.filesLabel}
                  typeLabel={t[PAYMENT_TYPE_KEY[p.type]]}
                  onEdit={() => setModal({ open: true, payment: p })}
                  onDelete={() => { if (confirm(t.confirmDelete)) deletePayment(p.id) }}
                />
              ))}
            </tbody>
          </table>

          <PaginationControls
            page={page} pageCount={pageCount} pageSize={pageSize}
            total={outFiltered.length} hasNext={hasNext} hasPrev={hasPrev}
            onPageChange={setPage} onPageSizeChange={setPageSize}
          />
        </div>
      )}

      {modal.open && (
        <Modal
          paymentId={modal.payment?.id}
          initial={modal.payment ? {
            direction: 'out',
            type: modal.payment.type,
            amount: modal.payment.amount,
            currency: modal.payment.currency || 'ILS',
            entityType: 'supplier',
            projectId: modal.payment.projectId ?? '',
            clientId: '',
            supplierId: modal.payment.supplierId ?? '',
            purchaseInvoiceId: modal.payment.purchaseInvoiceId ?? '',
            purchaseInvoiceIds: modal.payment.purchaseInvoiceIds ?? [],
            bankAccountId: modal.payment.bankAccountId ?? '',
            checkId: modal.payment.checkId ?? '',
            checkNumber: modal.payment.checkNumber ?? '',
            checkIssuerName: modal.payment.checkIssuerName ?? '',
            checkPayeeName: modal.payment.checkPayeeName ?? '',
            checkDueDate: modal.payment.checkDueDate ?? '',
            date: modal.payment.date,
            description: modal.payment.description,
            notes: modal.payment.notes,
            attachments: modal.payment.attachments ?? [],
          } : { ...EMPTY, supplierId: quickSupplierId }}
          onSave={handleSave}
          onClose={() => { setModal({ open: false }); setQuickSupplierId('') }}
        />
      )}
    </div>
  )
}
