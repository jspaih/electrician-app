import { useState } from 'react'
import { useStore } from '../store/useStore'
import { formatCurrency } from '../utils/helpers'
import { BarChart3, TrendingUp, TrendingDown, HardHat, Calendar } from 'lucide-react'
import { useT, useLang } from '../hooks/useT'

const L = {
  en: {
    title: 'Reports',
    subtitle: 'Profit & loss and project financials',
    tabMonthly: 'Monthly P&L',
    tabProject: 'By Project',
    last3: 'Last 3 months',
    last6: 'Last 6 months',
    last12: 'Last 12 months',
    custom: 'Custom',
    startMonth: 'Start month',
    endMonth: 'End month',
    monthsWord: 'months',
    totalIncome: 'Total Income',
    totalExpenses: 'Total Expenses',
    totalLabor: 'Total Labor',
    netProfit: 'Net Profit',
    monthlyBreakdown: 'Monthly breakdown',
    noData: 'No data for the selected period',
    income: 'Income',
    expenses: 'Expenses',
    labor: 'Labor',
    noProjects: 'No projects to report on',
    project: 'Project',
    client: 'Client',
    budget: 'Budget',
    received: 'Received',
    spent: 'Spent',
    budgetUsed: 'Budget used',
    grandTotal: 'Total',
    projects: 'projects',
    months: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ] as const,
  },
  ar: {
    title: 'التقارير',
    subtitle: 'الأرباح والخسائر والبيانات المالية للمشاريع',
    tabMonthly: 'الأرباح والخسائر الشهرية',
    tabProject: 'حسب المشروع',
    last3: 'آخر 3 أشهر',
    last6: 'آخر 6 أشهر',
    last12: 'آخر 12 شهراً',
    custom: 'مخصص',
    startMonth: 'شهر البداية',
    endMonth: 'شهر النهاية',
    monthsWord: 'شهر',
    totalIncome: 'إجمالي الدخل',
    totalExpenses: 'إجمالي المصاريف',
    totalLabor: 'إجمالي العمالة',
    netProfit: 'صافي الربح',
    monthlyBreakdown: 'التفصيل الشهري',
    noData: 'لا توجد بيانات للفترة المحددة',
    income: 'الدخل',
    expenses: 'المصاريف',
    labor: 'العمالة',
    noProjects: 'لا توجد مشاريع للإبلاغ عنها',
    project: 'المشروع',
    client: 'العميل',
    budget: 'الميزانية',
    received: 'المستلم',
    spent: 'المنفق',
    budgetUsed: 'نسبة استخدام الميزانية',
    grandTotal: 'الإجمالي',
    projects: 'مشاريع',
    months: [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
    ] as const,
  },
} as const

function getMonthRange(count: number): string[] {
  const months: string[] = []
  const d = new Date()
  for (let i = count - 1; i >= 0; i--) {
    const dt = new Date(d.getFullYear(), d.getMonth() - i, 1)
    months.push(dt.toISOString().slice(0, 7))
  }
  return months
}

function getCustomMonthRange(start: string, end: string): string[] {
  if (!start || !end) return []
  const months: string[] = []
  const [sy, sm] = start.split('-').map(Number)
  const [ey, em] = end.split('-').map(Number)
  let y = sy, m = sm
  while (y < ey || (y === ey && m <= em)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`)
    m++
    if (m > 12) { m = 1; y++ }
  }
  return months
}

export default function Reports() {
  const lang = useLang()
  // Pick the dictionary based on language; we need it untyped for the months array indexing.
  const t = lang === 'ar' ? L.ar : L.en
  const monthLabel = (ym: string): string => {
    const [y, m] = ym.split('-')
    return `${t.months[parseInt(m) - 1]} ${y}`
  }

  const { projects, getMonthlyReport, getProjectFinancials, getProjectLaborCost } = useStore()
  const [tab, setTab] = useState<'monthly' | 'project'>('monthly')
  const [periodType, setPeriodType] = useState<'preset' | 'custom'>('preset')
  const [monthCount, setMonthCount] = useState(6)
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 6)
    return d.toISOString().slice(0, 7)
  })
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().slice(0, 7))

  const months = periodType === 'preset' ? getMonthRange(monthCount) : getCustomMonthRange(customStart, customEnd)
  const reports = months.map(m => ({ month: m, ...getMonthlyReport(m) }))

  const totalIncome   = reports.reduce((s, r) => s + r.income, 0)
  const totalExpenses = reports.reduce((s, r) => s + r.expenses, 0)
  const totalLabor    = reports.reduce((s, r) => s + r.labor, 0)
  const totalProfit   = reports.reduce((s, r) => s + r.profit, 0)

  const projectReports = projects.map(p => {
    const fin = getProjectFinancials(p.id)
    const laborCost = getProjectLaborCost(p.id)
    const client = useStore.getState().clients.find(c => c.id === p.clientId)
    return {
      ...p,
      clientName: client?.name ?? '—',
      received: fin.received,
      spent: fin.spent,
      laborCost,
      netProfit: fin.received - fin.spent - laborCost,
      budgetUsed: p.budget > 0 ? ((fin.spent + laborCost) / p.budget * 100) : 0,
    }
  }).sort((a, b) => b.netProfit - a.netProfit)

  const maxValue = Math.max(...reports.map(r => Math.max(r.income, r.expenses + r.labor)), 1)

  const textEnd = lang === 'ar' ? 'text-left' : 'text-right'
  const textStart = lang === 'ar' ? 'text-right' : 'text-left'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
          <p className="text-gray-500 text-sm">{t.subtitle}</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-800 rounded-lg p-1 w-fit border border-gray-700">
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'monthly' ? 'bg-yellow-500/20 text-yellow-300' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setTab('monthly')}
        >{t.tabMonthly}</button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'project' ? 'bg-yellow-500/20 text-yellow-300' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setTab('project')}
        >{t.tabProject}</button>
      </div>

      {tab === 'monthly' && (
        <>
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div className="flex gap-1 bg-gray-800 rounded-lg p-1 border border-gray-700">
                {([
                  { label: t.last3,  value: 3 },
                  { label: t.last6,  value: 6 },
                  { label: t.last12, value: 12 },
                ] as const).map(opt => (
                  <button key={opt.value}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      periodType === 'preset' && monthCount === opt.value ? 'bg-yellow-500/20 text-yellow-300' : 'text-gray-400 hover:text-white'
                    }`}
                    onClick={() => { setPeriodType('preset'); setMonthCount(opt.value) }}
                  >{opt.label}</button>
                ))}
                <button
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    periodType === 'custom' ? 'bg-yellow-500/20 text-yellow-300' : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setPeriodType('custom')}
                >{t.custom}</button>
              </div>
            </div>

            {periodType === 'custom' && (
              <div className="flex items-center gap-3">
                <div>
                  <label className="label">{t.startMonth}</label>
                  <input className="input w-44" type="month" value={customStart} onChange={e => setCustomStart(e.target.value)} />
                </div>
                <div>
                  <label className="label">{t.endMonth}</label>
                  <input className="input w-44" type="month" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
                </div>
                <span className="text-xs text-gray-500 self-end pb-2">{months.length} {t.monthsWord}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <p className="text-xs text-gray-500 uppercase">{t.totalIncome}</p>
              </div>
              <p className="text-2xl font-bold text-green-400">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="card">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <p className="text-xs text-gray-500 uppercase">{t.totalExpenses}</p>
              </div>
              <p className="text-2xl font-bold text-red-400">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="card">
              <div className="flex items-center gap-2 mb-1">
                <HardHat className="w-4 h-4 text-orange-400" />
                <p className="text-xs text-gray-500 uppercase">{t.totalLabor}</p>
              </div>
              <p className="text-2xl font-bold text-orange-400">{formatCurrency(totalLabor)}</p>
            </div>
            <div className="card">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-yellow-400" />
                <p className="text-xs text-gray-500 uppercase">{t.netProfit}</p>
              </div>
              <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(totalProfit)}</p>
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold text-white mb-4">{t.monthlyBreakdown}</h2>
            {reports.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">{t.noData}</p>
            ) : (
              <div className="space-y-4">
                {reports.map(r => (
                  <div key={r.month}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-300">{monthLabel(r.month)}</span>
                      <span className={`text-sm font-bold ${r.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(r.profit)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-16">{t.income}</span>
                        <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500/70 rounded-full transition-all" style={{ width: `${(r.income / maxValue) * 100}%` }} />
                        </div>
                        <span className={`text-xs text-green-400 w-20 ${textEnd}`}>{formatCurrency(r.income)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-16">{t.expenses}</span>
                        <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500/70 rounded-full transition-all" style={{ width: `${(r.expenses / maxValue) * 100}%` }} />
                        </div>
                        <span className={`text-xs text-red-400 w-20 ${textEnd}`}>{formatCurrency(r.expenses)}</span>
                      </div>
                      {r.labor > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-16">{t.labor}</span>
                          <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500/70 rounded-full transition-all" style={{ width: `${(r.labor / maxValue) * 100}%` }} />
                          </div>
                          <span className={`text-xs text-orange-400 w-20 ${textEnd}`}>{formatCurrency(r.labor)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'project' && (
        <>
          {projectReports.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <BarChart3 className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-gray-400 font-medium">{t.noProjects}</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className={`${textStart} px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide`}>{t.project}</th>
                    <th className={`${textStart} px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell`}>{t.client}</th>
                    <th className={`${textEnd} px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide`}>{t.budget}</th>
                    <th className={`${textEnd} px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide`}>{t.received}</th>
                    <th className={`${textEnd} px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide`}>{t.spent}</th>
                    <th className={`${textEnd} px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell`}>{t.labor}</th>
                    <th className={`${textEnd} px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide`}>{t.netProfit}</th>
                    <th className={`${textEnd} px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell`}>{t.budgetUsed}</th>
                  </tr>
                </thead>
                <tbody>
                  {projectReports.map(p => (
                    <tr key={p.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium text-white">{p.name}</p>
                        <p className="font-mono text-xs text-yellow-500">{p.id}</p>
                      </td>
                      <td className="px-5 py-3 text-gray-300 hidden md:table-cell">{p.clientName}</td>
                      <td className={`px-5 py-3 ${textEnd} text-gray-300`}>{formatCurrency(p.budget)}</td>
                      <td className={`px-5 py-3 ${textEnd} text-green-400`}>{formatCurrency(p.received)}</td>
                      <td className={`px-5 py-3 ${textEnd} text-red-400`}>{formatCurrency(p.spent)}</td>
                      <td className={`px-5 py-3 ${textEnd} text-orange-400 hidden lg:table-cell`}>{formatCurrency(p.laborCost)}</td>
                      <td className={`px-5 py-3 ${textEnd}`}>
                        <span className={`font-bold ${p.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(p.netProfit)}
                        </span>
                      </td>
                      <td className={`px-5 py-3 ${textEnd} hidden lg:table-cell`}>
                        {p.budget > 0 ? (
                          <div className="flex items-center gap-2 justify-end">
                            <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${p.budgetUsed > 90 ? 'bg-red-500' : p.budgetUsed > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                style={{ width: `${Math.min(100, p.budgetUsed)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400">{p.budgetUsed.toFixed(0)}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-700/30 font-semibold">
                    <td className="px-5 py-3 text-white">{t.grandTotal} ({projectReports.length} {t.projects})</td>
                    <td className="px-5 py-3 hidden md:table-cell" />
                    <td className={`px-5 py-3 ${textEnd} text-gray-300`}>{formatCurrency(projectReports.reduce((s, p) => s + p.budget, 0))}</td>
                    <td className={`px-5 py-3 ${textEnd} text-green-400`}>{formatCurrency(projectReports.reduce((s, p) => s + p.received, 0))}</td>
                    <td className={`px-5 py-3 ${textEnd} text-red-400`}>{formatCurrency(projectReports.reduce((s, p) => s + p.spent, 0))}</td>
                    <td className={`px-5 py-3 ${textEnd} text-orange-400 hidden lg:table-cell`}>{formatCurrency(projectReports.reduce((s, p) => s + p.laborCost, 0))}</td>
                    <td className={`px-5 py-3 ${textEnd}`}>
                      <span className={`font-bold ${projectReports.reduce((s, p) => s + p.netProfit, 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(projectReports.reduce((s, p) => s + p.netProfit, 0))}
                      </span>
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell" />
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
