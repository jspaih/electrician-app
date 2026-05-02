import { useState } from 'react'
import { useStore } from '../store/useStore'
import { formatCurrency, formatDate, today } from '../utils/helpers'
import { Plus, Pencil, Trash2, X, ArrowLeftRight } from 'lucide-react'
import type { BankTransfer } from '../types'
import { useT } from '../hooks/useT'

const L = {
  en: {
    modalTitle: 'Bank Transfer',
    fromAccount: 'From Account *',
    toAccount: 'To Account *',
    choose: '— Choose —',
    amount: 'Amount *',
    fee: 'Transfer Fee',
    date: 'Date',
    notes: 'Notes',
    deduct: 'Deduct:',
    fromSource: 'from source',
    addTo: 'Add:',
    toDestination: 'to destination',
    cancel: 'Cancel',
    record: 'Record Transfer',
    title: 'Bank Transfers',
    countSuffix: '{n} transfer(s)',
    newTransfer: 'New Transfer',
    needTwoTip: 'Add at least two bank accounts first',
    needTwoMsg: 'You need at least two bank accounts to record transfers. Go to ',
    banks: 'Banks',
    toAdd: ' to add them.',
    empty: 'No transfers recorded',
    colId: 'ID',
    colRoute: 'From → To',
    colDate: 'Date',
    colAmount: 'Amount',
    colFee: 'Fee',
    confirmDelete: 'Delete this transfer?',
  },
  ar: {
    modalTitle: 'تحويل بنكي',
    fromAccount: 'من حساب *',
    toAccount: 'إلى حساب *',
    choose: '— اختر —',
    amount: 'المبلغ *',
    fee: 'رسوم التحويل',
    date: 'التاريخ',
    notes: 'ملاحظات',
    deduct: 'خصم:',
    fromSource: 'من المصدر',
    addTo: 'إضافة:',
    toDestination: 'إلى الوجهة',
    cancel: 'إلغاء',
    record: 'تسجيل التحويل',
    title: 'التحويلات البنكية',
    countSuffix: '{n} تحويل',
    newTransfer: 'تحويل جديد',
    needTwoTip: 'أضف حسابين بنكيين على الأقل أولاً',
    needTwoMsg: 'تحتاج إلى حسابين بنكيين على الأقل لتسجيل التحويلات. اذهب إلى ',
    banks: 'البنوك',
    toAdd: ' لإضافتها.',
    empty: 'لا توجد تحويلات مسجلة',
    colId: 'المعرّف',
    colRoute: 'من ← إلى',
    colDate: 'التاريخ',
    colAmount: 'المبلغ',
    colFee: 'الرسوم',
    confirmDelete: 'حذف هذا التحويل؟',
  },
} as const

const EMPTY: Omit<BankTransfer, 'id' | 'createdAt'> = {
  fromAccountId: '', toAccountId: '', amount: 0, fee: 0, date: today(), notes: '',
}

function Modal({
  initial, onSave, onClose,
}: {
  initial: Omit<BankTransfer, 'id' | 'createdAt'>
  onSave: (d: Omit<BankTransfer, 'id' | 'createdAt'>) => void
  onClose: () => void
}) {
  const t = useT(L)
  const { banks } = useStore()
  const [form, setForm] = useState(initial)
  const set = (k: keyof typeof form, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  const canSave = form.fromAccountId && form.toAccountId &&
    form.fromAccountId !== form.toAccountId && form.amount > 0

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="font-semibold text-white">{t.modalTitle}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">{t.fromAccount}</label>
            <select className="input" value={form.fromAccountId} onChange={e => set('fromAccountId', e.target.value)}>
              <option value="">{t.choose}</option>
              {banks
                .filter(b => (b.accountType ?? 'current') === 'current' || b.accountType === 'cash')
                .map(b => <option key={b.id} value={b.id}>{b.name}{b.bankName ? ` (${b.bankName})` : ''}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-center">
            <ArrowLeftRight className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <label className="label">{t.toAccount}</label>
            <select className="input" value={form.toAccountId} onChange={e => set('toAccountId', e.target.value)}>
              <option value="">{t.choose}</option>
              {banks
                .filter(b => ((b.accountType ?? 'current') === 'current' || b.accountType === 'cash') && b.id !== form.fromAccountId)
                .map(b => (
                  <option key={b.id} value={b.id}>{b.name}{b.bankName ? ` (${b.bankName})` : ''}</option>
                ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t.amount}</label>
              <input className="input" type="number" min={0} step="0.01" value={form.amount} onChange={e => set('amount', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="label">{t.fee}</label>
              <input className="input" type="number" min={0} step="0.01" value={form.fee} onChange={e => set('fee', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          <div>
            <label className="label">{t.date}</label>
            <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
          <div>
            <label className="label">{t.notes}</label>
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
          {canSave && (
            <div className="bg-gray-900/50 rounded-lg px-4 py-3 text-sm text-gray-400">
              {t.deduct} <span className="text-red-400 font-medium">{formatCurrency(form.amount + form.fee)}</span> {t.fromSource}
              {' · '}
              {t.addTo} <span className="text-green-400 font-medium">{formatCurrency(form.amount)}</span> {t.toDestination}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-700">
          <button className="btn-secondary" onClick={onClose}>{t.cancel}</button>
          <button className="btn-primary" disabled={!canSave} onClick={() => canSave && onSave(form)}>
            {t.record}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Transfers() {
  const t = useT(L)
  const { transfers, banks, addTransfer, updateTransfer, deleteTransfer, getBankBalance } = useStore()
  const [modal, setModal] = useState<{ open: boolean; transfer?: BankTransfer }>({ open: false })

  const sorted = [...transfers].sort((a, b) => b.date.localeCompare(a.date))

  function handleSave(data: Omit<BankTransfer, 'id' | 'createdAt'>) {
    if (modal.transfer) updateTransfer(modal.transfer.id, data)
    else addTransfer(data)
    setModal({ open: false })
  }

  function bankName(id: string) {
    return banks.find(b => b.id === id)?.name ?? id
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
          <p className="text-gray-500 text-sm">{t.countSuffix.replace('{n}', String(transfers.length))}</p>
        </div>
        <button
          className={`btn-primary flex items-center gap-2 ${banks.length < 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => { if (banks.length >= 2) setModal({ open: true }) }}
          title={banks.length < 2 ? t.needTwoTip : ''}
        >
          <Plus className="w-4 h-4" /> {t.newTransfer}
        </button>
      </div>

      {banks.length < 2 && (
        <div className="bg-yellow-900/20 border border-yellow-800/40 rounded-lg px-4 py-3 text-sm text-yellow-300">
          {t.needTwoMsg}<strong>{t.banks}</strong>{t.toAdd}
        </div>
      )}

      {/* Bank balance summary */}
      {banks.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {banks.map(b => {
            const bal = getBankBalance(b.id)
            return (
              <div key={b.id} className="card py-3">
                <p className="text-xs text-gray-500 truncate">{b.name}</p>
                <p className={`text-lg font-bold ${bal >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(bal)}</p>
              </div>
            )
          })}
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <ArrowLeftRight className="w-12 h-12 text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">{t.empty}</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colId}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colRoute}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">{t.colDate}</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colAmount}</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">{t.colFee}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {sorted.map(tr => (
                <tr key={tr.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-yellow-500">{tr.id}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-red-400">{bankName(tr.fromAccountId)}</span>
                      <ArrowLeftRight className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-green-400">{bankName(tr.toAccountId)}</span>
                    </div>
                    {tr.notes && <p className="text-xs text-gray-500 mt-0.5">{tr.notes}</p>}
                  </td>
                  <td className="px-5 py-3 text-gray-400 hidden md:table-cell">{formatDate(tr.date)}</td>
                  <td className="px-5 py-3 text-right font-semibold text-white">{formatCurrency(tr.amount)}</td>
                  <td className="px-5 py-3 text-right text-gray-500 hidden md:table-cell">
                    {tr.fee > 0 ? formatCurrency(tr.fee) : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button className="text-gray-500 hover:text-yellow-400" onClick={() => setModal({ open: true, transfer: tr })}>
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button className="text-gray-500 hover:text-red-400" onClick={() => { if (confirm(t.confirmDelete)) deleteTransfer(tr.id) }}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal.open && (
        <Modal
          initial={modal.transfer ? {
            fromAccountId: modal.transfer.fromAccountId, toAccountId: modal.transfer.toAccountId,
            amount: modal.transfer.amount, fee: modal.transfer.fee,
            date: modal.transfer.date, notes: modal.transfer.notes,
          } : EMPTY}
          onSave={handleSave}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  )
}
