import { useState } from 'react'
import { useStore } from '../store/useStore'
import { formatCurrency, formatDate, today } from '../utils/helpers'
import { Users, Printer, Search } from 'lucide-react'
import { useT } from '../hooks/useT'

const L = {
  en: {
    title: 'Client Statement',
    subtitle: 'Account statement with running balance',
    client: 'Client',
    chooseClient: '-- Select Client --',
    project: 'Filter by Project',
    allProjects: 'All Projects',
    from: 'From',
    to: 'To',
    print: 'Print',
    search: 'Search…',
    colDate: 'Date',
    colRef: 'Reference',
    colType: 'Type',
    colDebit: 'Invoice (Debit)',
    colCredit: 'Payment (Credit)',
    colBalance: 'Balance',
    empty: 'No transactions found for selected filters.',
    noClient: 'Select a client to view their statement.',
    typeInvoice: 'Sales Invoice',
    typePayment: 'Payment',
    openingBalance: 'Opening Balance',
    closingBalance: 'Closing Balance',
    totalInvoiced: 'Total Invoiced',
    totalPaid: 'Total Paid',
    outstanding: 'Outstanding Balance',
  },
  ar: {
    title: 'كشف حساب العميل',
    subtitle: 'كشف الحساب مع الرصيد المتراكم',
    client: 'العميل',
    chooseClient: '-- اختر العميل --',
    project: 'تصفية بالمشروع',
    allProjects: 'جميع المشاريع',
    from: 'من',
    to: 'إلى',
    print: 'طباعة',
    search: 'بحث...',
    colDate: 'التاريخ',
    colRef: 'المرجع',
    colType: 'النوع',
    colDebit: 'الفاتورة (مدين)',
    colCredit: 'الدفعة (دائن)',
    colBalance: 'الرصيد',
    empty: 'لا توجد معاملات بالفلاتر المحددة.',
    noClient: 'اختر عميلاً لعرض كشف حسابه.',
    typeInvoice: 'فاتورة مبيعات',
    typePayment: 'دفعة',
    openingBalance: 'الرصيد الافتتاحي',
    closingBalance: 'الرصيد الختامي',
    totalInvoiced: 'إجمالي الفواتير',
    totalPaid: 'إجمالي المدفوعات',
    outstanding: 'الرصيد المستحق',
  },
} as const

export default function ClientStatement() {
  const t = useT(L)
  const { clients, receipts, payments, projects, settings } = useStore()
  const defaultCurrency = settings.currency || 'ILS'

  const [clientId, setClientId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState(today())
  const [search, setSearch] = useState('')

  const client = clients.find(c => c.id === clientId)
  const clientProjects = projects.filter(p => p.clientId === clientId)

  // Gather invoices (receipts with clientId)
  const invoices = receipts.filter(r => {
    if (r.clientId !== clientId) return false
    if (projectId && r.projectId !== projectId) return false
    if (from && r.date < from) return false
    if (to && r.date > to) return false
    return true
  })

  // Gather payments (payments in from client)
  const clientPayments = payments.filter(p => {
    if (p.clientId !== clientId || p.direction !== 'in') return false
    if (projectId && p.projectId !== projectId) return false
    if (from && p.date < from) return false
    if (to && p.date > to) return false
    return true
  })

  // Combine and sort chronologically
  type TxRow = {
    date: string
    ref: string
    type: string
    debit: number   // invoice amount
    credit: number  // payment amount
  }

  const rows: TxRow[] = [
    ...invoices.map(r => ({
      date: r.date, ref: r.id, type: t.typeInvoice,
      debit: r.total, credit: 0,
    })),
    ...clientPayments.map(p => ({
      date: p.date, ref: p.id, type: t.typePayment,
      debit: 0, credit: p.amount,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date) || a.ref.localeCompare(b.ref))

  const q = search.toLowerCase()
  const displayRows = rows.filter(r =>
    !q || r.ref.toLowerCase().includes(q) || r.type.toLowerCase().includes(q)
  )

  // Running balance: opening is 0 (filter-based)
  let running = 0
  const withBalance = displayRows.map(r => {
    running += r.debit - r.credit
    return { ...r, balance: running }
  })

  const totalInvoiced = rows.reduce((s, r) => s + r.debit, 0)
  const totalPaid = rows.reduce((s, r) => s + r.credit, 0)
  const outstanding = totalInvoiced - totalPaid

  function printStatement() {
    const companyName = settings.companyName || 'Company'
    const rows2 = withBalance.map(r => `
      <tr>
        <td style="padding:5px 10px;border-bottom:1px solid #eee">${formatDate(r.date)}</td>
        <td style="padding:5px 10px;border-bottom:1px solid #eee;font-family:monospace;font-size:11px">${r.ref}</td>
        <td style="padding:5px 10px;border-bottom:1px solid #eee">${r.type}</td>
        <td style="padding:5px 10px;border-bottom:1px solid #eee;text-align:right;color:#dc2626">${r.debit > 0 ? r.debit.toFixed(2) : ''}</td>
        <td style="padding:5px 10px;border-bottom:1px solid #eee;text-align:right;color:#16a34a">${r.credit > 0 ? r.credit.toFixed(2) : ''}</td>
        <td style="padding:5px 10px;border-bottom:1px solid #eee;text-align:right;font-weight:bold">${r.balance.toFixed(2)}</td>
      </tr>`).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${t.title}</title>
<style>body{font-family:Arial,sans-serif;padding:24px;color:#111}table{width:100%;border-collapse:collapse;font-size:12px}
th{background:#f3f4f6;padding:7px 10px;border-bottom:2px solid #e5e7eb;text-align:left}
th.right{text-align:right}.summary{display:flex;gap:20px;flex-wrap:wrap;margin-bottom:16px}</style></head>
<body>
  <div style="display:flex;justify-content:space-between;border-bottom:2px solid #f59e0b;padding-bottom:10px;margin-bottom:16px">
    <div><strong style="font-size:16px">${companyName}</strong></div>
    <div style="text-align:right"><strong>${t.title}</strong><br>${client?.name??''}</div>
  </div>
  <div class="summary">
    <div><span style="color:#888;font-size:11px">${t.totalInvoiced}</span><br><strong>${formatCurrency(totalInvoiced, defaultCurrency)}</strong></div>
    <div><span style="color:#888;font-size:11px">${t.totalPaid}</span><br><strong style="color:#16a34a">${formatCurrency(totalPaid, defaultCurrency)}</strong></div>
    <div><span style="color:#888;font-size:11px">${t.outstanding}</span><br><strong style="color:${outstanding>0?'#dc2626':'#16a34a'}">${formatCurrency(outstanding, defaultCurrency)}</strong></div>
  </div>
  <table>
    <thead><tr>
      <th>${t.colDate}</th><th>${t.colRef}</th><th>${t.colType}</th>
      <th class="right">${t.colDebit}</th><th class="right">${t.colCredit}</th>
      <th class="right">${t.colBalance}</th>
    </tr></thead>
    <tbody>${rows2}</tbody>
  </table>
</body></html>`
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.print()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
          <p className="text-gray-500 text-sm">{t.subtitle}</p>
        </div>
        {clientId && (
          <button className="btn-secondary flex items-center gap-2" onClick={printStatement}>
            <Printer className="w-4 h-4" /> {t.print}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="label">{t.client}</label>
            <select className="input" value={clientId} onChange={e => { setClientId(e.target.value); setProjectId('') }}>
              <option value="">{t.chooseClient}</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t.project}</label>
            <select className="input" value={projectId} onChange={e => setProjectId(e.target.value)} disabled={!clientId}>
              <option value="">{t.allProjects}</option>
              {clientProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t.from}</label>
            <input className="input" type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">{t.to}</label>
            <input className="input" type="date" value={to} onChange={e => setTo(e.target.value)} />
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input className="input pl-9 max-w-xs" placeholder={t.search} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Summary cards */}
      {clientId && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card py-3">
            <p className="text-xs text-gray-500">{t.totalInvoiced}</p>
            <p className="text-xl font-bold text-white">{formatCurrency(totalInvoiced, defaultCurrency)}</p>
          </div>
          <div className="card py-3">
            <p className="text-xs text-gray-500">{t.totalPaid}</p>
            <p className="text-xl font-bold text-green-400">{formatCurrency(totalPaid, defaultCurrency)}</p>
          </div>
          <div className="card py-3">
            <p className="text-xs text-gray-500">{t.outstanding}</p>
            <p className={`text-xl font-bold ${outstanding > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {formatCurrency(outstanding, defaultCurrency)}
            </p>
          </div>
        </div>
      )}

      {!clientId ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-12 h-12 text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">{t.noClient}</p>
        </div>
      ) : withBalance.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-10 text-center">
          <p className="text-gray-400">{t.empty}</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colDate}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colRef}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">{t.colType}</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colDebit}</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colCredit}</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colBalance}</th>
              </tr>
            </thead>
            <tbody>
              {withBalance.map((r, i) => (
                <tr key={i} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                  <td className="px-5 py-3 text-gray-300">{formatDate(r.date)}</td>
                  <td className="px-5 py-3 font-mono text-xs text-yellow-500">{r.ref}</td>
                  <td className="px-5 py-3 text-gray-400 hidden md:table-cell">{r.type}</td>
                  <td className="px-5 py-3 text-right text-red-400">{r.debit > 0 ? formatCurrency(r.debit, defaultCurrency) : '—'}</td>
                  <td className="px-5 py-3 text-right text-green-400">{r.credit > 0 ? formatCurrency(r.credit, defaultCurrency) : '—'}</td>
                  <td className={`px-5 py-3 text-right font-bold ${r.balance > 0 ? 'text-red-400' : r.balance < 0 ? 'text-green-400' : 'text-gray-400'}`}>
                    {formatCurrency(r.balance, defaultCurrency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
