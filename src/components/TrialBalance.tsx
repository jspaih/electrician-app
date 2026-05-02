import { useMemo, useState } from 'react'
import { useT } from '../hooks/useT'
import { useJournalEntries, useSettings } from '../hooks/useSelectors'
import { useStore } from '../store/useStore'
import { getTrialBalance, type AccountBalance } from '../services/accounting/balances'
import { formatCurrency, formatDate, today } from '../utils/helpers'
import { Printer, BookOpen } from 'lucide-react'
import type { AccountType } from '../types'

const L = {
  en: {
    title:        'Trial Balance',
    asOf:         'As of',
    print:        'Print',
    code:         'Code',
    account:      'Account',
    debit:        'Debit',
    credit:       'Credit',
    total:        'Total',
    balanced:     'Trial balance is balanced',
    unbalanced:   'Warning: debits ≠ credits',
    empty:        'No journal entries yet',
    emptyHint:    'Once you record payments, receipts, or invoices, balances will appear here.',
    asset:        'Assets',
    liability:    'Liabilities',
    equity:       'Equity',
    revenue:      'Revenue',
    expense:      'Expenses',
  },
  ar: {
    title:        'ميزان المراجعة',
    asOf:         'بتاريخ',
    print:        'طباعة',
    code:         'الرمز',
    account:      'الحساب',
    debit:        'مدين',
    credit:       'دائن',
    total:        'الإجمالي',
    balanced:     'ميزان المراجعة متوازن',
    unbalanced:   'تحذير: المدين لا يساوي الدائن',
    empty:        'لا توجد قيود محاسبية بعد',
    emptyHint:    'بمجرد تسجيل المدفوعات أو الإيصالات أو الفواتير، ستظهر الأرصدة هنا.',
    asset:        'الأصول',
    liability:    'الخصوم',
    equity:       'حقوق الملكية',
    revenue:      'الإيرادات',
    expense:      'المصروفات',
  },
} as const

const TYPE_ORDER: AccountType[] = ['asset', 'liability', 'equity', 'revenue', 'expense']

export default function TrialBalance() {
  const t = useT(L)
  const settings        = useSettings()
  const journalEntries  = useJournalEntries()
  const chartAccounts   = useStore(s => s.chartAccounts)

  const [date, setDate] = useState(today())

  const rows = useMemo(
    () => getTrialBalance(chartAccounts, journalEntries, { toDate: date }),
    [chartAccounts, journalEntries, date],
  )

  const totalDebit  = rows.reduce((s, r) => s + r.tbDebit,  0)
  const totalCredit = rows.reduce((s, r) => s + r.tbCredit, 0)
  const isBalanced  = Math.abs(totalDebit - totalCredit) < 0.01

  const grouped = useMemo(() => {
    const map: Record<AccountType, AccountBalance[]> = {
      asset: [], liability: [], equity: [], revenue: [], expense: [],
    }
    for (const r of rows) map[r.account.type].push(r)
    return map
  }, [rows])

  const currency = settings.currency || 'ILS'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
          <p className="text-gray-500 text-sm">{t.asOf} {formatDate(date)}</p>
        </div>
        <div className="flex gap-3">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="input"
          />
          <button className="btn-secondary flex items-center gap-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> {t.print}
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="w-12 h-12 text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">{t.empty}</p>
          <p className="text-gray-600 text-sm mt-1 max-w-md">{t.emptyHint}</p>
        </div>
      ) : (
        <>
          {/* Balance check banner */}
          <div className={`card py-3 px-5 flex items-center justify-between ${
            isBalanced ? 'border-green-700/40' : 'border-red-700/40 bg-red-900/10'
          }`}>
            <span className={`text-sm font-medium ${isBalanced ? 'text-green-400' : 'text-red-400'}`}>
              {isBalanced ? `✓ ${t.balanced}` : `✗ ${t.unbalanced}`}
            </span>
            <div className="flex gap-8">
              <span className="text-gray-400 text-sm">
                {t.debit}: <span className="text-white font-mono ml-1">{formatCurrency(totalDebit, currency)}</span>
              </span>
              <span className="text-gray-400 text-sm">
                {t.credit}: <span className="text-white font-mono ml-1">{formatCurrency(totalCredit, currency)}</span>
              </span>
            </div>
          </div>

          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide w-24">{t.code}</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.account}</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide w-40">{t.debit}</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide w-40">{t.credit}</th>
                </tr>
              </thead>
              <tbody>
                {TYPE_ORDER.map(type => (
                  grouped[type].length > 0 && (
                    <GroupSection
                      key={type}
                      label={t[type]}
                      rows={grouped[type]}
                      currency={currency}
                      lang={settings.language}
                    />
                  )
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-600 bg-gray-800">
                  <td colSpan={2} className="px-5 py-3 font-bold text-white">{t.total}</td>
                  <td className="px-5 py-3 text-right font-bold font-mono text-green-400">
                    {formatCurrency(totalDebit, currency)}
                  </td>
                  <td className="px-5 py-3 text-right font-bold font-mono text-blue-400">
                    {formatCurrency(totalCredit, currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function GroupSection({
  label, rows, currency, lang,
}: {
  label: string
  rows: AccountBalance[]
  currency: string
  lang: 'en' | 'ar'
}) {
  return (
    <>
      <tr className="bg-gray-800/50">
        <td colSpan={4} className="px-5 py-2">
          <span className="text-xs font-bold text-yellow-400 uppercase tracking-wide">{label}</span>
        </td>
      </tr>
      {rows.map(r => (
        <tr key={r.account.id} className="border-b border-gray-700/40 hover:bg-gray-700/20">
          <td className="px-5 py-2.5 font-mono text-xs text-gray-500">{r.account.code}</td>
          <td className="px-5 py-2.5 text-gray-300">
            {lang === 'ar' ? r.account.nameAr : r.account.nameEn}
          </td>
          <td className="px-5 py-2.5 text-right font-mono text-green-400">
            {r.tbDebit > 0 ? formatCurrency(r.tbDebit, currency) : ''}
          </td>
          <td className="px-5 py-2.5 text-right font-mono text-blue-400">
            {r.tbCredit > 0 ? formatCurrency(r.tbCredit, currency) : ''}
          </td>
        </tr>
      ))}
    </>
  )
}
