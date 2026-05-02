import { useMemo, useState } from 'react'
import { useT } from '../hooks/useT'
import { useJournalEntries, useSettings } from '../hooks/useSelectors'
import { useStore } from '../store/useStore'
import { getIncomeStatement, type AccountBalance } from '../services/accounting/balances'
import { formatCurrency, formatDate } from '../utils/helpers'
import { Printer, TrendingUp, TrendingDown } from 'lucide-react'

const L = {
  en: {
    title:          'Income Statement',
    subtitle:       'Profit & Loss for the period',
    print:          'Print',
    period:         'Period',
    from:           'From',
    to:             'To',
    revenue:        'Revenue',
    expenses:       'Expenses',
    totalRevenue:   'Total Revenue',
    totalExpenses:  'Total Expenses',
    grossMargin:    'Gross Margin',
    netIncome:      'Net Income',
    netLoss:        'Net Loss',
    empty:          'No financial activity for this period',
    emptyHint:      'Once you record sales or expenses, your P&L will populate here.',
    quickThisMonth: 'This month',
    quickLastMonth: 'Last month',
    quickThisYear: 'Year to date',
    quickAll:      'All time',
  },
  ar: {
    title:          'قائمة الدخل',
    subtitle:       'الأرباح والخسائر للفترة',
    print:          'طباعة',
    period:         'الفترة',
    from:           'من',
    to:             'إلى',
    revenue:        'الإيرادات',
    expenses:       'المصروفات',
    totalRevenue:   'إجمالي الإيرادات',
    totalExpenses:  'إجمالي المصروفات',
    grossMargin:    'هامش الربح',
    netIncome:      'صافي الربح',
    netLoss:        'صافي الخسارة',
    empty:          'لا توجد حركة مالية لهذه الفترة',
    emptyHint:      'بمجرد تسجيل المبيعات أو المصروفات، ستظهر قائمة الدخل هنا.',
    quickThisMonth: 'هذا الشهر',
    quickLastMonth: 'الشهر الماضي',
    quickThisYear: 'منذ بداية السنة',
    quickAll:      'كل الفترات',
  },
} as const

function startOfMonth(d: Date): string {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
}
function endOfMonth(d: Date): string {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
}
function startOfYear(d: Date): string {
  return new Date(d.getFullYear(), 0, 1).toISOString().split('T')[0]
}
function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

export default function IncomeStatement() {
  const t = useT(L)
  const settings       = useSettings()
  const journalEntries = useJournalEntries()
  const chartAccounts  = useStore(s => s.chartAccounts)

  const lang     = settings.language
  const currency = settings.currency || 'ILS'

  // Default range: this month
  const [fromDate, setFromDate] = useState(() => startOfMonth(new Date()))
  const [toDate,   setToDate]   = useState(() => todayStr())

  const stmt = useMemo(
    () => getIncomeStatement(chartAccounts, journalEntries, fromDate, toDate),
    [chartAccounts, journalEntries, fromDate, toDate],
  )

  const isProfit = stmt.netIncome >= 0
  const margin   = stmt.totalRevenue > 0 ? (stmt.netIncome / stmt.totalRevenue) * 100 : 0
  const isEmpty  = stmt.revenue.length === 0 && stmt.expenses.length === 0

  function applyQuickRange(kind: 'thisMonth' | 'lastMonth' | 'thisYear' | 'all') {
    const now = new Date()
    if (kind === 'thisMonth') {
      setFromDate(startOfMonth(now))
      setToDate(todayStr())
    } else if (kind === 'lastMonth') {
      const last = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      setFromDate(startOfMonth(last))
      setToDate(endOfMonth(last))
    } else if (kind === 'thisYear') {
      setFromDate(startOfYear(now))
      setToDate(todayStr())
    } else {
      setFromDate('1970-01-01')
      setToDate(todayStr())
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
          <p className="text-gray-500 text-sm">
            {t.subtitle} — {formatDate(fromDate)} → {formatDate(toDate)}
          </p>
        </div>
        <button className="btn-secondary flex items-center gap-2" onClick={() => window.print()}>
          <Printer className="w-4 h-4" /> {t.print}
        </button>
      </div>

      {/* Date range + quick presets */}
      <div className="card flex flex-wrap items-center gap-3">
        <span className="text-xs text-gray-500 uppercase tracking-wide">{t.period}:</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{t.from}</span>
          <input type="date" className="input py-1.5 text-sm w-auto"
            value={fromDate} onChange={e => setFromDate(e.target.value)} />
          <span className="text-xs text-gray-400">{t.to}</span>
          <input type="date" className="input py-1.5 text-sm w-auto"
            value={toDate} onChange={e => setToDate(e.target.value)} />
        </div>
        <div className="flex gap-1.5 ml-auto">
          <button className="text-xs px-2.5 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
            onClick={() => applyQuickRange('thisMonth')}>{t.quickThisMonth}</button>
          <button className="text-xs px-2.5 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
            onClick={() => applyQuickRange('lastMonth')}>{t.quickLastMonth}</button>
          <button className="text-xs px-2.5 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
            onClick={() => applyQuickRange('thisYear')}>{t.quickThisYear}</button>
          <button className="text-xs px-2.5 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
            onClick={() => applyQuickRange('all')}>{t.quickAll}</button>
        </div>
      </div>

      {isEmpty ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <TrendingUp className="w-12 h-12 text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">{t.empty}</p>
          <p className="text-gray-600 text-sm mt-1 max-w-md">{t.emptyHint}</p>
        </div>
      ) : (
        <>
          {/* Summary KPI strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">{t.totalRevenue}</p>
                <p className="text-xl font-bold text-green-400 mt-0.5">
                  {formatCurrency(stmt.totalRevenue, currency)}
                </p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">{t.totalExpenses}</p>
                <p className="text-xl font-bold text-red-400 mt-0.5">
                  {formatCurrency(stmt.totalExpenses, currency)}
                </p>
              </div>
            </div>
            <div className={`card flex items-center gap-4 ${
              isProfit ? 'border-green-700/40' : 'border-red-700/40'
            }`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                isProfit ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {isProfit ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  {isProfit ? t.netIncome : t.netLoss}
                </p>
                <p className={`text-xl font-bold mt-0.5 ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(Math.abs(stmt.netIncome), currency)}
                </p>
                {stmt.totalRevenue > 0 && (
                  <p className={`text-xs mt-0.5 ${isProfit ? 'text-green-600' : 'text-red-500'}`}>
                    {t.grossMargin}: {margin.toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Detail table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="font-bold text-green-400 mb-4 text-sm uppercase tracking-wide">
                {t.revenue}
              </h2>
              <AccountList rows={stmt.revenue} lang={lang} currency={currency} color="green" />
              <div className="flex justify-between pt-3 mt-3 border-t border-gray-700 font-bold">
                <span className="text-white">{t.totalRevenue}</span>
                <span className="text-green-400 font-mono">
                  {formatCurrency(stmt.totalRevenue, currency)}
                </span>
              </div>
            </div>

            <div className="card">
              <h2 className="font-bold text-red-400 mb-4 text-sm uppercase tracking-wide">
                {t.expenses}
              </h2>
              <AccountList rows={stmt.expenses} lang={lang} currency={currency} color="red" />
              <div className="flex justify-between pt-3 mt-3 border-t border-gray-700 font-bold">
                <span className="text-white">{t.totalExpenses}</span>
                <span className="text-red-400 font-mono">
                  {formatCurrency(stmt.totalExpenses, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Net income banner */}
          <div className={`card py-4 ${
            isProfit ? 'border-green-700/40 bg-green-900/10' : 'border-red-700/40 bg-red-900/10'
          }`}>
            <div className="flex justify-between items-center">
              <span className={`font-bold text-lg ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                {isProfit ? t.netIncome : t.netLoss}
              </span>
              <span className={`font-mono font-bold text-2xl ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(Math.abs(stmt.netIncome), currency)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function AccountList({
  rows, lang, currency, color,
}: {
  rows: AccountBalance[]
  lang: 'en' | 'ar'
  currency: string
  color: 'green' | 'red'
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-600 italic">—</p>
  }
  const textClass = color === 'green' ? 'text-green-300' : 'text-red-300'
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
          <span className={`font-mono shrink-0 ml-2 ${textClass}`}>
            {formatCurrency(r.balance, currency)}
          </span>
        </div>
      ))}
    </div>
  )
}
