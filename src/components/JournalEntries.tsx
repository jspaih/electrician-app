import { useState } from 'react'
import { useStore } from '../store/useStore'
import { formatDate, today } from '../utils/helpers'
import { Plus, Pencil, Trash2, X, BookOpen, PlusCircle, MinusCircle, Printer } from 'lucide-react'
import type { JournalEntry, JournalLine } from '../types'
import { useT } from '../hooks/useT'

const L = {
  en: {
    title: 'Journal Entries',
    subtitle: 'General-purpose accounting entries (debit / credit)',
    newEntry: 'New Entry',
    editTitle: 'Edit Journal Entry',
    newTitle: 'New Journal Entry',
    date: 'Date',
    reference: 'Reference / Description',
    referencePh: 'e.g. Depreciation Q1, Accrual adjustment…',
    client: 'Client (optional)',
    supplier: 'Supplier (optional)',
    project: 'Project (optional)',
    notes: 'Notes',
    notesPh: 'Internal notes…',
    lines: 'Debit / Credit Lines',
    account: 'Account Name',
    accountPh: 'e.g. Cash, Revenue, Accounts Payable…',
    debit: 'Debit',
    credit: 'Credit',
    lineNotes: 'Notes',
    addLine: 'Add Line',
    cancel: 'Cancel',
    save: 'Save',
    print: 'Print',
    confirmDelete: 'Delete this journal entry?',
    colDate: 'Date',
    colRef: 'Reference',
    colDebit: 'Total Debit',
    colCredit: 'Total Credit',
    colLinked: 'Linked',
    colSource: 'Source',
    sourceAll: 'All sources',
    sourceManual: 'Manual',
    sourceAuto: 'Auto-generated',
    sourceLabels: {
      manual:           'Manual',
      receipt:          'Receipt',
      payment:          'Payment',
      sales_invoice:    'Sales Invoice',
      purchase_invoice: 'Purchase Invoice',
      stock_movement:   'Stock Movement',
      labor_entry:      'Labor',
      bank_transfer:    'Bank Transfer',
      check_deposit:    'Check Deposit',
      check_cleared:    'Check Cleared',
    } as Record<string, string>,
    empty: 'No journal entries yet',
    emptyHint: 'Record any accounting entry with debit and credit lines',
    balanced: 'Balanced',
    unbalanced: 'Not balanced — debit must equal credit',
    noAccount: 'Each line needs an account name',
    chooseNone: '-- None --',
    totalDebit: 'Total Debit',
    totalCredit: 'Total Credit',
  },
  ar: {
    title: 'قيود اليومية',
    subtitle: 'قيود محاسبية عامة (مدين / دائن)',
    newEntry: 'قيد جديد',
    editTitle: 'تعديل قيد اليومية',
    newTitle: 'قيد يومية جديد',
    date: 'التاريخ',
    reference: 'المرجع / الوصف',
    referencePh: 'مثال: إهلاك الربع الأول، تسوية مستحقات…',
    client: 'العميل (اختياري)',
    supplier: 'المورد (اختياري)',
    project: 'المشروع (اختياري)',
    notes: 'ملاحظات',
    notesPh: 'ملاحظات داخلية…',
    lines: 'سطور المدين / الدائن',
    account: 'اسم الحساب',
    accountPh: 'مثال: نقدية، إيرادات، حسابات مستحقة الدفع…',
    debit: 'مدين',
    credit: 'دائن',
    lineNotes: 'ملاحظات',
    addLine: 'إضافة سطر',
    cancel: 'إلغاء',
    save: 'حفظ',
    print: 'طباعة',
    confirmDelete: 'حذف هذا القيد؟',
    colDate: 'التاريخ',
    colRef: 'المرجع',
    colDebit: 'إجمالي المدين',
    colCredit: 'إجمالي الدائن',
    colLinked: 'مرتبط بـ',
    colSource: 'المصدر',
    sourceAll: 'جميع المصادر',
    sourceManual: 'يدوي',
    sourceAuto: 'تلقائي',
    sourceLabels: {
      manual:           'يدوي',
      receipt:          'إيصال',
      payment:          'دفعة',
      sales_invoice:    'فاتورة مبيعات',
      purchase_invoice: 'فاتورة شراء',
      stock_movement:   'حركة مخزون',
      labor_entry:      'عمالة',
      bank_transfer:    'تحويل بنكي',
      check_deposit:    'إيداع شيك',
      check_cleared:    'تسوية شيك',
    } as Record<string, string>,
    empty: 'لا توجد قيود يومية بعد',
    emptyHint: 'سجّل أي قيد محاسبي بسطور المدين والدائن',
    balanced: 'متوازن',
    unbalanced: 'غير متوازن — المدين يجب أن يساوي الدائن',
    noAccount: 'كل سطر يحتاج اسم حساب',
    chooseNone: '-- لا شيء --',
    totalDebit: 'إجمالي المدين',
    totalCredit: 'إجمالي الدائن',
  },
} as const

function newLine(): JournalLine {
  return { id: crypto.randomUUID(), accountName: '', debit: 0, credit: 0, notes: '' }
}

const EMPTY = (): Omit<JournalEntry, 'id' | 'createdAt'> => ({
  date: today(),
  reference: '',
  lines: [newLine(), newLine()],
  totalDebit: 0,
  totalCredit: 0,
  projectId: '',
  clientId: '',
  supplierId: '',
  notes: '',
})

// ─── Print Modal ─────────────────────────────────────────────────────────────
function PrintModal({ entry, onClose }: { entry: JournalEntry; onClose: () => void }) {
  const { clients, suppliers, projects } = useStore()
  const client   = clients.find(c => c.id === entry.clientId)
  const supplier = suppliers.find(s => s.id === entry.supplierId)
  const project  = projects.find(p => p.id === entry.projectId)

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white text-gray-900 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-gray-100 print:hidden">
          <span className="font-semibold">Print Preview</span>
          <div className="flex gap-3">
            <button className="btn-primary text-sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 inline mr-1" />Print
            </button>
            <button onClick={onClose}><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="p-8 print:p-4">
          <h2 className="text-xl font-bold mb-1">Journal Entry — {entry.id}</h2>
          <div className="flex gap-6 text-sm text-gray-600 mb-2">
            <span>Date: {formatDate(entry.date)}</span>
            {client   && <span>Client: {client.name}</span>}
            {supplier && <span>Supplier: {supplier.name}</span>}
            {project  && <span>Project: {project.name}</span>}
          </div>
          {entry.reference && <p className="text-gray-700 mb-4">{entry.reference}</p>}
          <table className="w-full text-sm border-collapse mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left">Account</th>
                <th className="border border-gray-300 px-3 py-2 text-right">Debit</th>
                <th className="border border-gray-300 px-3 py-2 text-right">Credit</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {entry.lines.map(line => (
                <tr key={line.id}>
                  <td className="border border-gray-200 px-3 py-2">{line.accountName}</td>
                  <td className="border border-gray-200 px-3 py-2 text-right">
                    {line.debit > 0 ? line.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-right">
                    {line.credit > 0 ? line.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-gray-500">{line.notes}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td className="border border-gray-300 px-3 py-2">Total</td>
                <td className="border border-gray-300 px-3 py-2 text-right">
                  {entry.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right">
                  {entry.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="border border-gray-300 px-3 py-2" />
              </tr>
            </tfoot>
          </table>
          {entry.notes && <p className="text-sm text-gray-600">Notes: {entry.notes}</p>}
        </div>
      </div>
    </div>
  )
}

// ─── Modal ───────────────────────────────────────────────────────────────────
function Modal({
  initial,
  onSave,
  onClose,
}: {
  initial: Omit<JournalEntry, 'id' | 'createdAt'>
  onSave: (d: Omit<JournalEntry, 'id' | 'createdAt'>) => void
  onClose: () => void
}) {
  const t = useT(L)
  const { clients, suppliers, projects } = useStore()
  const [form, setForm] = useState<Omit<JournalEntry, 'id' | 'createdAt'>>(initial)

  const totalDebit  = form.lines.reduce((s, l) => s + (l.debit  || 0), 0)
  const totalCredit = form.lines.reduce((s, l) => s + (l.credit || 0), 0)
  const isBalanced  = totalDebit > 0 && Math.abs(totalDebit - totalCredit) < 0.001

  function updateLine(idx: number, patch: Partial<JournalLine>) {
    setForm(f => {
      const lines = f.lines.map((l, i) => i === idx ? { ...l, ...patch } : l)
      return { ...f, lines }
    })
  }

  function addLine() {
    setForm(f => ({ ...f, lines: [...f.lines, newLine()] }))
  }

  function removeLine(idx: number) {
    if (form.lines.length <= 2) return
    setForm(f => ({ ...f, lines: f.lines.filter((_, i) => i !== idx) }))
  }

  function handleSave() {
    if (!form.reference.trim()) return
    if (!isBalanced) return
    if (form.lines.some(l => !l.accountName.trim())) return
    onSave({ ...form, totalDebit, totalCredit })
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-2xl shadow-2xl my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="font-semibold text-white">
            {initial.reference ? t.editTitle : t.newTitle}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Header fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t.date}</label>
              <input className="input" type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className="label">{t.reference}</label>
              <input className="input" value={form.reference} placeholder={t.referencePh}
                onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} />
            </div>
          </div>

          {/* Optional links */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">{t.client}</label>
              <select className="input" value={form.clientId ?? ''}
                onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}>
                <option value="">{t.chooseNone}</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t.supplier}</label>
              <select className="input" value={form.supplierId ?? ''}
                onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}>
                <option value="">{t.chooseNone}</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t.project}</label>
              <select className="input" value={form.projectId ?? ''}
                onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}>
                <option value="">{t.chooseNone}</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          {/* Debit / Credit lines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">{t.lines}</label>
              <button
                className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300"
                onClick={addLine}
              >
                <PlusCircle className="w-3.5 h-3.5" /> {t.addLine}
              </button>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_100px_100px_100px_28px] gap-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1 px-1">
              <span>{t.account}</span>
              <span className="text-right">{t.debit}</span>
              <span className="text-right">{t.credit}</span>
              <span>{t.lineNotes}</span>
              <span />
            </div>

            <div className="space-y-2">
              {form.lines.map((line, idx) => (
                <div key={line.id} className="grid grid-cols-[1fr_100px_100px_100px_28px] gap-2 items-center">
                  <input
                    className="input py-1.5 text-sm"
                    value={line.accountName}
                    placeholder={t.accountPh}
                    onChange={e => updateLine(idx, { accountName: e.target.value })}
                  />
                  <input
                    className="input py-1.5 text-sm text-right"
                    type="number"
                    min={0}
                    step="0.01"
                    value={line.debit || ''}
                    placeholder="0.00"
                    onChange={e => updateLine(idx, { debit: parseFloat(e.target.value) || 0 })}
                  />
                  <input
                    className="input py-1.5 text-sm text-right"
                    type="number"
                    min={0}
                    step="0.01"
                    value={line.credit || ''}
                    placeholder="0.00"
                    onChange={e => updateLine(idx, { credit: parseFloat(e.target.value) || 0 })}
                  />
                  <input
                    className="input py-1.5 text-sm"
                    value={line.notes}
                    placeholder="—"
                    onChange={e => updateLine(idx, { notes: e.target.value })}
                  />
                  <button
                    className="text-gray-600 hover:text-red-400 disabled:opacity-30"
                    disabled={form.lines.length <= 2}
                    onClick={() => removeLine(idx)}
                  >
                    <MinusCircle className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Totals row */}
            <div className="grid grid-cols-[1fr_100px_100px_100px_28px] gap-2 mt-3 pt-3 border-t border-gray-700">
              <span className="text-sm font-semibold text-gray-300">Total</span>
              <span className={`text-sm font-bold text-right ${isBalanced ? 'text-green-400' : 'text-yellow-400'}`}>
                {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className={`text-sm font-bold text-right ${isBalanced ? 'text-green-400' : 'text-yellow-400'}`}>
                {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span />
              <span />
            </div>

            {/* Balance status */}
            <p className={`text-xs mt-2 font-medium ${isBalanced ? 'text-green-400' : 'text-red-400'}`}>
              {isBalanced ? `✓ ${t.balanced}` : `✗ ${t.unbalanced}`}
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="label">{t.notes}</label>
            <textarea
              className="input resize-none"
              rows={2}
              value={form.notes}
              placeholder={t.notesPh}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-700">
          <button className="btn-secondary" onClick={onClose}>{t.cancel}</button>
          <button
            className="btn-primary disabled:opacity-40"
            disabled={!isBalanced || !form.reference.trim() || form.lines.some(l => !l.accountName.trim())}
            onClick={handleSave}
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function JournalEntries() {
  const t = useT(L)
  const { journalEntries, clients, suppliers, projects, addJournalEntry, updateJournalEntry, deleteJournalEntry } = useStore()
  const [modal, setModal]     = useState<{ open: boolean; entry?: JournalEntry }>({ open: false })
  const [printEntry, setPrint] = useState<JournalEntry | null>(null)
  const [sourceFilter, setSourceFilter] = useState<'all' | 'manual' | 'auto'>('all')

  const sorted = [...journalEntries]
    .filter(e => {
      if (sourceFilter === 'all') return true
      const src = e.source ?? 'manual'
      if (sourceFilter === 'manual') return src === 'manual'
      return src !== 'manual'
    })
    .sort((a, b) => b.date.localeCompare(a.date))

  function handleSave(data: Omit<JournalEntry, 'id' | 'createdAt'>) {
    if (modal.entry) updateJournalEntry(modal.entry.id, data)
    else addJournalEntry(data)
    setModal({ open: false })
  }

  function linkedLabel(entry: JournalEntry) {
    const parts: string[] = []
    const client   = clients.find(c => c.id === entry.clientId)
    const supplier = suppliers.find(s => s.id === entry.supplierId)
    const project  = projects.find(p => p.id === entry.projectId)
    if (client)   parts.push(client.name)
    if (supplier) parts.push(supplier.name)
    if (project)  parts.push(project.name)
    return parts.join(', ') || '—'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
          <p className="text-gray-500 text-sm">{t.subtitle}</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal({ open: true })}>
          <Plus className="w-4 h-4" /> {t.newEntry}
        </button>
      </div>

      {/* Source filter */}
      {journalEntries.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 uppercase tracking-wide">{t.colSource}:</span>
          <div className="flex gap-1">
            {(['all', 'manual', 'auto'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSourceFilter(s)}
                className={`text-xs px-3 py-1 rounded transition-colors ${
                  sourceFilter === s
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-transparent'
                }`}
              >
                {s === 'all' ? t.sourceAll : s === 'manual' ? t.sourceManual : t.sourceAuto}
              </button>
            ))}
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="w-12 h-12 text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">{t.empty}</p>
          <p className="text-gray-600 text-sm mt-1">{t.emptyHint}</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colDate}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colRef}</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colDebit}</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colCredit}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">{t.colSource}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">{t.colLinked}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {sorted.map(entry => (
                <tr key={entry.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                  <td className="px-5 py-3 text-gray-300 whitespace-nowrap">{formatDate(entry.date)}</td>
                  <td className="px-5 py-3">
                    <p className="text-white font-medium truncate max-w-[220px]">{entry.reference}</p>
                    <p className="text-xs text-gray-500">{entry.id}</p>
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-green-400">
                    {entry.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-blue-400">
                    {entry.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    {(() => {
                      const src = entry.source ?? 'manual'
                      const isAuto = src !== 'manual'
                      return (
                        <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          isAuto
                            ? 'bg-blue-900/40 text-blue-300'
                            : 'bg-gray-700 text-gray-300'
                        }`}>
                          {t.sourceLabels[src] ?? src}
                        </span>
                      )
                    })()}
                  </td>
                  <td className="px-5 py-3 text-gray-500 hidden lg:table-cell truncate max-w-[160px]">
                    {linkedLabel(entry)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button className="text-gray-500 hover:text-blue-400" onClick={() => setPrint(entry)}>
                        <Printer className="w-4 h-4" />
                      </button>
                      <button className="text-gray-500 hover:text-yellow-400" onClick={() => setModal({ open: true, entry })}>
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        className="text-gray-500 hover:text-red-400"
                        onClick={() => { if (confirm(t.confirmDelete)) deleteJournalEntry(entry.id) }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal.open && (
        <Modal
          initial={modal.entry ? {
            date: modal.entry.date,
            reference: modal.entry.reference,
            lines: modal.entry.lines,
            totalDebit: modal.entry.totalDebit,
            totalCredit: modal.entry.totalCredit,
            projectId: modal.entry.projectId ?? '',
            clientId: modal.entry.clientId ?? '',
            supplierId: modal.entry.supplierId ?? '',
            notes: modal.entry.notes,
          } : EMPTY()}
          onSave={handleSave}
          onClose={() => setModal({ open: false })}
        />
      )}

      {printEntry && <PrintModal entry={printEntry} onClose={() => setPrint(null)} />}
    </div>
  )
}
