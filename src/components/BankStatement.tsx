import { useState } from 'react'
import { useStore } from '../store/useStore'
import { formatCurrency, formatDate, today } from '../utils/helpers'
import { Landmark, Printer, Search } from 'lucide-react'
import { useT } from '../hooks/useT'

const L = {
  en: {
    title: 'Bank & Cash Statement',
    subtitle: 'Account statement with running balance',
    account: 'Account',
    chooseAccount: '-- Select Account --',
    cashAccount: 'Cash',
    from: 'From',
    to: 'To',
    print: 'Print',
    search: 'Search…',
    colDate: 'Date',
    colRef: 'Reference',
    colDesc: 'Description',
    colIn: 'In (+)',
    colOut: 'Out (−)',
    colBalance: 'Balance',
    empty: 'No transactions found for selected filters.',
    noAccount: 'Select a bank or cash account to view statement.',
    openingBalance: 'Opening Balance',
    closingBalance: 'Closing Balance',
    totalIn: 'Total In',
    totalOut: 'Total Out',
    typePayment: 'Payment',
    typeTransfer: 'Transfer',
    transferFrom: 'Transfer from',
    transferTo: 'Transfer to',
  },
  ar: {
    title: 'كشف حساب البنك والنقد',
    subtitle: 'كشف الحساب مع الرصيد المتراكم',
    account: 'الحساب',
    chooseAccount: '-- اختر الحساب --',
    cashAccount: 'نقد',
    from: 'من',
    to: 'إلى',
    print: 'طباعة',
    search: 'بحث...',
    colDate: 'التاريخ',
    colRef: 'المرجع',
    colDesc: 'البيان',
    colIn: 'وارد (+)',
    colOut: 'صادر (−)',
    colBalance: 'الرصيد',
    empty: 'لا توجد معاملات بالفلاتر المحددة.',
    noAccount: 'اختر حساباً بنكياً أو نقدياً لعرض الكشف.',
    openingBalance: 'الرصيد الافتتاحي',
    closingBalance: 'الرصيد الختامي',
    totalIn: 'إجمالي الوارد',
    totalOut: 'إجمالي الصادر',
    typePayment: 'دفعة',
    typeTransfer: 'تحويل',
    transferFrom: 'تحويل من',
    transferTo: 'تحويل إلى',
  },
} as const

// Cash account pseudo-id
const CASH_ID = '__cash__'

export default function BankStatement() {
  const t = useT(L)
  const { banks, payments, transfers, checks, settings } = useStore()
  const defaultCurrency = settings.currency || 'ILS'
  const companyName = settings.companyName || 'Company'

  const [accountId, setAccountId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState(today())
  const [search, setSearch] = useState('')

  const bank = banks.find(b => b.id === accountId)
  const isCash = accountId === CASH_ID || bank?.accountType === 'cash'

  // Build transactions
  type TxRow = {
    date: string
    ref: string
    desc: string
    in: number
    out: number
  }

  let openingBalance = 0
  const rows: TxRow[] = []

  const isBankCashType = bank?.accountType === 'cash'

  if (accountId === CASH_ID) {
    // Legacy cash pseudo-account: sum payments where type === 'cash' with no bankAccountId
    openingBalance = 0
    for (const p of payments) {
      if (p.type !== 'cash' || p.bankAccountId) continue
      const inPeriod = (!from || p.date >= from) && (!to || p.date <= to)
      if (!inPeriod) {
        if (from && p.date < from) {
          openingBalance += p.direction === 'in' ? p.amount : -p.amount
        }
        continue
      }
      rows.push({
        date: p.date, ref: p.id,
        desc: p.description || (p.direction === 'in' ? 'Cash in' : 'Cash out'),
        in: p.direction === 'in' ? p.amount : 0,
        out: p.direction === 'out' ? p.amount : 0,
      })
    }
  } else if (bank && isBankCashType) {
    // Named cash account: sum all payments assigned to this account
    openingBalance = bank.initialBalance
    for (const p of payments) {
      if (p.bankAccountId !== accountId) continue
      if (from && p.date < from) {
        openingBalance += p.direction === 'in' ? p.amount : -p.amount
        continue
      }
      if (to && p.date > to) continue
      rows.push({
        date: p.date, ref: p.id,
        desc: p.description || (p.direction === 'in' ? 'Cash in' : 'Cash out'),
        in: p.direction === 'in' ? p.amount : 0,
        out: p.direction === 'out' ? p.amount : 0,
      })
    }
  } else if (bank) {
    openingBalance = bank.initialBalance
    // Payments before period → opening
    for (const p of payments) {
      if (p.bankAccountId !== accountId || p.type === 'cash') continue
      if (from && p.date < from) {
        openingBalance += p.direction === 'in' ? p.amount : -p.amount
      }
    }
    for (const tf of transfers) {
      if (from && tf.date < from) {
        if (tf.fromAccountId === accountId) openingBalance -= (tf.amount + tf.fee)
        if (tf.toAccountId === accountId) openingBalance += tf.amount
      }
    }
    for (const c of checks) {
      if (c.bankAccountId !== accountId || c.status !== 'cleared') continue
      if (from && c.issueDate < from) {
        openingBalance += c.type === 'received' ? c.amount : -c.amount
      }
    }

    // In-period payments
    for (const p of payments) {
      if (p.bankAccountId !== accountId || p.type === 'cash') continue
      if (from && p.date < from) continue
      if (to && p.date > to) continue
      rows.push({
        date: p.date, ref: p.id,
        desc: p.description || t.typePayment,
        in: p.direction === 'in' ? p.amount : 0,
        out: p.direction === 'out' ? p.amount : 0,
      })
    }
    // In-period transfers
    for (const tf of transfers) {
      if (from && tf.date < from) continue
      if (to && tf.date > to) continue
      if (tf.fromAccountId === accountId) {
        rows.push({ date: tf.date, ref: tf.id, desc: `${t.transferTo} ${banks.find(b=>b.id===tf.toAccountId)?.name??''}`, in: 0, out: tf.amount + tf.fee })
      }
      if (tf.toAccountId === accountId) {
        rows.push({ date: tf.date, ref: tf.id, desc: `${t.transferFrom} ${banks.find(b=>b.id===tf.fromAccountId)?.name??''}`, in: tf.amount, out: 0 })
      }
    }
    // In-period cleared checks
    for (const c of checks) {
      if (c.bankAccountId !== accountId || c.status !== 'cleared') continue
      if (from && c.issueDate < from) continue
      if (to && c.issueDate > to) continue
      rows.push({
        date: c.issueDate, ref: c.id,
        desc: `Check #${c.checkNumber} — ${c.issuerName || c.payeeName}`,
        in: c.type === 'received' ? c.amount : 0,
        out: c.type === 'issued' ? c.amount : 0,
      })
    }
  }

  // Sort by date
  rows.sort((a, b) => a.date.localeCompare(b.date) || a.ref.localeCompare(b.ref))

  const q = search.toLowerCase()
  const displayRows = rows.filter(r =>
    !q || r.ref.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q)
  )

  let running = openingBalance
  const withBalance = displayRows.map(r => {
    running += r.in - r.out
    return { ...r, balance: running }
  })

  const totalIn  = rows.reduce((s, r) => s + r.in, 0)
  const totalOut = rows.reduce((s, r) => s + r.out, 0)
  const closingBalance = openingBalance + totalIn - totalOut
  const cur = (accountId === CASH_ID) ? defaultCurrency : (bank?.currency || defaultCurrency)

  function printStatement() {
    const accountName = accountId === CASH_ID ? t.cashAccount : (bank?.name ?? '')
    const rowsHtml = withBalance.map(r => `
      <tr>
        <td style="padding:5px 10px;border-bottom:1px solid #eee">${formatDate(r.date)}</td>
        <td style="padding:5px 10px;border-bottom:1px solid #eee;font-family:monospace;font-size:11px">${r.ref}</td>
        <td style="padding:5px 10px;border-bottom:1px solid #eee">${r.desc}</td>
        <td style="padding:5px 10px;border-bottom:1px solid #eee;text-align:right;color:#16a34a">${r.in > 0 ? r.in.toFixed(2) : ''}</td>
        <td style="padding:5px 10px;border-bottom:1px solid #eee;text-align:right;color:#dc2626">${r.out > 0 ? r.out.toFixed(2) : ''}</td>
        <td style="padding:5px 10px;border-bottom:1px solid #eee;text-align:right;font-weight:bold">${r.balance.toFixed(2)}</td>
      </tr>`).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${t.title}</title>
<style>body{font-family:Arial,sans-serif;padding:24px;color:#111}table{width:100%;border-collapse:collapse;font-size:12px}
th{background:#f3f4f6;padding:7px 10px;border-bottom:2px solid #e5e7eb;text-align:left}th.right{text-align:right}</style></head>
<body>
  <div style="display:flex;justify-content:space-between;border-bottom:2px solid #f59e0b;padding-bottom:10px;margin-bottom:16px">
    <div><strong style="font-size:16px">${companyName}</strong></div>
    <div style="text-align:right"><strong>${t.title}</strong><br>${accountName}</div>
  </div>
  <div style="display:flex;gap:20px;margin-bottom:14px;font-size:12px">
    <div><span style="color:#888">${t.openingBalance}</span><br><strong>${formatCurrency(openingBalance, cur)}</strong></div>
    <div><span style="color:#888">${t.totalIn}</span><br><strong style="color:#16a34a">${formatCurrency(totalIn, cur)}</strong></div>
    <div><span style="color:#888">${t.totalOut}</span><br><strong style="color:#dc2626">${formatCurrency(totalOut, cur)}</strong></div>
    <div><span style="color:#888">${t.closingBalance}</span><br><strong>${formatCurrency(closingBalance, cur)}</strong></div>
  </div>
  <table>
    <thead><tr>
      <th>${t.colDate}</th><th>${t.colRef}</th><th>${t.colDesc}</th>
      <th class="right">${t.colIn}</th><th class="right">${t.colOut}</th><th class="right">${t.colBalance}</th>
    </tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</body></html>`
    const win = window.open('', '_blank', 'width=950,height=700')
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
        {accountId && (
          <button className="btn-secondary flex items-center gap-2" onClick={printStatement}>
            <Printer className="w-4 h-4" /> {t.print}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="label">{t.account}</label>
            <select className="input" value={accountId} onChange={e => setAccountId(e.target.value)}>
              <option value="">{t.chooseAccount}</option>
              <option value={CASH_ID}>{t.cashAccount} (legacy)</option>
              {/* Cash accounts */}
              {banks.filter(b => b.accountType === 'cash').map(b =>
                <option key={b.id} value={b.id}>{b.name} [{t.cashAccount}]</option>
              )}
              {/* Current bank accounts */}
              {banks.filter(b => (b.accountType ?? 'current') === 'current').map(b =>
                <option key={b.id} value={b.id}>{b.name}{b.bankName ? ` (${b.bankName})` : ''}</option>
              )}
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
          <div className="flex flex-col justify-end">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input className="input pl-9" placeholder={t.search} value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      {accountId && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card py-3">
            <p className="text-xs text-gray-500">{t.openingBalance}</p>
            <p className="text-xl font-bold text-white">{formatCurrency(openingBalance, cur)}</p>
          </div>
          <div className="card py-3">
            <p className="text-xs text-gray-500">{t.totalIn}</p>
            <p className="text-xl font-bold text-green-400">{formatCurrency(totalIn, cur)}</p>
          </div>
          <div className="card py-3">
            <p className="text-xs text-gray-500">{t.totalOut}</p>
            <p className="text-xl font-bold text-red-400">{formatCurrency(totalOut, cur)}</p>
          </div>
          <div className="card py-3">
            <p className="text-xs text-gray-500">{t.closingBalance}</p>
            <p className={`text-xl font-bold ${closingBalance >= 0 ? 'text-white' : 'text-red-400'}`}>{formatCurrency(closingBalance, cur)}</p>
          </div>
        </div>
      )}

      {!accountId ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <Landmark className="w-12 h-12 text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">{t.noAccount}</p>
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
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">{t.colDesc}</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colIn}</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colOut}</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colBalance}</th>
              </tr>
            </thead>
            <tbody>
              {withBalance.map((r, i) => (
                <tr key={i} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                  <td className="px-5 py-3 text-gray-300">{formatDate(r.date)}</td>
                  <td className="px-5 py-3 font-mono text-xs text-yellow-500">{r.ref}</td>
                  <td className="px-5 py-3 text-gray-400 hidden md:table-cell truncate max-w-[200px]">{r.desc}</td>
                  <td className="px-5 py-3 text-right text-green-400">{r.in > 0 ? formatCurrency(r.in, cur) : '—'}</td>
                  <td className="px-5 py-3 text-right text-red-400">{r.out > 0 ? formatCurrency(r.out, cur) : '—'}</td>
                  <td className={`px-5 py-3 text-right font-bold ${r.balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                    {formatCurrency(r.balance, cur)}
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
