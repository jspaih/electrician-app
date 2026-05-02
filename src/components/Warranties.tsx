import { useState } from 'react'
import { useStore } from '../store/useStore'
import { formatDate, today } from '../utils/helpers'
import { Plus, Pencil, Trash2, X, Search, Shield, AlertTriangle } from 'lucide-react'
import type { Warranty, WarrantyStatus } from '../types'
import { useT } from '../hooks/useT'

const L = {
  en: {
    editTitle: 'Edit Warranty',
    newTitle: 'New Warranty',
    linkItem: 'Link to Inventory Item (optional)',
    noneItem: '— Free text below —',
    item: 'Item / Equipment Description *',
    itemPh: '16A MCB breaker, LED panel light...',
    manufacturer: 'Manufacturer',
    manufacturerPh: 'Schneider, ABB...',
    serial: 'Serial Number',
    startDate: 'Start Date',
    endDate: 'End Date *',
    status: 'Status',
    client: 'Client',
    project: 'Project',
    none: '— None —',
    notes: 'Notes',
    cancel: 'Cancel',
    save: 'Save Changes',
    add: 'Add Warranty',
    title: 'Warranties',
    countSuffix: '{n} warranties tracked',
    newWarranty: 'New Warranty',
    expiringMsg: '{n} warranty/warranties expiring within 30 days',
    expiresPrefix: 'expires',
    expiresSep: '—',
    searchPh: 'Search warranties...',
    allStatuses: 'All Statuses',
    empty: 'No warranties yet',
    emptyHint: 'Track equipment warranties for your clients',
    colId: 'ID',
    colItem: 'Item',
    colManufacturer: 'Manufacturer',
    colSerial: 'S/N',
    colExpires: 'Expires',
    colStatus: 'Status',
    expired: 'EXPIRED',
    daysLeft: '{n} days left',
    confirmDelete: 'Delete?',
    statusActive: 'active',
    statusExpiredW: 'expired',
    statusClaimed: 'claimed',
  },
  ar: {
    editTitle: 'تعديل الضمان',
    newTitle: 'ضمان جديد',
    linkItem: 'ربط بصنف من المخزون (اختياري)',
    noneItem: '— نص حر أدناه —',
    item: 'وصف المعدات / الصنف *',
    itemPh: 'قاطع 16 أمبير، بانل LED...',
    manufacturer: 'الشركة المصنعة',
    manufacturerPh: 'شنايدر، ABB...',
    serial: 'الرقم التسلسلي',
    startDate: 'تاريخ البداية',
    endDate: 'تاريخ الانتهاء *',
    status: 'الحالة',
    client: 'العميل',
    project: 'المشروع',
    none: '— لا شيء —',
    notes: 'ملاحظات',
    cancel: 'إلغاء',
    save: 'حفظ التغييرات',
    add: 'إضافة ضمان',
    title: 'الضمانات',
    countSuffix: '{n} ضمان متتبع',
    newWarranty: 'ضمان جديد',
    expiringMsg: '{n} ضمان/ضمانات تنتهي خلال 30 يوماً',
    expiresPrefix: 'ينتهي',
    expiresSep: '—',
    searchPh: 'بحث في الضمانات...',
    allStatuses: 'جميع الحالات',
    empty: 'لا توجد ضمانات بعد',
    emptyHint: 'تتبع ضمانات المعدات لعملائك',
    colId: 'المعرّف',
    colItem: 'الصنف',
    colManufacturer: 'الشركة المصنعة',
    colSerial: 'الرقم التسلسلي',
    colExpires: 'الانتهاء',
    colStatus: 'الحالة',
    expired: 'منتهي',
    daysLeft: 'باقي {n} يوم',
    confirmDelete: 'حذف؟',
    statusActive: 'ساري',
    statusExpiredW: 'منتهي',
    statusClaimed: 'مطالبة',
  },
} as const

const STATUSES: WarrantyStatus[] = ['active', 'expired', 'claimed']

const STATUS_KEY: Record<WarrantyStatus, keyof typeof L.en> = {
  active: 'statusActive',
  expired: 'statusExpiredW',
  claimed: 'statusClaimed',
}

function wStatusColor(s: string) {
  const map: Record<string, string> = {
    active: 'bg-green-900 text-green-300', expired: 'bg-red-900 text-red-300', claimed: 'bg-yellow-900 text-yellow-300',
  }
  return map[s] ?? 'bg-gray-700 text-gray-300'
}

const EMPTY: Omit<Warranty, 'id' | 'createdAt'> = {
  projectId: '', clientId: '', itemId: '', itemDescription: '', manufacturer: '',
  serialNumber: '', startDate: today(), endDate: '', status: 'active', notes: '',
}

function Modal({
  initial, onSave, onClose,
}: {
  initial: Omit<Warranty, 'id' | 'createdAt'>
  onSave: (d: Omit<Warranty, 'id' | 'createdAt'>) => void
  onClose: () => void
}) {
  const t = useT(L)
  const { clients, projects, items } = useStore()
  const [form, setForm] = useState(initial)
  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  function handleItemSelect(itemId: string) {
    if (!itemId) {
      setForm(f => ({ ...f, itemId: '' }))
      return
    }
    const item = items.find(i => i.id === itemId)
    if (!item) return
    setForm(f => ({
      ...f,
      itemId,
      itemDescription: item.name,
      serialNumber: item.serialNumber ?? f.serialNumber,
    }))
  }

  const itemsWithSerial = items.filter(i => i.serialNumber)

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 sticky top-0 bg-gray-800">
          <h2 className="font-semibold text-white">{initial.itemDescription ? t.editTitle : t.newTitle}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {items.length > 0 && (
            <div>
              <label className="label">{t.linkItem}</label>
              <select className="input" value={form.itemId ?? ''} onChange={e => handleItemSelect(e.target.value)}>
                <option value="">{t.noneItem}</option>
                {items.map(i => (
                  <option key={i.id} value={i.id}>{i.name}{i.serialNumber ? ` [${i.serialNumber}]` : ''}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">{t.item}</label>
            <input className="input" value={form.itemDescription} onChange={e => set('itemDescription', e.target.value)} placeholder={t.itemPh} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t.manufacturer}</label>
              <input className="input" value={form.manufacturer} onChange={e => set('manufacturer', e.target.value)} placeholder={t.manufacturerPh} />
            </div>
            <div>
              <label className="label">{t.serial}</label>
              <input className="input" value={form.serialNumber} onChange={e => set('serialNumber', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">{t.startDate}</label>
              <input className="input" type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            </div>
            <div>
              <label className="label">{t.endDate}</label>
              <input className="input" type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} />
            </div>
            <div>
              <label className="label">{t.status}</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value as WarrantyStatus)}>
                {STATUSES.map(s => <option key={s} value={s}>{t[STATUS_KEY[s]]}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {clients.length > 0 && (
              <div>
                <label className="label">{t.client}</label>
                <select className="input" value={form.clientId} onChange={e => set('clientId', e.target.value)}>
                  <option value="">{t.none}</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            {projects.length > 0 && (
              <div>
                <label className="label">{t.project}</label>
                <select className="input" value={form.projectId} onChange={e => set('projectId', e.target.value)}>
                  <option value="">{t.none}</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div>
            <label className="label">{t.notes}</label>
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-700">
          <button className="btn-secondary" onClick={onClose}>{t.cancel}</button>
          <button className="btn-primary" onClick={() => { if (form.itemDescription.trim() && form.endDate) onSave(form) }}>
            {initial.itemDescription ? t.save : t.add}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Warranties() {
  const t = useT(L)
  const { warranties, clients, projects, addWarranty, updateWarranty, deleteWarranty, getExpiringWarranties } = useStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<WarrantyStatus | 'all'>('all')
  const [modal, setModal] = useState<{ open: boolean; warranty?: Warranty }>({ open: false })

  const expiring = getExpiringWarranties()

  const filtered = warranties.filter(w => {
    const matchStatus = statusFilter === 'all' || w.status === statusFilter
    const matchSearch = w.itemDescription.toLowerCase().includes(search.toLowerCase()) ||
      w.manufacturer.toLowerCase().includes(search.toLowerCase()) ||
      w.id.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  }).sort((a, b) => a.endDate.localeCompare(b.endDate))

  function handleSave(data: Omit<Warranty, 'id' | 'createdAt'>) {
    if (modal.warranty) updateWarranty(modal.warranty.id, data)
    else addWarranty(data)
    setModal({ open: false })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
          <p className="text-gray-500 text-sm">{t.countSuffix.replace('{n}', String(warranties.length))}</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal({ open: true })}>
          <Plus className="w-4 h-4" /> {t.newWarranty}
        </button>
      </div>

      {/* Expiring alert */}
      {expiring.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-800/40 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <p className="text-sm font-medium text-yellow-300">{t.expiringMsg.replace('{n}', String(expiring.length))}</p>
          </div>
          {expiring.map(w => (
            <p key={w.id} className="text-xs text-yellow-400/80 ml-6">
              {w.itemDescription} {t.expiresSep} {t.expiresPrefix} {formatDate(w.endDate)}
            </p>
          ))}
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input className="input pl-9" placeholder={t.searchPh} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value as WarrantyStatus | 'all')}>
          <option value="all">{t.allStatuses}</option>
          {STATUSES.map(s => <option key={s} value={s}>{t[STATUS_KEY[s]]}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <Shield className="w-12 h-12 text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">{t.empty}</p>
          <p className="text-gray-600 text-sm mt-1">{t.emptyHint}</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colId}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colItem}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">{t.colManufacturer}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">{t.colSerial}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colExpires}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colStatus}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(w => {
                const client = clients.find(c => c.id === w.clientId)
                const project = projects.find(p => p.id === w.projectId)
                const daysLeft = Math.ceil((new Date(w.endDate).getTime() - Date.now()) / 86400000)
                const isExpiringSoon = w.status === 'active' && daysLeft <= 30 && daysLeft > 0
                const isExpired = w.status === 'active' && daysLeft <= 0

                return (
                  <tr key={w.id} className={`border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors ${isExpired ? 'bg-red-900/10' : isExpiringSoon ? 'bg-yellow-900/10' : ''}`}>
                    <td className="px-5 py-3 font-mono text-xs text-yellow-500">{w.id}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-white">{w.itemDescription}</p>
                      {client && <p className="text-xs text-gray-500">{client.name}</p>}
                      {project && <p className="text-xs text-gray-500">{project.name}</p>}
                    </td>
                    <td className="px-5 py-3 text-gray-300 hidden md:table-cell">{w.manufacturer || '—'}</td>
                    <td className="px-5 py-3 text-gray-400 font-mono text-xs hidden lg:table-cell">{w.serialNumber || '—'}</td>
                    <td className="px-5 py-3">
                      <p className={isExpired ? 'text-red-400' : isExpiringSoon ? 'text-yellow-400' : 'text-gray-300'}>
                        {formatDate(w.endDate)}
                      </p>
                      {w.status === 'active' && (
                        <p className={`text-xs ${isExpired ? 'text-red-500' : isExpiringSoon ? 'text-yellow-500' : 'text-gray-500'}`}>
                          {isExpired ? t.expired : t.daysLeft.replace('{n}', String(daysLeft))}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`badge ${wStatusColor(w.status)}`}>{t[STATUS_KEY[w.status]]}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button className="text-gray-500 hover:text-yellow-400" onClick={() => setModal({ open: true, warranty: w })}>
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button className="text-gray-500 hover:text-red-400" onClick={() => { if (confirm(t.confirmDelete)) deleteWarranty(w.id) }}>
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
          initial={modal.warranty ? {
            projectId: modal.warranty.projectId ?? '', clientId: modal.warranty.clientId ?? '',
            itemDescription: modal.warranty.itemDescription, manufacturer: modal.warranty.manufacturer,
            serialNumber: modal.warranty.serialNumber, startDate: modal.warranty.startDate,
            endDate: modal.warranty.endDate, status: modal.warranty.status, notes: modal.warranty.notes,
          } : EMPTY}
          onSave={handleSave}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  )
}
