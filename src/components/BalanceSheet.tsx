import { useMemo, useState } from 'react'
import { useT } from '../hooks/useT'
import { useJournalEntries, useSettings } from '../hooks/useSelectors'
import { useStore } from '../store/useStore'
import { getBalanceSheet, type AccountBalance } from '../services/accounting/balances'
import { formatCurrency, formatDate, today } from '../utils/helpers'
import { Printer, Scale } from 'lucide-react'

const L = {
  en: {
    title:               'Balance Sheet',
    asOf:                'As of',
    print:               'Print',
    assets:              'Assets',
    liabilities:         'Liabilities',
    equity:              'Equity',
    totalAssets:         'Total Assets',
    totalLiabilities:    'Total Liabilities',
    totalEquity:         'Total Equity',
    currentYearProfit:   'Current Year Profit/Loss',
    liabilitiesPlusEquity: 'Liabilities + Equity',
    balancedOk:          'Assets = Liabilities + Equity',
    notBalanced:         'Out of balance',
    empty:               'No journal entries yet',
    emptyHint:           'Record transactions to see your balance sheet take shape.',
  },
  ar: {
    title:               'الميزانية العمومية',
    asOf:                'بتاريخ',
    print:               'طباعة',
    assets:              'الأصول',
    liabilities:         'الخصوم',
    equity:              'حقوق الملكية',
    totalAssets:         'إجمالي الأصول',
    totalLiabilities:    'إجمالي الخصوم',
    totalEquity:         'إجمالي حقوق الملكية',
    currentYearProfit:   'أرباح/خسائر السنة الجارية',
    liabilitiesPlusEquity: 'الخصوم + حقوق الملكية',
    balancedOk:          'الأصول = الخصوم + حقوق الملكية',
    notBalanced:         'غير متوازن',
    empty:               'لا توجد قيود محاسبية بعد',
    emptyHint:           'سجّل المعاملات لترى ميزانيتك العمومية تتشكل.',
  },
} as const

export default function BalanceSheet() {
  const t = useT(L)
  const settings       = useSettings()
  const journalEntries = useJournalEntries()
  const chartAccounts  = useStore(s => s.chartAccounts)

  const [date, setDate] = useState(today())
  const lang = settings.language
  const currency = settings.currency || 'ILS'

  const sheet = useMemo(
    () => getBalanceSheet(chartAccounts, journalEntries, date),
    [chartAccounts, journalEntries, date],
  )

  const liabilitiesPlusEquity = sheet.totalLiabilities + sheet.totalEquity

  const isEmpty = sheet.assets.length === 0
    && sheet.liabilities.length === 0
    && sheet.equity.length === 0
    && sheet.netIncome === 0

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

      {isEmpty ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <Scale className="w-12 h-12 text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">{t.empty}</p>
          <p className="text-gray-600 text-sm mt-1 max-w-md">{t.emptyHint}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Assets */}
          <div className="card">
            <h2 className="font-bold text-yellow-400 mb-4 text-sm uppercase tracking-wide">
              {t.assets}
            </h2>
            <AccountList rows={sheet.assets} lang={lang} currency={currency} />
            <div className="flex justify-between pt-3 mt-3 border-t border-gray-700 font-bold">
              <span className="text-white">{t.totalAssets}</span>
              <span className="text-green-400 font-mono">
                {formatCurrency(sheet.totalAssets, currency)}
              </span>
            </div>
          </div>

          {/* RIGHT: Liabilities + Equity */}
          <div className="space-y-4">
            <div className="card">
              <h2 className="font-bold text-red-400 mb-4 text-sm uppercase tracking-wide">
                {t.liabilities}
              </h2>
              <AccountList rows={sheet.liabilities} lang={lang} currency={currency} />
              <div className="flex justify-between pt-3 mt-3 border-t border-gray-700 font-bold">
                <span className="text-white">{t.totalLiabilities}</span>
                <span className="text-red-400 font-mono">
                  {formatCurrency(sheet.totalLiabilities, currency)}
                </span>
              </div>
            </div>

            <div className="card">
              <h2 className="font-bold text-blue-400 mb-4 text-sm uppercase tracking-wide">
                {t.equity}
              </h2>
              <AccountList rows={sheet.equity} lang={lang} currency={currency} />

              {/* Net income from P&L */}
              <div className="flex justify-between py-2 mt-2 border-t border-gray-700/50 text-sm">
                <span className="text-gray-300 italic">{t.currentYearProfit}</span>
                <span className={`font-mono ${sheet.netIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(sheet.netIncome, currency)}
                </span>
              </div>

              <div className="flex justify-between pt-3 mt-3 border-t border-gray-700 font-bold">
                <span className="text-white">{t.totalEquity}</span>
                <span className="text-blue-400 font-mono">
                  {formatCurrency(sheet.totalEquity, currency)}
                </span>
              </div>
            </div>

            {/* Accounting equation check */}
            <div className={`card py-3 ${
              sheet.isBalanced ? 'border-green-700/40' : 'border-red-700/40 bg-red-900/10'
            }`}>
              <div className="flex justify-between items-center">
                <span className={`text-sm font-medium ${
                  sheet.isBalanced ? 'text-green-400' : 'text-red-400'
                }`}>
                  {t.liabilitiesPlusEquity}
                </span>
                <span className={`font-mono font-bold ${
                  sheet.isBalanced ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formatCurrency(liabilitiesPlusEquity, currency)}
                </span>
              </div>
              <p className={`text-xs mt-1 ${sheet.isBalanced ? 'text-green-600' : 'text-red-500'}`}>
                {sheet.isBalanced ? `✓ ${t.balancedOk}` : `✗ ${t.notBalanced}`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AccountList({
  rows, lang, currency,
}: {
  rows: AccountBalance[]
  lang: 'en' | 'ar'
  currency: string
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-600 italic">—</p>
  }
  return (
    <div className="space-y-1">
      {rows.map(r => (
        <div key={r.account.id} className="flex justify-between py-1.5 text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-gray-500 text-xs font-mono shrink-0">{r.account.code}</span>
            <span className="text-gray-300 truncate">
              {lang === 'ar' ? r.account.nameAr : r.account.nameEn}
            </span>
          </div>
          <span className="text-white font-mono shrink-0 ml-2">
            {formatCurrency(r.balance, currency)}
          </span>
        </div>
      ))}
    </div>
  )
}
