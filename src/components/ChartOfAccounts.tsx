import { useState, useMemo, Fragment } from 'react'
import { useStore } from '../store/useStore'
import { useT } from '../hooks/useT'
import { Plus, Pencil, Trash2, X, BookOpen, Sparkles, Lock } from 'lucide-react'
import type { ChartAccount, AccountType } from '../types'

const L = {
  en: {
    title: 'Chart of Accounts',
    subtitle: 'Structured accounts for double-entry bookkeeping',
    seedBtn: 'Seed default accounts',
    newAccount: 'New Account',
    seedHint: 'Click "Seed default accounts" to populate the standard electrician chart of accounts.',
    empty: 'No accounts yet',
    confirmDelete: 'Delete this account? Journal entries that use it will not be deleted.',
    cannotDeleteSystem: 'System accounts cannot be deleted. You can deactivate them instead.',
    code: 'Code',
    name: 'Account Name',
    type: 'Type',
    parent: 'Parent',
    actions: 'Actions',
    system: 'System',
    inactive: 'Inactive',
    asset: 'Assets',
    liability: 'Liabilities',
    equity: 'Equity',
    revenue: 'Revenue',
    expense: 'Expenses',
    modalEdit: 'Edit Account',
    modalNew: 'New Account',
    fieldCode: 'Code *',
    fieldNameEn: 'Name (English) *',
    fieldNameAr: 'Name (Arabic) *',
    fieldType: 'Account Type *',
    fieldParent: 'Parent Account',
    fieldDescription: 'Description',
    fieldActive: 'Active',
    none: '— None —',
    cancel: 'Cancel',
    save: 'Save',
    add: 'Add',
    duplicateCode: 'An account with this code already exists',
  },
  ar: {
    title: 'دليل الحسابات',
    subtitle: 'حسابات منظمة لمسك دفاتر القيد المزدوج',
    seedBtn: 'تعبئة الحسابات الافتراضية',
    newAccount: 'حساب جديد',
    seedHint: 'انقر "تعبئة الحسابات الافتراضية" لإنشاء دليل حسابات قياسي للكهربائيين.',
    empty: 'لا توجد حسابات بعد',
    confirmDelete: 'حذف هذا الحساب؟ القيود المرتبطة به لن تُحذف.',
    cannotDeleteSystem: 'لا يمكن حذف حسابات النظام. يمكنك تعطيلها بدلاً من ذلك.',
    code: 'الرمز',
    name: 'اسم الحساب',
    type: 'النوع',
    parent: 'الحساب الأب',
    actions: 'إجراءات',
    system: 'نظام',
    inactive: 'غير مفعل',
    asset: 'الأصول',
    liability: 'الخصوم',
    equity: 'حقوق الملكية',
    revenue: 'الإيرادات',
    expense: 'المصروفات',
    modalEdit: 'تعديل الحساب',
    modalNew: 'حساب جديد',
    fieldCode: 'الرمز *',
    fieldNameEn: 'الاسم (الإنجليزية) *',
    fieldNameAr: 'الاسم (العربية) *',
    fieldType: 'نوع الحساب *',
    fieldParent: 'الحساب الأب',
    fieldDescription: 'الوصف',
    fieldActive: 'مفعل',
    none: '— لا يوجد —',
    cancel: 'إلغاء',
    save: 'حفظ',
    add: 'إضافة',
    duplicateCode: 'يوجد حساب آخر بهذا الرمز',
  },
} as const

const TYPE_ORDER: AccountType[] = ['asset', 'liability', 'equity', 'revenue', 'expense']

const TYPE_COLOR: Record<AccountType, string> = {
  asset:     'bg-green-900/40 text-green-300',
  liability: 'bg-red-900/40 text-red-300',
  equity:    'bg-blue-900/40 text-blue-300',
  revenue:   'bg-purple-900/40 text-purple-300',
  expense:   'bg-orange-900/40 text-orange-300',
}

const EMPTY = (): Omit<ChartAccount, 'id' | 'createdAt'> => ({
  code: '',
  nameEn: '',
  nameAr: '',
  type: 'asset',
  parentCode: '',
  isSystem: false,
  isActive: true,
  description: '',
})

function Modal({
  initial, accounts, onSave, onClose,
}: {
  initial: Omit<ChartAccount, 'id' | 'createdAt'>
  accounts: ChartAccount[]
  onSave: (d: Omit<ChartAccount, 'id' | 'createdAt'>) => void
  onClose: () => void
}) {
  const t = useT(L)
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')
  const set = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }))

  // Possible parents: same type, not self, not descendants
  const parentOptions = accounts.filter(a =>
    a.type === form.type && a.code !== initial.code,
  )

  function handleSave() {
    if (!form.code.trim() || !form.nameEn.trim() || !form.nameAr.trim()) return
    // Check duplicate code (only when creating, or when changing code)
    const codeExists = accounts.some(a => a.code === form.code && a.code !== initial.code)
    if (codeExists) {
      setError(t.duplicateCode)
      return
    }
    onSave(form)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="font-semibold text-white">{initial.code ? t.modalEdit : t.modalNew}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t.fieldCode}</label>
              <input
                className="input font-mono"
                value={form.code}
                placeholder="1100"
                disabled={form.isSystem}
                onChange={e => { setError(''); set('code', e.target.value) }}
              />
            </div>
            <div>
              <label className="label">{t.fieldType}</label>
              <select
                className="input"
                value={form.type}
                disabled={form.isSystem}
                onChange={e => set('type', e.target.value as AccountType)}
              >
                {TYPE_ORDER.map(typ => (
                  <option key={typ} value={typ}>{t[typ]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">{t.fieldNameEn}</label>
            <input className="input" value={form.nameEn}
              onChange={e => set('nameEn', e.target.value)} />
          </div>
          <div>
            <label className="label">{t.fieldNameAr}</label>
            <input className="input" value={form.nameAr}
              onChange={e => set('nameAr', e.target.value)} />
          </div>

          <div>
            <label className="label">{t.fieldParent}</label>
            <select className="input" value={form.parentCode ?? ''}
              onChange={e => set('parentCode', e.target.value)}>
              <option value="">{t.none}</option>
              {parentOptions.map(p => (
                <option key={p.code} value={p.code}>{p.code} — {p.nameEn}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">{t.fieldDescription}</label>
            <textarea className="input resize-none" rows={2} value={form.description ?? ''}
              onChange={e => set('description', e.target.value)} />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={form.isActive}
              onChange={e => set('isActive', e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-yellow-500" />
            {t.fieldActive}
          </label>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-700">
          <button className="btn-secondary" onClick={onClose}>{t.cancel}</button>
          <button className="btn-primary" onClick={handleSave}>
            {initial.code ? t.save : t.add}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ChartOfAccounts() {
  const t = useT(L)
  const chartAccounts = useStore(s => s.chartAccounts)
  const addChartAccount    = useStore(s => s.addChartAccount)
  const updateChartAccount = useStore(s => s.updateChartAccount)
  const deleteChartAccount = useStore(s => s.deleteChartAccount)
  const seedChartOfAccounts = useStore(s => s.seedChartOfAccounts)

  const [modal, setModal] = useState<{ open: boolean; account?: ChartAccount }>({ open: false })

  // Group by type, then by code (so parents appear before children)
  const grouped = useMemo(() => {
    const groups: Record<AccountType, ChartAccount[]> = {
      asset: [], liability: [], equity: [], revenue: [], expense: [],
    }
    for (const a of chartAccounts) groups[a.type].push(a)
    for (const k of TYPE_ORDER) groups[k].sort((a, b) => a.code.localeCompare(b.code))
    return groups
  }, [chartAccounts])

  const accountByCode = useMemo(() => {
    const map = new Map<string, ChartAccount>()
    for (const a of chartAccounts) map.set(a.code, a)
    return map
  }, [chartAccounts])

  function handleSave(data: Omit<ChartAccount, 'id' | 'createdAt'>) {
    if (modal.account) updateChartAccount(modal.account.id, data)
    else addChartAccount(data)
    setModal({ open: false })
  }

  function handleDelete(account: ChartAccount) {
    if (account.isSystem) {
      alert(t.cannotDeleteSystem)
      return
    }
    if (confirm(t.confirmDelete)) deleteChartAccount(account.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
          <p className="text-gray-500 text-sm">{t.subtitle}</p>
        </div>
        <div className="flex gap-2">
          {chartAccounts.length === 0 && (
            <button className="btn-secondary flex items-center gap-2" onClick={seedChartOfAccounts}>
              <Sparkles className="w-4 h-4" /> {t.seedBtn}
            </button>
          )}
          <button className="btn-primary flex items-center gap-2" onClick={() => setModal({ open: true })}>
            <Plus className="w-4 h-4" /> {t.newAccount}
          </button>
        </div>
      </div>

      {chartAccounts.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="w-12 h-12 text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">{t.empty}</p>
          <p className="text-gray-600 text-sm mt-1 max-w-sm">{t.seedHint}</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.code}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.name}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">{t.type}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">{t.parent}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {TYPE_ORDER.map(type => (
                grouped[type].length > 0 && (
                  <Fragment key={type}>
                    <tr className="bg-gray-800/50">
                      <td colSpan={5} className="px-5 py-2">
                        <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded ${TYPE_COLOR[type]}`}>
                          {t[type]}
                        </span>
                      </td>
                    </tr>
                    {grouped[type].map(acc => {
                      const parent = acc.parentCode ? accountByCode.get(acc.parentCode) : null
                      // Indent based on whether it has a parent (1 level for now)
                      const indent = parent ? 'pl-8' : ''
                      return (
                        <tr key={acc.id} className={`border-b border-gray-700/40 hover:bg-gray-700/20 transition-colors ${!acc.isActive ? 'opacity-50' : ''}`}>
                          <td className={`px-5 py-2.5 font-mono text-xs text-yellow-400 ${indent}`}>{acc.code}</td>
                          <td className="px-5 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-white">{acc.nameEn}</span>
                              {acc.isSystem && (
                                <Lock className="w-3 h-3 text-gray-600" aria-label={t.system} />
                              )}
                              {!acc.isActive && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-400">
                                  {t.inactive}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500" dir="rtl">{acc.nameAr}</p>
                          </td>
                          <td className="px-5 py-2.5 hidden md:table-cell">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${TYPE_COLOR[acc.type]}`}>
                              {t[acc.type]}
                            </span>
                          </td>
                          <td className="px-5 py-2.5 hidden lg:table-cell text-gray-500 font-mono text-xs">
                            {parent ? `${parent.code} — ${parent.nameEn}` : '—'}
                          </td>
                          <td className="px-5 py-2.5">
                            <div className="flex items-center gap-2 justify-end">
                              <button className="text-gray-500 hover:text-yellow-400" onClick={() => setModal({ open: true, account: acc })}>
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                className="text-gray-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed"
                                disabled={acc.isSystem}
                                onClick={() => handleDelete(acc)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </Fragment>
                )
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal.open && (
        <Modal
          initial={modal.account ? {
            code: modal.account.code,
            nameEn: modal.account.nameEn,
            nameAr: modal.account.nameAr,
            type: modal.account.type,
            parentCode: modal.account.parentCode ?? '',
            isSystem: modal.account.isSystem,
            isActive: modal.account.isActive,
            description: modal.account.description ?? '',
          } : EMPTY()}
          accounts={chartAccounts}
          onSave={handleSave}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  )
}
