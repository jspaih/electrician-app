import { useState, useMemo, useCallback } from 'react'
import { useStore } from '../store/useStore'
import {
  useChecks, useClients, useProjects, useBanks, useSuppliers,
  useStoreActions, useById, useTableData,
} from '../hooks/useSelectors'
import { usePagination } from '../hooks/usePagination'
import { PaginationControls } from './PaginationControls'
import { formatCurrency, formatDate, checkStatusColor } from '../utils/helpers'
import { Search, FileCheck, Landmark, RotateCcw, CheckCircle2, ArrowRightLeft, X } from 'lucide-react'
import { useT } from '../hooks/useT'
import type { Check, CheckStatus, CheckType } from '../types'

// 'bounced' removed from dropdown per req 24e — it's kept in type for backward compat but no longer selectable
const STATUSES: CheckStatus[] = ['pending', 'deposited', 'cleared', 'cancelled', 'returned', 'paid_to']

const L = {
  en: {
    title: 'Checks',
    subtitle: '{n} total checks — managed via Payments',
    pendingReceived: 'Checks in Box (Received)',
    pendingIssued: 'Payable Checks (Issued)',
    checksInBox: 'Checks in Box',
    selectedCount: '{n} checks selected',
    depositBank: 'Deposit to Bank',
    cleared: 'Cleared',
    bounced: 'Bounced',
    returned: 'Returned',
    paidTo: 'Paid To',
    searchPlaceholder: 'Search by check number or name…',
    allTypes: 'All types',
    typeReceived: 'Received',
    typeIssued: 'Issued',
    allStatuses: 'All statuses',
    noChecks: 'No checks',
    checksAutoHint: 'Checks are created automatically when you add a check payment',
    colIdNumber: 'ID / Number',
    colType: 'Type',
    colParties: 'Issuer / Payee',
    colDueDate: 'Due Date',
    colStatus: 'Status',
    colAmount: 'Amount',
    overdue: 'Overdue',
    paidToLabel: 'Paid to:',
    editTooltip: 'Update status',
    depositTitle: 'Deposit to Bank',
    depositPrompt: 'Choose the bank account for {n} check(s)',
    chooseBank: '-- Select bank --',
    cancel: 'Cancel',
    deposit: 'Deposit',
    paidToTitle: 'Paid To',
    paidToPrompt: 'Enter the name for {n} check(s)',
    payeePlaceholder: 'Payee name…',
    confirm: 'Confirm',
    updateTitle: 'Update Check #{num}',
    status: 'Status',
    bankAccount: 'Bank Account',
    noneDash: '-- None --',
    payeeName: 'Payee Name',
    namePlaceholder: 'Name…',
    notes: 'Notes',
    save: 'Save',
    // statuses
    stPending: 'Received',
    stDeposited: 'Deposited',
    stCleared: 'Cleared',
    stBounced: 'Bounced',
    stCancelled: 'Cancelled',
    stReturned: 'Returned',
    stPaidTo: 'Paid To',
  },
  ar: {
    title: 'الشيكات',
    subtitle: '{n} شيك إجمالاً — تُدار من خلال المدفوعات',
    pendingReceived: 'شيكات في الصندوق (مستلمة)',
    pendingIssued: 'شيكات مستحقة الدفع (صادرة)',
    checksInBox: 'شيكات في الصندوق',
    selectedCount: 'تم تحديد {n} شيك',
    depositBank: 'إيداع في البنك',
    cleared: 'تمت التسوية',
    bounced: 'مرتجع',
    returned: 'مُعاد',
    paidTo: 'دُفع إلى',
    searchPlaceholder: 'بحث برقم الشيك أو الاسم...',
    allTypes: 'جميع الأنواع',
    typeReceived: 'مستلم',
    typeIssued: 'صادر',
    allStatuses: 'جميع الحالات',
    noChecks: 'لا توجد شيكات',
    checksAutoHint: 'تُنشأ الشيكات تلقائياً عند إضافة دفعة بالشيك',
    colIdNumber: 'المعرّف / الرقم',
    colType: 'النوع',
    colParties: 'الساحب / المستفيد',
    colDueDate: 'تاريخ الاستحقاق',
    colStatus: 'الحالة',
    colAmount: 'المبلغ',
    overdue: 'متأخر',
    paidToLabel: 'دُفع إلى:',
    editTooltip: 'تعديل الحالة',
    depositTitle: 'إيداع في البنك',
    depositPrompt: 'اختر الحساب البنكي لـ {n} شيك',
    chooseBank: '-- اختر البنك --',
    cancel: 'إلغاء',
    deposit: 'إيداع',
    paidToTitle: 'دُفع إلى',
    paidToPrompt: 'أدخل الاسم لـ {n} شيك',
    payeePlaceholder: 'اسم المستفيد...',
    confirm: 'تأكيد',
    updateTitle: 'تحديث الشيك #{num}',
    status: 'الحالة',
    bankAccount: 'الحساب البنكي',
    noneDash: '-- لا يوجد --',
    payeeName: 'اسم المستفيد',
    namePlaceholder: 'الاسم...',
    notes: 'ملاحظات',
    save: 'حفظ',
    // statuses
    stPending: 'مستلم',
    stDeposited: 'مُودع',
    stCleared: 'تمت التسوية',
    stBounced: 'مرتجع',
    stCancelled: 'ملغي',
    stReturned: 'مُعاد',
    stPaidTo: 'دُفع إلى',
  },
} as const

const STATUS_KEY: Record<CheckStatus, keyof typeof L.en> = {
  pending: 'stPending',
  deposited: 'stDeposited',
  cleared: 'stCleared',
  bounced: 'stBounced',
  cancelled: 'stCancelled',
  returned: 'stReturned',
  paid_to: 'stPaidTo',
}

const TYPE_KEY: Record<CheckType, keyof typeof L.en> = {
  received: 'typeReceived',
  issued: 'typeIssued',
}

export default function Checks() {
  const t = useT(L)

  // Narrow subscriptions
  const checks    = useChecks()
  const clients   = useClients()
  const projects  = useProjects()
  const banks     = useBanks()
  const suppliers = useSuppliers()
  const { updateCheck, bulkUpdateCheckStatus } = useStoreActions()
  const getChecksInBoxBalance = useStore(s => s.getChecksInBoxBalance)

  // O(1) lookup maps for table rows
  const clientById   = useById(clients)
  const supplierById = useById(suppliers)
  const projectById  = useById(projects)
  const bankById     = useById(banks)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CheckStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<CheckType | 'all'>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Action modals
  const [depositModal, setDepositModal] = useState(false)
  const [depositBankId, setDepositBankId] = useState('')
  const [paidToModal, setPaidToModal] = useState(false)
  const [paidToName, setPaidToName] = useState('')
  const [editCheck, setEditCheck] = useState<Check | null>(null)
  const [editStatus, setEditStatus] = useState<CheckStatus>('pending')
  const [editBank, setEditBank] = useState('')
  const [editPaidTo, setEditPaidTo] = useState('')
  const [editNotes, setEditNotes] = useState('')

  // Memoized filter+search+sort
  const filtered = useTableData(checks, {
    search,
    searchFields: ['id', 'checkNumber', 'issuerName', 'payeeName'],
    filter: useCallback(
      (c: Check) => {
        if (statusFilter !== 'all' && c.status !== statusFilter) return false
        if (typeFilter   !== 'all' && c.type   !== typeFilter)   return false
        return true
      },
      [statusFilter, typeFilter],
    ),
    sort: useCallback(
      (a: Check, b: Check) => b.dueDate.localeCompare(a.dueDate),
      [],
    ),
  })

  // Pagination
  const {
    items: pageItems,
    page, pageCount, pageSize, hasNext, hasPrev,
    setPage, setPageSize,
  } = usePagination(filtered, { initialPageSize: 25 })

  // Memoized aggregates
  const { pendingReceived, pendingIssued, inBoxCurrencies } = useMemo(() => {
    let received = 0, issued = 0
    const currencies = new Set<string>()
    for (const c of checks) {
      if (c.status === 'pending') {
        if (c.type === 'received') {
          received += c.amount
          currencies.add(c.currency || 'ILS')
        } else if (c.type === 'issued') {
          issued += c.amount
        }
      }
    }
    return {
      pendingReceived: received,
      pendingIssued:   issued,
      inBoxCurrencies: Array.from(currencies),
    }
  }, [checks])

  const selectedIds = Array.from(selected)
  const allFilteredSelected = filtered.length > 0 && filtered.every(c => selected.has(c.id))

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allFilteredSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(c => c.id)))
    }
  }

  function handleBulkDeposit() {
    if (!depositBankId) return
    bulkUpdateCheckStatus(selectedIds, 'deposited', { bankAccountId: depositBankId })
    setSelected(new Set())
    setDepositModal(false)
    setDepositBankId('')
  }

  function handleBulkAction(status: CheckStatus) {
    bulkUpdateCheckStatus(selectedIds, status)
    setSelected(new Set())
  }

  function handleBulkPaidTo() {
    if (!paidToName.trim()) return
    bulkUpdateCheckStatus(selectedIds, 'paid_to', { paidToName })
    setSelected(new Set())
    setPaidToModal(false)
    setPaidToName('')
  }

  function openEdit(c: Check) {
    setEditCheck(c)
    setEditStatus(c.status)
    setEditBank(c.bankAccountId || '')
    setEditPaidTo(c.paidToName || '')
    setEditNotes(c.notes)
  }

  function saveEdit() {
    if (!editCheck) return
    updateCheck(editCheck.id, {
      status: editStatus,
      bankAccountId: editBank || undefined,
      paidToName: editPaidTo || undefined,
      notes: editNotes,
    })
    setEditCheck(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
          <p className="text-gray-500 text-sm">{t.subtitle.replace('{n}', String(checks.length))}</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-wide">{t.pendingReceived}</p>
          <p className="text-xl font-bold text-green-400 mt-1">{formatCurrency(pendingReceived)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-wide">{t.pendingIssued}</p>
          <p className="text-xl font-bold text-red-400 mt-1">{formatCurrency(pendingIssued)}</p>
        </div>
      </div>

      {/* Checks in Box per currency */}
      {inBoxCurrencies.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {inBoxCurrencies.map(cur => (
            <div key={cur} className="card py-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{t.checksInBox} • {cur}</p>
              <p className="text-lg font-bold text-yellow-400 mt-1">{formatCurrency(getChecksInBoxBalance(cur), cur)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Bulk actions toolbar */}
      {selected.size > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-sm text-yellow-300 font-medium">{t.selectedCount.replace('{n}', String(selected.size))}</span>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="text-xs px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600/40 transition-colors flex items-center gap-1"
              onClick={() => setDepositModal(true)}>
              <Landmark className="w-3.5 h-3.5" /> {t.depositBank}
            </button>
            <button className="text-xs px-3 py-1.5 rounded-lg bg-green-600/20 text-green-300 hover:bg-green-600/40 transition-colors flex items-center gap-1"
              onClick={() => handleBulkAction('cleared')}>
              <CheckCircle2 className="w-3.5 h-3.5" /> {t.cleared}
            </button>
            <button className="text-xs px-3 py-1.5 rounded-lg bg-orange-600/20 text-orange-300 hover:bg-orange-600/40 transition-colors flex items-center gap-1"
              onClick={() => handleBulkAction('returned')}>
              <RotateCcw className="w-3.5 h-3.5" /> {t.returned}
            </button>
            <button className="text-xs px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-300 hover:bg-purple-600/40 transition-colors flex items-center gap-1"
              onClick={() => setPaidToModal(true)}>
              <ArrowRightLeft className="w-3.5 h-3.5" /> {t.paidTo}
            </button>
          </div>
          <button className="ml-auto text-gray-500 hover:text-white" onClick={() => setSelected(new Set())}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input className="input pl-9" placeholder={t.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={typeFilter} onChange={e => setTypeFilter(e.target.value as CheckType | 'all')}>
          <option value="all">{t.allTypes}</option>
          <option value="received">{t.typeReceived}</option>
          <option value="issued">{t.typeIssued}</option>
        </select>
        <select className="input w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value as CheckStatus | 'all')}>
          <option value="all">{t.allStatuses}</option>
          {STATUSES.map(s => <option key={s} value={s}>{t[STATUS_KEY[s]]}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <FileCheck className="w-12 h-12 text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">{t.noChecks}</p>
          <p className="text-gray-600 text-sm mt-1">{t.checksAutoHint}</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="px-3 py-3 w-10">
                  <input type="checkbox" checked={allFilteredSelected} onChange={toggleAll}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-yellow-500 focus:ring-yellow-500" />
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colIdNumber}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colType}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">{t.colParties}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">{t.colDueDate}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colStatus}</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colAmount}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {pageItems.map(c => {
                const client   = clientById.get(c.clientId ?? '')
                const supplier = supplierById.get(c.supplierId ?? '')
                const project  = projectById.get(c.projectId ?? '')
                const bank     = bankById.get(c.bankAccountId ?? '')
                const overdue  = c.status === 'pending' && new Date(c.dueDate) < new Date()

                return (
                  <tr key={c.id} className={`border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors ${overdue ? 'bg-red-900/10' : ''}`}>
                    <td className="px-3 py-3">
                      <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-yellow-500 focus:ring-yellow-500" />
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-mono text-xs text-yellow-500">{c.id}</p>
                      <p className="text-white font-medium">#{c.checkNumber}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`badge ${c.type === 'received' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                        {t[TYPE_KEY[c.type]]}
                      </span>
                      {bank && <p className="text-xs text-gray-500 mt-0.5">{bank.name}</p>}
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <p className="text-gray-300">{c.issuerName}</p>
                      <p className="text-gray-500 text-xs">{c.payeeName}</p>
                      {client && <p className="text-xs text-blue-400">{client.name}</p>}
                      {supplier && <p className="text-xs text-purple-400">{supplier.name}</p>}
                      {project && <p className="text-xs text-gray-500">{project.name}</p>}
                      {c.paidToName && <p className="text-xs text-purple-400">{t.paidToLabel} {c.paidToName}</p>}
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <p className={overdue ? 'text-red-400' : 'text-gray-300'}>{formatDate(c.dueDate)}</p>
                      {overdue && <p className="text-xs text-red-500">{t.overdue}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`badge ${checkStatusColor(c.status)}`}>{t[STATUS_KEY[c.status]]}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`font-bold ${c.type === 'received' ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(c.amount, c.currency || 'ILS')}
                      </span>
                      {c.currency && c.currency !== 'ILS' && (
                        <p className="text-xs text-gray-500">{c.currency}</p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <button className="text-gray-500 hover:text-yellow-400" onClick={() => openEdit(c)} title={t.editTooltip}>
                        <FileCheck className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <PaginationControls
            page={page}
            pageCount={pageCount}
            pageSize={pageSize}
            total={filtered.length}
            hasNext={hasNext}
            hasPrev={hasPrev}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      {/* Deposit to Bank Modal */}
      {depositModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-sm shadow-2xl p-6 space-y-4">
            <h3 className="font-semibold text-white">{t.depositTitle}</h3>
            <p className="text-sm text-gray-400">{t.depositPrompt.replace('{n}', String(selected.size))}</p>
            <select className="input" value={depositBankId} onChange={e => setDepositBankId(e.target.value)}>
              <option value="">{t.chooseBank}</option>
              {banks
                .filter(b => (b.accountType ?? 'current') === 'current')
                .map(b => <option key={b.id} value={b.id}>{b.name} ({b.bankName})</option>)}
            </select>
            <div className="flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => { setDepositModal(false); setDepositBankId('') }}>{t.cancel}</button>
              <button className="btn-primary" onClick={handleBulkDeposit}>{t.deposit}</button>
            </div>
          </div>
        </div>
      )}

      {/* Paid To Modal */}
      {paidToModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-sm shadow-2xl p-6 space-y-4">
            <h3 className="font-semibold text-white">{t.paidToTitle}</h3>
            <p className="text-sm text-gray-400">{t.paidToPrompt.replace('{n}', String(selected.size))}</p>
            <input className="input" value={paidToName} onChange={e => setPaidToName(e.target.value)} placeholder={t.payeePlaceholder} />
            <div className="flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => { setPaidToModal(false); setPaidToName('') }}>{t.cancel}</button>
              <button className="btn-primary" onClick={handleBulkPaidTo}>{t.confirm}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit single check modal (status only) */}
      {editCheck && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <h3 className="font-semibold text-white">{t.updateTitle.replace('{num}', editCheck.checkNumber)}</h3>
              <button onClick={() => setEditCheck(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">{t.status}</label>
                <select className="input" value={editStatus} onChange={e => setEditStatus(e.target.value as CheckStatus)}>
                  {STATUSES.map(s => <option key={s} value={s}>{t[STATUS_KEY[s]]}</option>)}
                </select>
              </div>
              {(editStatus === 'deposited' || editStatus === 'cleared') && (
                <div>
                  <label className="label">{t.bankAccount}</label>
                  <select className="input" value={editBank} onChange={e => setEditBank(e.target.value)}>
                    <option value="">{t.noneDash}</option>
                    {banks
                      .filter(b => (b.accountType ?? 'current') === 'current')
                      .map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              )}
              {editStatus === 'paid_to' && (
                <div>
                  <label className="label">{t.payeeName}</label>
                  <input className="input" value={editPaidTo} onChange={e => setEditPaidTo(e.target.value)} placeholder={t.namePlaceholder} />
                </div>
              )}
              <div>
                <label className="label">{t.notes}</label>
                <textarea className="input resize-none" rows={2} value={editNotes} onChange={e => setEditNotes(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-700">
              <button className="btn-secondary" onClick={() => setEditCheck(null)}>{t.cancel}</button>
              <button className="btn-primary" onClick={saveEdit}>{t.save}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
