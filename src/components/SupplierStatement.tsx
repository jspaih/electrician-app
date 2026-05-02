import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { formatCurrency, formatDate, today } from '../utils/helpers'
import { FileText, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { useT } from '../hooks/useT'

const L = {
  en: {
    title: 'Supplier Statement',
    pickSupplier: 'Select a supplier to view their account statement',
    supplier: 'Supplier',
    allSuppliers: '-- All Suppliers --',
    project: 'Project (optional)',
    allProjects: '-- All Projects --',
    from: 'From Date',
    to: 'To Date',
    totalPurchases: 'Total Purchases',
    totalPaid: 'Total Paid',
    balance: 'Balance',
    colDate: 'Date',
    colSupplier: 'Supplier',
    colType: 'Type',
    colRef: 'Reference',
    colDebit: 'Debit (Purchases)',
    colCredit: 'Credit (Payments)',
    colBalance: 'Running Balance',
    typePurchase: 'Purchase Invoice',
    typePayment: 'Payment',
    typeCheck: 'Issued Check',
    noData: 'No transactions found for the selected criteria',
    openingBalance: 'Opening Balance',
    closingBalance: 'Closing Balance',
    checkDue: 'due',
  },
  ar: {
    title: 'كشف حساب مورد',
    pickSupplier: 'اختر مورداً لعرض كشف حسابه',
    supplier: 'المورد',
    allSuppliers: '-- جميع الموردين --',
    project: 'المشروع (اختياري)',
    allProjects: '-- جميع المشاريع --',
    from: 'من تاريخ',
    to: 'إلى تاريخ',
    totalPurchases: 'إجمالي المشتريات',
    totalPaid: 'إجمالي المدفوع',
    balance: 'الرصيد',
    colDate: 'التاريخ',
    colSupplier: 'المورد',
    colType: 'النوع',
    colRef: 'المرجع',
    colDebit: 'مدين (مشتريات)',
    colCredit: 'دائن (مدفوعات)',
    colBalance: 'الرصيد المتراكم',
    typePurchase: 'فاتورة شراء',
    typePayment: 'دفعة',
    typeCheck: 'شيك صادر',
    noData: 'لا توجد معاملات للمعايير المحددة',
    openingBalance: 'الرصيد الافتتاحي',
    closingBalance: 'الرصيد الختامي',
    checkDue: 'استحقاق',
  },
} as const

interface TxRow {
  id: string
  date: string          // always the issuance / invoice date
  supplierName: string
  type: 'purchase' | 'payment' | 'check'
  ref: string
  checkNumber?: string
  checkDueDate?: string
  debit: number
  credit: number
}

export default function SupplierStatement() {
  const t = useT(L)
  const [searchParams] = useSearchParams()
  const { suppliers, projects, purchaseInvoices, payments, checks, settings } = useStore()
  const defaultCurrency = settings.currency || 'ILS'

  // Pre-select supplier when navigated from Suppliers page (?s=SUP...)
  const [supplierId, setSupplierId] = useState(() => searchParams.get('s') || '')
  const [projectId, setProjectId] = useState('')
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 3)
    return d.toISOString().split('T')[0]
  })
  const [toDate, setToDate] = useState(today)

  // Build supplier name lookup map
  const supplierNameById = new Map(suppliers.map(s => [s.id, s.name]))

  // ── Build transaction rows ────────────────────────────────────────────────

  const rows: TxRow[] = []

  // Purchase invoices → DEBIT (we owe the supplier)
  purchaseInvoices
    .filter(inv => {
      if (supplierId && inv.supplierId !== supplierId) return false
      if (projectId && inv.projectId !== projectId) return false
      if (inv.date < fromDate || inv.date > toDate) return false
      return true
    })
    .forEach(inv => {
      rows.push({
        id: inv.id,
        date: inv.date,
        supplierName: supplierNameById.get(inv.supplierId) ?? '—',
        type: 'purchase',
        ref: inv.id,
        debit: inv.total,
        credit: 0,
      })
    })

  // Payments to supplier → CREDIT (we paid the supplier)
  // For check-type payments the effect is on the ISSUANCE date (p.date), not the due date.
  // We show check rows with the individual check numbers so the user can track each check.
  payments
    .filter(p => {
      if (p.direction !== 'out') return false
      if (p.entityType !== 'supplier') return false
      if (supplierId && p.supplierId !== supplierId) return false
      if (projectId && p.projectId !== projectId) return false
      if (p.date < fromDate || p.date > toDate) return false
      return true
    })
    .forEach(p => {
      const sName = supplierNameById.get(p.supplierId ?? '') ?? '—'

      if (p.type === 'check') {
        // Look up individual issued checks linked to this payment
        const linkedChecks = checks.filter(
          c => c.paymentId === p.id && c.type === 'issued'
        )

        if (linkedChecks.length > 0) {
          // One row per check — each uses the check's issueDate (= payment date)
          linkedChecks.forEach(c => {
            rows.push({
              id: c.id,
              date: c.issueDate || p.date,   // issue date — balance effect is immediate
              supplierName: sName,
              type: 'check',
              ref: p.id,
              checkNumber: c.checkNumber,
              checkDueDate: c.dueDate,
              debit: 0,
              credit: c.amount,
            })
          })
        } else {
          // Legacy single-check payment (checkNumber on payment itself)
          rows.push({
            id: p.id,
            date: p.date,                    // issue date
            supplierName: sName,
            type: 'check',
            ref: p.id,
            checkNumber: p.checkNumber,
            checkDueDate: p.checkDueDate,
            debit: 0,
            credit: p.amount,
          })
        }
      } else {
        // Cash / bank transfer
        rows.push({
          id: p.id,
          date: p.date,
          supplierName: sName,
          type: 'payment',
          ref: p.id,
          debit: 0,
          credit: p.amount,
        })
      }
    })

  rows.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))

  // Running balance (debit = we owe supplier, credit = we paid)
  let running = 0
  const rowsWithBalance = rows.map(r => {
    running += r.debit - r.credit
    return { ...r, runningBalance: running }
  })

  const totalDebit  = rows.reduce((s, r) => s + r.debit, 0)
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0)
  const netBalance  = totalDebit - totalCredit

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t.title}</h1>
      </div>

      {/* Filters */}
      <div className="card space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="label">{t.supplier}</label>
            <select className="input" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
              <option value="">{t.allSuppliers}</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t.project}</label>
            <select className="input" value={projectId} onChange={e => setProjectId(e.target.value)}>
              <option value="">{t.allProjects}</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t.from}</label>
            <input className="input" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>
          <div>
            <label className="label">{t.to}</label>
            <input className="input" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Summary cards */}
      {rows.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card py-3 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-red-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">{t.totalPurchases}</p>
              <p className="text-xl font-bold text-red-400">{formatCurrency(totalDebit, defaultCurrency)}</p>
            </div>
          </div>
          <div className="card py-3 flex items-center gap-3">
            <TrendingDown className="w-8 h-8 text-green-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">{t.totalPaid}</p>
              <p className="text-xl font-bold text-green-400">{formatCurrency(totalCredit, defaultCurrency)}</p>
            </div>
          </div>
          <div className="card py-3 flex items-center gap-3">
            <Wallet className="w-8 h-8 text-yellow-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">{t.balance}</p>
              <p className={`text-xl font-bold ${netBalance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {formatCurrency(Math.abs(netBalance), defaultCurrency)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Transactions table */}
      {rowsWithBalance.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <FileText className="w-12 h-12 text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">
            {!supplierId && rows.length === 0 ? t.pickSupplier : t.noData}
          </p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colDate}</th>
                {/* Supplier column — between Date and Type */}
                {!supplierId && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">{t.colSupplier}</th>
                )}
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colType}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">{t.colRef}</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colDebit}</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colCredit}</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">{t.colBalance}</th>
              </tr>
            </thead>
            <tbody>
              {rowsWithBalance.map(r => (
                <tr key={r.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                  {/* Date — always the issuance/invoice date */}
                  <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{formatDate(r.date)}</td>

                  {/* Supplier name — shown when viewing all suppliers */}
                  {!supplierId && (
                    <td className="px-4 py-3 text-gray-300 hidden md:table-cell text-xs font-medium">
                      {r.supplierName}
                    </td>
                  )}

                  {/* Type badge */}
                  <td className="px-4 py-3">
                    {r.type === 'purchase' && (
                      <span className="badge bg-red-900 text-red-300">{t.typePurchase}</span>
                    )}
                    {r.type === 'payment' && (
                      <span className="badge bg-green-900 text-green-300">{t.typePayment}</span>
                    )}
                    {r.type === 'check' && (
                      <div>
                        <span className="badge bg-yellow-900/60 text-yellow-300">{t.typeCheck}</span>
                        {r.checkNumber && (
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            #{r.checkNumber}
                            {r.checkDueDate && (
                              <> · {t.checkDue}: {formatDate(r.checkDueDate)}</>
                            )}
                          </p>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Reference */}
                  <td className="px-4 py-3 font-mono text-xs text-yellow-500 hidden md:table-cell">
                    {r.ref}
                  </td>

                  {/* Debit */}
                  <td className="px-4 py-3 text-right text-red-400 font-medium">
                    {r.debit > 0 ? formatCurrency(r.debit) : '—'}
                  </td>

                  {/* Credit */}
                  <td className="px-4 py-3 text-right text-green-400 font-medium">
                    {r.credit > 0 ? formatCurrency(r.credit) : '—'}
                  </td>

                  {/* Running balance */}
                  <td className="px-4 py-3 text-right hidden lg:table-cell">
                    <span className={r.runningBalance > 0 ? 'text-red-400' : 'text-green-400'}>
                      {formatCurrency(Math.abs(r.runningBalance))}
                    </span>
                  </td>
                </tr>
              ))}

              {/* Totals row */}
              <tr className="border-t-2 border-gray-600 bg-gray-700/20 font-semibold">
                <td className="px-4 py-3 text-gray-300" colSpan={supplierId ? 3 : 4}>{t.closingBalance}</td>
                <td className="px-4 py-3 text-right text-red-400">{formatCurrency(totalDebit, defaultCurrency)}</td>
                <td className="px-4 py-3 text-right text-green-400">{formatCurrency(totalCredit, defaultCurrency)}</td>
                <td className="px-4 py-3 text-right hidden lg:table-cell">
                  <span className={netBalance > 0 ? 'text-red-400' : 'text-green-400'}>
                    {formatCurrency(Math.abs(netBalance), defaultCurrency)}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
