import { useState } from 'react'
import { useStore } from '../store/useStore'
import { formatCurrency, formatDate, today, isValidDate } from '../utils/helpers'
import { Plus, Pencil, Trash2, X, Search, ReceiptText, Banknote, Archive, Landmark } from 'lucide-react'
import type { Receipt } from '../types'
import { useT } from '../hooks/useT'

const L = {
  en: {
    title: 'Receipts In',
    countSuffix: '{n} receipt(s)',
    newReceipt: 'New Receipt',
    searchPh: 'Search receipts...',
    empty: 'No receipts yet',
    emptyHint: 'Record payments received from clients',
    colId: 'ID',
    colDate: 'Date',
    colClient: 'Client',
    colPayment: 'Method',
    colAmount: 'Amount',
    confirmDelete: 'Delete this receipt?',
    // Modal
    modalNew: 'New Receipt',
    modalEdit: 'Edit Receipt',
    client: 'Client *',
    project: 'Project',
    choose: '-- Choose --',
    chooseNone: '-- None --',
    date: 'Date',
    amount: 'Amount Received *',
    currency: 'Currency',
    paymentMethod: 'Payment Method',
    payMethodCash: 'Cash',
    payMethodCheck: 'Check',
    payMethodBank: 'Bank Transfer',
    receivedAt: 'Received At',
    chooseCashBox: '-- Cash account --',
    chooseChecksBox: '-- Checks box --',
    chooseBankAcc: '-- Bank account --',
    settleInvoice: 'Settle Sales Invoice (optional)',
    noInvoice: '-- None --',
    clientDue: 'Outstanding balance',
    outstanding: 'outstanding',
    notes: 'Notes',
    cancel: 'Cancel',
    save: 'Save Receipt',
    // Multi-check
    checkEntries: 'Checks Received',
    addCheck: '+ Add Check',
    checkNum: 'Check #',
    dueDate: 'Due Date',
    issuerName: 'Issuer Name',
    checksTotal: 'Total from checks',
    checkNumPlaceholder: '123456',
    // Edit mode
    editOnlyNotes: 'Only notes and invoice link can be edited after saving.',
    linkInvoice: 'Link to Sales Invoice',
    checksOnRecord: 'Checks on Record',
    receivedChecks: 'Received Checks',
    checkDue: 'due',
    // Print
    receiptLbl: 'Receipt',
    print: 'Print',
    paidVia: 'Paid via',
    pTotal: 'Amount',
    // method labels
    cash: 'Cash',
    check: 'Check',
    bank_transfer: 'Bank Transfer',
  },
  ar: {
    title: 'إيصالات واردة',
    countSuffix: '{n} إيصال',
    newReceipt: 'إيصال جديد',
    searchPh: 'بحث في الإيصالات...',
    empty: 'لا توجد إيصالات بعد',
    emptyHint: 'سجّل المدفوعات المستلمة من العملاء',
    colId: 'المعرّف',
    colDate: 'التاريخ',
    colClient: 'العميل',
    colPayment: 'الطريقة',
    colAmount: 'المبلغ',
    confirmDelete: 'حذف هذا الإيصال؟',
    // Modal
    modalNew: 'إيصال جديد',
    modalEdit: 'تعديل الإيصال',
    client: 'العميل *',
    project: 'المشروع',
    choose: '-- اختر --',
    chooseNone: '-- لا يوجد --',
    date: 'التاريخ',
    amount: 'المبلغ المستلم *',
    currency: 'العملة',
    paymentMethod: 'طريقة الدفع',
    payMethodCash: 'نقدي',
    payMethodCheck: 'شيك',
    payMethodBank: 'تحويل بنكي',
    receivedAt: 'وُجد في',
    chooseCashBox: '-- الصندوق النقدي --',
    chooseChecksBox: '-- صندوق الشيكات --',
    chooseBankAcc: '-- الحساب البنكي --',
    settleInvoice: 'تسوية فاتورة مبيعات (اختياري)',
    noInvoice: '-- لا يوجد --',
    clientDue: 'الرصيد المستحق',
    outstanding: 'متبقي',
    notes: 'ملاحظات',
    cancel: 'إلغاء',
    save: 'حفظ الإيصال',
    // Multi-check
    checkEntries: 'الشيكات المستلمة',
    addCheck: '+ إضافة شيك',
    checkNum: 'رقم الشيك',
    dueDate: 'تاريخ الاستحقاق',
    issuerName: 'اسم الساحب',
    checksTotal: 'الإجمالي من الشيكات',
    checkNumPlaceholder: '123456',
    // Edit mode
    editOnlyNotes: 'يمكن تعديل الملاحظات ورابط الفاتورة فقط بعد الحفظ.',
    linkInvoice: 'ربط بفاتورة مبيعات',
    checksOnRecord: 'الشيكات المسجلة',
    receivedChecks: 'الشيكات المستلمة',
    checkDue: 'استحقاق',
    // Print
    receiptLbl: 'إيصال',
    print: 'طباعة',
    paidVia: 'تم الدفع عبر',
    pTotal: 'المبلغ',
    // method labels
    cash: 'نقدي',
    check: 'شيك',
    bank_transfer: 'تحويل بنكي',
  },
} as const

const CURRENCIES = ['ILS', 'USD', 'JOD']

type PaymentMethodType = 'cash' | 'check' | 'bank_transfer'
const METHOD_KEY: Record<PaymentMethodType, keyof typeof L.en> = {
  cash: 'payMethodCash', check: 'payMethodCheck', bank_transfer: 'payMethodBank',
}

// A single check entry in a multi-check receipt
interface CheckEntry {
  id: string
  checkNumber: string
  amount: number
  currency: string
  dueDate: string
  issuerName: string
}

function newCheckEntry(): CheckEntry {
  return {
    id: Math.random().toString(36).slice(2),
    checkNumber: '',
    amount: 0,
    currency: 'ILS',
    dueDate: '',
    issuerName: '',
  }
}

const EMPTY_RECEIPT = (): Omit<Receipt, 'id' | 'createdAt'> => ({
  entityType: 'client', projectId: '', clientId: '', supplierId: '', paymentId: '',
  salesInvoiceId: '',
  lineItems: [],
  subtotal: 0, discountPercent: 0, discount: 0, taxPercent: 0, tax: 0, total: 0,
  currency: 'ILS', exchangeRate: 1,
  paymentMethod: 'cash', receivedAccountId: '',
  date: today(), notes: '',
})

function PrintModal({ receipt, onClose }: { receipt: Receipt; onClose: () => void }) {
  const t = useT(L)
  const { clients, projects, banks, checks: allChecks, settings } = useStore()
  const isAr    = settings.language === 'ar'
  const client  = clients.find(c => c.id === receipt.clientId)
  const project = projects.find(p => p.id === receipt.projectId)
  const account = banks.find(b => b.id === receipt.receivedAccountId)
  const pm      = (receipt.paymentMethod ?? 'cash') as PaymentMethodType
  const currency = receipt.currency ?? settings.currency ?? 'ILS'

  // Checks linked to this receipt
  const rcvChecks = (allChecks as any[]).filter(c => c.paymentId === receipt.id && c.type === 'received')

  function doPrint() {
    const dir = isAr ? 'rtl' : 'ltr'
    const ra  = isAr ? 'left' : 'right'
    const lbl = {
      receipt:     isAr ? 'إيصال استلام'        : 'Receipt',
      client:      isAr ? 'العميل'              : 'Client',
      project:     isAr ? 'المشروع'             : 'Project',
      date:        isAr ? 'التاريخ'             : 'Date',
      paidVia:     isAr ? 'طريقة الدفع'         : 'Payment Method',
      receivedAt:  isAr ? 'حُصِّل في'            : 'Received at',
      notes:       isAr ? 'ملاحظات'             : 'Notes',
      checkNo:     isAr ? 'رقم الشيك'           : 'Check #',
      issuer:      isAr ? 'الساحب'              : 'Issuer',
      dueDate:     isAr ? 'تاريخ الاستحقاق'     : 'Due Date',
      amount:      isAr ? 'المبلغ'              : 'Amount',
      total:       isAr ? 'الإجمالي'            : 'Total',
      checks:      isAr ? 'الشيكات المستلمة'    : 'Received Checks',
      receivedBy:  isAr ? 'استلم'               : 'Received by',
      authorizedBy:isAr ? 'اعتمد'               : 'Authorized by',
    }
    const methodName = pm === 'cash'
      ? (isAr ? 'نقدي' : 'Cash')
      : pm === 'check'
      ? (isAr ? 'شيك' : 'Check')
      : (isAr ? 'تحويل بنكي' : 'Bank Transfer')

    const checkRows = rcvChecks.map((c: any) => `
      <tr>
        <td>${c.checkNumber}</td>
        <td>${c.issuerName || '—'}</td>
        <td>${formatDate(c.dueDate)}</td>
        <td style="text-align:${ra}">${formatCurrency(c.amount, c.currency || currency)}</td>
      </tr>`).join('')

    const html = `<!DOCTYPE html>
<html dir="${dir}" lang="${settings.language}">
<head><meta charset="utf-8">
<title>${lbl.receipt} ${receipt.id}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,'Noto Sans Arabic',sans-serif;padding:28px 36px;color:#1a1a1a;font-size:13px}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1a1a1a;padding-bottom:14px;margin-bottom:20px}
.co-name{font-size:18px;font-weight:700}
.co-sub{font-size:11px;color:#555;margin-top:3px;line-height:1.5}
.doc-side{text-align:${ra}}
.doc-title{font-size:16px;font-weight:700;color:#1d4ed8}
.doc-id{font-size:12px;color:#444;margin-top:3px}
.doc-date{font-size:12px;color:#666;margin-top:2px}
.badge{display:inline-block;background:#dbeafe;border:1px solid #93c5fd;border-radius:4px;padding:2px 10px;font-size:11px;font-weight:600;color:#1d4ed8;margin-top:4px}
.info{width:100%;border-collapse:collapse;margin-bottom:18px}
.info td{padding:6px 8px;font-size:13px;border-bottom:1px solid #f0f0f0}
.info td:first-child{color:#666;width:32%;font-weight:500}
.info td:last-child{font-weight:600}
.sec-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#555;border-bottom:1px solid #ddd;padding-bottom:4px;margin-bottom:8px}
.chks{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:18px}
.chks th{background:#eff6ff;border:1px solid #bfdbfe;padding:6px 8px;font-weight:600;color:#1e40af}
.chks td{border:1px solid #ddd;padding:6px 8px}
.total{display:flex;justify-content:space-between;border-top:2px solid #1a1a1a;margin-top:8px;padding-top:10px;font-size:17px;font-weight:700}
.sig{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:44px}
.sig-box{border-top:1px solid #aaa;padding-top:6px;text-align:center;font-size:11px;color:#666}
.footer{margin-top:20px;text-align:center;font-size:10px;color:#aaa;border-top:1px solid #eee;padding-top:8px}
@media print{body{padding:12mm 16mm}@page{size:A4;margin:0}}
</style></head>
<body>
<div class="hdr">
  <div>
    <div class="co-name">${settings.companyName || '&nbsp;'}</div>
    <div class="co-sub">${[settings.companyPhone, settings.companyAddress].filter(Boolean).join(' &nbsp;·&nbsp; ')}</div>
  </div>
  <div class="doc-side">
    <div class="doc-title">${lbl.receipt}</div>
    <div class="doc-id">${receipt.id}</div>
    <div class="doc-date">${formatDate(receipt.date)}</div>
    <span class="badge">${methodName}</span>
  </div>
</div>
<table class="info">
  <tr><td>${lbl.client}</td><td>${client?.name ?? '—'}</td></tr>
  ${project ? `<tr><td>${lbl.project}</td><td>${project.name}</td></tr>` : ''}
  <tr><td>${lbl.paidVia}</td><td>${methodName}${account ? ' — ' + account.name : ''}</td></tr>
  ${receipt.notes ? `<tr><td>${lbl.notes}</td><td>${receipt.notes}</td></tr>` : ''}
</table>
${rcvChecks.length > 0 ? `
<div class="sec-title">${lbl.checks}</div>
<table class="chks">
  <thead><tr>
    <th>${lbl.checkNo}</th>
    <th>${lbl.issuer}</th>
    <th>${lbl.dueDate}</th>
    <th>${lbl.amount}</th>
  </tr></thead>
  <tbody>${checkRows}</tbody>
</table>` : ''}
<div class="total">
  <span>${lbl.total}</span>
  <span>${formatCurrency(receipt.total, currency)}</span>
</div>
<div class="sig">
  <div class="sig-box">${lbl.receivedBy}</div>
  <div class="sig-box">${lbl.authorizedBy}</div>
</div>
<div class="footer">${settings.companyName ? settings.companyName + ' &nbsp;·&nbsp; ' : ''}${receipt.id} &nbsp;·&nbsp; ${formatDate(receipt.date)}</div>
</body></html>`

    const win = window.open('', '_blank', 'width=680,height=820')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.print()
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-sm shadow-2xl p-6 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">{t.receiptLbl} {receipt.id}</h3>
            <p className="text-xs text-gray-500">{formatDate(receipt.date)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Preview */}
        <div className="bg-gray-900/60 rounded-xl p-4 space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">{t.client.replace(' *', '')}</span>
            <span className="text-white font-medium">{client?.name ?? '—'}</span>
          </div>
          {project && (
            <div className="flex justify-between">
              <span className="text-gray-400">{t.project}</span>
              <span className="text-gray-300">{project.name}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-400">{t.date}</span>
            <span className="text-gray-300">{formatDate(receipt.date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">{t.paidVia}</span>
            <span className="text-gray-300">{t[METHOD_KEY[pm]]}{account ? ` — ${account.name}` : ''}</span>
          </div>
          {rcvChecks.length > 0 && (
            <div className="border-t border-gray-700 pt-2 space-y-1.5">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{t.checksOnRecord}</p>
              {rcvChecks.map((c: any) => (
                <div key={c.id} className="grid grid-cols-4 gap-1 text-xs items-center">
                  <span className="font-mono text-yellow-400">#{c.checkNumber}</span>
                  <span className="text-gray-400 truncate">{c.issuerName}</span>
                  <span className="text-gray-500 text-center">{formatDate(c.dueDate)}</span>
                  <span className="text-white text-right">{formatCurrency(c.amount, c.currency || currency)}</span>
                </div>
              ))}
            </div>
          )}
          {receipt.notes && (
            <div className="flex justify-between gap-4">
              <span className="text-gray-400 shrink-0">{t.notes}</span>
              <span className="text-gray-500 text-right text-xs truncate max-w-[160px]">{receipt.notes}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-700 pt-2 font-bold text-base">
            <span className="text-gray-400">{t.pTotal}</span>
            <span className="text-green-400">{formatCurrency(receipt.total, currency)}</span>
          </div>
        </div>

        <button className="btn-primary w-full" onClick={doPrint}>{t.print}</button>
      </div>
    </div>
  )
}

function Modal({
  initial, receiptId, onSave, onClose,
}: {
  initial: Omit<Receipt, 'id' | 'createdAt'>
  receiptId?: string
  onSave: (d: Omit<Receipt, 'id' | 'createdAt'>, checkEntries: CheckEntry[]) => void
  onClose: () => void
}) {
  const t = useT(L)
  const { clients, projects, banks, receipts: _r, settings, checks: allChecks } = useStore()
  const { salesInvoices } = useStore() as any  // receipts settle sales invoices

  // Edit-mode: only notes may change
  const isEdit = !!receiptId
  const editReceivedChecks = isEdit
    ? allChecks.filter((c: any) => c.paymentId === receiptId && c.type === 'received')
    : []

  const [form, setForm] = useState(initial)
  const [checkEntries, setCheckEntries] = useState<CheckEntry[]>([newCheckEntry()])
  const setField = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }))

  const pm = (form.paymentMethod ?? 'cash') as PaymentMethodType
  const currency = form.currency ?? settings.currency ?? 'ILS'

  function setPaymentMethod(m: PaymentMethodType) {
    setForm(f => ({ ...f, paymentMethod: m, receivedAccountId: '' }))
    // Reset check entries when switching to check mode
    if (m === 'check') setCheckEntries([newCheckEntry()])
  }

  const cashAccounts    = banks.filter(b => b.accountType === 'cash')
  const checksBoxes     = banks.filter(b => b.accountType === 'checks_box')
  const currentBanks    = banks.filter(b => (b.accountType ?? 'current') === 'current')

  const receivedAccounts = pm === 'cash' ? cashAccounts : pm === 'check' ? checksBoxes : currentBanks
  const receivedLabel    = pm === 'cash' ? t.chooseCashBox : pm === 'check' ? t.chooseChecksBox : t.chooseBankAcc

  const filteredProjects = form.clientId ? projects.filter(p => p.clientId === form.clientId) : projects

  // Sales invoices for the selected client (for settlement)
  const clientInvoices = salesInvoices
    ? (salesInvoices as any[]).filter((inv: any) => inv.clientId === form.clientId)
    : []

  // Only unpaid / partially-paid invoices are eligible for settlement
  const unpaidClientInvoices = clientInvoices.filter(
    (inv: any) => inv.status !== 'paid' && inv.status !== 'cancelled'
  )

  // Total outstanding across all unpaid invoices for this client
  const clientTotalDue = unpaidClientInvoices.reduce(
    (sum: number, inv: any) => sum + Math.max(0, inv.total - (inv.paidAmount || 0)),
    0
  )

  const pmIcons = {
    cash: <Banknote className="w-4 h-4" />,
    check: <Archive className="w-4 h-4" />,
    bank_transfer: <Landmark className="w-4 h-4" />,
  }

  // ── Multi-check helpers ───────────────────────────────────────────────────
  function updateEntry(id: string, field: keyof CheckEntry, value: string | number) {
    setCheckEntries(entries =>
      entries.map(e => e.id === id ? { ...e, [field]: value } : e)
    )
  }

  function addEntry() {
    setCheckEntries(entries => {
      const last = entries[entries.length - 1]
      if (!last) return [...entries, newCheckEntry()]

      // ── Sequential check number ────────────────────────────────────────────
      const nextCheckNumber = (() => {
        const match = last.checkNumber.match(/^(\D*)(\d+)(\D*)$/)
        if (!match) return last.checkNumber
        const [, prefix, digits, suffix] = match
        const next = String(parseInt(digits, 10) + 1).padStart(digits.length, '0')
        return prefix + next + suffix
      })()

      // ── Same calendar day, next month (local date to avoid UTC shift) ──────
      const nextDueDate = (() => {
        if (!last.dueDate) return ''
        const d = new Date(last.dueDate + 'T00:00:00')
        const targetDay = d.getDate()
        const next = new Date(d.getFullYear(), d.getMonth() + 1, targetDay)
        // Clamp to last day of month on overflow (e.g. Jan 31 → Feb 28)
        if (next.getMonth() !== ((d.getMonth() + 1) % 12)) {
          next.setDate(0)
        }
        const y  = next.getFullYear()
        const mo = String(next.getMonth() + 1).padStart(2, '0')
        const d2 = String(next.getDate()).padStart(2, '0')
        return `${y}-${mo}-${d2}`
      })()

      return [...entries, {
        id: Math.random().toString(36).slice(2),
        checkNumber: nextCheckNumber,
        amount: last.amount,
        currency: last.currency,
        dueDate: nextDueDate,
        issuerName: last.issuerName,
      }]
    })
  }

  function removeEntry(id: string) {
    setCheckEntries(entries => entries.filter(e => e.id !== id))
  }

  // When payment method is check, total = sum of check entry amounts
  const checksTotal = pm === 'check'
    ? checkEntries.reduce((sum, e) => sum + (e.amount || 0), 0)
    : form.total

  // Derive the main currency for check receipts (use first entry's currency if set)
  const checkCurrency = pm === 'check'
    ? (checkEntries[0]?.currency || currency)
    : currency

  // Validation: check receipts require at least one entry with amount + checkNumber; receivedAt is mandatory
  const isValid = isEdit || (form.clientId && isValidDate(form.date) && !!form.receivedAccountId && (
    pm === 'check'
      ? checkEntries.length > 0 && checksTotal > 0 && checkEntries.every(e => e.checkNumber.trim())
      : form.total > 0
  ))

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
          <h2 className="font-semibold text-white">{initial.clientId ? t.modalEdit : t.modalNew}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">

          {/* Edit-mode notice */}
          {isEdit && (
            <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg px-4 py-2.5 text-xs text-yellow-300">
              {t.editOnlyNotes}
            </div>
          )}

          {/* ══ All fields except notes locked in edit mode ══ */}
          <fieldset disabled={isEdit} className={isEdit ? 'space-y-4 opacity-60 pointer-events-none select-none' : 'space-y-4'}>

            {/* Client + Project */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t.client}</label>
                <select className="input" value={form.clientId}
                  onChange={e => { setField('clientId', e.target.value); setField('projectId', ''); setField('salesInvoiceId', '') }}>
                  <option value="">{t.choose}</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{t.project}</label>
                <select className="input" value={form.projectId} onChange={e => setField('projectId', e.target.value)}>
                  <option value="">{t.chooseNone}</option>
                  {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            {/* ── Client outstanding balance + Invoice selector (new receipts only) ── */}
            {!isEdit && form.clientId && (
              <div className="space-y-3">
                {/* Outstanding balance badge */}
                {clientTotalDue > 0 && (
                  <div className="flex items-center justify-between bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2">
                    <span className="text-xs text-gray-400">{t.clientDue}</span>
                    <span className="text-sm font-bold text-red-400">{formatCurrency(clientTotalDue)}</span>
                  </div>
                )}

                {/* Invoice selector — shown right after client when invoices exist */}
                {unpaidClientInvoices.length > 0 && (
                  <div>
                    <label className="label">{t.settleInvoice}</label>
                    <select
                      className="input"
                      value={form.salesInvoiceId ?? ''}
                      onChange={e => setField('salesInvoiceId', e.target.value)}
                    >
                      <option value="">{t.noInvoice}</option>
                      {unpaidClientInvoices.map((inv: any) => {
                        const outstanding = Math.max(0, inv.total - (inv.paidAmount || 0))
                        return (
                          <option key={inv.id} value={inv.id}>
                            {inv.id} — {formatCurrency(outstanding, inv.currency ?? 'ILS')} {t.outstanding} ({formatDate(inv.date)})
                          </option>
                        )
                      })}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Amount + Currency + Date — only for non-check methods */}
            {pm !== 'check' && (
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="label">{t.amount}</label>
                  <input className="input" type="number" min={0} step="0.01"
                    value={form.total || ''}
                    onChange={e => {
                      const v = parseFloat(e.target.value) || 0
                      setForm(f => ({ ...f, total: v, subtotal: v }))
                    }} />
                </div>
                <div>
                  <label className="label">{t.currency}</label>
                  <select className="input" value={currency} onChange={e => setField('currency', e.target.value)}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Date */}
            <div>
              <label className="label">{t.date}</label>
              <input className="input w-48" type="date" value={form.date} onChange={e => setField('date', e.target.value)} />
            </div>

            {/* Payment method */}
            <div>
              <label className="label">{t.paymentMethod}</label>
              <div className="grid grid-cols-3 gap-2">
                {(['cash', 'check', 'bank_transfer'] as PaymentMethodType[]).map(m => (
                  <button key={m} type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                      pm === m ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300' : 'border-gray-600 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {pmIcons[m]} {t[METHOD_KEY[m]]}
                  </button>
                ))}
              </div>
            </div>

            {/* Received At */}
            <div>
              <label className="label">{t.receivedAt}</label>
              <select className="input" value={form.receivedAccountId ?? ''}
                onChange={e => setField('receivedAccountId', e.target.value)}>
                <option value="">{receivedLabel}</option>
                {receivedAccounts.map(b => (
                  <option key={b.id} value={b.id}>{b.name}{b.bankName ? ` (${b.bankName})` : ''}</option>
                ))}
              </select>
            </div>

            {/* ── Multi-check entries (only when method = check, new receipt) ── */}
            {pm === 'check' && !isEdit && (
              <div className="bg-gray-900/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wide">{t.checkEntries}</p>
                  <button
                    type="button"
                    onClick={addEntry}
                    className="text-xs text-yellow-400 hover:text-yellow-300 font-medium"
                  >
                    {t.addCheck}
                  </button>
                </div>

                {checkEntries.map((entry, idx) => (
                  <div key={entry.id} className="bg-gray-800 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">#{idx + 1}</span>
                      {checkEntries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEntry(entry.id)}
                          className="text-red-500 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {/* Check # + Issuer */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="label text-[10px]">{t.checkNum}</label>
                        <input
                          className="input text-sm py-1.5"
                          value={entry.checkNumber}
                          placeholder={t.checkNumPlaceholder}
                          onChange={e => updateEntry(entry.id, 'checkNumber', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="label text-[10px]">{t.issuerName}</label>
                        <input
                          className="input text-sm py-1.5"
                          value={entry.issuerName}
                          onChange={e => updateEntry(entry.id, 'issuerName', e.target.value)}
                        />
                      </div>
                    </div>
                    {/* Amount + Currency + Due Date */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <label className="label text-[10px]">{t.amount}</label>
                        <input
                          className="input text-sm py-1.5"
                          type="number"
                          min={0}
                          step="0.01"
                          value={entry.amount || ''}
                          onChange={e => updateEntry(entry.id, 'amount', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="label text-[10px]">{t.currency}</label>
                        <select
                          className="input text-sm py-1.5"
                          value={entry.currency}
                          onChange={e => updateEntry(entry.id, 'currency', e.target.value)}
                        >
                          {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="label text-[10px]">{t.dueDate}</label>
                        <input
                          className="input text-sm py-1.5"
                          type="date"
                          value={entry.dueDate}
                          onChange={e => updateEntry(entry.id, 'dueDate', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Checks total summary */}
                <div className="flex items-center justify-between border-t border-gray-700 pt-2">
                  <span className="text-xs text-gray-400">{t.checksTotal}</span>
                  <span className="font-bold text-green-400 text-sm">
                    {formatCurrency(checksTotal, checkCurrency)}
                  </span>
                </div>
              </div>
            )}

          </fieldset>

          {/* Invoice selector in edit mode — kept outside fieldset so it stays editable */}
          {isEdit && clientInvoices.length > 0 && (
            <div>
              <label className="label">{t.linkInvoice}</label>
              <select className="input" value={form.salesInvoiceId ?? ''}
                onChange={e => setField('salesInvoiceId', e.target.value)}>
                <option value="">{t.noInvoice}</option>
                {clientInvoices.map((inv: any) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.id} — {formatCurrency(inv.total, inv.currency ?? 'ILS')} ({formatDate(inv.date)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ── Read-only check cards (edit mode, check receipt) ── */}
          {isEdit && pm === 'check' && editReceivedChecks.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.checksOnRecord}</p>
              <div className="bg-gray-900/50 rounded-xl border border-yellow-700/30 overflow-hidden">
                <p className="px-4 py-2 text-[10px] font-semibold text-yellow-400 uppercase tracking-wide bg-gray-900/40 border-b border-yellow-700/20">
                  📥 {t.receivedChecks}
                </p>
                <div className="divide-y divide-gray-700/40">
                  {editReceivedChecks.map((c: any, idx: number) => (
                    <div key={c.id} className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
                      <span className="text-gray-500">#{idx + 1}</span>
                      <span className="font-mono text-yellow-300">#{c.checkNumber}</span>
                      <span className="text-gray-400 flex-1 truncate">{c.issuerName}</span>
                      <span className="text-gray-500">{t.checkDue}: {formatDate(c.dueDate)}</span>
                      <span className="font-semibold text-white">{formatCurrency(c.amount, c.currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notes — always editable */}
          <div>
            <label className="label">{t.notes}</label>
            <textarea className="input resize-none" rows={2} value={form.notes}
              onChange={e => setField('notes', e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-700">
          <button className="btn-secondary" onClick={onClose}>{t.cancel}</button>
          <button className="btn-primary"
            onClick={() => {
              if (!isValid) return
              // Build the final receipt data with computed total
              const finalData: Omit<Receipt, 'id' | 'createdAt'> = pm === 'check'
                ? { ...form, entityType: 'client', supplierId: '', total: checksTotal, subtotal: checksTotal, currency: checkCurrency }
                : { ...form, entityType: 'client', supplierId: '' }
              onSave(finalData, pm === 'check' ? checkEntries : [])
            }}>
            {t.save}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Receipts() {
  const t = useT(L)
  const { receipts, clients, addReceipt, updateReceipt, deleteReceipt, addCheck } = useStore()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<{ open: boolean; receipt?: Receipt }>({ open: false })
  const [printReceipt, setPrintReceipt] = useState<Receipt | null>(null)

  // Only show client receipts
  const clientReceipts = receipts.filter(r => r.entityType !== 'supplier')

  const filtered = clientReceipts.filter(r => {
    const client = clients.find(c => c.id === r.clientId)
    return r.id.toLowerCase().includes(search.toLowerCase()) ||
      (client?.name ?? '').toLowerCase().includes(search.toLowerCase())
  }).sort((a, b) => b.date.localeCompare(a.date))

  const totalIn = clientReceipts.reduce((s, r) => s + r.total, 0)

  function handleSave(data: Omit<Receipt, 'id' | 'createdAt'>, checkEntries: CheckEntry[]) {
    if (modal.receipt) {
      // Edit mode: notes and invoice link may change
      updateReceipt(modal.receipt.id, { notes: data.notes, salesInvoiceId: data.salesInvoiceId })
    } else {
      const receipt = addReceipt(data)
      // Create a Check record for each check entry
      if (data.paymentMethod === 'check' && checkEntries.length > 0) {
        for (const entry of checkEntries) {
          if (!entry.checkNumber.trim()) continue
          addCheck({
            checkNumber: entry.checkNumber,
            type: 'received',
            status: 'pending',
            amount: entry.amount,
            currency: entry.currency,
            bankAccountId: data.receivedAccountId || '',
            issuerName: entry.issuerName,
            payeeName: '',
            issueDate: data.date,
            dueDate: entry.dueDate || data.date,
            projectId: data.projectId,
            clientId: data.clientId,
            supplierId: '',
            paymentId: receipt.id,
            notes: `From receipt ${receipt.id}`,
          })
        }
      }
    }
    setModal({ open: false })
  }

  const pmIcon = (m?: string) => {
    if (m === 'check') return <Archive className="w-3.5 h-3.5" />
    if (m === 'bank_transfer') return <Landmark className="w-3.5 h-3.5" />
    return <Banknote className="w-3.5 h-3.5" />
  }
  const pmLabel = (m?: string) => {
    if (m === 'check') return t.payMethodCheck
    if (m === 'bank_transfer') return t.payMethodBank
    return t.payMethodCash
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
          <p className="text-gray-500 text-sm">{t.countSuffix.replace('{n}', String(clientReceipts.length))}</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal({ open: true })}>
          <Plus className="w-4 h-4" /> {t.newReceipt}
        </button>
      </div>

      {/* Summary */}
      {clientReceipts.length > 0 && (
        <div className="card py-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">{t.title}</p>
          <p className="text-xl font-bold text-green-400 mt-1">{formatCurrency(totalIn)}</p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input className="input pl-9" placeholder={t.searchPh} value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <ReceiptText className="w-12 h-12 text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">{t.empty}</p>
          <p className="text-gray-600 text-sm mt-1">{t.emptyHint}</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colId}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">{t.colDate}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colClient}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">{t.colPayment}</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colAmount}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const client = clients.find(c => c.id === r.clientId)
                return (
                  <tr key={r.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-yellow-500">{r.id}</td>
                    <td className="px-5 py-3 text-gray-400 hidden md:table-cell">{formatDate(r.date)}</td>
                    <td className="px-5 py-3 text-white font-medium">{client?.name ?? '—'}</td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <span className="flex items-center gap-1.5 text-gray-300">
                        {pmIcon(r.paymentMethod)} {pmLabel(r.paymentMethod)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-green-400">
                      +{formatCurrency(r.total, r.currency ?? 'ILS')}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button className="text-gray-500 hover:text-blue-400" title={t.print}
                          onClick={() => setPrintReceipt(r)}>
                          <ReceiptText className="w-4 h-4" />
                        </button>
                        <button className="text-gray-500 hover:text-yellow-400"
                          onClick={() => setModal({ open: true, receipt: r })}>
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button className="text-gray-500 hover:text-red-400"
                          onClick={() => { if (confirm(t.confirmDelete)) deleteReceipt(r.id) }}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal.open && (
        <Modal
          receiptId={modal.receipt?.id}
          initial={modal.receipt
            ? { ...modal.receipt, lineItems: modal.receipt.lineItems ?? [] }
            : EMPTY_RECEIPT()}
          onSave={handleSave}
          onClose={() => setModal({ open: false })}
        />
      )}

      {printReceipt && (
        <PrintModal receipt={printReceipt} onClose={() => setPrintReceipt(null)} />
      )}
    </div>
  )
}
