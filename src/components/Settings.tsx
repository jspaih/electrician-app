import { useState, useRef } from 'react'
import { useData, dataService } from '../services/dataService'
import { Settings as SettingsIcon, Download, Upload, Trash2, Globe, Moon, Sun } from 'lucide-react'
import { useT } from '../hooks/useT'

const CURRENCIES = ['ILS', 'USD', 'EUR', 'JOD']

const L = {
  en: {
    title: 'Settings',
    subtitle: 'App configuration, data management',
    companyInfo: 'Company Information',
    companyName: 'Company / Business Name',
    companyNamePlaceholder: 'Your electrical business name...',
    phone: 'Phone',
    defaultCurrency: 'Default Currency',
    address: 'Address',
    addressPlaceholder: 'Business address...',
    taxRate: 'Default Tax Rate (%)',
    savedAuto: 'Settings saved automatically',
    language: 'Language',
    english: 'English (LTR)',
    arabic: 'العربية (RTL)',
    langNote: 'UI fully supports both languages — toggle anytime.',
    theme: 'Theme',
    themeDark: '🌙 Dark',
    themeLight: '☀️ Light',
    dataManagement: 'Data Management',
    dataManagementDesc: 'All data is stored locally in your browser. Export regularly as a backup.',
    exportTitle: 'Export Data (JSON)',
    exportDesc: 'Download a complete backup of all your data',
    importTitle: 'Import Data (JSON)',
    importDesc: 'Restore from a backup file — this will replace current data',
    deleteAllTitle: 'Delete All Data',
    deleteAllDesc: 'Permanently remove all data — cannot be undone',
    about: 'About',
    aboutLine1: 'Electrician Business Manager v1.0',
    aboutLine2: 'Data stored in browser localStorage. No server, no cloud — 100% offline.',
    exportFailed: 'Export failed. See console for details.',
    importSuccess: 'Data imported successfully!',
    importFailed: 'Failed to import — invalid file format.',
    confirmWipe1: 'WARNING: This will delete ALL your data permanently. Are you sure?',
    confirmWipe2: 'This is your last chance — all clients, projects, payments, everything will be gone. Continue?',
  },
  ar: {
    title: 'الإعدادات',
    subtitle: 'إعدادات التطبيق وإدارة البيانات',
    companyInfo: 'معلومات الشركة',
    companyName: 'اسم الشركة / النشاط التجاري',
    companyNamePlaceholder: 'اسم نشاطك التجاري في الكهرباء...',
    phone: 'الهاتف',
    defaultCurrency: 'العملة الافتراضية',
    address: 'العنوان',
    addressPlaceholder: 'عنوان العمل...',
    taxRate: 'نسبة الضريبة الافتراضية (%)',
    savedAuto: 'تم حفظ الإعدادات تلقائياً',
    language: 'اللغة',
    english: 'English (LTR)',
    arabic: 'العربية (RTL)',
    langNote: 'واجهة المستخدم تدعم اللغتين بالكامل — يمكنك التبديل في أي وقت.',
    theme: 'المظهر',
    themeDark: '🌙 داكن',
    themeLight: '☀️ فاتح',
    dataManagement: 'إدارة البيانات',
    dataManagementDesc: 'يتم تخزين جميع البيانات محلياً في متصفحك. قم بالتصدير بانتظام كنسخة احتياطية.',
    exportTitle: 'تصدير البيانات (JSON)',
    exportDesc: 'تنزيل نسخة احتياطية كاملة لجميع بياناتك',
    importTitle: 'استيراد البيانات (JSON)',
    importDesc: 'استعادة من ملف نسخة احتياطية — سيؤدي هذا إلى استبدال البيانات الحالية',
    deleteAllTitle: 'حذف جميع البيانات',
    deleteAllDesc: 'إزالة جميع البيانات نهائياً — لا يمكن التراجع',
    about: 'حول',
    aboutLine1: 'مدير أعمال الكهربائي v1.0',
    aboutLine2: 'يتم تخزين البيانات في التخزين المحلي للمتصفح. بدون خادم، بدون سحابة — 100٪ بدون اتصال.',
    exportFailed: 'فشل التصدير. راجع وحدة التحكم للتفاصيل.',
    importSuccess: 'تم استيراد البيانات بنجاح!',
    importFailed: 'فشل الاستيراد — تنسيق الملف غير صالح.',
    confirmWipe1: 'تحذير: سيؤدي هذا إلى حذف جميع بياناتك نهائياً. هل أنت متأكد؟',
    confirmWipe2: 'هذه فرصتك الأخيرة — سيتم حذف جميع العملاء والمشاريع والمدفوعات وكل شيء. هل تريد المتابعة؟',
  },
} as const

export default function Settings() {
  const t = useT(L)
  const { settings, updateSettings } = useData()
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleExport() {
    try {
      dataService.exportBackup()
    } catch (err) {
      console.error('Export failed:', err)
      alert(t.exportFailed)
    }
  }

  function handleImport() {
    fileRef.current?.click()
  }

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      try {
        dataService.restoreBackup(text)
        alert(t.importSuccess)
        window.location.reload()
        return
      } catch {
        // Not a full backup — try legacy format below.
      }
      const ok = dataService.importStoreJson(text)
      if (ok) {
        alert(t.importSuccess)
        window.location.reload()
      } else {
        alert(t.importFailed)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleClearAll() {
    if (confirm(t.confirmWipe1)) {
      if (confirm(t.confirmWipe2)) {
        try { dataService.exportBackup() } catch { /* non-fatal */ }
        dataService.wipeStore()
        window.location.reload()
      }
    }
  }

  function save() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">{t.title}</h1>
        <p className="text-gray-500 text-sm">{t.subtitle}</p>
      </div>

      {/* Company Info */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <SettingsIcon className="w-4 h-4 text-yellow-500" /> {t.companyInfo}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="label">{t.companyName}</label>
            <input
              className="input"
              value={settings.companyName}
              onChange={e => { updateSettings({ companyName: e.target.value }); save() }}
              placeholder={t.companyNamePlaceholder}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t.phone}</label>
              <input
                className="input"
                value={settings.companyPhone}
                onChange={e => { updateSettings({ companyPhone: e.target.value }); save() }}
                placeholder="+970 XXX..."
              />
            </div>
            <div>
              <label className="label">{t.defaultCurrency}</label>
              <select
                className="input"
                value={settings.currency}
                onChange={e => { updateSettings({ currency: e.target.value }); save() }}
              >
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">{t.address}</label>
            <input
              className="input"
              value={settings.companyAddress}
              onChange={e => { updateSettings({ companyAddress: e.target.value }); save() }}
              placeholder={t.addressPlaceholder}
            />
          </div>
          <div>
            <label className="label">{t.taxRate}</label>
            <input
              className="input w-32"
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={settings.taxRate}
              onChange={e => { updateSettings({ taxRate: parseFloat(e.target.value) || 0 }); save() }}
            />
          </div>
        </div>
        {saved && <p className="text-green-400 text-xs mt-3">{t.savedAuto}</p>}
      </div>

      {/* Language */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4 text-yellow-500" /> {t.language}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            className={`py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
              settings.language === 'en'
                ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                : 'border-gray-600 text-gray-400 hover:border-gray-500'
            }`}
            onClick={() => { updateSettings({ language: 'en' }); save() }}
          >
            {t.english}
          </button>
          <button
            className={`py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
              settings.language === 'ar'
                ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                : 'border-gray-600 text-gray-400 hover:border-gray-500'
            }`}
            onClick={() => { updateSettings({ language: 'ar' }); save() }}
          >
            {t.arabic}
          </button>
        </div>
        <p className="text-xs text-yellow-400 mt-2">{t.langNote}</p>
      </div>

      {/* Theme */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          {(settings.theme ?? 'dark') === 'dark'
            ? <Moon className="w-4 h-4 text-yellow-500" />
            : <Sun className="w-4 h-4 text-yellow-500" />
          }
          {t.theme}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            className={`py-3 px-4 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              (settings.theme ?? 'dark') === 'dark'
                ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                : 'border-gray-600 text-gray-400 hover:border-gray-500'
            }`}
            onClick={() => { updateSettings({ theme: 'dark' }); save() }}
          >
            {t.themeDark}
          </button>
          <button
            className={`py-3 px-4 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              settings.theme === 'light'
                ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                : 'border-gray-600 text-gray-400 hover:border-gray-500'
            }`}
            onClick={() => { updateSettings({ theme: 'light' }); save() }}
          >
            {t.themeLight}
          </button>
        </div>
      </div>

      {/* Data Management */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4">{t.dataManagement}</h2>
        <p className="text-sm text-gray-400 mb-4">{t.dataManagementDesc}</p>
        <div className="space-y-3">
          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-600 hover:border-green-500 hover:bg-green-500/5 transition-colors text-left"
            onClick={handleExport}
          >
            <Download className="w-5 h-5 text-green-400" />
            <div>
              <p className="font-medium text-white text-sm">{t.exportTitle}</p>
              <p className="text-xs text-gray-500">{t.exportDesc}</p>
            </div>
          </button>

          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-600 hover:border-blue-500 hover:bg-blue-500/5 transition-colors text-left"
            onClick={handleImport}
          >
            <Upload className="w-5 h-5 text-blue-400" />
            <div>
              <p className="font-medium text-white text-sm">{t.importTitle}</p>
              <p className="text-xs text-gray-500">{t.importDesc}</p>
            </div>
          </button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={onFileSelected} />

          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-red-900/50 hover:border-red-500 hover:bg-red-500/5 transition-colors text-left"
            onClick={handleClearAll}
          >
            <Trash2 className="w-5 h-5 text-red-400" />
            <div>
              <p className="font-medium text-red-400 text-sm">{t.deleteAllTitle}</p>
              <p className="text-xs text-gray-500">{t.deleteAllDesc}</p>
            </div>
          </button>
        </div>
      </div>

      {/* About */}
      <div className="card">
        <h2 className="font-semibold text-white mb-2">{t.about}</h2>
        <p className="text-sm text-gray-400">{t.aboutLine1}</p>
        <p className="text-xs text-gray-600 mt-1">{t.aboutLine2}</p>
      </div>
    </div>
  )
}
