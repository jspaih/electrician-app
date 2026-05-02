import { useState } from 'react'
import { useStore } from '../store/useStore'
import { formatDate, today, uid } from '../utils/helpers'
import {
  Plus, Pencil, Trash2, X, Search, ClipboardList, AlertCircle, Eye, Printer,
  CheckCircle2, XCircle, Share2, Square, CheckSquare, UserCheck,
} from 'lucide-react'
import { useT } from '../hooks/useT'
import ShareModal from './ShareModal'
import type { WorkOrder, WorkOrderStatus, WorkOrderPriority, WorkOrderMaterial, Employee } from '../types'

const STATUSES: WorkOrderStatus[] = ['pending', 'in_progress', 'completed', 'cancelled']
const PRIORITIES: WorkOrderPriority[] = ['low', 'medium', 'high']

const L = {
  en: {
    title: 'Work Orders',
    count: '{n} work orders',
    newWO: 'New Work Order',
    searchPlaceholder: 'Search work orders…',
    allStatuses: 'All Statuses',
    noWO: 'No work orders yet',
    createHint: 'Break projects into detailed work orders',
    projectLabel: 'Project:',
    assignedLabel: 'Assigned:',
    materials: 'materials',
    shortage: 'shortage',
    shortages: 'shortages',
    start: 'Start:',
    due: 'Due:',
    completed: 'Completed:',
    confirmDelete: 'Delete?',
    modalEdit: 'Edit Work Order',
    modalNew: 'New Work Order',
    viewTitle: 'Work Order Details',
    project: 'Project *',
    chooseProject: '— Select Project —',
    titleField: 'Title *',
    titlePlaceholder: 'Install main panel, wire 2nd floor…',
    description: 'Description',
    status: 'Status',
    priority: 'Priority',
    assignedTo: 'Assigned To',
    none: '— None —',
    startDate: 'Start Date',
    dueDate: 'Due Date',
    completedDate: 'Completed',
    materialsNeeded: 'Materials',
    addMaterial: 'Add Material',
    noMaterials: 'No materials assigned yet.',
    chooseItem: '— Select Item —',
    stockLabel: 'Stock',
    colItem: 'Item',
    needed: 'Needed',
    used: 'Used',
    stock: 'Stock',
    notes: 'Notes',
    cancel: 'Cancel',
    close: 'Close',
    saveChanges: 'Save Changes',
    createWO: 'Create Work Order',
    printShortages: 'Print Shortages',
    shortagesReport: 'Shortages Report',
    noShortages: 'No shortages — all stock levels are sufficient.',
    shortageItem: 'Item',
    shortageNeeded: 'Needed',
    shortageStock: 'In Stock',
    shortageGap: 'Gap',
    // statuses
    stPending: 'Pending',
    stInProgress: 'In Progress',
    stCompleted: 'Completed',
    stCancelled: 'Cancelled',
    // priorities
    prLow: 'Low',
    prMedium: 'Medium',
    prHigh: 'High',
    // selection & bulk actions
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    selectedCount: '{n} selected',
    markComplete: 'Complete',
    markCancelled: 'Cancel',
    printWO: 'Print',
    share: 'Share',
    assignEmployee: 'Assign',
    bulkComplete: 'Mark All Complete',
    bulkCancel: 'Cancel All',
    bulkPrint: 'Print All',
    confirmComplete: 'Mark as completed?',
    confirmCancel: 'Mark as cancelled?',
    confirmBulkComplete: 'Mark {n} work orders as completed?',
    confirmBulkCancel: 'Cancel {n} work orders?',
    workOrder: 'Work Order',
    assignTo: 'Assign to',
    chooseEmployee: '— Select Employee —',
    notifyEmployee: 'Notify Assigned Employee',
  },
  ar: {
    title: 'أوامر العمل',
    count: '{n} أمر عمل',
    newWO: 'أمر عمل جديد',
    searchPlaceholder: 'بحث في أوامر العمل...',
    allStatuses: 'جميع الحالات',
    noWO: 'لا توجد أوامر عمل بعد',
    createHint: 'قسّم المشاريع إلى أوامر عمل مفصلة',
    projectLabel: 'المشروع:',
    assignedLabel: 'المسؤول:',
    materials: 'مواد',
    shortage: 'نقص',
    shortages: 'نقص',
    start: 'البدء:',
    due: 'الاستحقاق:',
    completed: 'الإكمال:',
    confirmDelete: 'حذف؟',
    modalEdit: 'تعديل أمر العمل',
    modalNew: 'أمر عمل جديد',
    viewTitle: 'تفاصيل أمر العمل',
    project: 'المشروع *',
    chooseProject: '— اختر مشروعاً —',
    titleField: 'العنوان *',
    titlePlaceholder: 'تركيب لوحة رئيسية، تمديد الطابق الثاني...',
    description: 'الوصف',
    status: 'الحالة',
    priority: 'الأولوية',
    assignedTo: 'تعيين إلى',
    none: '— لا يوجد —',
    startDate: 'تاريخ البدء',
    dueDate: 'تاريخ الاستحقاق',
    completedDate: 'تاريخ الإكمال',
    materialsNeeded: 'المواد',
    addMaterial: 'إضافة مادة',
    noMaterials: 'لم يتم تعيين مواد بعد.',
    chooseItem: '— اختر صنفاً —',
    stockLabel: 'المخزون',
    colItem: 'الصنف',
    needed: 'المطلوب',
    used: 'المستخدم',
    stock: 'المخزون',
    notes: 'ملاحظات',
    cancel: 'إلغاء',
    close: 'إغلاق',
    saveChanges: 'حفظ التغييرات',
    createWO: 'إنشاء أمر العمل',
    printShortages: 'طباعة النقص',
    shortagesReport: 'تقرير نقص المواد',
    noShortages: 'لا يوجد نقص — جميع مستويات المخزون كافية.',
    shortageItem: 'الصنف',
    shortageNeeded: 'المطلوب',
    shortageStock: 'المخزون',
    shortageGap: 'الفرق',
    // statuses
    stPending: 'قيد الانتظار',
    stInProgress: 'قيد التنفيذ',
    stCompleted: 'مكتمل',
    stCancelled: 'ملغي',
    // priorities
    prLow: 'منخفضة',
    prMedium: 'متوسطة',
    prHigh: 'عالية',
    // selection & bulk actions
    selectAll: 'تحديد الكل',
    deselectAll: 'إلغاء التحديد',
    selectedCount: '{n} محدد',
    markComplete: 'إكمال',
    markCancelled: 'إلغاء',
    printWO: 'طباعة',
    share: 'مشاركة',
    assignEmployee: 'تعيين',
    bulkComplete: 'إكمال الكل',
    bulkCancel: 'إلغاء الكل',
    bulkPrint: 'طباعة الكل',
    confirmComplete: 'تأكيد الإكمال؟',
    confirmCancel: 'تأكيد الإلغاء؟',
    confirmBulkComplete: 'إكمال {n} أوامر عمل؟',
    confirmBulkCancel: 'إلغاء {n} أوامر عمل؟',
    workOrder: 'أمر العمل',
    assignTo: 'تعيين إلى',
    chooseEmployee: '— اختر موظفاً —',
    notifyEmployee: 'إشعار الموظف المعيّن',
  },
} as const

const STATUS_KEY: Record<WorkOrderStatus, keyof typeof L.en> = {
  pending: 'stPending',
  in_progress: 'stInProgress',
  completed: 'stCompleted',
  cancelled: 'stCancelled',
}

const PRIORITY_KEY: Record<WorkOrderPriority, keyof typeof L.en> = {
  low: 'prLow',
  medium: 'prMedium',
  high: 'prHigh',
}

function woStatusColor(s: string) {
  const map: Record<string, string> = {
    pending: 'bg-yellow-900 text-yellow-300', in_progress: 'bg-blue-900 text-blue-300',
    completed: 'bg-green-900 text-green-300', cancelled: 'bg-red-900 text-red-300',
  }
  return map[s] ?? 'bg-gray-700 text-gray-300'
}

function priorityColor(p: string) {
  const map: Record<string, string> = {
    low: 'bg-gray-700 text-gray-300', medium: 'bg-yellow-900 text-yellow-300', high: 'bg-red-900 text-red-300',
  }
  return map[p] ?? 'bg-gray-700 text-gray-300'
}

const EMPTY: Omit<WorkOrder, 'id' | 'createdAt'> = {
  projectId: '', title: '', description: '', status: 'pending', priority: 'medium',
  assignedTo: '', materials: [], startDate: today(), dueDate: '', completedDate: '', notes: '',
}

function Modal({
  initial, onSave, onClose,
}: {
  initial: Omit<WorkOrder, 'id' | 'createdAt'>
  onSave: (d: Omit<WorkOrder, 'id' | 'createdAt'>) => void
  onClose: () => void
}) {
  const t = useT(L)
  const { projects, items, getItemStock } = useStore()
  const [form, setForm] = useState(initial)
  const set = (k: keyof typeof form, v: string | number) => setForm(f => ({ ...f, [k]: v as any }))

  function addMaterial() {
    setForm(f => ({ ...f, materials: [...f.materials, { id: uid(), itemId: '', quantityNeeded: 0, quantityUsed: 0 }] }))
  }
  function updateMaterial(idx: number, key: keyof WorkOrderMaterial, val: string | number) {
    const mats = form.materials.map((m, i) => i === idx ? { ...m, [key]: val } : m)
    setForm(f => ({ ...f, materials: mats }))
  }
  function removeMaterial(idx: number) {
    setForm(f => ({ ...f, materials: f.materials.filter((_, i) => i !== idx) }))
  }

  const activeEmployees = useStore.getState().employees.filter(e => e.isActive)

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
          <h2 className="font-semibold text-white">{initial.title ? t.modalEdit : t.modalNew}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">{t.project}</label>
            <select className="input" value={form.projectId} onChange={e => set('projectId', e.target.value)}>
              <option value="">{t.chooseProject}</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t.titleField}</label>
            <input className="input" value={form.title} onChange={e => set('title', e.target.value)} placeholder={t.titlePlaceholder} />
          </div>
          <div>
            <label className="label">{t.description}</label>
            <textarea className="input resize-none" rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">{t.status}</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value as WorkOrderStatus)}>
                {STATUSES.map(s => <option key={s} value={s}>{t[STATUS_KEY[s]]}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t.priority}</label>
              <select className="input" value={form.priority} onChange={e => set('priority', e.target.value as WorkOrderPriority)}>
                {PRIORITIES.map(p => <option key={p} value={p}>{t[PRIORITY_KEY[p]]}</option>)}
              </select>
            </div>
            {activeEmployees.length > 0 && (
              <div>
                <label className="label">{t.assignedTo}</label>
                <select className="input" value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)}>
                  <option value="">{t.none}</option>
                  {activeEmployees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">{t.startDate}</label>
              <input className="input" type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            </div>
            <div>
              <label className="label">{t.dueDate}</label>
              <input className="input" type="date" value={form.dueDate ?? ''} onChange={e => set('dueDate', e.target.value)} />
            </div>
            <div>
              <label className="label">{t.completedDate}</label>
              <input className="input" type="date" value={form.completedDate ?? ''} onChange={e => set('completedDate', e.target.value)} />
            </div>
          </div>

          {/* Materials */}
          <div>
            <label className="label mb-2">{t.materialsNeeded}</label>
            {form.materials.length > 0 && (
              <div className="grid grid-cols-12 gap-2 mb-1 px-1">
                <div className="col-span-5 text-xs text-gray-500 font-medium">{t.colItem}</div>
                <div className="col-span-3 text-xs text-gray-500 font-medium text-center">{t.needed}</div>
                <div className="col-span-3 text-xs text-gray-500 font-medium text-center">{t.used}</div>
              </div>
            )}
            {form.materials.length === 0 ? (
              <p className="text-xs text-gray-500">{t.noMaterials}</p>
            ) : (
              <div className="space-y-2">
                {form.materials.map((mat, idx) => (
                  <div key={mat.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <select className="input text-xs" value={mat.itemId} onChange={e => updateMaterial(idx, 'itemId', e.target.value)}>
                        <option value="">{t.chooseItem}</option>
                        {items.map(i => <option key={i.id} value={i.id}>{i.name} ({t.stockLabel}: {getItemStock(i.id)})</option>)}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input className="input text-xs text-center" type="number" min={0} value={mat.quantityNeeded} onChange={e => updateMaterial(idx, 'quantityNeeded', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="col-span-3">
                      <input className="input text-xs text-center" type="number" min={0} value={mat.quantityUsed} onChange={e => updateMaterial(idx, 'quantityUsed', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button className="text-gray-600 hover:text-red-400" onClick={() => removeMaterial(idx)}><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              className="mt-2 w-full border border-dashed border-gray-600 hover:border-yellow-500 text-gray-500 hover:text-yellow-400 rounded-lg py-2 text-sm flex items-center justify-center gap-1 transition-colors"
              onClick={addMaterial}
            >
              <Plus className="w-4 h-4" /> {t.addMaterial}
            </button>
          </div>

          <div>
            <label className="label">{t.notes}</label>
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-700">
          <button className="btn-secondary" onClick={onClose}>{t.cancel}</button>
          <button className="btn-primary" onClick={() => { if (form.title.trim() && form.projectId) onSave(form) }}>
            {initial.title ? t.saveChanges : t.createWO}
          </button>
        </div>
      </div>
    </div>
  )
}

function ViewModal({ wo, onClose, onPrintShortages }: { wo: WorkOrder; onClose: () => void; onPrintShortages: () => void }) {
  const t = useT(L)
  const { projects, employees, items, getItemStock } = useStore()
  const project = projects.find(p => p.id === wo.projectId)
  const employee = employees.find(e => e.id === wo.assignedTo)

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
          <div>
            <h2 className="font-semibold text-white">{t.viewTitle}</h2>
            <p className="text-xs text-yellow-500 font-mono">{wo.id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4 text-sm">
          <div className="flex gap-2 flex-wrap">
            <span className={`badge ${woStatusColor(wo.status)}`}>{t[STATUS_KEY[wo.status]]}</span>
            <span className={`badge ${priorityColor(wo.priority)}`}>{t[PRIORITY_KEY[wo.priority]]}</span>
          </div>
          <div>
            <p className="text-gray-500 text-xs">{t.titleField}</p>
            <p className="text-white font-semibold">{wo.title}</p>
          </div>
          {wo.description && (
            <div>
              <p className="text-gray-500 text-xs">{t.description}</p>
              <p className="text-gray-300">{wo.description}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-xs">{t.project}</p>
              <p className="text-white">{project?.name ?? '—'}</p>
            </div>
            {employee && (
              <div>
                <p className="text-gray-500 text-xs">{t.assignedTo}</p>
                <p className="text-white">{employee.name}</p>
              </div>
            )}
            <div>
              <p className="text-gray-500 text-xs">{t.startDate}</p>
              <p className="text-gray-300">{formatDate(wo.startDate)}</p>
            </div>
            {wo.dueDate && (
              <div>
                <p className="text-gray-500 text-xs">{t.dueDate}</p>
                <p className="text-gray-300">{formatDate(wo.dueDate)}</p>
              </div>
            )}
            {wo.completedDate && (
              <div>
                <p className="text-gray-500 text-xs">{t.completedDate}</p>
                <p className="text-green-400">{formatDate(wo.completedDate)}</p>
              </div>
            )}
          </div>

          {/* Materials table */}
          {wo.materials.length > 0 && (
            <div>
              <p className="text-gray-500 text-xs mb-2">{t.materialsNeeded}</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left pb-1 text-gray-500">{t.colItem}</th>
                    <th className="text-center pb-1 text-gray-500">{t.needed}</th>
                    <th className="text-center pb-1 text-gray-500">{t.used}</th>
                    <th className="text-center pb-1 text-gray-500">{t.stock}</th>
                  </tr>
                </thead>
                <tbody>
                  {wo.materials.map(mat => {
                    const item = items.find(i => i.id === mat.itemId)
                    const stock = getItemStock(mat.itemId)
                    const shortage = stock < mat.quantityNeeded
                    return (
                      <tr key={mat.id} className="border-b border-gray-700/40">
                        <td className="py-1.5 text-gray-300">{item?.name ?? mat.itemId}</td>
                        <td className="py-1.5 text-center text-white">{mat.quantityNeeded}</td>
                        <td className="py-1.5 text-center text-blue-400">{mat.quantityUsed}</td>
                        <td className={`py-1.5 text-center font-medium ${shortage ? 'text-red-400' : 'text-green-400'}`}>{stock}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {wo.notes && (
            <div>
              <p className="text-gray-500 text-xs">{t.notes}</p>
              <p className="text-gray-300">{wo.notes}</p>
            </div>
          )}
        </div>
        <div className="flex justify-between gap-3 px-6 py-4 border-t border-gray-700">
          <button className="btn-secondary flex items-center gap-2" onClick={onPrintShortages}>
            <Printer className="w-4 h-4" /> {t.printShortages}
          </button>
          <button className="btn-secondary" onClick={onClose}>{t.close}</button>
        </div>
      </div>
    </div>
  )
}

export default function WorkOrders() {
  const t = useT(L)
  const { workOrders, projects, employees, items, getItemStock, addWorkOrder, updateWorkOrder, deleteWorkOrder } = useStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'all'>('all')
  const [modal, setModal] = useState<{ open: boolean; workOrder?: WorkOrder }>({ open: false })
  const [viewWO, setViewWO] = useState<WorkOrder | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [shareTarget, setShareTarget] = useState<WorkOrder | null>(null)
  const [notifyTarget, setNotifyTarget] = useState<{ wo: WorkOrder; employee: Employee } | null>(null)

  const activeEmployees = employees.filter(e => e.isActive)

  const filtered = workOrders.filter(w => {
    const matchStatus = statusFilter === 'all' || w.status === statusFilter
    const matchSearch = w.title.toLowerCase().includes(search.toLowerCase()) || w.id.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  // ─── Selection helpers ──────────────────────────────────────────────────────
  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(w => w.id)))
    }
  }

  const allSelected = filtered.length > 0 && selected.size === filtered.length

  // ─── PDF helpers ────────────────────────────────────────────────────────────
  function buildWorkOrderHtml(wo: WorkOrder): string {
    const project = projects.find(p => p.id === wo.projectId)
    const employee = employees.find(e => e.id === wo.assignedTo)
    const statusLabel = t[STATUS_KEY[wo.status]]
    const priorityLabel = t[PRIORITY_KEY[wo.priority]]

    const matRows = wo.materials.length === 0
      ? `<tr><td colspan="4" style="text-align:center;color:#888;padding:12px">${t.noMaterials}</td></tr>`
      : wo.materials.map(m => {
          const item = items.find(i => i.id === m.itemId)
          const stock = getItemStock(m.itemId)
          const gap = m.quantityNeeded - stock
          const shortage = stock < m.quantityNeeded
          return `<tr>
            <td style="padding:6px 12px;border-bottom:1px solid #eee">${item?.name ?? m.itemId}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:center">${m.quantityNeeded}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:center">${m.quantityUsed}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:center${shortage ? ';color:#dc2626;font-weight:bold' : ';color:#16a34a'}">${stock}${shortage ? ` (−${gap})` : ''}</td>
          </tr>`
        }).join('')

    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${t.workOrder}: ${wo.title}</title>
<style>
  body{font-family:Arial,sans-serif;padding:30px;color:#111}
  h1{font-size:20px;margin-bottom:4px}
  .sub{color:#555;font-size:13px;margin-bottom:20px}
  .badges{margin-bottom:16px;display:flex;gap:8px}
  .badge{display:inline-block;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600}
  .badge-status{background:#fef9c3;color:#854d0e}
  .badge-priority{background:#fee2e2;color:#991b1b}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;font-size:13px;margin-bottom:20px}
  .info-label{color:#666;font-size:11px;margin-bottom:2px}
  .info-value{color:#111;font-weight:500}
  .section-title{font-size:13px;font-weight:700;color:#444;margin-bottom:8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{background:#f3f4f6;padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb}
  th.center{text-align:center}
  .notes{margin-top:20px;padding:12px;background:#f9fafb;border-radius:6px;font-size:13px;color:#444}
</style>
</head>
<body>
  <h1>${t.workOrder}: ${wo.title}</h1>
  <div class="sub">${wo.id} &nbsp;|&nbsp; ${t.project} ${project?.name ?? '—'}</div>
  <div class="badges">
    <span class="badge badge-status">${statusLabel}</span>
    <span class="badge badge-priority">${priorityLabel}</span>
  </div>
  <div class="info-grid">
    ${employee ? `<div><div class="info-label">${t.assignedTo}</div><div class="info-value">${employee.name}${employee.phone ? ` · ${employee.phone}` : ''}</div></div>` : ''}
    <div><div class="info-label">${t.startDate}</div><div class="info-value">${formatDate(wo.startDate)}</div></div>
    ${wo.dueDate ? `<div><div class="info-label">${t.dueDate}</div><div class="info-value">${formatDate(wo.dueDate)}</div></div>` : ''}
    ${wo.completedDate ? `<div><div class="info-label">${t.completedDate}</div><div class="info-value">${formatDate(wo.completedDate)}</div></div>` : ''}
  </div>
  ${wo.description ? `<div class="section-title">${t.description}</div><p style="font-size:13px;color:#444;margin:0 0 20px">${wo.description}</p>` : ''}
  <div class="section-title">${t.materialsNeeded}</div>
  <table>
    <thead>
      <tr>
        <th>${t.colItem}</th>
        <th class="center">${t.needed}</th>
        <th class="center">${t.used}</th>
        <th class="center">${t.stock}</th>
      </tr>
    </thead>
    <tbody>${matRows}</tbody>
  </table>
  ${wo.notes ? `<div class="notes"><strong>${t.notes}:</strong> ${wo.notes}</div>` : ''}
</body>
</html>`
  }

  function openPrintWindow(html: string) {
    const win = window.open('', '_blank', 'width=800,height=700')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.print()
  }

  function handlePrintWO(wo: WorkOrder) {
    openPrintWindow(buildWorkOrderHtml(wo))
  }

  function handleShareWhatsApp(wo: WorkOrder, phone: string) {
    const clean = phone.replace(/\D/g, '')
    openPrintWindow(buildWorkOrderHtml(wo))
    const msg = encodeURIComponent(`${t.workOrder}: ${wo.title} [${wo.id}]`)
    setTimeout(() => {
      window.open(`https://wa.me/${clean}?text=${msg}`, '_blank')
    }, 1500)
  }

  function handleShareEmail(wo: WorkOrder, email: string) {
    const project = projects.find(p => p.id === wo.projectId)
    const subject = encodeURIComponent(`${t.workOrder}: ${wo.title}`)
    const body = encodeURIComponent(
      `${t.workOrder}: ${wo.title}\n${wo.id}\n\n${t.project} ${project?.name ?? '—'}\n${t.status}: ${t[STATUS_KEY[wo.status]]}\n${t.priority}: ${t[PRIORITY_KEY[wo.priority]]}\n${t.startDate}: ${formatDate(wo.startDate)}${wo.dueDate ? `\n${t.dueDate}: ${formatDate(wo.dueDate)}` : ''}${wo.description ? `\n\n${wo.description}` : ''}${wo.notes ? `\n\n${t.notes}: ${wo.notes}` : ''}`
    )
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_self')
  }

  // ─── Work Order actions ─────────────────────────────────────────────────────
  function handleSave(data: Omit<WorkOrder, 'id' | 'createdAt'>) {
    if (modal.workOrder) {
      updateWorkOrder(modal.workOrder.id, data)
      setModal({ open: false })
    } else {
      const wo = addWorkOrder(data)
      setModal({ open: false })
      if (data.assignedTo) {
        const emp = employees.find(e => e.id === data.assignedTo)
        if (emp) setNotifyTarget({ wo, employee: emp })
      }
    }
  }

  function handleMarkComplete(id: string) {
    if (!confirm(t.confirmComplete)) return
    updateWorkOrder(id, { status: 'completed', completedDate: today() })
  }

  function handleMarkCancelled(id: string) {
    if (!confirm(t.confirmCancel)) return
    updateWorkOrder(id, { status: 'cancelled' })
  }

  function handleQuickAssign(wo: WorkOrder, employeeId: string) {
    updateWorkOrder(wo.id, { ...wo, assignedTo: employeeId })
  }

  // ─── Bulk actions ───────────────────────────────────────────────────────────
  function handleBulkComplete() {
    if (!confirm(t.confirmBulkComplete.replace('{n}', String(selected.size)))) return
    selected.forEach(id => updateWorkOrder(id, { status: 'completed', completedDate: today() }))
    setSelected(new Set())
  }

  function handleBulkCancel() {
    if (!confirm(t.confirmBulkCancel.replace('{n}', String(selected.size)))) return
    selected.forEach(id => updateWorkOrder(id, { status: 'cancelled' }))
    setSelected(new Set())
  }

  function handleBulkPrint() {
    const selectedWOs = filtered.filter(w => selected.has(w.id))
    const combined = selectedWOs.map(wo => buildWorkOrderHtml(wo)).join('<div style="page-break-after:always"></div>')
    openPrintWindow(combined)
  }

  // ─── Shortages print ────────────────────────────────────────────────────────
  function printShortages(wo: WorkOrder) {
    const project = projects.find(p => p.id === wo.projectId)
    const employee = employees.find(e => e.id === wo.assignedTo)
    const shortages = wo.materials.filter(m => getItemStock(m.itemId) < m.quantityNeeded)

    const rows = shortages.length === 0
      ? `<tr><td colspan="4" style="text-align:center;color:#888;padding:16px">${t.noShortages}</td></tr>`
      : shortages.map(m => {
          const item = items.find(i => i.id === m.itemId)
          const stock = getItemStock(m.itemId)
          const gap = m.quantityNeeded - stock
          return `<tr>
            <td style="padding:6px 12px;border-bottom:1px solid #eee">${item?.name ?? m.itemId}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:center">${m.quantityNeeded}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:center;color:#dc2626">${stock}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:center;font-weight:bold;color:#dc2626">${gap}</td>
          </tr>`
        }).join('')

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${t.shortagesReport}</title>
<style>
  body{font-family:Arial,sans-serif;padding:30px;color:#111}
  h1{font-size:20px;margin-bottom:4px}
  .sub{color:#666;font-size:13px;margin-bottom:20px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{background:#f3f4f6;padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb}
  th.center{text-align:center}
</style>
</head>
<body>
  <h1>${t.shortagesReport}: ${wo.title}</h1>
  <div class="sub">
    ${t.project} ${project?.name ?? wo.projectId} &nbsp;|&nbsp;
    ${t.start} ${formatDate(wo.startDate)}
    ${employee ? `&nbsp;|&nbsp; ${t.assignedTo}: ${employee.name}` : ''}
  </div>
  <table>
    <thead>
      <tr>
        <th>${t.shortageItem}</th>
        <th class="center">${t.shortageNeeded}</th>
        <th class="center">${t.shortageStock}</th>
        <th class="center">${t.shortageGap}</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`

    const win = window.open('', '_blank', 'width=700,height=600')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.print()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
          <p className="text-gray-500 text-sm">{t.count.replace('{n}', String(workOrders.length))}</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal({ open: true })}>
          <Plus className="w-4 h-4" /> {t.newWO}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input className="input pl-9" placeholder={t.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value as WorkOrderStatus | 'all')}>
          <option value="all">{t.allStatuses}</option>
          {STATUSES.map(s => <option key={s} value={s}>{t[STATUS_KEY[s]]}</option>)}
        </select>
      </div>

      {/* Bulk actions toolbar */}
      {selected.size > 0 && (
        <div className="card border-yellow-600/40 bg-yellow-500/5 flex items-center gap-3 flex-wrap py-3">
          <span className="text-yellow-400 text-sm font-semibold">
            {t.selectedCount.replace('{n}', String(selected.size))}
          </span>
          <div className="flex-1" />
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-700/30 hover:bg-green-700/50 text-green-300 border border-green-700/40 text-xs font-medium transition-colors"
            onClick={handleBulkComplete}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> {t.bulkComplete}
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-700/30 hover:bg-red-700/50 text-red-300 border border-red-700/40 text-xs font-medium transition-colors"
            onClick={handleBulkCancel}
          >
            <XCircle className="w-3.5 h-3.5" /> {t.bulkCancel}
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium transition-colors"
            onClick={handleBulkPrint}
          >
            <Printer className="w-3.5 h-3.5" /> {t.bulkPrint}
          </button>
          <button
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            onClick={() => setSelected(new Set())}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList className="w-12 h-12 text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">{t.noWO}</p>
          <p className="text-gray-600 text-sm mt-1">{t.createHint}</p>
        </div>
      ) : (
        <>
          {/* Select all toggle */}
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
              onClick={toggleSelectAll}
            >
              {allSelected
                ? <CheckSquare className="w-4 h-4 text-yellow-400" />
                : <Square className="w-4 h-4" />}
              {allSelected ? t.deselectAll : t.selectAll}
            </button>
          </div>

          <div className="space-y-3">
            {filtered.map(w => {
              const project = projects.find(p => p.id === w.projectId)
              const employee = employees.find(e => e.id === w.assignedTo)
              const materialCount = w.materials.length
              const shortages = w.materials.filter(m => {
                const stock = getItemStock(m.itemId)
                return stock < m.quantityNeeded
              })
              const isSelected = selected.has(w.id)

              return (
                <div
                  key={w.id}
                  className={`card transition-colors ${isSelected ? 'border-yellow-500/50 bg-yellow-500/5' : 'hover:border-gray-600'}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      className="mt-1 text-gray-500 hover:text-yellow-400 shrink-0 transition-colors"
                      onClick={() => toggleSelect(w.id)}
                    >
                      {isSelected
                        ? <CheckSquare className="w-4 h-4 text-yellow-400" />
                        : <Square className="w-4 h-4" />}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-yellow-500">{w.id}</span>
                        <span className={`badge ${woStatusColor(w.status)}`}>{t[STATUS_KEY[w.status]]}</span>
                        <span className={`badge ${priorityColor(w.priority)}`}>{t[PRIORITY_KEY[w.priority]]}</span>
                      </div>
                      <h3 className="font-semibold text-white mt-1">{w.title}</h3>
                      <p className="text-sm text-gray-400">
                        {t.projectLabel} <span className="text-gray-300">{project?.name ?? '—'}</span>
                        {employee && <> • {t.assignedLabel} <span className="text-gray-300">{employee.name}</span></>}
                      </p>
                      {w.description && <p className="text-xs text-gray-500 mt-1">{w.description}</p>}

                      {/* Materials summary */}
                      {materialCount > 0 && (
                        <div className="mt-2 flex items-center gap-3">
                          <span className="text-xs text-gray-500">{materialCount} {t.materials}</span>
                          {shortages.length > 0 && (
                            <span className="text-xs text-red-400 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {shortages.length} {shortages.length !== 1 ? t.shortages : t.shortage}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-2 flex gap-4 text-xs text-gray-600">
                        <span>{t.start} {formatDate(w.startDate)}</span>
                        {w.dueDate && <span>{t.due} {formatDate(w.dueDate)}</span>}
                        {w.completedDate && <span className="text-green-500">{t.completed} {formatDate(w.completedDate)}</span>}
                      </div>

                      {/* Quick assign employee */}
                      {activeEmployees.length > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <UserCheck className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                          <select
                            className="bg-transparent border border-gray-700 hover:border-gray-500 text-gray-400 text-xs rounded-lg px-2 py-1 transition-colors focus:outline-none focus:border-yellow-500"
                            value={w.assignedTo}
                            onChange={e => handleQuickAssign(w, e.target.value)}
                          >
                            <option value="">{t.none}</option>
                            {activeEmployees.map(emp => (
                              <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {/* Row 1: view, edit, delete */}
                      <div className="flex items-center gap-1.5">
                        <button className="text-gray-500 hover:text-blue-400 transition-colors" title={t.viewTitle} onClick={() => setViewWO(w)}>
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-gray-500 hover:text-yellow-400 transition-colors" title={t.modalEdit} onClick={() => setModal({ open: true, workOrder: w })}>
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button className="text-gray-500 hover:text-red-400 transition-colors" title={t.confirmDelete} onClick={() => { if (confirm(t.confirmDelete)) deleteWorkOrder(w.id) }}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {/* Row 2: complete, cancel, print, share */}
                      <div className="flex items-center gap-1.5">
                        {w.status !== 'completed' && (
                          <button
                            className="text-gray-500 hover:text-green-400 transition-colors"
                            title={t.markComplete}
                            onClick={() => handleMarkComplete(w.id)}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {w.status !== 'cancelled' && (
                          <button
                            className="text-gray-500 hover:text-red-400 transition-colors"
                            title={t.markCancelled}
                            onClick={() => handleMarkCancelled(w.id)}
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          className="text-gray-500 hover:text-gray-300 transition-colors"
                          title={t.printWO}
                          onClick={() => handlePrintWO(w)}
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          className="text-gray-500 hover:text-blue-400 transition-colors"
                          title={t.share}
                          onClick={() => setShareTarget(w)}
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {modal.open && (
        <Modal
          initial={modal.workOrder ? { ...modal.workOrder } : EMPTY}
          onSave={handleSave}
          onClose={() => setModal({ open: false })}
        />
      )}

      {viewWO && (
        <ViewModal
          wo={viewWO}
          onClose={() => setViewWO(null)}
          onPrintShortages={() => printShortages(viewWO)}
        />
      )}

      {shareTarget && (() => {
        const emp = employees.find(e => e.id === shareTarget.assignedTo)
        return (
          <ShareModal
            docId={shareTarget.id}
            docTitle={shareTarget.title}
            defaultPhone={emp?.phone ?? ''}
            defaultEmail=""
            onDownload={() => { handlePrintWO(shareTarget); setShareTarget(null) }}
            onWhatsApp={phone => { handleShareWhatsApp(shareTarget, phone); setShareTarget(null) }}
            onEmail={email => { handleShareEmail(shareTarget, email); setShareTarget(null) }}
            onClose={() => setShareTarget(null)}
          />
        )
      })()}

      {notifyTarget && (
        <ShareModal
          docId={notifyTarget.wo.id}
          docTitle={`${t.notifyEmployee}: ${notifyTarget.wo.title}`}
          defaultPhone={notifyTarget.employee.phone}
          defaultEmail=""
          onDownload={() => { handlePrintWO(notifyTarget.wo); setNotifyTarget(null) }}
          onWhatsApp={phone => { handleShareWhatsApp(notifyTarget.wo, phone); setNotifyTarget(null) }}
          onEmail={email => { handleShareEmail(notifyTarget.wo, email); setNotifyTarget(null) }}
          onClose={() => setNotifyTarget(null)}
        />
      )}
    </div>
  )
}
