import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { Plus, Pencil, Trash2, X, Search, Truck, FileText, CreditCard } from 'lucide-react'
import { useT } from '../hooks/useT'
import type { Supplier } from '../types'

const L = {
  en: {
    title: 'Suppliers',
    count: '{n} suppliers',
    newSupplier: 'New Supplier',
    searchPlaceholder: 'Search suppliers…',
    noSuppliers: 'No suppliers yet',
    addHint: 'Add your electrical material suppliers here',
    colId: 'ID',
    colSupplier: 'Supplier',
    colPhone: 'Phone',
    colEmail: 'Email',
    colItems: 'Items',
    modalEdit: 'Edit Supplier',
    modalNew: 'New Supplier',
    supplierName: 'Supplier Name (English) *',
    supplierNamePlaceholder: 'ABC Electrical Supplies',
    nameAr: 'Name (Arabic)',
    nameArPlaceholder: 'اسم المورد بالعربية',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    notes: 'Notes',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    addSupplier: 'Add Supplier',
    cannotDelete: 'Cannot delete — this supplier is linked to {i} item(s) and {p} payment(s).',
    viewStatement: 'Statement',
    makePayment: 'Pay',
    confirmDelete: 'Delete this supplier?',
  },
  ar: {
    title: 'الموردين',
    count: '{n} مورد',
    newSupplier: 'مورد جديد',
    searchPlaceholder: 'بحث في الموردين...',
    noSuppliers: 'لا يوجد موردين بعد',
    addHint: 'أضف موردي المواد الكهربائية هنا',
    colId: 'المعرّف',
    colSupplier: 'المورد',
    colPhone: 'الهاتف',
    colEmail: 'البريد الإلكتروني',
    colItems: 'الأصناف',
    modalEdit: 'تعديل المورد',
    modalNew: 'مورد جديد',
    supplierName: 'اسم المورد (إنجليزي) *',
    supplierNamePlaceholder: 'ABC Electrical Supplies',
    nameAr: 'الاسم (عربي)',
    nameArPlaceholder: 'شركة التوريدات الكهربائية',
    phone: 'الهاتف',
    email: 'البريد الإلكتروني',
    address: 'العنوان',
    notes: 'ملاحظات',
    cancel: 'إلغاء',
    saveChanges: 'حفظ التغييرات',
    addSupplier: 'إضافة مورد',
    cannotDelete: 'لا يمكن الحذف — هذا المورد مرتبط بـ {i} صنف و {p} دفعة.',
    viewStatement: 'كشف حساب',
    makePayment: 'دفعة',
    confirmDelete: 'حذف هذا المورد؟',
  },
} as const

const EMPTY: Omit<Supplier, 'id' | 'createdAt'> = {
  name: '', nameAr: '', phone: '', email: '', address: '', notes: '',
}

function Modal({
  initial, onSave, onClose,
}: {
  initial: Omit<Supplier, 'id' | 'createdAt'>
  onSave: (d: Omit<Supplier, 'id' | 'createdAt'>) => void
  onClose: () => void
}) {
  const t = useT(L)
  const [form, setForm] = useState(initial)
  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="font-semibold text-white">{initial.name ? t.modalEdit : t.modalNew}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t.supplierName}</label>
              <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder={t.supplierNamePlaceholder} />
            </div>
            <div>
              <label className="label">{t.nameAr}</label>
              <input className="input" dir="rtl" value={form.nameAr ?? ''} onChange={e => set('nameAr', e.target.value)} placeholder={t.nameArPlaceholder} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t.phone}</label>
              <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div>
              <label className="label">{t.email}</label>
              <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">{t.address}</label>
            <input className="input" value={form.address} onChange={e => set('address', e.target.value)} />
          </div>
          <div>
            <label className="label">{t.notes}</label>
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-700">
          <button className="btn-secondary" onClick={onClose}>{t.cancel}</button>
          <button className="btn-primary" onClick={() => { if (form.name.trim()) onSave(form) }}>
            {initial.name ? t.saveChanges : t.addSupplier}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Suppliers() {
  const t = useT(L)
  const navigate = useNavigate()
  const { suppliers, items, payments, addSupplier, updateSupplier, deleteSupplier, settings } = useStore()
  const lang = settings.language
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<{ open: boolean; supplier?: Supplier }>({ open: false })

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.phone.includes(search)
  )

  function handleSave(data: Omit<Supplier, 'id' | 'createdAt'>) {
    if (modal.supplier) updateSupplier(modal.supplier.id, data)
    else addSupplier(data)
    setModal({ open: false })
  }

  function handleDelete(id: string) {
    const linkedItems    = items.filter(i => i.supplierId === id).length
    const linkedPayments = payments.filter(p => p.supplierId === id).length
    if (linkedItems + linkedPayments > 0) {
      alert(t.cannotDelete.replace('{i}', String(linkedItems)).replace('{p}', String(linkedPayments)))
      return
    }
    if (confirm(t.confirmDelete)) deleteSupplier(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
          <p className="text-gray-500 text-sm">{t.count.replace('{n}', String(suppliers.length))}</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal({ open: true })}>
          <Plus className="w-4 h-4" /> {t.newSupplier}
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input className="input pl-9" placeholder={t.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <Truck className="w-12 h-12 text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">{t.noSuppliers}</p>
          <p className="text-gray-600 text-sm mt-1">{t.addHint}</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colId}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colSupplier}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">{t.colPhone}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">{t.colEmail}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">{t.colItems}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const linkedItems = items.filter(i => i.supplierId === s.id).length
                return (
                  <tr key={s.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-yellow-500">{s.id}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-white">{lang === 'ar' && s.nameAr ? s.nameAr : s.name}</p>
                      {s.nameAr && lang !== 'ar' && <p className="text-xs text-gray-500" dir="rtl">{s.nameAr}</p>}
                      {!s.nameAr && s.address && <p className="text-xs text-gray-500">{s.address}</p>}
                    </td>
                    <td className="px-5 py-3 text-gray-300 hidden md:table-cell">{s.phone || '—'}</td>
                    <td className="px-5 py-3 text-gray-300 hidden lg:table-cell">{s.email || '—'}</td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <span className="badge bg-blue-900/50 text-blue-300">{linkedItems}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        {/* View Statement */}
                        <button
                          title={t.viewStatement}
                          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 border border-blue-800 hover:border-blue-600 px-2 py-1 rounded-lg transition-colors"
                          onClick={() => navigate(`/supplier-statement?s=${s.id}`)}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span className="hidden xl:inline">{t.viewStatement}</span>
                        </button>
                        {/* Make Payment */}
                        <button
                          title={t.makePayment}
                          className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 border border-yellow-800 hover:border-yellow-600 px-2 py-1 rounded-lg transition-colors"
                          onClick={() => navigate('/payments', { state: { supplierId: s.id, supplierName: s.name } })}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span className="hidden xl:inline">{t.makePayment}</span>
                        </button>
                        <button className="text-gray-500 hover:text-yellow-400" onClick={() => setModal({ open: true, supplier: s })}>
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button className="text-gray-500 hover:text-red-400" onClick={() => handleDelete(s.id)}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal.open && (
        <Modal
          initial={modal.supplier ? {
            name: modal.supplier.name, nameAr: modal.supplier.nameAr ?? '',
            phone: modal.supplier.phone, email: modal.supplier.email,
            address: modal.supplier.address, notes: modal.supplier.notes,
          } : EMPTY}
          onSave={handleSave}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  )
}
