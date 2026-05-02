import { useState } from 'react'
import { useStore } from '../store/useStore'
import { formatDate } from '../utils/helpers'
import { Plus, Pencil, Trash2, X, Search, Users } from 'lucide-react'
import { useT } from '../hooks/useT'
import type { Client } from '../types'

const EMPTY: Omit<Client, 'id' | 'createdAt'> = {
  name: '', nameAr: '', phone: '', email: '', address: '', taxNumber: '', notes: '',
}

const L = {
  en: {
    title: 'Clients',
    totalCount: 'Total {n} clients',
    newClient: 'New Client',
    searchPlaceholder: 'Search by name, phone or email…',
    noClients: 'No clients',
    addFirst: 'Add your first client to get started',
    colId: 'ID',
    colName: 'Name',
    colPhone: 'Phone',
    colEmail: 'Email',
    colProjects: 'Projects',
    colCreated: 'Added on',
    modalEdit: 'Edit Client',
    modalNew: 'New Client',
    fullName: 'Full Name (English) *',
    fullNamePlaceholder: 'John Smith',
    nameAr: 'Name (Arabic)',
    nameArPlaceholder: 'الاسم بالعربية',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    addressPlaceholder: 'City, street, building…',
    taxNumber: 'Tax Number',
    taxNumberPlaceholder: 'Optional tax/ID number',
    notes: 'Notes',
    notesPlaceholder: 'Any additional notes…',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    addClient: 'Add Client',
    cannotDelete: 'Cannot delete — this client has {n} linked project(s).',
    confirmDelete: 'Delete this client? This action cannot be undone.',
  },
  ar: {
    title: 'العملاء',
    totalCount: 'إجمالي {n} عميل',
    newClient: 'عميل جديد',
    searchPlaceholder: 'ابحث بالاسم أو الهاتف أو البريد الإلكتروني...',
    noClients: 'لا يوجد عملاء',
    addFirst: 'أضف أول عميل للبدء',
    colId: 'المعرف',
    colName: 'الاسم',
    colPhone: 'الهاتف',
    colEmail: 'البريد الإلكتروني',
    colProjects: 'المشاريع',
    colCreated: 'تاريخ الإضافة',
    modalEdit: 'تعديل العميل',
    modalNew: 'عميل جديد',
    fullName: 'الاسم الكامل (إنجليزي) *',
    fullNamePlaceholder: 'Ahmed Al-Hassan',
    nameAr: 'الاسم (عربي)',
    nameArPlaceholder: 'أحمد الحسن',
    phone: 'الهاتف',
    email: 'البريد الإلكتروني',
    address: 'العنوان',
    addressPlaceholder: 'المدينة، الشارع، المبنى...',
    taxNumber: 'الرقم الضريبي',
    taxNumberPlaceholder: 'رقم ضريبي/هوية اختياري',
    notes: 'ملاحظات',
    notesPlaceholder: 'أي ملاحظات إضافية...',
    cancel: 'إلغاء',
    saveChanges: 'حفظ التغييرات',
    addClient: 'إضافة عميل',
    cannotDelete: 'لا يمكن الحذف — هذا العميل لديه {n} مشروع مرتبط.',
    confirmDelete: 'حذف هذا العميل؟ لا يمكن التراجع عن هذا الإجراء.',
  },
} as const

function Modal({
  initial, onSave, onClose,
}: {
  initial: Omit<Client, 'id' | 'createdAt'>
  onSave: (data: Omit<Client, 'id' | 'createdAt'>) => void
  onClose: () => void
}) {
  const t = useT(L)
  const [form, setForm] = useState(initial)
  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="font-semibold text-white">{initial.name ? t.modalEdit : t.modalNew}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t.fullName}</label>
                <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder={t.fullNamePlaceholder} />
              </div>
              <div>
                <label className="label">{t.nameAr}</label>
                <input className="input" dir="rtl" value={form.nameAr ?? ''} onChange={e => set('nameAr', e.target.value)} placeholder={t.nameArPlaceholder} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t.phone}</label>
                <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+970 5X XXX XXXX" />
              </div>
              <div>
                <label className="label">{t.email}</label>
                <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
              </div>
            </div>
            <div>
              <label className="label">{t.address}</label>
              <input className="input" value={form.address} onChange={e => set('address', e.target.value)} placeholder={t.addressPlaceholder} />
            </div>
            <div>
              <label className="label">{t.taxNumber}</label>
              <input className="input" value={form.taxNumber} onChange={e => set('taxNumber', e.target.value)} placeholder={t.taxNumberPlaceholder} />
            </div>
            <div>
              <label className="label">{t.notes}</label>
              <textarea className="input resize-none" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder={t.notesPlaceholder} />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-700">
          <button className="btn-secondary" onClick={onClose}>{t.cancel}</button>
          <button
            className="btn-primary"
            onClick={() => { if (form.name.trim()) onSave(form) }}
          >
            {initial.name ? t.saveChanges : t.addClient}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Clients() {
  const t = useT(L)
  const { clients, projects, addClient, updateClient, deleteClient, settings } = useStore()
  const lang = settings.language
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<{ open: boolean; client?: Client }>({ open: false })

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  function handleSave(data: Omit<Client, 'id' | 'createdAt'>) {
    if (modal.client) {
      updateClient(modal.client.id, data)
    } else {
      addClient(data)
    }
    setModal({ open: false })
  }

  function handleDelete(id: string) {
    const linked = projects.filter(p => p.clientId === id).length
    if (linked > 0) {
      alert(t.cannotDelete.replace('{n}', String(linked)))
      return
    }
    if (confirm(t.confirmDelete)) deleteClient(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
          <p className="text-gray-500 text-sm">{t.totalCount.replace('{n}', String(clients.length))}</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal({ open: true })}>
          <Plus className="w-4 h-4" /> {t.newClient}
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          className="input pl-9"
          placeholder={t.searchPlaceholder}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-12 h-12 text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">{t.noClients}</p>
          <p className="text-gray-600 text-sm mt-1">{t.addFirst}</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-750">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colId}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colName}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">{t.colPhone}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">{t.colEmail}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">{t.colProjects}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">{t.colCreated}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const clientProjects = projects.filter(p => p.clientId === c.id).length
                return (
                  <tr key={c.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-yellow-500">{c.id}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-white">{lang === 'ar' && c.nameAr ? c.nameAr : c.name}</p>
                      {c.nameAr && lang !== 'ar' && <p className="text-xs text-gray-500 mt-0.5" dir="rtl">{c.nameAr}</p>}
                      {!c.nameAr && c.address && <p className="text-xs text-gray-500 mt-0.5">{c.address}</p>}
                    </td>
                    <td className="px-5 py-3 text-gray-300 hidden md:table-cell">{c.phone || '—'}</td>
                    <td className="px-5 py-3 text-gray-300 hidden lg:table-cell">{c.email || '—'}</td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <span className="badge bg-blue-900/50 text-blue-300">{clientProjects}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 hidden lg:table-cell">{formatDate(c.createdAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          className="text-gray-500 hover:text-yellow-400 transition-colors"
                          onClick={() => setModal({ open: true, client: c })}
                        ><Pencil className="w-4 h-4" /></button>
                        <button
                          className="text-gray-500 hover:text-red-400 transition-colors"
                          onClick={() => handleDelete(c.id)}
                        ><Trash2 className="w-4 h-4" /></button>
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
          initial={modal.client ? {
            name: modal.client.name, nameAr: modal.client.nameAr ?? '',
            phone: modal.client.phone, email: modal.client.email,
            address: modal.client.address, taxNumber: modal.client.taxNumber ?? '', notes: modal.client.notes,
          } : EMPTY}
          onSave={handleSave}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  )
}
