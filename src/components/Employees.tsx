import { useState } from 'react'
import { useStore } from '../store/useStore'
import { formatCurrency, formatDate, today } from '../utils/helpers'
import { Plus, Pencil, Trash2, X, Search, HardHat, Clock } from 'lucide-react'
import { useT } from '../hooks/useT'
import type { Employee, LaborEntry } from '../types'

const ROLES = ['Electrician', 'Helper', 'Foreman', 'Apprentice', 'Technician', 'Other']

const L = {
  en: {
    title: 'Employees & Labor',
    subtitle: '{e} employees • {l} labor entries',
    logLabor: 'Log Labor',
    newEmployee: 'New Employee',
    activeEmployees: 'Active Employees',
    thisMonthLabor: 'This Month Labor',
    totalLaborCost: 'Total Labor Cost',
    tabEmployees: 'Employees',
    tabLabor: 'Labor Log',
    searchEmployees: 'Search employees…',
    noEmployees: 'No employees yet',
    noLabor: 'No labor entries yet',
    colId: 'ID',
    colName: 'Name',
    colRole: 'Role',
    colPhone: 'Phone',
    colDailyRate: 'Daily Rate',
    colTotalEarned: 'Total Earned',
    colEmployee: 'Employee',
    colProject: 'Project',
    colDate: 'Date',
    colHours: 'Hours',
    colCost: 'Cost',
    inactive: 'Inactive',
    confirmDelete: 'Delete?',
    cannotDelete: 'Cannot delete — this employee has {n} labor entries. Deactivate instead.',
    confirmDeleteEmp: 'Delete this employee?',
    // Employee modal
    modalEditEmp: 'Edit Employee',
    modalNewEmp: 'New Employee',
    fullName: 'Full Name (English) *',
    fullNamePlaceholder: 'Employee name…',
    nameAr: 'Name (Arabic)',
    nameArPlaceholder: 'الاسم بالعربية',
    phone: 'Phone',
    role: 'Role',
    dailyRate: 'Daily Rate (ILS)',
    active: 'Active',
    notes: 'Notes',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    addEmployee: 'Add Employee',
    // Labor modal
    logLaborTitle: 'Log Labor',
    employee: 'Employee *',
    project: 'Project *',
    choose: '— Select —',
    date: 'Date',
    hours: 'Hours',
    dailyRateShort: 'Daily Rate',
    costLabel: 'Cost:',
    costHint: '({h}h / 8h × {rate} daily)',
    workDetailsPlaceholder: 'Work details…',
    logEntry: 'Log Entry',
    // Report tab
    tabReport: 'Work Report',
    reportEmp: 'Employee',
    reportProject: 'Project',
    reportFrom: 'From',
    reportTo: 'To',
    allEmployees: 'All Employees',
    allProjects: 'All Projects',
    reportTotalHours: 'Total Hours',
    reportTotalCost: 'Total Cost',
    reportEntries: '{n} entries',
    noReportData: 'No entries for the selected filters',
    // Roles
    roleElectrician: 'Electrician',
    roleHelper: 'Helper',
    roleForeman: 'Foreman',
    roleApprentice: 'Apprentice',
    roleTechnician: 'Technician',
    roleOther: 'Other',
  },
  ar: {
    title: 'الموظفون والعمالة',
    subtitle: '{e} موظف • {l} إدخال عمالة',
    logLabor: 'تسجيل عمالة',
    newEmployee: 'موظف جديد',
    activeEmployees: 'الموظفون النشطون',
    thisMonthLabor: 'عمالة هذا الشهر',
    totalLaborCost: 'إجمالي تكلفة العمالة',
    tabEmployees: 'الموظفون',
    tabLabor: 'سجل العمالة',
    searchEmployees: 'بحث في الموظفين...',
    noEmployees: 'لا يوجد موظفون بعد',
    noLabor: 'لا توجد إدخالات عمالة بعد',
    colId: 'المعرّف',
    colName: 'الاسم',
    colRole: 'الوظيفة',
    colPhone: 'الهاتف',
    colDailyRate: 'الأجر اليومي',
    colTotalEarned: 'إجمالي المكتسب',
    colEmployee: 'الموظف',
    colProject: 'المشروع',
    colDate: 'التاريخ',
    colHours: 'الساعات',
    colCost: 'التكلفة',
    inactive: 'غير نشط',
    confirmDelete: 'حذف؟',
    cannotDelete: 'لا يمكن الحذف — هذا الموظف لديه {n} إدخال عمالة. قم بإلغاء تفعيله بدلاً من ذلك.',
    confirmDeleteEmp: 'حذف هذا الموظف؟',
    // Employee modal
    modalEditEmp: 'تعديل الموظف',
    modalNewEmp: 'موظف جديد',
    fullName: 'الاسم الكامل (إنجليزي) *',
    fullNamePlaceholder: 'Employee name…',
    nameAr: 'الاسم (عربي)',
    nameArPlaceholder: 'اسم الموظف...',
    phone: 'الهاتف',
    role: 'الوظيفة',
    dailyRate: 'الأجر اليومي (ILS)',
    active: 'نشط',
    notes: 'ملاحظات',
    cancel: 'إلغاء',
    saveChanges: 'حفظ التغييرات',
    addEmployee: 'إضافة موظف',
    // Labor modal
    logLaborTitle: 'تسجيل عمالة',
    employee: 'الموظف *',
    project: 'المشروع *',
    choose: '— اختر —',
    date: 'التاريخ',
    hours: 'الساعات',
    dailyRateShort: 'الأجر اليومي',
    costLabel: 'التكلفة:',
    costHint: '({h}س / 8س × {rate} يومي)',
    workDetailsPlaceholder: 'تفاصيل العمل...',
    logEntry: 'تسجيل',
    // Report tab
    tabReport: 'تقرير الأعمال',
    reportEmp: 'الموظف',
    reportProject: 'المشروع',
    reportFrom: 'من',
    reportTo: 'إلى',
    allEmployees: 'جميع الموظفين',
    allProjects: 'جميع المشاريع',
    reportTotalHours: 'إجمالي الساعات',
    reportTotalCost: 'إجمالي التكلفة',
    reportEntries: '{n} إدخال',
    noReportData: 'لا توجد إدخالات للمرشحات المحددة',
    // Roles
    roleElectrician: 'كهربائي',
    roleHelper: 'مساعد',
    roleForeman: 'معلم',
    roleApprentice: 'متدرب',
    roleTechnician: 'فني',
    roleOther: 'أخرى',
  },
} as const

const ROLE_KEY: Record<string, keyof typeof L.en> = {
  Electrician: 'roleElectrician',
  Helper: 'roleHelper',
  Foreman: 'roleForeman',
  Apprentice: 'roleApprentice',
  Technician: 'roleTechnician',
  Other: 'roleOther',
}

const EMPTY_EMP: Omit<Employee, 'id' | 'createdAt'> = {
  name: '', nameAr: '', phone: '', role: 'Electrician', dailyRate: 0, isActive: true, notes: '',
}

function EmployeeModal({
  initial, onSave, onClose,
}: {
  initial: Omit<Employee, 'id' | 'createdAt'>
  onSave: (d: Omit<Employee, 'id' | 'createdAt'>) => void
  onClose: () => void
}) {
  const t = useT(L)
  const [form, setForm] = useState(initial)
  const set = (k: keyof typeof form, v: string | number | boolean) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="font-semibold text-white">{initial.name ? t.modalEditEmp : t.modalNewEmp}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
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
              <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div>
              <label className="label">{t.role}</label>
              <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
                {ROLES.map(r => <option key={r} value={r}>{t[ROLE_KEY[r]] ?? r}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t.dailyRate}</label>
              <input className="input" type="number" min={0} step="0.01" value={form.dailyRate} onChange={e => set('dailyRate', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer py-2">
                <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-yellow-500 focus:ring-yellow-500" />
                <span className="text-sm text-gray-300">{t.active}</span>
              </label>
            </div>
          </div>
          <div>
            <label className="label">{t.notes}</label>
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-700">
          <button className="btn-secondary" onClick={onClose}>{t.cancel}</button>
          <button className="btn-primary" onClick={() => { if (form.name.trim()) onSave(form) }}>
            {initial.name ? t.saveChanges : t.addEmployee}
          </button>
        </div>
      </div>
    </div>
  )
}

function LaborModal({
  initial, onSave, onClose,
}: {
  initial: { employeeId: string; projectId: string; date: string; hours: number; dailyRate: number; notes: string }
  onSave: (d: Omit<LaborEntry, 'id' | 'createdAt'>) => void
  onClose: () => void
}) {
  const t = useT(L)
  const { projects, employees } = useStore()
  const [form, setForm] = useState(initial)
  const set = (k: keyof typeof form, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  const totalCost = (form.hours / 8) * form.dailyRate // proportional to an 8-hour day

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="font-semibold text-white">{t.logLaborTitle}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">{t.employee}</label>
            <select className="input" value={form.employeeId} onChange={e => {
              const emp = employees.find(em => em.id === e.target.value)
              set('employeeId', e.target.value)
              if (emp) set('dailyRate', emp.dailyRate)
            }}>
              <option value="">{t.choose}</option>
              {employees.filter(e => e.isActive).map(e => <option key={e.id} value={e.id}>{e.name} ({t[ROLE_KEY[e.role]] ?? e.role})</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t.project}</label>
            <select className="input" value={form.projectId} onChange={e => set('projectId', e.target.value)}>
              <option value="">{t.choose}</option>
              {projects.filter(p => p.status === 'active').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">{t.date}</label>
              <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div>
              <label className="label">{t.hours}</label>
              <input className="input" type="number" min={0} max={24} step="0.5" value={form.hours} onChange={e => set('hours', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="label">{t.dailyRateShort}</label>
              <input className="input" type="number" min={0} step="0.01" value={form.dailyRate} onChange={e => set('dailyRate', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          <div className="bg-gray-900/50 rounded-lg px-4 py-3">
            <p className="text-sm text-gray-400">
              {t.costLabel} <span className="font-bold text-white">{formatCurrency(totalCost)}</span>
              <span className="text-xs text-gray-500 ml-2">{t.costHint.replace('{h}', String(form.hours)).replace('{rate}', formatCurrency(form.dailyRate))}</span>
            </p>
          </div>
          <div>
            <label className="label">{t.notes}</label>
            <input className="input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder={t.workDetailsPlaceholder} />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-700">
          <button className="btn-secondary" onClick={onClose}>{t.cancel}</button>
          <button className="btn-primary" onClick={() => {
            if (form.employeeId && form.projectId && form.hours > 0) {
              onSave({ ...form, totalCost })
            }
          }}>
            {t.logEntry}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Employees() {
  const t = useT(L)
  const { employees, laborEntries, projects, addEmployee, updateEmployee, deleteEmployee, addLaborEntry, deleteLaborEntry } = useStore()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'employees' | 'labor' | 'report'>('employees')
  const [reportEmpId, setReportEmpId] = useState('')
  const [reportProjectId, setReportProjectId] = useState('')
  const [reportFrom, setReportFrom] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0] })
  const [reportTo, setReportTo] = useState(today)
  const [empModal, setEmpModal] = useState<{ open: boolean; employee?: Employee }>({ open: false })
  const [laborModal, setLaborModal] = useState(false)

  const filteredEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) || e.role.toLowerCase().includes(search.toLowerCase())
  )

  const sortedLabor = [...laborEntries].sort((a, b) => b.date.localeCompare(a.date))

  const totalLaborCost = laborEntries.reduce((s, l) => s + l.totalCost, 0)
  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthLaborCost = laborEntries.filter(l => l.date.startsWith(thisMonth)).reduce((s, l) => s + l.totalCost, 0)

  function handleSaveEmployee(data: Omit<Employee, 'id' | 'createdAt'>) {
    if (empModal.employee) updateEmployee(empModal.employee.id, data)
    else addEmployee(data)
    setEmpModal({ open: false })
  }

  function handleSaveLabor(data: Omit<LaborEntry, 'id' | 'createdAt'>) {
    addLaborEntry(data)
    setLaborModal(false)
  }

  function handleDeleteEmployee(id: string) {
    const linked = laborEntries.filter(l => l.employeeId === id).length
    if (linked > 0) {
      alert(t.cannotDelete.replace('{n}', String(linked)))
      return
    }
    if (confirm(t.confirmDeleteEmp)) deleteEmployee(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
          <p className="text-gray-500 text-sm">{t.subtitle.replace('{e}', String(employees.length)).replace('{l}', String(laborEntries.length))}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-2" onClick={() => setLaborModal(true)}>
            <Clock className="w-4 h-4" /> {t.logLabor}
          </button>
          <button className="btn-primary flex items-center gap-2" onClick={() => setEmpModal({ open: true })}>
            <Plus className="w-4 h-4" /> {t.newEmployee}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-wide">{t.activeEmployees}</p>
          <p className="text-xl font-bold text-white mt-1">{employees.filter(e => e.isActive).length}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-wide">{t.thisMonthLabor}</p>
          <p className="text-xl font-bold text-yellow-400 mt-1">{formatCurrency(monthLaborCost)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-wide">{t.totalLaborCost}</p>
          <p className="text-xl font-bold text-red-400 mt-1">{formatCurrency(totalLaborCost)}</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-800 rounded-lg p-1 w-fit border border-gray-700">
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'employees' ? 'bg-yellow-500/20 text-yellow-300' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setTab('employees')}
        >{t.tabEmployees}</button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'labor' ? 'bg-yellow-500/20 text-yellow-300' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setTab('labor')}
        >{t.tabLabor}</button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'report' ? 'bg-yellow-500/20 text-yellow-300' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setTab('report')}
        >{t.tabReport}</button>
      </div>

      {tab === 'employees' && (
        <>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input className="input pl-9" placeholder={t.searchEmployees} value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {filteredEmployees.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <HardHat className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-gray-400 font-medium">{t.noEmployees}</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colId}</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colName}</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">{t.colRole}</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">{t.colPhone}</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colDailyRate}</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">{t.colTotalEarned}</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map(emp => {
                    const totalEarned = laborEntries.filter(l => l.employeeId === emp.id).reduce((s, l) => s + l.totalCost, 0)
                    return (
                      <tr key={emp.id} className={`border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors ${!emp.isActive ? 'opacity-50' : ''}`}>
                        <td className="px-5 py-3 font-mono text-xs text-yellow-500">{emp.id}</td>
                        <td className="px-5 py-3">
                          <p className="font-medium text-white">{emp.name}</p>
                          {!emp.isActive && <span className="badge bg-red-900/50 text-red-400 text-xs">{t.inactive}</span>}
                        </td>
                        <td className="px-5 py-3 text-gray-300 hidden md:table-cell">{t[ROLE_KEY[emp.role]] ?? emp.role}</td>
                        <td className="px-5 py-3 text-gray-300 hidden md:table-cell">{emp.phone || '—'}</td>
                        <td className="px-5 py-3 text-right text-white font-medium">{formatCurrency(emp.dailyRate)}</td>
                        <td className="px-5 py-3 text-right text-yellow-400 hidden lg:table-cell">{formatCurrency(totalEarned)}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2 justify-end">
                            <button className="text-gray-500 hover:text-yellow-400" onClick={() => setEmpModal({ open: true, employee: emp })}>
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button className="text-gray-500 hover:text-red-400" onClick={() => handleDeleteEmployee(emp.id)}>
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
        </>
      )}

      {tab === 'labor' && (
        <>
          {sortedLabor.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <Clock className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-gray-400 font-medium">{t.noLabor}</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colId}</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colEmployee}</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">{t.colProject}</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colDate}</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colHours}</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colCost}</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {sortedLabor.map(l => {
                    const emp = employees.find(e => e.id === l.employeeId)
                    const project = projects.find(p => p.id === l.projectId)
                    return (
                      <tr key={l.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs text-yellow-500">{l.id}</td>
                        <td className="px-5 py-3 text-white">{emp?.name ?? '—'}</td>
                        <td className="px-5 py-3 text-gray-300 hidden md:table-cell">{project?.name ?? '—'}</td>
                        <td className="px-5 py-3 text-gray-400">{formatDate(l.date)}</td>
                        <td className="px-5 py-3 text-right text-gray-300">{l.hours}h</td>
                        <td className="px-5 py-3 text-right font-medium text-yellow-400">{formatCurrency(l.totalCost)}</td>
                        <td className="px-5 py-3">
                          <button className="text-gray-500 hover:text-red-400" onClick={() => { if (confirm(t.confirmDelete)) deleteLaborEntry(l.id) }}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'report' && (() => {
        const reportEntries = laborEntries.filter(l => {
          if (reportEmpId && l.employeeId !== reportEmpId) return false
          if (reportProjectId && l.projectId !== reportProjectId) return false
          if (l.date < reportFrom || l.date > reportTo) return false
          return true
        }).sort((a, b) => b.date.localeCompare(a.date))

        const totalHours = reportEntries.reduce((s, l) => s + l.hours, 0)
        const totalCostRep = reportEntries.reduce((s, l) => s + l.totalCost, 0)

        return (
          <>
            <div className="card space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="label">{t.reportEmp}</label>
                  <select className="input" value={reportEmpId} onChange={e => setReportEmpId(e.target.value)}>
                    <option value="">{t.allEmployees}</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">{t.reportProject}</label>
                  <select className="input" value={reportProjectId} onChange={e => setReportProjectId(e.target.value)}>
                    <option value="">{t.allProjects}</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">{t.reportFrom}</label>
                  <input className="input" type="date" value={reportFrom} onChange={e => setReportFrom(e.target.value)} />
                </div>
                <div>
                  <label className="label">{t.reportTo}</label>
                  <input className="input" type="date" value={reportTo} onChange={e => setReportTo(e.target.value)} />
                </div>
              </div>
            </div>

            {reportEntries.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                <div className="card py-3">
                  <p className="text-xs text-gray-500">{t.reportEntries.replace('{n}', String(reportEntries.length))}</p>
                  <p className="text-xl font-bold text-white mt-0.5">{reportEntries.length}</p>
                </div>
                <div className="card py-3">
                  <p className="text-xs text-gray-500">{t.reportTotalHours}</p>
                  <p className="text-xl font-bold text-yellow-400 mt-0.5">{totalHours}h</p>
                </div>
                <div className="card py-3">
                  <p className="text-xs text-gray-500">{t.reportTotalCost}</p>
                  <p className="text-xl font-bold text-red-400 mt-0.5">{formatCurrency(totalCostRep)}</p>
                </div>
              </div>
            )}

            {reportEntries.length === 0 ? (
              <div className="card flex flex-col items-center justify-center py-16 text-center">
                <Clock className="w-12 h-12 text-gray-600 mb-3" />
                <p className="text-gray-400">{t.noReportData}</p>
              </div>
            ) : (
              <div className="card p-0 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colDate}</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colEmployee}</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">{t.colProject}</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colHours}</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colCost}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportEntries.map(l => {
                      const emp = employees.find(e => e.id === l.employeeId)
                      const proj = projects.find(p => p.id === l.projectId)
                      return (
                        <tr key={l.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                          <td className="px-5 py-3 text-gray-300">{formatDate(l.date)}</td>
                          <td className="px-5 py-3">
                            <p className="font-medium text-white">{emp?.name ?? '—'}</p>
                            {emp && <p className="text-xs text-gray-500">{t[ROLE_KEY[emp.role]] ?? emp.role}</p>}
                          </td>
                          <td className="px-5 py-3 text-gray-300 hidden md:table-cell">{proj?.name ?? '—'}</td>
                          <td className="px-5 py-3 text-right text-gray-300">{l.hours}h</td>
                          <td className="px-5 py-3 text-right font-medium text-yellow-400">{formatCurrency(l.totalCost)}</td>
                        </tr>
                      )
                    })}
                    <tr className="border-t-2 border-gray-600 bg-gray-700/20 font-semibold">
                      <td className="px-5 py-3 text-gray-300" colSpan={3}></td>
                      <td className="px-5 py-3 text-right text-yellow-400">{totalHours}h</td>
                      <td className="px-5 py-3 text-right text-yellow-400">{formatCurrency(totalCostRep)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </>
        )
      })()}

      {empModal.open && (
        <EmployeeModal
          initial={empModal.employee ? {
            name: empModal.employee.name, nameAr: empModal.employee.nameAr ?? '',
            phone: empModal.employee.phone, role: empModal.employee.role,
            dailyRate: empModal.employee.dailyRate, isActive: empModal.employee.isActive, notes: empModal.employee.notes,
          } : EMPTY_EMP}
          onSave={handleSaveEmployee}
          onClose={() => setEmpModal({ open: false })}
        />
      )}

      {laborModal && (
        <LaborModal
          initial={{ employeeId: '', projectId: '', date: today(), hours: 8, dailyRate: 0, notes: '' }}
          onSave={handleSaveLabor}
          onClose={() => setLaborModal(false)}
        />
      )}
    </div>
  )
}
