import { useState } from 'react'
import { useStore } from '../store/useStore'
import { formatCurrency, formatDate } from '../utils/helpers'
import {
  Plus, Pencil, Trash2, X, Landmark, TrendingUp, TrendingDown,
  Banknote, Archive, Clock, RotateCcw, Info, Send,
} from 'lucide-react'
import type { BankAccount, BankAccountType } from '../types'
import { useT } from '../hooks/useT'

const L = {
  en: {
    title: 'Banks & Accounts',
    totalBalance: 'Total (Cash + Current):',
    newAccount: 'New Account',
    empty: 'No accounts yet',
    emptyHint: 'Add your accounts to track balances automatically',
    cannotDelete: 'Cannot delete — linked to {n} transaction(s).',
    confirmDelete: 'Delete this account?',

    // Form
    editTitle: 'Edit Account',
    newTitle: 'New Account',
    accountType: 'Account Type *',
    typeCurrent: 'Current Bank Account',
    typeCash: 'Cash Account',
    typeChecksBox: 'Checks Box',
    typeReturned: 'Returned Checks Account',
    typePostdated: 'Postdated Checks (auto)',
    typeCurrentHint: 'Postdated Checks and Issued Checks sub-accounts will be created automatically.',
    shortName: 'Account Name (English) *',
    shortNamePh: 'Main Business Account',
    nameAr: 'Account Name (Arabic)',
    nameArPh: 'اسم الحساب بالعربية',
    bankName: 'Bank Name',
    bankNamePh: 'Arab Bank, Cairo Amman…',
    currency: 'Currency',
    accountNumber: 'Account Number',
    accountNumberPh: 'XXXX XXXX XXXX',
    iban: 'IBAN (optional)',
    ibanPh: 'PS92XXXX…',
    initialBalance: 'Initial Balance',
    notes: 'Notes',
    cancel: 'Cancel',
    save: 'Save Changes',
    add: 'Add Account',

    // Card labels
    initialBalanceLabel: 'Initial balance:',
    totalIn: 'Total In',
    totalOut: 'Total Out',
    recentTxns: 'Recent Transactions',
    transferTo: 'Transfer to {n}',
    transferFrom: 'Transfer from {n}',
    linkedTo: 'Linked to:',
    postdatedChecks: 'Postdated Checks',
    depositedChecks: 'deposited check(s) pending clearance',
    checksInBox: 'checks in box',
    returnedChecks: 'returned check(s)',
    projectedBalance: 'Projected Balance',
    projectedHint: '(after all pending items clear)',
    noPostdated: 'No deposited checks pending',
    returnedFrom: 'Returned from:',
    noReturned: 'No returned or bounced checks',
    autoCreated: 'Auto-managed — tracks checks deposited to',
    issuedChecksLabel: 'Issued Checks (Pending)',
    noIssuedChecks: 'No pending issued checks',
    issuedChecksHint: 'Auto-managed — tracks checks issued from',

    // Sections
    sectionCash: 'Cash Accounts',
    sectionCurrent: 'Bank Accounts (Current)',
    sectionChecksBox: 'Checks Box Accounts',
    sectionReturned: 'Returned Checks Accounts',
    sectionPostdated: 'Postdated Checks',

    // Statuses
    stPending: 'In Box',
    stDeposited: 'Deposited',
    stCleared: 'Cleared',
    stReturned: 'Returned',
    stBounced: 'Bounced',
  },
  ar: {
    title: 'البنوك والحسابات',
    totalBalance: 'الإجمالي (النقد + الجاري):',
    newAccount: 'حساب جديد',
    empty: 'لا توجد حسابات بعد',
    emptyHint: 'أضف حساباتك لتتبع الأرصدة تلقائياً',
    cannotDelete: 'لا يمكن الحذف — مرتبط بـ {n} معاملة.',
    confirmDelete: 'حذف هذا الحساب؟',

    // Form
    editTitle: 'تعديل الحساب',
    newTitle: 'حساب جديد',
    accountType: 'نوع الحساب *',
    typeCurrent: 'حساب جاري بنكي',
    typeCash: 'حساب نقدي',
    typeChecksBox: 'حساب صندوق الشيكات',
    typeReturned: 'حساب الشيكات المرتجعة',
    typePostdated: 'شيكات مؤجلة (تلقائي)',
    typeCurrentHint: 'سيتم إنشاء حسابات فرعية للشيكات المؤجلة والشيكات الصادرة تلقائياً.',
    shortName: 'اسم الحساب (إنجليزي) *',
    shortNamePh: 'Main Business Account',
    nameAr: 'اسم الحساب (عربي)',
    nameArPh: 'الحساب التجاري الرئيسي',
    bankName: 'اسم البنك',
    bankNamePh: 'البنك العربي، القاهرة عمان...',
    currency: 'العملة',
    accountNumber: 'رقم الحساب',
    accountNumberPh: 'XXXX XXXX XXXX',
    iban: 'IBAN (اختياري)',
    ibanPh: 'PS92XXXX...',
    initialBalance: 'الرصيد الابتدائي',
    notes: 'ملاحظات',
    cancel: 'إلغاء',
    save: 'حفظ التغييرات',
    add: 'إضافة حساب',

    // Card labels
    initialBalanceLabel: 'الرصيد الابتدائي:',
    totalIn: 'إجمالي الوارد',
    totalOut: 'إجمالي الصادر',
    recentTxns: 'آخر المعاملات',
    transferTo: 'تحويل إلى {n}',
    transferFrom: 'تحويل من {n}',
    linkedTo: 'مرتبط بـ:',
    postdatedChecks: 'شيكات مؤجلة',
    depositedChecks: 'شيك مودَع بانتظار التسوية',
    checksInBox: 'شيك في الصندوق',
    returnedChecks: 'شيك مرتجع',
    projectedBalance: 'الرصيد المتوقع',
    projectedHint: '(بعد تسوية جميع البنود المعلقة)',
    noPostdated: 'لا توجد شيكات مودَعة بانتظار التسوية',
    returnedFrom: 'مرتجع من:',
    noReturned: 'لا توجد شيكات مرتجعة أو مرفوضة',
    autoCreated: 'مُدار تلقائياً — يتتبع الشيكات المودَعة إلى',
    issuedChecksLabel: 'الشيكات الصادرة (معلقة)',
    noIssuedChecks: 'لا توجد شيكات صادرة معلقة',
    issuedChecksHint: 'مُدار تلقائياً — يتتبع الشيكات الصادرة من',

    // Sections
    sectionCash: 'الحسابات النقدية',
    sectionCurrent: 'الحسابات الجارية البنكية',
    sectionChecksBox: 'حسابات صندوق الشيكات',
    sectionReturned: 'حسابات الشيكات المرتجعة',
    sectionPostdated: 'الشيكات المؤجلة',

    // Statuses
    stPending: 'في الصندوق',
    stDeposited: 'مودَع',
    stCleared: 'تمت التسوية',
    stReturned: 'مُعاد',
    stBounced: 'مرتجع',
  },
} as const

const CURRENCIES = ['ILS', 'USD', 'EUR', 'JOD']

type FormData = Omit<BankAccount, 'id' | 'createdAt'>

const EMPTY: FormData = {
  name: '', nameAr: '', bankName: '', accountNumber: '', iban: '',
  initialBalance: 0, currency: 'ILS', notes: '',
  accountType: 'current',
}

function typeIcon(t: BankAccountType) {
  const map: Record<BankAccountType, JSX.Element> = {
    current:          <Landmark className="w-4 h-4" />,
    cash:             <Banknote className="w-4 h-4" />,
    checks_box:       <Archive className="w-4 h-4" />,
    postdated:        <Clock className="w-4 h-4" />,
    returned_checks:  <RotateCcw className="w-4 h-4" />,
    issued_checks:    <Send className="w-4 h-4" />,
  }
  return map[t] ?? <Landmark className="w-4 h-4" />
}

function typeBadgeColor(t: BankAccountType) {
  const map: Record<BankAccountType, string> = {
    current:         'bg-blue-900/40 text-blue-300 border-blue-700/40',
    cash:            'bg-green-900/40 text-green-300 border-green-700/40',
    checks_box:      'bg-yellow-900/40 text-yellow-300 border-yellow-700/40',
    postdated:       'bg-purple-900/40 text-purple-300 border-purple-700/40',
    returned_checks: 'bg-red-900/40 text-red-300 border-red-700/40',
    issued_checks:   'bg-orange-900/40 text-orange-300 border-orange-700/40',
  }
  return map[t] ?? 'bg-gray-700 text-gray-300'
}

// ─── Create / Edit Modal ──────────────────────────────────────────────────────
function Modal({
  initial, isEdit, onSave, onClose,
}: {
  initial: FormData
  isEdit: boolean
  onSave: (d: FormData) => void
  onClose: () => void
}) {
  const t = useT(L)
  const [form, setForm] = useState<FormData>(initial)
  const set = (k: keyof FormData, v: string | number) => setForm(f => ({ ...f, [k]: v }))
  const type = form.accountType

  const showBankFields   = type === 'current'
  const showInitBal      = type === 'current' || type === 'cash'
  const showCurrency     = type !== 'returned_checks'

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="font-semibold text-white">{isEdit ? t.editTitle : t.newTitle}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Account type — only shown when creating */}
          {!isEdit && (
            <div>
              <label className="label">{t.accountType}</label>
              <select className="input" value={type}
                onChange={e => set('accountType', e.target.value as BankAccountType)}>
                <option value="current">{t.typeCurrent}</option>
                <option value="cash">{t.typeCash}</option>
                <option value="checks_box">{t.typeChecksBox}</option>
                <option value="returned_checks">{t.typeReturned}</option>
              </select>
              {type === 'current' && (
                <p className="flex items-start gap-1.5 text-xs text-blue-400 mt-1.5">
                  <Info className="w-3 h-3 shrink-0 mt-0.5" />
                  {t.typeCurrentHint}
                </p>
              )}
            </div>
          )}

          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t.shortName}</label>
              <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder={t.shortNamePh} />
            </div>
            <div>
              <label className="label">{t.nameAr}</label>
              <input className="input" dir="rtl" value={form.nameAr ?? ''} onChange={e => set('nameAr', e.target.value)} placeholder={t.nameArPh} />
            </div>
          </div>

          {/* Bank-specific fields (current only) */}
          {showBankFields && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">{t.bankName}</label>
                <input className="input" value={form.bankName} onChange={e => set('bankName', e.target.value)} placeholder={t.bankNamePh} />
              </div>
              <div>
                <label className="label">{t.accountNumber}</label>
                <input className="input" value={form.accountNumber} onChange={e => set('accountNumber', e.target.value)} placeholder={t.accountNumberPh} />
              </div>
              <div>
                <label className="label">{t.iban}</label>
                <input className="input" value={form.iban ?? ''} onChange={e => set('iban', e.target.value)} placeholder={t.ibanPh} />
              </div>
            </div>
          )}

          {/* Currency */}
          {showCurrency && (
            <div>
              <label className="label">{t.currency}</label>
              <select className="input" value={form.currency} onChange={e => set('currency', e.target.value)}>
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          )}

          {/* Initial balance */}
          {showInitBal && (
            <div>
              <label className="label">{t.initialBalance}</label>
              <input className="input" type="number" step="0.01" value={form.initialBalance}
                onChange={e => set('initialBalance', parseFloat(e.target.value) || 0)} />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="label">{t.notes}</label>
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-700">
          <button className="btn-secondary" onClick={onClose}>{t.cancel}</button>
          <button className="btn-primary" onClick={() => { if (form.name.trim()) onSave(form) }}>
            {isEdit ? t.save : t.add}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Banks() {
  const t = useT(L)
  const { banks, payments, transfers, checks, addBank, updateBank, deleteBank, getBankBalance } = useStore()
  const [modal, setModal] = useState<{ open: boolean; bank?: BankAccount }>({ open: false })

  function handleSave(data: FormData) {
    if (modal.bank) updateBank(modal.bank.id, data)
    else addBank(data)
    setModal({ open: false })
  }

  function handleDelete(bank: BankAccount) {
    const id = bank.id
    const type = bank.accountType ?? 'current'

    // Count linked transactions
    let linked = payments.filter(p => p.bankAccountId === id).length
               + transfers.filter(tr => tr.fromAccountId === id || tr.toAccountId === id).length
               + checks.filter(c => c.bankAccountId === id).length

    // Also count transactions linked to postdated child (for current banks)
    if (type === 'current') {
      const postdated = banks.find(b => b.linkedBankId === id && b.accountType === 'postdated')
      if (postdated) {
        linked += checks.filter(c => c.bankAccountId === postdated.id).length
      }
    }

    if (linked > 0) {
      alert(t.cannotDelete.replace('{n}', String(linked)))
      return
    }
    if (confirm(t.confirmDelete)) deleteBank(id)
  }

  // Total across cash + current only (meaningful monetary accounts)
  const totalBalance = banks
    .filter(b => (b.accountType ?? 'current') === 'current' || b.accountType === 'cash')
    .reduce((s, b) => s + getBankBalance(b.id), 0)

  // Group banks by type (excluding auto-created postdated — shown under their parent)
  const cashBanks      = banks.filter(b => b.accountType === 'cash')
  const currentBanks   = banks.filter(b => (b.accountType ?? 'current') === 'current')
  const checksBoxes    = banks.filter(b => b.accountType === 'checks_box')
  const returnedAccts  = banks.filter(b => b.accountType === 'returned_checks')
  // Postdated accounts are indexed by linkedBankId for quick lookup
  const postdatedMap   = Object.fromEntries(
    banks.filter(b => b.accountType === 'postdated').map(b => [b.linkedBankId, b])
  )
  // Issued checks accounts are indexed by linkedBankId for quick lookup
  const issuedChecksMap = Object.fromEntries(
    banks.filter(b => b.accountType === 'issued_checks').map(b => [b.linkedBankId, b])
  )

  const hasAny = banks.filter(b => b.accountType !== 'postdated' && b.accountType !== 'issued_checks').length > 0

  // ─── Helpers ────────────────────────────────────────────────────────────────
  function recentTxns(bank: BankAccount) {
    const id = bank.id
    return [
      ...payments.filter(p => p.bankAccountId === id).map(p => ({
        id: p.id, date: p.date, label: p.description,
        amount: p.direction === 'in' ? p.amount : -p.amount,
      })),
      ...transfers.filter(tr => tr.fromAccountId === id || tr.toAccountId === id).map(tr => ({
        id: tr.id, date: tr.date,
        label: tr.fromAccountId === id
          ? t.transferTo.replace('{n}', banks.find(b => b.id === tr.toAccountId)?.name ?? tr.toAccountId)
          : t.transferFrom.replace('{n}', banks.find(b => b.id === tr.fromAccountId)?.name ?? tr.fromAccountId),
        amount: tr.toAccountId === id ? tr.amount : -(tr.amount + tr.fee),
      })),
    ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
  }

  function totalInOut(bank: BankAccount) {
    const id = bank.id
    const type = bank.accountType ?? 'current'
    if (type === 'cash') {
      const ps = payments.filter(p => p.bankAccountId === id)
      return {
        in:  ps.filter(p => p.direction === 'in').reduce((s, p) => s + p.amount, 0),
        out: ps.filter(p => p.direction === 'out').reduce((s, p) => s + p.amount, 0),
      }
    }
    // current
    const ps = payments.filter(p => p.bankAccountId === id && p.type !== 'cash')
    const totalIn  = ps.filter(p => p.direction === 'in').reduce((s, p) => s + p.amount, 0)
                   + transfers.filter(tr => tr.toAccountId === id).reduce((s, tr) => s + tr.amount, 0)
                   + checks.filter(c => c.bankAccountId === id && c.type === 'received' && c.status === 'cleared').reduce((s, c) => s + c.amount, 0)
    const totalOut = ps.filter(p => p.direction === 'out').reduce((s, p) => s + p.amount, 0)
                   + transfers.filter(tr => tr.fromAccountId === id).reduce((s, tr) => s + tr.amount + tr.fee, 0)
                   + checks.filter(c => c.bankAccountId === id && c.type === 'issued' && c.status === 'cleared').reduce((s, c) => s + c.amount, 0)
    return { in: totalIn, out: totalOut }
  }

  // ─── Card renderers ──────────────────────────────────────────────────────────
  function CardBase({ bank, children }: { bank: BankAccount; children?: React.ReactNode }) {
    const type = bank.accountType ?? 'current'
    const balance = getBankBalance(bank.id)
    const flows = (type === 'current' || type === 'cash') ? totalInOut(bank) : null
    const txns  = (type === 'current' || type === 'cash') ? recentTxns(bank) : []

    return (
      <div className="card">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg border ${typeBadgeColor(type)}`}>
              {typeIcon(type)}
            </div>
            <div>
              <span className="font-mono text-xs text-yellow-500">{bank.id}</span>
              <h3 className="font-semibold text-white text-lg leading-tight">{bank.name}</h3>
              {bank.bankName && <p className="text-sm text-gray-400">{bank.bankName}</p>}
              {bank.accountNumber && <p className="text-xs text-gray-600 font-mono">{bank.accountNumber}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="text-gray-500 hover:text-yellow-400" onClick={() => setModal({ open: true, bank })}>
              <Pencil className="w-4 h-4" />
            </button>
            <button className="text-gray-500 hover:text-red-400" onClick={() => handleDelete(bank)}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Balance */}
        <div className={`text-3xl font-bold mt-4 ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {formatCurrency(balance, bank.currency || 'ILS')}
        </div>
        {(type === 'current' || type === 'cash') && (
          <p className="text-xs text-gray-500 mt-0.5">
            {bank.currency} • {t.initialBalanceLabel} {formatCurrency(bank.initialBalance)}
          </p>
        )}

        {/* Flow row */}
        {flows && (
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-xs text-gray-500">{t.totalIn}</p>
                <p className="text-sm font-semibold text-green-400">{formatCurrency(flows.in, bank.currency)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <div>
                <p className="text-xs text-gray-500">{t.totalOut}</p>
                <p className="text-sm font-semibold text-red-400">{formatCurrency(flows.out, bank.currency)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent transactions */}
        {txns.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">{t.recentTxns}</p>
            <div className="space-y-1.5">
              {txns.map(tx => (
                <div key={tx.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-gray-300 truncate max-w-[180px]">{tx.label}</p>
                    <p className="text-xs text-gray-600">{formatDate(tx.date)}</p>
                  </div>
                  <span className={`font-medium ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount, bank.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {children}
      </div>
    )
  }

  function CurrentBankCard({ bank }: { bank: BankAccount }) {
    const postdated = postdatedMap[bank.id]
    const postBal   = postdated ? getBankBalance(postdated.id) : 0
    const depositedChecks = checks.filter(
      c => c.bankAccountId === bank.id && c.type === 'received' && c.status === 'deposited'
    )

    const issuedAcct = issuedChecksMap[bank.id]
    const issuedBal  = issuedAcct ? getBankBalance(issuedAcct.id) : 0
    const pendingIssuedChecks = checks.filter(
      c => c.bankAccountId === bank.id && c.type === 'issued' && c.status === 'pending'
    )

    const actualBalance = getBankBalance(bank.id)
    // Projected = actual + deposited received (will clear in) - pending issued (will clear out)
    const projectedBalance = actualBalance + postBal - issuedBal

    return (
      <CardBase bank={bank}>
        {/* Projected balance row */}
        {(postBal > 0 || issuedBal > 0) && (
          <div className="mt-3 pt-3 border-t border-gray-700/60 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">{t.projectedBalance}</p>
              <p className="text-[10px] text-gray-600">{t.projectedHint}</p>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${projectedBalance >= 0 ? 'text-blue-300' : 'text-red-400'}`}>
                {formatCurrency(projectedBalance, bank.currency)}
              </p>
              <div className="flex items-center gap-3 justify-end mt-0.5">
                {postBal > 0 && (
                  <span className="text-[10px] text-purple-400">+{formatCurrency(postBal, bank.currency)} postdated</span>
                )}
                {issuedBal > 0 && (
                  <span className="text-[10px] text-orange-400">-{formatCurrency(issuedBal, bank.currency)} issued</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Postdated sub-panel */}
        {postdated && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="bg-purple-900/20 border border-purple-700/30 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-xs font-semibold text-purple-300">{t.postdatedChecks}</span>
                  <span className="font-mono text-xs text-gray-600">{postdated.id}</span>
                </div>
                <span className={`text-sm font-bold ${postBal > 0 ? 'text-purple-300' : 'text-gray-500'}`}>
                  {formatCurrency(postBal, bank.currency)}
                </span>
              </div>
              {depositedChecks.length > 0 ? (
                <div className="mt-2 space-y-1">
                  {depositedChecks.slice(0, 4).map(c => (
                    <div key={c.id} className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">#{c.checkNumber} — {c.issuerName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">{formatDate(c.dueDate)}</span>
                        <span className="text-purple-300 font-medium">{formatCurrency(c.amount, c.currency)}</span>
                      </div>
                    </div>
                  ))}
                  {depositedChecks.length > 4 && (
                    <p className="text-xs text-gray-600">+{depositedChecks.length - 4} more</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-600 mt-1">{t.noPostdated}</p>
              )}
              <p className="text-xs text-gray-600 mt-2 italic">{t.autoCreated} {bank.name}</p>
            </div>
          </div>
        )}

        {/* Issued checks sub-panel */}
        {issuedAcct && (
          <div className="mt-3">
            <div className="bg-orange-900/20 border border-orange-700/30 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Send className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-xs font-semibold text-orange-300">{t.issuedChecksLabel}</span>
                  <span className="font-mono text-xs text-gray-600">{issuedAcct.id}</span>
                </div>
                <span className={`text-sm font-bold ${issuedBal > 0 ? 'text-orange-300' : 'text-gray-500'}`}>
                  {formatCurrency(issuedBal, bank.currency)}
                </span>
              </div>
              {pendingIssuedChecks.length > 0 ? (
                <div className="mt-2 space-y-1">
                  {pendingIssuedChecks.slice(0, 4).map(c => {
                    const overdue = new Date(c.dueDate) < new Date()
                    return (
                      <div key={c.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">#{c.checkNumber} — {c.payeeName}</span>
                        <div className="flex items-center gap-2">
                          <span className={`${overdue ? 'text-red-400' : 'text-gray-500'}`}>
                            {formatDate(c.dueDate)}{overdue ? ' ⚠' : ''}
                          </span>
                          <span className="text-orange-300 font-medium">{formatCurrency(c.amount, c.currency)}</span>
                        </div>
                      </div>
                    )
                  })}
                  {pendingIssuedChecks.length > 4 && (
                    <p className="text-xs text-gray-600">+{pendingIssuedChecks.length - 4} more</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-600 mt-1">{t.noIssuedChecks}</p>
              )}
              <p className="text-xs text-gray-600 mt-2 italic">{t.issuedChecksHint} {bank.name}</p>
            </div>
          </div>
        )}
      </CardBase>
    )
  }

  function ChecksBoxCard({ bank }: { bank: BankAccount }) {
    const pendingChecks = checks.filter(c => c.type === 'received' && c.status === 'pending')
    const balance = getBankBalance(bank.id)

    return (
      <div className="card">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg border ${typeBadgeColor('checks_box')}`}>
              <Archive className="w-4 h-4" />
            </div>
            <div>
              <span className="font-mono text-xs text-yellow-500">{bank.id}</span>
              <h3 className="font-semibold text-white text-lg leading-tight">{bank.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{pendingChecks.length} {t.checksInBox}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="text-gray-500 hover:text-yellow-400" onClick={() => setModal({ open: true, bank })}>
              <Pencil className="w-4 h-4" />
            </button>
            <button className="text-gray-500 hover:text-red-400" onClick={() => handleDelete(bank)}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className={`text-3xl font-bold mt-4 ${balance > 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
          {formatCurrency(balance, bank.currency || 'ILS')}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{bank.currency}</p>

        {pendingChecks.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700 space-y-1.5">
            {pendingChecks.slice(0, 5).map(c => {
              const overdue = new Date(c.dueDate) < new Date()
              return (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-gray-300">#{c.checkNumber} — {c.issuerName}</p>
                    <p className={`text-xs ${overdue ? 'text-red-400' : 'text-gray-500'}`}>
                      Due {formatDate(c.dueDate)}{overdue ? ' ⚠' : ''}
                    </p>
                  </div>
                  <span className="text-yellow-400 font-medium">{formatCurrency(c.amount, c.currency)}</span>
                </div>
              )
            })}
            {pendingChecks.length > 5 && (
              <p className="text-xs text-gray-600">+{pendingChecks.length - 5} more</p>
            )}
          </div>
        )}
      </div>
    )
  }

  function ReturnedChecksCard({ bank }: { bank: BankAccount }) {
    const returnedChecks = checks.filter(
      c => c.type === 'received' && (c.status === 'bounced' || c.status === 'returned')
    )
    const balance = getBankBalance(bank.id)

    return (
      <div className="card">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg border ${typeBadgeColor('returned_checks')}`}>
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <span className="font-mono text-xs text-yellow-500">{bank.id}</span>
              <h3 className="font-semibold text-white text-lg leading-tight">{bank.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{returnedChecks.length} {t.returnedChecks}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="text-gray-500 hover:text-yellow-400" onClick={() => setModal({ open: true, bank })}>
              <Pencil className="w-4 h-4" />
            </button>
            <button className="text-gray-500 hover:text-red-400" onClick={() => handleDelete(bank)}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className={`text-3xl font-bold mt-4 ${balance > 0 ? 'text-red-400' : 'text-gray-500'}`}>
          {formatCurrency(balance)}
        </div>
        <p className="text-xs text-gray-500 mt-0.5 italic">{t.stReturned} + {t.stBounced}</p>

        {returnedChecks.length > 0 ? (
          <div className="mt-4 pt-4 border-t border-gray-700 space-y-2">
            {returnedChecks.slice(0, 6).map(c => {
              const retBank = banks.find(b => b.id === c.bankAccountId)
              return (
                <div key={c.id} className="flex items-start justify-between text-sm gap-2">
                  <div className="min-w-0">
                    <p className="text-gray-300">#{c.checkNumber} — {c.issuerName}</p>
                    {retBank && (
                      <p className="text-xs text-red-400">
                        {t.returnedFrom} {retBank.bankName || retBank.name}
                      </p>
                    )}
                    <p className="text-xs text-gray-600">{formatDate(c.dueDate)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-red-400 font-medium">{formatCurrency(c.amount, c.currency)}</span>
                    <p className={`text-xs mt-0.5 ${c.status === 'bounced' ? 'text-orange-400' : 'text-red-400'}`}>
                      {c.status === 'bounced' ? t.stBounced : t.stReturned}
                    </p>
                  </div>
                </div>
              )
            })}
            {returnedChecks.length > 6 && (
              <p className="text-xs text-gray-600">+{returnedChecks.length - 6} more</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-600 mt-4 pt-4 border-t border-gray-700">{t.noReturned}</p>
        )}
      </div>
    )
  }

  // ─── Section helper ──────────────────────────────────────────────────────────
  function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">{icon}</span>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">{title}</h2>
          <div className="flex-1 h-px bg-gray-700" />
        </div>
        {children}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
          <p className="text-gray-500 text-sm">
            {t.totalBalance}{' '}
            <span className={`font-semibold ${totalBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(totalBalance)}
            </span>
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal({ open: true })}>
          <Plus className="w-4 h-4" /> {t.newAccount}
        </button>
      </div>

      {!hasAny ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <Landmark className="w-12 h-12 text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">{t.empty}</p>
          <p className="text-gray-600 text-sm mt-1">{t.emptyHint}</p>
        </div>
      ) : (
        <>
          {/* ── a. Cash Accounts ─────────────────────────────────────────── */}
          {cashBanks.length > 0 && (
            <Section icon={<Banknote className="w-4 h-4" />} title={t.sectionCash}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {cashBanks.map(b => <CardBase key={b.id} bank={b} />)}
              </div>
            </Section>
          )}

          {/* ── b. Current Bank Accounts (with postdated sub-panel) ───────── */}
          {currentBanks.length > 0 && (
            <Section icon={<Landmark className="w-4 h-4" />} title={t.sectionCurrent}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {currentBanks.map(b => <CurrentBankCard key={b.id} bank={b} />)}
              </div>
            </Section>
          )}

          {/* ── c. Checks Box ─────────────────────────────────────────────── */}
          {checksBoxes.length > 0 && (
            <Section icon={<Archive className="w-4 h-4" />} title={t.sectionChecksBox}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {checksBoxes.map(b => <ChecksBoxCard key={b.id} bank={b} />)}
              </div>
            </Section>
          )}

          {/* ── e. Returned Checks ────────────────────────────────────────── */}
          {returnedAccts.length > 0 && (
            <Section icon={<RotateCcw className="w-4 h-4" />} title={t.sectionReturned}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {returnedAccts.map(b => <ReturnedChecksCard key={b.id} bank={b} />)}
              </div>
            </Section>
          )}
        </>
      )}

      {modal.open && (
        <Modal
          isEdit={!!modal.bank}
          initial={modal.bank ? {
            name: modal.bank.name,
            nameAr: modal.bank.nameAr ?? '',
            bankName: modal.bank.bankName,
            accountNumber: modal.bank.accountNumber,
            iban: modal.bank.iban ?? '',
            initialBalance: modal.bank.initialBalance,
            currency: modal.bank.currency,
            notes: modal.bank.notes,
            accountType: modal.bank.accountType ?? 'current',
            linkedBankId: modal.bank.linkedBankId,
          } : EMPTY}
          onSave={handleSave}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  )
}
