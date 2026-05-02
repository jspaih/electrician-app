import { useState } from 'react'
import { useStore } from '../store/useStore'
import { formatDate, today } from '../utils/helpers'
import { Plus, Pencil, Trash2, X, RefreshCw } from 'lucide-react'
import type { ExchangeRate } from '../types'
import { useT } from '../hooks/useT'

const CURRENCIES = ['USD', 'EUR', 'JOD', 'EGP', 'SAR', 'AED', 'GBP']

const L = {
  en: {
    title: 'Exchange Rates',
    subtitle: 'Manage currency exchange rates for multi-currency transactions',
    newRate: 'New Rate',
    editTitle: 'Edit Exchange Rate',
    newTitle: 'New Exchange Rate',
    currency: 'Foreign Currency',
    rate: 'Rate (1 {cur} = ? {def})',
    date: 'Effective Date',
    notes: 'Notes',
    cancel: 'Cancel',
    save: 'Save',
    confirmDelete: 'Delete this exchange rate?',
    colCurrency: 'Currency',
    colRate: 'Rate',
    colDate: 'Date',
    colNotes: 'Notes',
    empty: 'No exchange rates yet',
    emptyHint: 'Add rates to record transactions in foreign currencies',
    latest: 'Latest',
    choose: '-- Select Currency --',
    ratePh: '3.65',
    notePh: 'e.g. Bank of Palestine rate',
    rateLabel: '1 {cur} = {rate} {def}',
  },
  ar: {
    title: 'أسعار الصرف',
    subtitle: 'إدارة أسعار صرف العملات للمعاملات متعددة العملات',
    newRate: 'سعر جديد',
    editTitle: 'تعديل سعر الصرف',
    newTitle: 'سعر صرف جديد',
    currency: 'العملة الأجنبية',
    rate: 'السعر (1 {cur} = ? {def})',
    date: 'تاريخ التفعيل',
    notes: 'ملاحظات',
    cancel: 'إلغاء',
    save: 'حفظ',
    confirmDelete: 'حذف سعر الصرف هذا؟',
    colCurrency: 'العملة',
    colRate: 'السعر',
    colDate: 'التاريخ',
    colNotes: 'ملاحظات',
    empty: 'لا توجد أسعار صرف بعد',
    emptyHint: 'أضف أسعار الصرف لتسجيل المعاملات بعملات أجنبية',
    latest: 'الأحدث',
    choose: '-- اختر العملة --',
    ratePh: '3.65',
    notePh: 'مثال: سعر بنك فلسطين',
    rateLabel: '1 {cur} = {rate} {def}',
  },
} as const

const EMPTY_FORM = (): Omit<ExchangeRate, 'id' | 'createdAt'> => ({
  currency: '', rate: 0, date: today(), notes: '',
})

function Modal({
  initial, defaultCurrency, onSave, onClose,
}: {
  initial: Omit<ExchangeRate, 'id' | 'createdAt'>
  defaultCurrency: string
  onSave: (d: Omit<ExchangeRate, 'id' | 'createdAt'>) => void
  onClose: () => void
}) {
  const t = useT(L)
  const [form, setForm] = useState(initial)
  const isEdit = !!initial.currency && initial.rate > 0

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="font-semibold text-white">{isEdit ? t.editTitle : t.newTitle}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">{t.currency}</label>
            <select
              className="input"
              value={form.currency}
              onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
            >
              <option value="">{t.choose}</option>
              {CURRENCIES.filter(c => c !== defaultCurrency).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">
              {t.rate
                .replace('{cur}', form.currency || '?')
                .replace('{def}', defaultCurrency)}
            </label>
            <input
              className="input"
              type="number"
              min={0}
              step="0.0001"
              value={form.rate || ''}
              placeholder={t.ratePh}
              onChange={e => setForm(f => ({ ...f, rate: parseFloat(e.target.value) || 0 }))}
            />
            {form.currency && form.rate > 0 && (
              <p className="text-xs text-yellow-400 mt-1">
                {t.rateLabel
                  .replace('{cur}', form.currency)
                  .replace('{rate}', form.rate.toFixed(4))
                  .replace('{def}', defaultCurrency)}
              </p>
            )}
          </div>
          <div>
            <label className="label">{t.date}</label>
            <input
              className="input"
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">{t.notes}</label>
            <input
              className="input"
              value={form.notes}
              placeholder={t.notePh}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-700">
          <button className="btn-secondary" onClick={onClose}>{t.cancel}</button>
          <button
            className="btn-primary"
            onClick={() => { if (form.currency && form.rate > 0) onSave(form) }}
          >{t.save}</button>
        </div>
      </div>
    </div>
  )
}

export default function ExchangeRates() {
  const t = useT(L)
  const { exchangeRates, settings, addExchangeRate, updateExchangeRate, deleteExchangeRate } = useStore()
  const [modal, setModal] = useState<{ open: boolean; rate?: ExchangeRate }>({ open: false })
  const defaultCurrency = settings.currency || 'ILS'

  // Group by currency, mark the latest per currency
  const latestByCurrency: Record<string, string> = {}
  for (const xr of [...exchangeRates].sort((a, b) => b.date.localeCompare(a.date))) {
    if (!latestByCurrency[xr.currency]) latestByCurrency[xr.currency] = xr.id
  }

  const sorted = [...exchangeRates].sort((a, b) => b.date.localeCompare(a.date))

  function handleSave(data: Omit<ExchangeRate, 'id' | 'createdAt'>) {
    if (modal.rate) updateExchangeRate(modal.rate.id, data)
    else addExchangeRate(data)
    setModal({ open: false })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
          <p className="text-gray-500 text-sm">{t.subtitle}</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal({ open: true })}>
          <Plus className="w-4 h-4" /> {t.newRate}
        </button>
      </div>

      {/* Summary cards — one per currency showing latest rate */}
      {Object.keys(latestByCurrency).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(latestByCurrency).map(([currency, rateId]) => {
            const xr = exchangeRates.find(x => x.id === rateId)!
            return (
              <div key={currency} className="card py-3">
                <div className="flex items-center gap-2 mb-1">
                  <RefreshCw className="w-3.5 h-3.5 text-yellow-500" />
                  <span className="text-xs font-bold text-yellow-400">{currency}</span>
                </div>
                <p className="text-lg font-bold text-white">
                  1 {currency} = {xr.rate.toLocaleString(undefined, { maximumFractionDigits: 4 })} {defaultCurrency}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{formatDate(xr.date)}</p>
              </div>
            )
          })}
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <RefreshCw className="w-12 h-12 text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">{t.empty}</p>
          <p className="text-gray-600 text-sm mt-1">{t.emptyHint}</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colCurrency}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colRate}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colDate}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">{t.colNotes}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {sorted.map(xr => {
                const isLatest = latestByCurrency[xr.currency] === xr.id
                return (
                  <tr key={xr.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{xr.currency}</span>
                        {isLatest && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-medium">{t.latest}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-green-400 font-medium">
                        1 {xr.currency} = {xr.rate.toLocaleString(undefined, { maximumFractionDigits: 4 })} {defaultCurrency}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-300">{formatDate(xr.date)}</td>
                    <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{xr.notes || '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button className="text-gray-500 hover:text-yellow-400" onClick={() => setModal({ open: true, rate: xr })}>
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          className="text-gray-500 hover:text-red-400"
                          onClick={() => { if (confirm(t.confirmDelete)) deleteExchangeRate(xr.id) }}
                        >
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
          initial={modal.rate ? {
            currency: modal.rate.currency,
            rate: modal.rate.rate,
            date: modal.rate.date,
            notes: modal.rate.notes,
          } : EMPTY_FORM()}
          defaultCurrency={defaultCurrency}
          onSave={handleSave}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  )
}
