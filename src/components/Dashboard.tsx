import { useMemo } from 'react'
import { useStore } from '../store/useStore'
import {
  useClients, useProjects, useBanks, useChecks, usePayments,
  useItems, useStockMovements, useWarranties, usePurchaseInvoices,
  useReceipts, useById,
} from '../hooks/useSelectors'
import { formatCurrency, formatDate, projectStatusColor } from '../utils/helpers'
import {
  Users, FolderKanban, Package, AlertTriangle,
  TrendingUp, TrendingDown, Landmark, FileCheck, Clock, Shield,
  Receipt, CreditCard, ClipboardList, FileText, ArrowDownCircle, ArrowUpCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useT } from '../hooks/useT'

const L = {
  en: {
    title: 'Dashboard',
    welcome: "Welcome back — here's your business at a glance",
    newReceipt: 'New Receipt',
    newPayment: 'New Payment',
    newEntry: 'New Entry',
    newQuotation: 'New Quotation',
    totalClients: 'Total Clients',
    activeProjects: 'Active Projects',
    bankBalance: 'Bank Balance',
    acrossAccounts: 'across {n} accounts',
    lowStockAlerts: 'Low Stock Alerts',
    incomeThisMonth: 'Income this month',
    expensesThisMonth: 'Expenses this month',
    issuedChecks: 'Issued Checks',
    receivedChecks: 'Received Checks',
    pending: 'pending',
    dueThisMonth: 'Due this month',
    dueNextMonth: 'Due next month',
    totalIssued: 'Total Issued',
    totalReceived: 'Total Received',
    alerts: 'Alerts',
    lowStock: 'Low stock:',
    remaining: 'remaining',
    min: 'min',
    view: 'View',
    pendingCheck: 'Pending check',
    dueOn: 'due',
    warrantyExpiring: 'Warranty expiring:',
    bankAccounts: 'Bank Accounts',
    viewAll: 'View all',
    noBanks: 'No bank accounts added yet.',
    recentPayments: 'Recent Payments',
    noPayments: 'No payments recorded yet.',
    noActiveProjects: 'No active projects.',
    pendingChecks: 'Pending Checks',
    noPendingChecks: 'No pending checks.',
    overdueInvoice: 'Overdue invoice:',
    daysOverdue: '{n} days overdue',
    overdueClient: 'Client owes:',
  },
  ar: {
    title: 'لوحة التحكم',
    welcome: 'مرحباً بعودتك — إليك نظرة سريعة على أعمالك',
    newReceipt: 'إيصال جديد',
    newPayment: 'دفعة جديدة',
    newEntry: 'قيد جديد',
    newQuotation: 'عرض سعر جديد',
    totalClients: 'إجمالي العملاء',
    activeProjects: 'المشاريع النشطة',
    bankBalance: 'الرصيد البنكي',
    acrossAccounts: 'موزع على {n} حساب',
    lowStockAlerts: 'تنبيهات المخزون المنخفض',
    incomeThisMonth: 'دخل هذا الشهر',
    expensesThisMonth: 'مصاريف هذا الشهر',
    issuedChecks: 'الشيكات الصادرة',
    receivedChecks: 'الشيكات الواردة',
    pending: 'قيد الانتظار',
    dueThisMonth: 'مستحق هذا الشهر',
    dueNextMonth: 'مستحق الشهر القادم',
    totalIssued: 'إجمالي الصادر',
    totalReceived: 'إجمالي الوارد',
    alerts: 'التنبيهات',
    lowStock: 'مخزون منخفض:',
    remaining: 'متبقي',
    min: 'الحد الأدنى',
    view: 'عرض',
    pendingCheck: 'شيك قيد الانتظار',
    dueOn: 'مستحق',
    warrantyExpiring: 'ضمان على وشك الانتهاء:',
    bankAccounts: 'الحسابات البنكية',
    viewAll: 'عرض الكل',
    noBanks: 'لم تتم إضافة أي حسابات بنكية بعد.',
    recentPayments: 'المدفوعات الأخيرة',
    noPayments: 'لم يتم تسجيل أي مدفوعات بعد.',
    noActiveProjects: 'لا توجد مشاريع نشطة.',
    pendingChecks: 'الشيكات قيد الانتظار',
    noPendingChecks: 'لا توجد شيكات قيد الانتظار.',
    overdueInvoice: 'فاتورة متأخرة:',
    daysOverdue: 'متأخرة {n} يوم',
    overdueClient: 'العميل مدين بـ:',
  },
} as const

function StatCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: string; sub?: string; icon: React.ElementType; color: string
}) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const t = useT(L)

  // Narrow subscriptions — re-render only when these specific arrays change
  const clients        = useClients()
  const projects       = useProjects()
  const banks          = useBanks()
  const checks         = useChecks()
  const payments       = usePayments()
  const items          = useItems()
  const stockMovements = useStockMovements()
  const warranties     = useWarranties()

  // Stable derived-calc refs (Zustand action identity never changes)
  const getBankBalance = useStore(s => s.getBankBalance)

  // Memoized lookup map for active project rows (replaces useStore.getState() anti-pattern)
  const clientById = useById(clients)

  // ── Memoized stock map: cheaper than calling getItemStock() N times ──
  const stockByItemId = useMemo(() => {
    const map = new Map<string, number>()
    const byItem = new Map<string, typeof stockMovements>()
    for (const m of stockMovements) {
      const arr = byItem.get(m.itemId) ?? []
      arr.push(m)
      byItem.set(m.itemId, arr)
    }
    for (const [id, mvs] of byItem) {
      const sorted = [...mvs].sort((a, b) => a.date.localeCompare(b.date))
      let s = 0
      for (const m of sorted) {
        if (m.type === 'in')              s += m.quantity
        else if (m.type === 'out')        s -= m.quantity
        else if (m.type === 'adjustment') s = m.quantity
      }
      map.set(id, s)
    }
    return map
  }, [stockMovements])

  // ── Low stock items (memoized) ──
  const lowStock = useMemo(
    () => items.filter(i => (stockByItemId.get(i.id) ?? 0) <= i.minStock),
    [items, stockByItemId],
  )

  // ── Pending checks (memoized) ──
  const pendingChecks = useMemo(
    () => checks.filter(c => c.status === 'pending'),
    [checks],
  )

  // ── Expiring warranties — within 30 days (memoized) ──
  const expiringWarranties = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() + 30)
    return warranties.filter(w =>
      w.status === 'active' && new Date(w.endDate) <= cutoff,
    )
  }, [warranties])

  // ── Overdue purchase invoices (we owe suppliers, past due date) ──
  const purchaseInvoices = usePurchaseInvoices()
  const receipts         = useReceipts()
  const getSalesInvoiceStatus = useStore(s => s.getSalesInvoiceStatus)

  const overduePurchase = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    return purchaseInvoices
      .filter(inv =>
        inv.dueDate &&
        inv.dueDate < todayStr &&
        inv.status !== 'paid' &&
        inv.total > (inv.paidAmount || 0)
      )
      .map(inv => ({
        ...inv,
        daysOverdue: Math.floor(
          (new Date(todayStr).getTime() - new Date(inv.dueDate!).getTime()) / 86400000
        ),
      }))
      .sort((a, b) => b.daysOverdue - a.daysOverdue)
  }, [purchaseInvoices])

  // ── Overdue sales invoices (clients owe us, past due date) ──
  const overdueSales = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    return receipts
      .filter(inv => {
        // Only sales invoices with line items (not simple receipts) and a due date
        if (!inv.lineItems || inv.lineItems.length === 0) return false
        if (!inv.date) return false
        // We treat invoices as overdue if 30+ days have passed and not fully paid
        const dueByImplied = new Date(inv.date)
        dueByImplied.setDate(dueByImplied.getDate() + 30)
        const dueStr = dueByImplied.toISOString().split('T')[0]
        if (dueStr >= todayStr) return false
        return getSalesInvoiceStatus(inv.id) !== 'paid'
      })
      .map(inv => {
        const due = new Date(inv.date)
        due.setDate(due.getDate() + 30)
        return {
          ...inv,
          daysOverdue: Math.floor(
            (new Date(todayStr).getTime() - due.getTime()) / 86400000
          ),
        }
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue)
  }, [receipts, getSalesInvoiceStatus])

  // ── Bank balances (memoized map → one pass instead of N passes per render) ──
  const bankBalances = useMemo(() => {
    const map = new Map<string, number>()
    for (const b of banks) map.set(b.id, getBankBalance(b.id))
    return map
  }, [banks, payments, checks, stockMovements, getBankBalance])
  // Note: getBankBalance internally reads payments/checks/transfers, so we
  // depend on payments+checks here. transfers are excluded — transfers in/out
  // also affect balance, so add them as a dep too:

  const totalBankBalance = useMemo(
    () => Array.from(bankBalances.values()).reduce((s, v) => s + v, 0),
    [bankBalances],
  )

  // ── Active project count + first 5 ──
  const activeProjectList = useMemo(
    () => projects.filter(p => p.status === 'active').slice(0, 5),
    [projects],
  )
  const activeProjects = useMemo(
    () => projects.filter(p => p.status === 'active').length,
    [projects],
  )

  // ── Month boundaries (computed once) ──
  const { thisMonthStr, nextMonthStr } = useMemo(() => {
    const now = new Date()
    return {
      thisMonthStr: now.toISOString().slice(0, 7),
      nextMonthStr: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 7),
    }
  }, [])

  // ── Monthly income/expenses (memoized) ──
  const { monthIncome, monthExpense } = useMemo(() => {
    let income = 0, expense = 0
    for (const p of payments) {
      if (!p.date.startsWith(thisMonthStr)) continue
      if (p.direction === 'in')  income  += p.amount
      else                       expense += p.amount
    }
    return { monthIncome: income, monthExpense: expense }
  }, [payments, thisMonthStr])

  // ── Check aggregations (single pass) ──
  const checkAgg = useMemo(() => {
    let issuedThis = 0, issuedNext = 0, issuedTotal = 0, issuedCount = 0
    let recvThis  = 0, recvNext  = 0, recvTotal  = 0, recvCount  = 0
    for (const c of checks) {
      if (c.status !== 'pending') continue
      if (c.type === 'issued') {
        issuedTotal += c.amount; issuedCount++
        if (c.dueDate.startsWith(thisMonthStr)) issuedThis += c.amount
        if (c.dueDate.startsWith(nextMonthStr)) issuedNext += c.amount
      } else if (c.type === 'received') {
        recvTotal += c.amount; recvCount++
        if (c.dueDate.startsWith(thisMonthStr)) recvThis += c.amount
        if (c.dueDate.startsWith(nextMonthStr)) recvNext += c.amount
      }
    }
    return {
      issuedDueThisMonth: issuedThis,
      issuedDueNextMonth: issuedNext,
      issuedTotal,        issuedCount,
      receivedDueThisMonth: recvThis,
      receivedDueNextMonth: recvNext,
      receivedTotal: recvTotal,
      receivedCount: recvCount,
    }
  }, [checks, thisMonthStr, nextMonthStr])

  const {
    issuedDueThisMonth, issuedDueNextMonth, issuedTotal, issuedCount,
    receivedDueThisMonth, receivedDueNextMonth, receivedTotal, receivedCount,
  } = checkAgg

  // ── Recent payments — top 5 most recently created ──
  const recentPayments = useMemo(
    () => [...payments].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    [payments],
  )

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-bold text-white">{t.title}</h1>
        <p className="text-gray-500 text-sm mt-1">{t.welcome}</p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 flex-wrap">
        <Link to="/receipts" className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm font-medium hover:bg-yellow-500/20 transition-colors">
          <Receipt className="w-4 h-4" /> {t.newReceipt}
        </Link>
        <Link to="/payments" className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 text-green-300 text-sm font-medium hover:bg-green-500/20 transition-colors">
          <CreditCard className="w-4 h-4" /> {t.newPayment}
        </Link>
        <Link to="/employees" className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm font-medium hover:bg-blue-500/20 transition-colors">
          <ClipboardList className="w-4 h-4" /> {t.newEntry}
        </Link>
        <Link to="/quotations" className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm font-medium hover:bg-purple-500/20 transition-colors">
          <FileText className="w-4 h-4" /> {t.newQuotation}
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t.totalClients}    value={String(clients.length)}   icon={Users}         color="bg-blue-500/10 text-blue-400"   />
        <StatCard label={t.activeProjects}  value={String(activeProjects)}    icon={FolderKanban}  color="bg-green-500/10 text-green-400" />
        <StatCard label={t.bankBalance}     value={formatCurrency(totalBankBalance)} icon={Landmark} color="bg-yellow-500/10 text-yellow-400" sub={t.acrossAccounts.replace('{n}', String(banks.length))} />
        <StatCard label={t.lowStockAlerts}  value={String(lowStock.length)}   icon={Package}       color="bg-red-500/10 text-red-400"     />
      </div>

      {/* Income / Expense this month */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{t.incomeThisMonth}</p>
            <p className="text-2xl font-bold text-green-400">{formatCurrency(monthIncome)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{t.expensesThisMonth}</p>
            <p className="text-2xl font-bold text-red-400">{formatCurrency(monthExpense)}</p>
          </div>
        </div>
      </div>

      {/* Check Summary Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Issued Checks */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpCircle className="w-5 h-5 text-red-400" />
            <h2 className="font-semibold text-white">{t.issuedChecks}</h2>
            <span className="badge bg-red-900/50 text-red-300 ml-auto">{issuedCount} {t.pending}</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{t.dueThisMonth}</span>
              <span className="text-sm font-bold text-red-400">{formatCurrency(issuedDueThisMonth)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{t.dueNextMonth}</span>
              <span className="text-sm font-bold text-red-400">{formatCurrency(issuedDueNextMonth)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-gray-700 pt-2">
              <span className="text-sm font-medium text-gray-300">{t.totalIssued}</span>
              <span className="text-sm font-bold text-red-400">{formatCurrency(issuedTotal)}</span>
            </div>
          </div>
        </div>

        {/* Received Checks */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <ArrowDownCircle className="w-5 h-5 text-green-400" />
            <h2 className="font-semibold text-white">{t.receivedChecks}</h2>
            <span className="badge bg-green-900/50 text-green-300 ml-auto">{receivedCount} {t.pending}</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{t.dueThisMonth}</span>
              <span className="text-sm font-bold text-green-400">{formatCurrency(receivedDueThisMonth)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{t.dueNextMonth}</span>
              <span className="text-sm font-bold text-green-400">{formatCurrency(receivedDueNextMonth)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-gray-700 pt-2">
              <span className="text-sm font-medium text-gray-300">{t.totalReceived}</span>
              <span className="text-sm font-bold text-green-400">{formatCurrency(receivedTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(lowStock.length > 0
        || pendingChecks.length > 0
        || expiringWarranties.length > 0
        || overduePurchase.length > 0
        || overdueSales.length > 0) && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">{t.alerts}</h2>
          <div className="space-y-2">

            {/* Overdue purchase invoices — we owe a supplier and the due date passed */}
            {overduePurchase.slice(0, 3).map(inv => (
              <div key={inv.id} className="flex items-center gap-3 bg-orange-900/20 border border-orange-800/40 rounded-lg px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
                <span className="text-sm text-orange-300">
                  {t.overdueInvoice} <span className="font-medium">{inv.id}</span> — {formatCurrency(inv.total - (inv.paidAmount || 0), inv.currency || 'ILS')} ({t.daysOverdue.replace('{n}', String(inv.daysOverdue))})
                </span>
                <Link to="/purchase-invoices" className="ml-auto text-xs text-orange-400 hover:text-orange-300 underline">{t.view}</Link>
              </div>
            ))}

            {/* Overdue sales invoices — clients owe us */}
            {overdueSales.slice(0, 3).map(inv => (
              <div key={inv.id} className="flex items-center gap-3 bg-pink-900/20 border border-pink-800/40 rounded-lg px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-pink-400 shrink-0" />
                <span className="text-sm text-pink-300">
                  {t.overdueClient} <span className="font-medium">{inv.id}</span> — {formatCurrency(inv.total, inv.currency || 'ILS')} ({t.daysOverdue.replace('{n}', String(inv.daysOverdue))})
                </span>
                <Link to="/sales-invoices" className="ml-auto text-xs text-pink-400 hover:text-pink-300 underline">{t.view}</Link>
              </div>
            ))}

            {lowStock.slice(0, 3).map(item => (
              <div key={item.id} className="flex items-center gap-3 bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-sm text-red-300">
                  {t.lowStock} <span className="font-medium">{item.name}</span> — {stockByItemId.get(item.id) ?? 0} {item.unit} {t.remaining} ({t.min}: {item.minStock})
                </span>
                <Link to="/inventory" className="ml-auto text-xs text-red-400 hover:text-red-300 underline">{t.view}</Link>
              </div>
            ))}
            {pendingChecks.slice(0, 3).map(chk => (
              <div key={chk.id} className="flex items-center gap-3 bg-yellow-900/20 border border-yellow-800/40 rounded-lg px-4 py-3">
                <Clock className="w-4 h-4 text-yellow-400 shrink-0" />
                <span className="text-sm text-yellow-300">
                  {t.pendingCheck} <span className="font-medium">#{chk.checkNumber}</span> — {formatCurrency(chk.amount)} {t.dueOn} {formatDate(chk.dueDate)}
                </span>
                <Link to="/checks" className="ml-auto text-xs text-yellow-400 hover:text-yellow-300 underline">{t.view}</Link>
              </div>
            ))}
            {expiringWarranties.slice(0, 3).map(w => (
              <div key={w.id} className="flex items-center gap-3 bg-purple-900/20 border border-purple-800/40 rounded-lg px-4 py-3">
                <Shield className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-sm text-purple-300">
                  {t.warrantyExpiring} <span className="font-medium">{w.itemDescription}</span> — {formatDate(w.endDate)}
                </span>
                <Link to="/warranties" className="ml-auto text-xs text-purple-400 hover:text-purple-300 underline">{t.view}</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bank Accounts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">{t.bankAccounts}</h2>
            <Link to="/banks" className="text-xs text-yellow-400 hover:text-yellow-300">{t.viewAll}</Link>
          </div>
          {banks.length === 0 ? (
            <p className="text-sm text-gray-500">{t.noBanks}</p>
          ) : (
            <div className="space-y-3">
              {banks.map(b => {
                const bal = bankBalances.get(b.id) ?? 0
                return (
                  <div key={b.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{b.name}</p>
                      <p className="text-xs text-gray-500">{b.bankName} • {b.accountNumber}</p>
                    </div>
                    <span className={`text-sm font-bold ${bal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(bal)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">{t.recentPayments}</h2>
            <Link to="/payments" className="text-xs text-yellow-400 hover:text-yellow-300">{t.viewAll}</Link>
          </div>
          {recentPayments.length === 0 ? (
            <p className="text-sm text-gray-500">{t.noPayments}</p>
          ) : (
            <div className="space-y-3">
              {recentPayments.map(p => (
                <div key={p.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{p.description || p.id}</p>
                    <p className="text-xs text-gray-500">{formatDate(p.date)} • {p.type.replace('_', ' ')}</p>
                  </div>
                  <span className={`text-sm font-bold ${p.direction === 'in' ? 'text-green-400' : 'text-red-400'}`}>
                    {p.direction === 'in' ? '+' : '-'}{formatCurrency(p.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Projects */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">{t.activeProjects}</h2>
            <Link to="/projects" className="text-xs text-yellow-400 hover:text-yellow-300">{t.viewAll}</Link>
          </div>
          {activeProjectList.length === 0 ? (
            <p className="text-sm text-gray-500">{t.noActiveProjects}</p>
          ) : (
            <div className="space-y-3">
              {activeProjectList.map(p => {
                const client = clientById.get(p.clientId)
                return (
                  <div key={p.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{p.name}</p>
                      <p className="text-xs text-gray-500">{client?.name ?? '—'} • {p.id}</p>
                    </div>
                    <span className={`badge ${projectStatusColor(p.status)}`}>{p.status}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pending Checks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-yellow-500" /> {t.pendingChecks}
            </h2>
            <Link to="/checks" className="text-xs text-yellow-400 hover:text-yellow-300">{t.viewAll}</Link>
          </div>
          {pendingChecks.length === 0 ? (
            <p className="text-sm text-gray-500">{t.noPendingChecks}</p>
          ) : (
            <div className="space-y-3">
              {pendingChecks.slice(0, 5).map(c => (
                <div key={c.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">#{c.checkNumber}</p>
                    <p className="text-xs text-gray-500">{t.dueOn} {formatDate(c.dueDate)} • {c.type}</p>
                  </div>
                  <span className={`text-sm font-bold ${c.type === 'received' ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(c.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
