import { useState, useRef, useMemo, useCallback } from 'react'
import { useStore } from '../store/useStore'
import { formatCurrency, formatDate } from '../utils/helpers'
import {
  Upload, X, CheckCircle2, AlertCircle, Link2,
  FileText, Landmark, RefreshCw,
  CheckCheck, CircleDot,
} from 'lucide-react'
import { useT } from '../hooks/useT'
import type { StatementLine, StatementFormat } from '../services/bankStatement/parsers'
import { parseStatement } from '../services/bankStatement/parsers'

// ── Translations ──────────────────────────────────────────────────────────────
const L = {
  en: {
    title: 'Bank Reconciliation',
    subtitle: 'Match your bank statement against app transactions',
    step1: '1. Select Account & Upload Statement',
    step2: '2. Reconcile Transactions',
    account: 'Bank Account *',
    chooseAccount: '-- Select Account --',
    uploadFile: 'Upload Bank Statement',
    uploadHint: 'CSV, Excel (.xlsx), BAI2, MT940, ISO20022 (CAMT), OFX / QFX',
    uploadBtn: 'Choose File',
    changeFile: 'Change File',
    detectedFormat: 'Detected format',
    parsedLines: 'transactions parsed',
    noLines: 'No transactions found in file.',
    parseError: 'Parse error',
    startReconcile: 'Start Reconciling',
    back: 'Back',
    reset: 'Reset',
    // Summary
    summaryMatched: 'Matched',
    summaryUnmatched: 'Unmatched (Bank)',
    summaryUnmatchedApp: 'Unmatched (App)',
    summaryDiff: 'Difference',
    // Table headers
    stmtSide: 'Bank Statement',
    appSide: 'App Transactions',
    colDate: 'Date',
    colDesc: 'Description',
    colRef: 'Ref',
    colIn: 'In',
    colOut: 'Out',
    colMatch: 'Match',
    // Actions
    autoMatch: 'Auto-Match All',
    matchSelected: 'Match Selected',
    unmatch: 'Unmatch',
    markOk: 'Mark as OK',
    unmarkOk: 'Unmark',
    // Status labels
    statusMatched: 'Matched',
    statusManual: 'Manual',
    statusOk: 'OK',
    statusUnmatched: 'Unmatched',
    // Instructions
    selectHint: 'Click a bank line and an app transaction, then press "Match Selected"',
    matchedCount: '{n} line(s) matched',
    exportNote: 'Reconciliation is session-only; export your books from Settings to save.',
    periodFilter: 'Filter by period (optional)',
    from: 'From',
    to: 'To',
    filterBtn: 'Apply',
    noAppTx: 'No app transactions for this account / period.',
  },
  ar: {
    title: 'التسوية البنكية',
    subtitle: 'مطابقة كشف حساب البنك مع معاملات التطبيق',
    step1: '١. اختر الحساب ورفع الكشف',
    step2: '٢. مطابقة المعاملات',
    account: 'الحساب البنكي *',
    chooseAccount: '-- اختر الحساب --',
    uploadFile: 'رفع كشف البنك',
    uploadHint: 'CSV, Excel (.xlsx), BAI2, MT940, ISO20022 (CAMT), OFX / QFX',
    uploadBtn: 'اختر ملف',
    changeFile: 'تغيير الملف',
    detectedFormat: 'الصيغة المكتشفة',
    parsedLines: 'معاملة تم تحليلها',
    noLines: 'لم يتم العثور على معاملات في الملف.',
    parseError: 'خطأ في التحليل',
    startReconcile: 'بدء التسوية',
    back: 'رجوع',
    reset: 'إعادة تعيين',
    // Summary
    summaryMatched: 'مطابَق',
    summaryUnmatched: 'غير مطابَق (البنك)',
    summaryUnmatchedApp: 'غير مطابَق (التطبيق)',
    summaryDiff: 'الفرق',
    // Table headers
    stmtSide: 'كشف البنك',
    appSide: 'معاملات التطبيق',
    colDate: 'التاريخ',
    colDesc: 'البيان',
    colRef: 'المرجع',
    colIn: 'دائن',
    colOut: 'مدين',
    colMatch: 'مطابقة',
    // Actions
    autoMatch: 'مطابقة تلقائية',
    matchSelected: 'مطابقة المحدد',
    unmatch: 'إلغاء المطابقة',
    markOk: 'تحديد كـ مقبول',
    unmarkOk: 'إلغاء التحديد',
    // Status labels
    statusMatched: 'مطابَق',
    statusManual: 'يدوي',
    statusOk: 'مقبول',
    statusUnmatched: 'غير مطابَق',
    // Instructions
    selectHint: 'اضغط على سطر من البنك وسطر من التطبيق ثم "مطابقة المحدد"',
    matchedCount: '{n} سطر مطابَق',
    exportNote: 'التسوية مؤقتة للجلسة. استخدم تصدير البيانات من الإعدادات للحفظ.',
    periodFilter: 'تصفية حسب الفترة (اختياري)',
    from: 'من',
    to: 'إلى',
    filterBtn: 'تطبيق',
    noAppTx: 'لا توجد معاملات للحساب / الفترة المحددة.',
  },
} as const

// ── Types ──────────────────────────────────────────────────────────────────────

interface InternalTx {
  id: string
  date: string
  description: string
  debit: number
  credit: number
  type: 'payment' | 'transfer' | 'check'
}

type MatchStatus = 'auto' | 'manual' | 'ok' | null

// ── Helpers ───────────────────────────────────────────────────────────────────

const FORMAT_LABELS: Record<StatementFormat, string> = {
  csv: 'CSV', xlsx: 'Excel (.xlsx)', bai2: 'BAI2',
  mt940: 'MT940 (SWIFT)', camt: 'ISO 20022 (CAMT)', ofx: 'OFX / QFX', unknown: 'Unknown',
}

function amtClose(a: number, b: number) { return Math.abs(a - b) < 0.02 }
function dateDiff(a: string, b: string) {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 86400000
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BankReconciliation() {
  const t = useT(L)
  const { banks, payments, transfers, checks } = useStore()

  const fileRef = useRef<HTMLInputElement>(null)

  // ── Step state ───────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<'setup' | 'reconcile'>('setup')

  // Setup
  const [accountId, setAccountId] = useState('')
  const [fromDate, setFromDate]   = useState('')
  const [toDate, setToDate]       = useState('')
  const [stmtLines, setStmtLines]  = useState<StatementLine[]>([])
  const [format, setFormat]        = useState<StatementFormat>('unknown')
  const [fileName, setFileName]    = useState('')
  const [parseError, setParseError] = useState('')
  const [parsing, setParsing]       = useState(false)

  // Reconciliation
  const [matches, setMatches]   = useState<Map<string, string>>(new Map())  // stmtId → internalId
  const [markedOk, setMarkedOk] = useState<Set<string>>(new Set())          // stmtIds
  const [selStmt, setSelStmt]   = useState<string | null>(null)
  const [selApp,  setSelApp]    = useState<string | null>(null)

  // ── Derived: internal transactions for the selected account ──────────────────
  const internalTxs: InternalTx[] = useMemo(() => {
    if (!accountId) return []
    const result: InternalTx[] = []
    const bank = banks.find(b => b.id === accountId)
    const isCash = bank?.accountType === 'cash'

    for (const p of payments) {
      if (p.bankAccountId !== accountId) continue
      if (isCash && p.type !== 'cash') continue
      if (!isCash && p.type === 'cash') continue
      if (fromDate && p.date < fromDate) continue
      if (toDate   && p.date > toDate)   continue
      result.push({
        id: p.id, date: p.date, description: p.description,
        debit:  p.direction === 'out' ? p.amount : 0,
        credit: p.direction === 'in'  ? p.amount : 0,
        type: 'payment',
      })
    }

    if (!isCash) {
      for (const tf of transfers) {
        if (fromDate && tf.date < fromDate) continue
        if (toDate   && tf.date > toDate)   continue
        if (tf.fromAccountId === accountId) {
          result.push({ id: tf.id, date: tf.date, description: `Transfer to ${banks.find(b=>b.id===tf.toAccountId)?.name??tf.toAccountId}`, debit: tf.amount+tf.fee, credit: 0, type: 'transfer' })
        }
        if (tf.toAccountId === accountId) {
          result.push({ id: tf.id+'_in', date: tf.date, description: `Transfer from ${banks.find(b=>b.id===tf.fromAccountId)?.name??tf.fromAccountId}`, debit: 0, credit: tf.amount, type: 'transfer' })
        }
      }
      for (const c of checks) {
        if (c.bankAccountId !== accountId || c.status !== 'cleared') continue
        if (fromDate && c.dueDate < fromDate) continue
        if (toDate   && c.dueDate > toDate)   continue
        result.push({
          id: c.id, date: c.dueDate,
          description: `Check #${c.checkNumber} — ${c.issuerName || c.payeeName}`,
          debit:  c.type === 'issued'   ? c.amount : 0,
          credit: c.type === 'received' ? c.amount : 0,
          type: 'check',
        })
      }
    }

    return result.sort((a,b) => a.date.localeCompare(b.date))
  }, [accountId, banks, payments, transfers, checks, fromDate, toDate])

  // ── File upload ───────────────────────────────────────────────────────────────
  async function handleFile(file: File) {
    setParsing(true); setParseError('')
    const res = await parseStatement(file)
    setParsing(false)
    setFileName(file.name)
    setFormat(res.format)
    if (res.error) { setParseError(res.error); setStmtLines([]); return }
    if (res.lines.length === 0) { setParseError(t.noLines); setStmtLines([]); return }
    setStmtLines(res.lines)
  }

  // ── Auto-match ────────────────────────────────────────────────────────────────
  const autoMatch = useCallback(() => {
    const usedInternal = new Set<string>()
    const newMatches = new Map<string, string>()

    // Pass 1: exact date + exact amount
    for (const sl of stmtLines) {
      const net = sl.credit - sl.debit
      for (const it of internalTxs) {
        if (usedInternal.has(it.id)) continue
        const itNet = it.credit - it.debit
        if (amtClose(net, itNet) && sl.date === it.date) {
          newMatches.set(sl.id, it.id)
          usedInternal.add(it.id)
          break
        }
      }
    }
    // Pass 2: exact amount + date within ±3 days
    for (const sl of stmtLines) {
      if (newMatches.has(sl.id)) continue
      const net = sl.credit - sl.debit
      for (const it of internalTxs) {
        if (usedInternal.has(it.id)) continue
        const itNet = it.credit - it.debit
        if (amtClose(net, itNet) && dateDiff(sl.date, it.date) <= 3) {
          newMatches.set(sl.id, it.id)
          usedInternal.add(it.id)
          break
        }
      }
    }
    setMatches(newMatches)
  }, [stmtLines, internalTxs])

  function doMatchSelected() {
    if (!selStmt || !selApp) return
    setMatches(m => { const n = new Map(m); n.set(selStmt!, selApp!); return n })
    setSelStmt(null); setSelApp(null)
  }
  function unmatchLine(stmtId: string) {
    setMatches(m => { const n = new Map(m); n.delete(stmtId); return n })
  }
  function toggleOk(stmtId: string) {
    setMarkedOk(s => { const n = new Set(s); n.has(stmtId) ? n.delete(stmtId) : n.add(stmtId); return n })
  }

  // ── Summary stats ─────────────────────────────────────────────────────────────
  const matchedStmt   = stmtLines.filter(l => matches.has(l.id) || markedOk.has(l.id))
  const unmatchedStmt = stmtLines.filter(l => !matches.has(l.id) && !markedOk.has(l.id))
  const matchedAppIds = new Set(matches.values())
  const unmatchedApp  = internalTxs.filter(it => !matchedAppIds.has(it.id))

  const totalStmt    = stmtLines.reduce((s,l) => s + l.credit - l.debit, 0)
  const totalApp     = internalTxs.reduce((s,t) => s + t.credit - t.debit, 0)
  const difference   = totalStmt - totalApp

  const bank = banks.find(b => b.id === accountId)
  const cur  = bank?.currency || 'ILS'

  // ── Phase 1: Setup ────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    const cashBanks    = banks.filter(b => b.accountType === 'cash')
    const currentBanks = banks.filter(b => (b.accountType ?? 'current') === 'current')
    const canStart = !!accountId && stmtLines.length > 0

    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
          <p className="text-gray-500 text-sm">{t.subtitle}</p>
        </div>

        <div className="card space-y-5">
          <h2 className="font-semibold text-white text-sm uppercase tracking-wide">{t.step1}</h2>

          {/* Account selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">{t.account}</label>
              <select className="input" value={accountId} onChange={e => setAccountId(e.target.value)}>
                <option value="">{t.chooseAccount}</option>
                {cashBanks.map(b => <option key={b.id} value={b.id}>{b.name} [Cash]</option>)}
                {currentBanks.map(b => <option key={b.id} value={b.id}>{b.name}{b.bankName ? ` (${b.bankName})` : ''}</option>)}
              </select>
            </div>

            {/* Optional date filter */}
            <div>
              <label className="label">{t.periodFilter}</label>
              <div className="grid grid-cols-2 gap-2">
                <input className="input" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} placeholder={t.from} />
                <input className="input" type="date" value={toDate}   onChange={e => setToDate(e.target.value)}   placeholder={t.to} />
              </div>
            </div>
          </div>

          {/* File upload */}
          <div>
            <label className="label">{t.uploadFile}</label>
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                stmtLines.length > 0
                  ? 'border-green-600/60 bg-green-900/10'
                  : 'border-gray-600 hover:border-yellow-500/60 hover:bg-yellow-500/5'
              }`}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
            >
              {parsing ? (
                <div className="flex flex-col items-center gap-2">
                  <RefreshCw className="w-8 h-8 text-yellow-400 animate-spin" />
                  <p className="text-gray-400 text-sm">Parsing…</p>
                </div>
              ) : stmtLines.length > 0 ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                  <p className="text-white font-medium">{fileName}</p>
                  <p className="text-xs text-gray-400">
                    <span className="text-green-400 font-semibold">{stmtLines.length}</span> {t.parsedLines}
                    {' · '}<span className="text-yellow-400">{FORMAT_LABELS[format]}</span>
                  </p>
                  <button className="text-xs text-gray-500 hover:text-gray-300 underline mt-1"
                    onClick={e => { e.stopPropagation(); fileRef.current?.click() }}>
                    {t.changeFile}
                  </button>
                </div>
              ) : parseError ? (
                <div className="flex flex-col items-center gap-2">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                  <p className="text-red-400 text-sm">{t.parseError}: {parseError}</p>
                  <p className="text-xs text-gray-500">{t.uploadHint}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-gray-500" />
                  <p className="text-gray-400 text-sm font-medium">{t.uploadBtn}</p>
                  <p className="text-xs text-gray-600">{t.uploadHint}</p>
                </div>
              )}
              <input ref={fileRef} type="file"
                accept=".csv,.xlsx,.xls,.ofx,.qfx,.txt,.xml,.sta,.mt940"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
              />
            </div>
          </div>

          {/* Proceed button */}
          <div className="flex justify-end">
            <button
              className={`btn-primary px-6 ${!canStart ? 'opacity-40 cursor-not-allowed' : ''}`}
              disabled={!canStart}
              onClick={() => { setPhase('reconcile'); autoMatch() }}
            >
              {t.startReconcile} →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Phase 2: Reconciliation ───────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
          <p className="text-gray-500 text-sm">
            {bank?.name}{bank?.bankName ? ` · ${bank.bankName}` : ''} · {FORMAT_LABELS[format]}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-2 text-xs"
            onClick={autoMatch}>
            <RefreshCw className="w-3.5 h-3.5" /> {t.autoMatch}
          </button>
          <button className="btn-secondary flex items-center gap-2 text-xs"
            onClick={() => { setPhase('setup'); setMatches(new Map()); setMarkedOk(new Set()); setSelStmt(null); setSelApp(null) }}>
            ← {t.back}
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card py-3">
          <p className="text-xs text-gray-500 flex items-center gap-1"><CheckCheck className="w-3 h-3 text-green-400"/>{t.summaryMatched}</p>
          <p className="text-xl font-bold text-green-400">{matchedStmt.length}</p>
          <p className="text-xs text-gray-600">{formatCurrency(matchedStmt.reduce((s,l)=>s+l.credit-l.debit,0), cur)}</p>
        </div>
        <div className="card py-3">
          <p className="text-xs text-gray-500 flex items-center gap-1"><AlertCircle className="w-3 h-3 text-orange-400"/>{t.summaryUnmatched}</p>
          <p className="text-xl font-bold text-orange-400">{unmatchedStmt.length}</p>
          <p className="text-xs text-gray-600">{formatCurrency(unmatchedStmt.reduce((s,l)=>s+l.credit-l.debit,0), cur)}</p>
        </div>
        <div className="card py-3">
          <p className="text-xs text-gray-500 flex items-center gap-1"><CircleDot className="w-3 h-3 text-blue-400"/>{t.summaryUnmatchedApp}</p>
          <p className="text-xl font-bold text-blue-400">{unmatchedApp.length}</p>
          <p className="text-xs text-gray-600">{formatCurrency(unmatchedApp.reduce((s,t)=>s+t.credit-t.debit,0), cur)}</p>
        </div>
        <div className="card py-3">
          <p className="text-xs text-gray-500">{t.summaryDiff}</p>
          <p className={`text-xl font-bold ${Math.abs(difference) < 0.01 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(difference, cur)}
          </p>
          {Math.abs(difference) < 0.01 && (
            <p className="text-xs text-green-600">✓ Balanced</p>
          )}
        </div>
      </div>

      {/* Manual match toolbar */}
      {(selStmt || selApp) && (
        <div className="bg-yellow-900/30 border border-yellow-700/40 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-xs text-yellow-300">{t.selectHint}</p>
          <div className="flex gap-2 shrink-0">
            <button
              className={`btn-primary text-xs py-1.5 px-3 ${(!selStmt || !selApp) ? 'opacity-40 cursor-not-allowed' : ''}`}
              disabled={!selStmt || !selApp}
              onClick={doMatchSelected}
            >
              <Link2 className="w-3.5 h-3.5 inline mr-1" />{t.matchSelected}
            </button>
            <button className="btn-secondary text-xs py-1.5 px-3"
              onClick={() => { setSelStmt(null); setSelApp(null) }}>
              <X className="w-3.5 h-3.5 inline mr-1" />{t.reset}
            </button>
          </div>
        </div>
      )}

      {/* Split reconciliation table */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* ── Bank Statement Side ── */}
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-700 bg-gray-900/40">
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wide flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-yellow-400" />
              {t.stmtSide}
              <span className="text-gray-600 font-normal normal-case">{stmtLines.length} rows</span>
            </h3>
          </div>
          <div className="overflow-y-auto max-h-[500px]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-800 z-10">
                <tr className="border-b border-gray-700">
                  <th className="text-left px-3 py-2 text-gray-500">{t.colDate}</th>
                  <th className="text-left px-3 py-2 text-gray-500">{t.colDesc}</th>
                  <th className="text-right px-3 py-2 text-gray-500">{t.colIn}</th>
                  <th className="text-right px-3 py-2 text-gray-500">{t.colOut}</th>
                  <th className="px-3 py-2 text-gray-500 text-center">{t.colMatch}</th>
                </tr>
              </thead>
              <tbody>
                {stmtLines.map(sl => {
                  const isMatched = matches.has(sl.id)
                  const isOk      = markedOk.has(sl.id)
                  const isSel     = selStmt === sl.id
                  const matchedTo = isMatched ? internalTxs.find(it => it.id === matches.get(sl.id)) : null

                  return (
                    <tr
                      key={sl.id}
                      onClick={() => !isMatched && !isOk && setSelStmt(s => s === sl.id ? null : sl.id)}
                      className={`border-b border-gray-700/40 transition-colors cursor-pointer ${
                        isSel     ? 'bg-yellow-500/10 border-yellow-500/30' :
                        isMatched ? 'bg-green-900/20 hover:bg-green-900/30' :
                        isOk      ? 'bg-gray-800/60 opacity-60'            :
                                    'hover:bg-gray-700/30'
                      }`}
                    >
                      <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{formatDate(sl.date)}</td>
                      <td className="px-3 py-2 text-gray-300 max-w-[140px]">
                        <p className="truncate">{sl.description}</p>
                        {sl.reference && <p className="text-[10px] text-gray-600 truncate">{sl.reference}</p>}
                        {matchedTo && (
                          <p className="text-[10px] text-green-500 truncate">→ {matchedTo.description}</p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right text-green-400 whitespace-nowrap">
                        {sl.credit > 0 ? formatCurrency(sl.credit, cur) : '—'}
                      </td>
                      <td className="px-3 py-2 text-right text-red-400 whitespace-nowrap">
                        {sl.debit > 0 ? formatCurrency(sl.debit, cur) : '—'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {isMatched ? (
                          <div className="flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                            <button
                              className="text-[10px] text-red-400 hover:text-red-300"
                              onClick={e => { e.stopPropagation(); unmatchLine(sl.id) }}
                            >{t.unmatch}</button>
                          </div>
                        ) : isOk ? (
                          <div className="flex items-center justify-center gap-1">
                            <CheckCheck className="w-3.5 h-3.5 text-gray-500" />
                            <button
                              className="text-[10px] text-gray-500 hover:text-gray-300"
                              onClick={e => { e.stopPropagation(); toggleOk(sl.id) }}
                            >{t.unmarkOk}</button>
                          </div>
                        ) : (
                          <button
                            className="text-[10px] text-gray-600 hover:text-yellow-400 underline"
                            onClick={e => { e.stopPropagation(); toggleOk(sl.id) }}
                          >{t.markOk}</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── App Transactions Side ── */}
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-700 bg-gray-900/40">
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wide flex items-center gap-2">
              <Landmark className="w-3.5 h-3.5 text-blue-400" />
              {t.appSide}
              <span className="text-gray-600 font-normal normal-case">{internalTxs.length} rows</span>
            </h3>
          </div>
          {internalTxs.length === 0 ? (
            <p className="text-sm text-gray-600 p-6 text-center">{t.noAppTx}</p>
          ) : (
            <div className="overflow-y-auto max-h-[500px]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-800 z-10">
                  <tr className="border-b border-gray-700">
                    <th className="text-left px-3 py-2 text-gray-500">{t.colDate}</th>
                    <th className="text-left px-3 py-2 text-gray-500">{t.colRef}</th>
                    <th className="text-left px-3 py-2 text-gray-500">{t.colDesc}</th>
                    <th className="text-right px-3 py-2 text-gray-500">{t.colIn}</th>
                    <th className="text-right px-3 py-2 text-gray-500">{t.colOut}</th>
                  </tr>
                </thead>
                <tbody>
                  {internalTxs.map(it => {
                    const isUsed = matchedAppIds.has(it.id)
                    const isSel  = selApp === it.id
                    const stmtForThis = isUsed
                      ? stmtLines.find(sl => matches.get(sl.id) === it.id)
                      : null

                    return (
                      <tr
                        key={it.id}
                        onClick={() => !isUsed && setSelApp(s => s === it.id ? null : it.id)}
                        className={`border-b border-gray-700/40 transition-colors cursor-pointer ${
                          isSel    ? 'bg-yellow-500/10 border-yellow-500/30' :
                          isUsed   ? 'bg-green-900/20 hover:bg-green-900/30 opacity-70' :
                                     'hover:bg-gray-700/30'
                        }`}
                      >
                        <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{formatDate(it.date)}</td>
                        <td className="px-3 py-2 font-mono text-yellow-600 whitespace-nowrap">{it.id}</td>
                        <td className="px-3 py-2 text-gray-300 max-w-[150px]">
                          <p className="truncate">{it.description}</p>
                          {stmtForThis && (
                            <p className="text-[10px] text-green-500 truncate">↔ {stmtForThis.description}</p>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-green-400 whitespace-nowrap">
                          {it.credit > 0 ? formatCurrency(it.credit, cur) : '—'}
                        </td>
                        <td className="px-3 py-2 text-right text-red-400 whitespace-nowrap">
                          {it.debit > 0 ? formatCurrency(it.debit, cur) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Footer note */}
      <p className="text-xs text-gray-600 text-center">{t.exportNote}</p>
    </div>
  )
}
