import { useState, useRef } from 'react'
import { useStore } from '../store/useStore'
import { formatCurrency, formatDate, projectStatusColor, today } from '../utils/helpers'
import { Plus, Pencil, Trash2, X, Search, FolderKanban, Camera, Image } from 'lucide-react'
import { useT } from '../hooks/useT'
import type { Project, ProjectStatus } from '../types'

const CURRENCIES = ['ILS', 'USD', 'EUR', 'JOD', 'EGP', 'SAR', 'AED', 'GBP']

const STATUSES: ProjectStatus[] = ['pending', 'active', 'on_hold', 'completed', 'cancelled']

const L = {
  en: {
    title: 'Projects',
    totalCount: 'Total {n} projects',
    newProject: 'New Project',
    searchPlaceholder: 'Search projects…',
    allStatuses: 'All statuses',
    noProjects: 'No projects',
    createFirst: 'Create your first project to get started',
    statusPending: 'Pending',
    statusActive: 'Active',
    statusOnHold: 'On Hold',
    statusCompleted: 'Completed',
    statusCancelled: 'Cancelled',
    modalEdit: 'Edit Project',
    modalNew: 'New Project',
    client: 'Client *',
    chooseClient: '— Select a client —',
    projectName: 'Project Name (English) *',
    projectNamePlaceholder: 'Villa wiring, office renovation…',
    projectNameAr: 'Project Name (Arabic)',
    projectNameArPh: 'اسم المشروع بالعربية',
    description: 'Description',
    status: 'Status',
    budget: 'Budget',
    budgetCurrency: 'Budget Currency',
    location: 'Location / Project Address',
    locationPlaceholder: 'Worksite address…',
    startDate: 'Start Date',
    endDate: 'End Date',
    notes: 'Notes',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    addProject: 'Add Project',
    clientLabel: 'Client:',
    budgetLabel: 'Budget',
    received: 'Received',
    spent: 'Spent',
    budgetUsed: 'Budget used',
    start: 'Start:',
    end: 'End:',
    photos: 'Photos',
    addPhoto: 'Add Photo',
    cannotDelete: 'Cannot delete — this project has {n} linked payment(s).',
    confirmDelete: 'Delete this project?',
  },
  ar: {
    title: 'المشاريع',
    totalCount: 'إجمالي {n} مشروع',
    newProject: 'مشروع جديد',
    searchPlaceholder: 'بحث في المشاريع...',
    allStatuses: 'كل الحالات',
    noProjects: 'لا توجد مشاريع',
    createFirst: 'أنشئ أول مشروع للبدء',
    statusPending: 'قيد الانتظار',
    statusActive: 'نشط',
    statusOnHold: 'معلق',
    statusCompleted: 'مكتمل',
    statusCancelled: 'ملغي',
    modalEdit: 'تعديل المشروع',
    modalNew: 'مشروع جديد',
    client: 'العميل *',
    chooseClient: '— اختر عميلاً —',
    projectName: 'اسم المشروع (إنجليزي) *',
    projectNamePlaceholder: 'Villa wiring, office renovation…',
    projectNameAr: 'اسم المشروع (عربي)',
    projectNameArPh: 'تمديد كهرباء فيلا، تجديد مكتب...',
    description: 'الوصف',
    status: 'الحالة',
    budget: 'الميزانية',
    budgetCurrency: 'عملة الميزانية',
    location: 'الموقع / عنوان المشروع',
    locationPlaceholder: 'عنوان موقع العمل...',
    startDate: 'تاريخ البدء',
    endDate: 'تاريخ الانتهاء',
    notes: 'ملاحظات',
    cancel: 'إلغاء',
    saveChanges: 'حفظ التغييرات',
    addProject: 'إضافة مشروع',
    clientLabel: 'العميل:',
    budgetLabel: 'الميزانية',
    received: 'المستلم',
    spent: 'المصروف',
    budgetUsed: 'الميزانية المستخدمة',
    start: 'البدء:',
    end: 'الانتهاء:',
    photos: 'الصور',
    addPhoto: 'إضافة صورة',
    cannotDelete: 'لا يمكن الحذف — هذا المشروع لديه {n} دفعة مرتبطة.',
    confirmDelete: 'حذف هذا المشروع؟',
  },
} as const

const STATUS_LABEL_KEY: Record<ProjectStatus, keyof typeof L.en> = {
  pending: 'statusPending',
  active: 'statusActive',
  on_hold: 'statusOnHold',
  completed: 'statusCompleted',
  cancelled: 'statusCancelled',
}

const EMPTY: Omit<Project, 'id' | 'createdAt'> = {
  clientId: '', name: '', nameAr: '', description: '', status: 'pending',
  location: '', startDate: today(), endDate: '', budget: 0, budgetCurrency: 'ILS', notes: '',
}

function Modal({
  initial, onSave, onClose,
}: {
  initial: Omit<Project, 'id' | 'createdAt'>
  onSave: (data: Omit<Project, 'id' | 'createdAt'>) => void
  onClose: () => void
}) {
  const t = useT(L)
  const { clients, settings } = useStore()
  const [form, setForm] = useState({ ...initial, budgetCurrency: initial.budgetCurrency || settings.currency || 'ILS' })
  const set = (k: keyof typeof form, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 sticky top-0 bg-gray-800">
          <h2 className="font-semibold text-white">{initial.name ? t.modalEdit : t.modalNew}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">{t.client}</label>
            <select className="input" value={form.clientId} onChange={e => set('clientId', e.target.value)}>
              <option value="">{t.chooseClient}</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t.projectName}</label>
              <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder={t.projectNamePlaceholder} />
            </div>
            <div>
              <label className="label">{t.projectNameAr}</label>
              <input className="input" dir="rtl" value={form.nameAr ?? ''} onChange={e => set('nameAr', e.target.value)} placeholder={t.projectNameArPh} />
            </div>
          </div>
          <div>
            <label className="label">{t.description}</label>
            <textarea className="input resize-none" rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t.status}</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value as ProjectStatus)}>
                {STATUSES.map(s => <option key={s} value={s}>{t[STATUS_LABEL_KEY[s]]}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t.budget}</label>
              <div className="flex gap-2">
                <input className="input flex-1" type="number" min={0} value={form.budget} onChange={e => set('budget', parseFloat(e.target.value) || 0)} />
                <select className="input w-24" value={form.budgetCurrency || 'ILS'} onChange={e => set('budgetCurrency', e.target.value)}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div>
            <label className="label">{t.location}</label>
            <input className="input" value={form.location} onChange={e => set('location', e.target.value)} placeholder={t.locationPlaceholder} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t.startDate}</label>
              <input className="input" type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            </div>
            <div>
              <label className="label">{t.endDate}</label>
              <input className="input" type="date" value={form.endDate ?? ''} onChange={e => set('endDate', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">{t.notes}</label>
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-700">
          <button className="btn-secondary" onClick={onClose}>{t.cancel}</button>
          <button
            className="btn-primary"
            onClick={() => { if (form.name.trim() && form.clientId) onSave(form) }}
          >
            {initial.name ? t.saveChanges : t.addProject}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Projects() {
  const t = useT(L)
  const { clients, projects, payments, addProject, updateProject, deleteProject, getProjectFinancials, addPhoto, deletePhoto, getPhotos } = useStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all')
  const [modal, setModal] = useState<{ open: boolean; project?: Project }>({ open: false })
  const [photoProject, setPhotoProject] = useState<string | null>(null)
  const [viewPhoto, setViewPhoto] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleAddPhoto(projectId: string) {
    setPhotoProject(projectId)
    setTimeout(() => fileRef.current?.click(), 50)
  }

  function onPhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !photoProject) return
    const reader = new FileReader()
    reader.onload = () => {
      addPhoto({
        entityType: 'project',
        entityId: photoProject,
        dataUrl: reader.result as string,
        caption: file.name,
        date: today(),
      })
      setPhotoProject(null)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const filtered = projects.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      clients.find(c => c.id === p.clientId)?.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  function handleSave(data: Omit<Project, 'id' | 'createdAt'>) {
    if (modal.project) {
      updateProject(modal.project.id, data)
    } else {
      addProject(data)
    }
    setModal({ open: false })
  }

  function handleDelete(id: string) {
    const linked = payments.filter(p => p.projectId === id).length
    if (linked > 0) {
      alert(t.cannotDelete.replace('{n}', String(linked)))
      return
    }
    if (confirm(t.confirmDelete)) deleteProject(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
          <p className="text-gray-500 text-sm">{t.totalCount.replace('{n}', String(projects.length))}</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal({ open: true })}>
          <Plus className="w-4 h-4" /> {t.newProject}
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input className="input pl-9" placeholder={t.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select
          className="input w-auto"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as ProjectStatus | 'all')}
        >
          <option value="all">{t.allStatuses}</option>
          {STATUSES.map(s => <option key={s} value={s}>{t[STATUS_LABEL_KEY[s]]}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <FolderKanban className="w-12 h-12 text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">{t.noProjects}</p>
          <p className="text-gray-600 text-sm mt-1">{t.createFirst}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => {
            const client = clients.find(c => c.id === p.clientId)
            const fin = getProjectFinancials(p.id)
            const budgetPct = p.budget > 0 ? Math.min(100, (fin.spent / p.budget) * 100) : 0

            return (
              <div key={p.id} className="card hover:border-gray-600 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-yellow-500">{p.id}</span>
                      <span className={`badge ${projectStatusColor(p.status)}`}>{t[STATUS_LABEL_KEY[p.status]]}</span>
                    </div>
                    <h3 className="font-semibold text-white mt-1">{p.name}</h3>
                    <p className="text-sm text-gray-400">
                      {t.clientLabel} <span className="text-gray-300">{client?.name ?? '—'}</span>
                      {p.location && <> • {p.location}</>}
                    </p>
                    {p.description && <p className="text-xs text-gray-500 mt-1 truncate">{p.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      className="text-gray-500 hover:text-yellow-400 transition-colors"
                      onClick={() => setModal({ open: true, project: p })}
                    ><Pencil className="w-4 h-4" /></button>
                    <button
                      className="text-gray-500 hover:text-red-400 transition-colors"
                      onClick={() => handleDelete(p.id)}
                    ><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                {/* Financials */}
                <div className="mt-4 grid grid-cols-3 gap-4 border-t border-gray-700 pt-4">
                  <div>
                    <p className="text-xs text-gray-500">{t.budgetLabel}</p>
                    <p className="text-sm font-semibold text-white">{formatCurrency(p.budget, p.budgetCurrency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t.received}</p>
                    <p className="text-sm font-semibold text-green-400">{formatCurrency(fin.received)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t.spent}</p>
                    <p className="text-sm font-semibold text-red-400">{formatCurrency(fin.spent)}</p>
                  </div>
                </div>

                {p.budget > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{t.budgetUsed}</span>
                      <span>{budgetPct.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${budgetPct > 90 ? 'bg-red-500' : budgetPct > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${budgetPct}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-3 flex gap-4 text-xs text-gray-600">
                  <span>{t.start} {formatDate(p.startDate)}</span>
                  {p.endDate && <span>{t.end} {formatDate(p.endDate)}</span>}
                </div>

                {/* Photos */}
                {(() => {
                  const photos = getPhotos('project', p.id)
                  return (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500 flex items-center gap-1"><Image className="w-3 h-3" /> {t.photos} ({photos.length})</span>
                        <button className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1" onClick={() => handleAddPhoto(p.id)}>
                          <Camera className="w-3 h-3" /> {t.addPhoto}
                        </button>
                      </div>
                      {photos.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {photos.map(photo => (
                            <div key={photo.id} className="relative group shrink-0">
                              <img
                                src={photo.dataUrl}
                                alt={photo.caption}
                                className="w-16 h-16 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setViewPhoto(photo.dataUrl)}
                              />
                              <button
                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => deletePhoto(photo.id)}
                              >×</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )
          })}
        </div>
      )}

      {modal.open && (
        <Modal
          initial={modal.project ? {
            clientId: modal.project.clientId, name: modal.project.name,
            nameAr: modal.project.nameAr ?? '',
            description: modal.project.description, status: modal.project.status,
            location: modal.project.location, startDate: modal.project.startDate,
            endDate: modal.project.endDate ?? '', budget: modal.project.budget,
            budgetCurrency: modal.project.budgetCurrency ?? 'ILS',
            notes: modal.project.notes,
          } : EMPTY}
          onSave={handleSave}
          onClose={() => setModal({ open: false })}
        />
      )}

      {/* Hidden file input for photos */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhotoSelected} />

      {/* Photo lightbox */}
      {viewPhoto && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setViewPhoto(null)}>
          <img src={viewPhoto} alt="Project photo" className="max-w-full max-h-full rounded-xl shadow-2xl" />
        </div>
      )}
    </div>
  )
}
