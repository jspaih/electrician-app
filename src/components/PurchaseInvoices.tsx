import { useState } from 'react'
import { useStore } from '../store/useStore'
import { formatCurrency, formatDate, today, uid, isValidDate } from '../utils/helpers'
import { Plus, Pencil, Trash2, X, Search, ShoppingCart, CheckCircle, PackagePlus, Shield } from 'lucide-react'
import type { PurchaseInvoice, PurchaseInvoiceLineItem, PurchaseInvoiceStatus } from '../types'
import SearchableSelect from './SearchableSelect'
import type { SelectOption } from './SearchableSelect'
import { useT } from '../hooks/useT'

const CURRENCIES = ['ILS', 'USD', 'EUR', 'JOD', 'EGP', 'SAR', 'AED']

const L = {
  en: {
    title: 'Purchase Invoices',
    subtitle: '{n} invoice(s)',
    newInvoice: 'New Invoice',
    editTitle: 'Edit Purchase Invoice',
    newTitle: 'New Purchase Invoice',
    supplier: 'Supplier *',
    project: 'Project (optional)',
    date: 'Invoice Date',
    dueDate: 'Due Date',
    status: 'Status',
    choose: '-- Select --',
    lines: 'Line Items',
    addLine: 'Add Line',
    searchItem: 'Search item or type...',
    description: 'Description...',
    qty: 'Qty',
    unitPrice: 'Unit Price',
    discount: 'Discount %',
    tax: 'Tax %',
    subtotal: 'Subtotal',
    discountLbl: 'Discount',
    taxLbl: 'Tax',
    total: 'Total',
    paidAmount: 'Paid Amount',
    remaining: 'Remaining',
    updateInventory: 'Update inventory on save',
    notes: 'Notes',
    cancel: 'Cancel',
    save: 'Save Invoice',
    currency: 'Currency',
    exchangeRate: 'Exchange Rate (1 {cur} = ? {def})',
    convertedTotal: '≈ {amount} {def}',
    quickCreate: 'Quick Create Item',
    quickName: 'Item Name *',
    quickCategory: 'Category *',
    quickUnit: 'Unit',
    quickCost: 'Cost Price',
    quickCancel: 'Cancel',
    quickSave: 'Create & Select',
    searchPh: 'Search invoices...',
    allStatuses: 'All Statuses',
    empty: 'No purchase invoices yet',
    emptyHint: 'Record purchases from suppliers to track costs and update inventory',
    colId: 'ID',
    colDate: 'Date',
    colSupplier: 'Supplier',
    colStatus: 'Status',
    colTotal: 'Total',
    colPaid: 'Paid',
    colRemaining: 'Remaining',
    confirmDelete: 'Delete this invoice?',
    statusDraft: 'Draft',
    statusReceived: 'Received',
    statusPartial: 'Partial',
    statusPaid: 'Paid',
    markPaid: 'Mark as Paid',
    invUpdated: 'Inventory updated automatically for linked items.',
    activateWarranty: 'Activate Warranty',
    warrantyItem: 'Item *',
    warrantySerial: 'Serial Number',
    warrantyEnd: 'Warranty End Date *',
    warrantyCancel: 'Cancel',
    warrantySave: 'Save Warranty',
  },
  ar: {
    title: 'فواتير الشراء',
    subtitle: '{n} فاتورة',
    newInvoice: 'فاتورة جديدة',
    editTitle: 'تعديل فاتورة الشراء',
    newTitle: 'فاتورة شراء جديدة',
    supplier: 'المورد *',
    project: 'المشروع (اختياري)',
    date: 'تاريخ الفاتورة',
    dueDate: 'تاريخ الاستحقاق',
    status: 'الحالة',
    choose: '-- اختر --',
    lines: 'بنود الفاتورة',
    addLine: 'إضافة بند',
    searchItem: 'بحث عن صنف أو كتابة...',
    description: 'الوصف...',
    qty: 'الكمية',
    unitPrice: 'سعر الوحدة',
    discount: 'الخصم %',
    tax: 'الضريبة %',
    subtotal: 'المجموع الفرعي',
    discountLbl: 'الخصم',
    taxLbl: 'الضريبة',
    total: 'الإجمالي',
    paidAmount: 'المبلغ المدفوع',
    remaining: 'المتبقي',
    updateInventory: 'تحديث المخزون عند الحفظ',
    notes: 'ملاحظات',
    cancel: 'إلغاء',
    save: 'حفظ الفاتورة',
    currency: 'العملة',
    exchangeRate: 'سعر الصرف (1 {cur} = ? {def})',
    convertedTotal: '≈ {amount} {def}',
    quickCreate: 'إنشاء صنف سريع',
    quickName: 'اسم الصنف *',
    quickCategory: 'الفئة *',
    quickUnit: 'الوحدة',
    quickCost: 'سعر التكلفة',
    quickCancel: 'إلغاء',
    quickSave: 'إنشاء واختيار',
    searchPh: 'بحث في الفواتير...',
    allStatuses: 'جميع الحالات',
    empty: 'لا توجد فواتير شراء بعد',
    emptyHint: 'سجل المشتريات من الموردين لتتبع التكاليف وتحديث المخزون',
    colId: 'المعرّف',
    colDate: 'التاريخ',
    colSupplier: 'المورد',
    colStatus: 'الحالة',
    colTotal: 'الإجمالي',
    colPaid: 'المدفوع',
    colRemaining: 'المتبقي',
    confirmDelete: 'حذف هذه الفاتورة؟',
    statusDraft: 'مسودة',
    statusReceived: 'مستلمة',
    statusPartial: 'مدفوعة جزئياً',
    statusPaid: 'مدفوعة',
    markPaid: 'تعيين كمدفوعة',
    invUpdated: 'تم تحديث المخزون تلقائياً للأصناف المرتبطة.',
    activateWarranty: 'تفعيل الضمان',
    warrantyItem: 'الصنف *',
    warrantySerial: 'الرقم التسلسلي',
    warrantyEnd: 'تاريخ انتهاء الضمان *',
    warrantyCancel: 'إلغاء',
    warrantySave: 'حفظ الضمان',
  },
} as const

const STATUS_KEY: Record<PurchaseInvoiceStatus, keyof typeof L.en> = {
  draft: 'statusDraft',
  received: 'statusReceived',
  partial: 'statusPartial',
  paid: 'statusPaid',
}

function statusColor(s: PurchaseInvoiceStatus) {
  const map: Record<PurchaseInvoiceStatus, string> = {
    draft:    'bg-gray-700 text-gray-300',
    received: 'bg-blue-900 text-blue-300',
    partial:  'bg-yellow-900 text-yellow-300',
    paid:     'bg-green-900 text-green-300',
  }
  return map[s]
}

const EMPTY_LINE = (): PurchaseInvoiceLineItem => ({
  id: uid(), description: '', quantity: 1, unitPrice: 0, total: 0,
})

const ITEM_CATEGORIES = [
  'Wiring', 'Panels', 'Lighting', 'Sockets & Switches',
  'Cables', 'Tools', 'Safety', 'HVAC', 'Other',
]
const ITEM_UNITS = ['pcs', 'm', 'kg', 'set', 'box', 'roll', 'pair', 'hour', 'day']

function calcTotals(lines: PurchaseInvoiceLineItem[], discountPercent: number, taxPercent: number) {
  const subtotal = lines.reduce((s, l) => s + l.total, 0)
  const discount = subtotal * (discountPercent / 100)
  const afterDiscount = subtotal - discount
  const tax = afterDiscount * (taxPercent / 100)
  return { subtotal, discount, tax, total: afterDiscount + tax }
}

const STATUSES: PurchaseInvoiceStatus[] = ['draft', 'received', 'partial', 'paid']

const EMPTY_QUICK_ITEM = () => ({ name: '', category: '', unit: 'pcs', costPrice: 0 })

function Modal({
  initial, onSave, onClose,
}: {
  initial: Omit<PurchaseInvoice, 'id' | 'createdAt'>
  onSave: (d: Omit<PurchaseInvoice, 'id' | 'createdAt'>, updateInv: boolean) => void
  onClose: () => void
}) {
  const t = useT(L)
  const { suppliers, projects, items, settings, addItem, addWarranty, getLatestRate } = useStore()
  const defaultCurrency = settings.currency || 'ILS'
  const [form, setForm] = useState({ ...initial, currency: initial.currency ?? defaultCurrency, exchangeRate: initial.exchangeRate ?? 1 })
  const [updateInv, setUpdateInv] = useState(true)
  const [quickLineIdx, setQuickLineIdx] = useState<number | null>(null)
  const [quickItem, setQuickItem] = useState(EMPTY_QUICK_ITEM())
  const [warrantyLineIdx, setWarrantyLineIdx] = useState<number | null>(null)
  const [warrantyForm, setWarrantyForm] = useState({ serialNumber: '', endDate: '' })
  const setField = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }))

  const isForeign = form.currency !== defaultCurrency
  const convertedTotal = form.total * (form.exchangeRate ?? 1)

  function handleCurrencyChange(cur: string) {
    const rate = cur === defaultCurrency ? 1 : (getLatestRate(cur) ?? 1)
    setForm(f => ({ ...f, currency: cur, exchangeRate: rate }))
  }

  function handleQuickCreate(idx: number) {
    if (!quickItem.name.trim() || !quickItem.category.trim()) return
    const isForeignCost = isForeign && form.exchangeRate && form.exchangeRate > 0
    // costPrice is always stored in the app default currency (ILS)
    const costPriceInDefault = isForeignCost
      ? quickItem.costPrice * (form.exchangeRate ?? 1)
      : quickItem.costPrice
    const newItem = addItem({
      name: quickItem.name.trim(),
      description: '',
      category: quickItem.category.trim(),
      unit: quickItem.unit || 'pcs',
      minStock: 0,
      costPrice: costPriceInDefault,
      sellingPrice: 0,
      supplierId: form.supplierId || undefined,
      sku: '',
      imageUrl: '',
      costCurrency: isForeignCost ? form.currency : undefined,
      costExchangeRate: isForeignCost ? (form.exchangeRate ?? undefined) : undefined,
    })
    // Line item unit price is in invoice currency
    const price = quickItem.costPrice
    const lines = form.lineItems.map((l, i) => {
      if (i !== idx) return l
      return { ...l, itemId: newItem.id, description: newItem.name, unitPrice: price, total: l.quantity * price }
    })
    const totals = calcTotals(lines, form.discountPercent, form.taxPercent)
    setForm(f => ({ ...f, lineItems: lines, ...totals }))
    setQuickLineIdx(null)
    setQuickItem(EMPTY_QUICK_ITEM())
  }

  const itemOptions: SelectOption[] = items.map(i => ({
    value: i.id,
    label: i.name,
    sub: `${formatCurrency(i.costPrice)} • ${i.category}`,
  }))

  function updateLine(idx: number, key: keyof PurchaseInvoiceLineItem, val: string | number) {
    const lines = form.lineItems.map((l, i) => {
      if (i !== idx) return l
      const updated = { ...l, [key]: val }
      if (key === 'quantity' || key === 'unitPrice') {
        updated.total = (key === 'quantity' ? (val as number) : l.quantity) *
                        (key === 'unitPrice' ? (val as number) : l.unitPrice)
      }
      return updated
    })
    const totals = calcTotals(lines, form.discountPercent, form.taxPercent)
    setForm(f => ({ ...f, lineItems: lines, ...totals }))
  }

  function fillFromItem(idx: number, itemId: string) {
    const item = items.find(i => i.id === itemId)
    if (!item) return
    const lines = form.lineItems.map((l, i) => {
      if (i !== idx) return l
      const total = l.quantity * item.costPrice
      return { ...l, itemId, description: item.name, unitPrice: item.costPrice, total }
    })
    const totals = calcTotals(lines, form.discountPercent, form.taxPercent)
    setForm(f => ({ ...f, lineItems: lines, ...totals }))
  }

  function updateTaxDiscount(discountPercent: number, taxPercent: number) {
    const totals = calcTotals(form.lineItems, discountPercent, taxPercent)
    setForm(f => ({ ...f, discountPercent, taxPercent, ...totals }))
  }

  const remaining = form.total - form.paidAmount

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
          <h2 className="font-semibold text-white">{initial.supplierId ? t.editTitle : t.newTitle}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t.supplier}</label>
              <select className="input" value={form.supplierId} onChange={e => setField('supplierId', e.target.value)}>
                <option value="">{t.choose}</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t.project}</label>
              <select className="input" value={form.projectId ?? ''} onChange={e => setField('projectId', e.target.value || undefined)}>
                <option value="">{t.choose}</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">{t.date}</label>
              <input className="input" type="date" value={form.date} onChange={e => setField('date', e.target.value)} />
            </div>
            <div>
              <label className="label">{t.dueDate}</label>
              <input className="input" type="date" value={form.dueDate ?? ''} onChange={e => setField('dueDate', e.target.value || undefined)} />
            </div>
            <div>
              <label className="label">{t.status}</label>
              <select className="input" value={form.status} onChange={e => setField('status', e.target.value as PurchaseInvoiceStatus)}>
                {STATUSES.map(s => <option key={s} value={s}>{t[STATUS_KEY[s]]}</option>)}
              </select>
            </div>
          </div>

          {/* Currency + Exchange Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t.currency}</label>
              <select className="input" value={form.currency} onChange={e => handleCurrencyChange(e.target.value)}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {isForeign && (
              <div>
                <label className="label">
                  {t.exchangeRate.replace('{cur}', form.currency).replace('{def}', defaultCurrency)}
                </label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  step="0.0001"
                  value={form.exchangeRate ?? ''}
                  onChange={e => setField('exchangeRate', parseFloat(e.target.value) || 0)}
                />
              </div>
            )}
          </div>

          {/* Line items */}
          <div>
            <label className="label mb-2">{t.lines}</label>
            <div className="space-y-3">
              {form.lineItems.map((line, idx) => (
                <div key={line.id} className="bg-gray-900/30 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-6">{idx + 1}.</span>
                    <div className="flex-1">
                      <SearchableSelect
                        options={itemOptions}
                        value={line.itemId ?? ''}
                        onChange={val => { if (val) fillFromItem(idx, val) }}
                        placeholder={t.searchItem}
                        allowCustom
                      />
                    </div>
                    <button
                      className="text-gray-500 hover:text-yellow-400 shrink-0"
                      title={t.quickCreate}
                      onClick={() => { setQuickLineIdx(quickLineIdx === idx ? null : idx); setQuickItem(EMPTY_QUICK_ITEM()); setWarrantyLineIdx(null) }}
                    ><PackagePlus className="w-4 h-4" /></button>
                    {line.itemId && (
                      <button
                        className={`shrink-0 transition-colors ${warrantyLineIdx === idx ? 'text-green-400' : 'text-gray-500 hover:text-green-400'}`}
                        title={t.activateWarranty}
                        onClick={() => {
                          const item = items.find(i => i.id === line.itemId)
                          setWarrantyLineIdx(warrantyLineIdx === idx ? null : idx)
                          setWarrantyForm({ serialNumber: item?.serialNumber ?? '', endDate: '' })
                          setQuickLineIdx(null)
                        }}
                      ><Shield className="w-4 h-4" /></button>
                    )}
                    <button
                      className="text-gray-600 hover:text-red-400 shrink-0"
                      onClick={() => {
                        const lines = form.lineItems.filter((_, i) => i !== idx)
                        setForm(f => ({ ...f, lineItems: lines, ...calcTotals(lines, f.discountPercent, f.taxPercent) }))
                        if (quickLineIdx === idx) setQuickLineIdx(null)
                        if (warrantyLineIdx === idx) setWarrantyLineIdx(null)
                      }}
                    ><X className="w-4 h-4" /></button>
                  </div>
                  <div className="flex gap-2 ml-8">
                    <div className="flex-1">
                      <input className="input text-xs" value={line.description} onChange={e => updateLine(idx, 'description', e.target.value)} placeholder={t.description} />
                    </div>
                    <div className="w-20">
                      <input className="input text-xs" type="number" min={0} step="0.001" value={line.quantity} onChange={e => updateLine(idx, 'quantity', parseFloat(e.target.value) || 0)} placeholder={t.qty} />
                    </div>
                    <div className="w-28">
                      <input className="input text-xs" type="number" min={0} step="0.01" value={line.unitPrice} onChange={e => updateLine(idx, 'unitPrice', parseFloat(e.target.value) || 0)} placeholder={t.unitPrice} />
                    </div>
                    <div className="w-24 text-right">
                      <p className="text-sm font-medium text-white py-2">{formatCurrency(line.total, form.currency)}</p>
                    </div>
                  </div>
                  {/* Inline quick-create item form */}
                  {warrantyLineIdx === idx && (() => {
                    const item = items.find(i => i.id === line.itemId)
                    return (
                      <div className="ml-8 bg-gray-800 border border-green-500/40 rounded-lg p-3 space-y-2">
                        <p className="text-xs font-semibold text-green-400 flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5" /> {t.activateWarranty}: {item?.name}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-500">{t.warrantySerial}</label>
                            <input className="input text-xs" value={warrantyForm.serialNumber}
                              onChange={e => setWarrantyForm(f => ({ ...f, serialNumber: e.target.value }))} />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">{t.warrantyEnd}</label>
                            <input className="input text-xs" type="date" value={warrantyForm.endDate}
                              onChange={e => setWarrantyForm(f => ({ ...f, endDate: e.target.value }))} />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button className="btn-secondary text-xs py-1 px-3" onClick={() => setWarrantyLineIdx(null)}>{t.warrantyCancel}</button>
                          <button
                            className="btn-primary text-xs py-1 px-3"
                            onClick={() => {
                              if (!warrantyForm.endDate) return
                              addWarranty({
                                itemId: line.itemId,
                                itemDescription: item?.name ?? line.description,
                                serialNumber: warrantyForm.serialNumber,
                                manufacturer: '',
                                startDate: form.date || today(),
                                endDate: warrantyForm.endDate,
                                status: 'active',
                                projectId: form.projectId ?? '',
                                clientId: '',
                                notes: '',
                              })
                              setWarrantyLineIdx(null)
                            }}
                          >{t.warrantySave}</button>
                        </div>
                      </div>
                    )
                  })()}
                  {quickLineIdx === idx && (
                    <div className="ml-8 bg-gray-800 border border-yellow-500/40 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-semibold text-yellow-400 flex items-center gap-1.5">
                        <PackagePlus className="w-3.5 h-3.5" /> {t.quickCreate}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <input className="input text-xs" placeholder={t.quickName}
                          value={quickItem.name} onChange={e => setQuickItem(q => ({ ...q, name: e.target.value }))} />
                        <select className="input text-xs" value={quickItem.category}
                          onChange={e => setQuickItem(q => ({ ...q, category: e.target.value }))}>
                          <option value="">{t.quickCategory}</option>
                          {ITEM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select className="input text-xs" value={quickItem.unit}
                          onChange={e => setQuickItem(q => ({ ...q, unit: e.target.value }))}>
                          {ITEM_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                        <div className="relative">
                          <input className="input text-xs pr-12" type="number" min={0} step="0.01" placeholder={t.quickCost}
                            value={quickItem.costPrice || ''} onChange={e => setQuickItem(q => ({ ...q, costPrice: parseFloat(e.target.value) || 0 }))} />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-yellow-400 font-mono pointer-events-none">{form.currency}</span>
                        </div>
                      </div>
                      {isForeign && quickItem.costPrice > 0 && form.exchangeRate && form.exchangeRate > 0 && (
                        <p className="text-xs text-yellow-400 ml-1">
                          ≈ {formatCurrency(quickItem.costPrice * form.exchangeRate, defaultCurrency)} {defaultCurrency}
                        </p>
                      )}
                      <div className="flex gap-2 justify-end">
                        <button className="btn-secondary text-xs py-1 px-3" onClick={() => setQuickLineIdx(null)}>{t.quickCancel}</button>
                        <button className="btn-primary text-xs py-1 px-3" onClick={() => handleQuickCreate(idx)}>{t.quickSave}</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Add line button at bottom, square style */}
            <button
              className="mt-2 w-full border border-dashed border-gray-600 hover:border-yellow-500 text-gray-500 hover:text-yellow-400 rounded-lg py-2 text-sm flex items-center justify-center gap-1 transition-colors"
              onClick={() => setForm(f => ({ ...f, lineItems: [...f.lineItems, EMPTY_LINE()] }))}
            >
              <Plus className="w-4 h-4" /> {t.addLine}
            </button>
          </div>

          {/* Totals */}
          <div className="bg-gray-900/50 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t.discount}</label>
                <input className="input" type="number" min={0} max={100} step="0.1"
                  value={form.discountPercent}
                  onChange={e => updateTaxDiscount(parseFloat(e.target.value) || 0, form.taxPercent)}
                />
              </div>
              <div>
                <label className="label">{t.tax}</label>
                <input className="input" type="number" min={0} max={100} step="0.1"
                  value={form.taxPercent}
                  onChange={e => updateTaxDiscount(form.discountPercent, parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="space-y-1.5 pt-2 border-t border-gray-700">
              <div className="flex justify-between text-sm text-gray-400">
                <span>{t.subtotal}</span><span>{formatCurrency(form.subtotal, form.currency)}</span>
              </div>
              {form.discount > 0 && (
                <div className="flex justify-between text-sm text-red-400">
                  <span>{t.discountLbl} ({form.discountPercent}%)</span><span>-{formatCurrency(form.discount, form.currency)}</span>
                </div>
              )}
              {form.tax > 0 && (
                <div className="flex justify-between text-sm text-gray-400">
                  <span>{t.taxLbl} ({form.taxPercent}%)</span><span>{formatCurrency(form.tax, form.currency)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-white text-lg border-t border-gray-600 pt-2">
                <span>{t.total}</span>
                <div className="text-right">
                  <span>{formatCurrency(form.total, form.currency)}</span>
                  {isForeign && form.exchangeRate && form.exchangeRate > 0 && (
                    <p className="text-xs text-yellow-400 font-normal mt-0.5">
                      {t.convertedTotal
                        .replace('{amount}', formatCurrency(convertedTotal))
                        .replace('{def}', defaultCurrency)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment tracking */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t.paidAmount}</label>
              <input className="input" type="number" min={0} step="0.01" value={form.paidAmount}
                onChange={e => setField('paidAmount', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="flex flex-col justify-end pb-1">
              <p className="text-xs text-gray-500">{t.remaining}</p>
              <p className={`text-lg font-bold ${remaining <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(Math.max(0, remaining), form.currency)}
              </p>
            </div>
          </div>

          {/* Inventory checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={updateInv} onChange={e => setUpdateInv(e.target.checked)}
              className="w-4 h-4 rounded text-yellow-500 bg-gray-700 border-gray-600" />
            <span className="text-sm text-gray-300">{t.updateInventory}</span>
          </label>

          <div>
            <label className="label">{t.notes}</label>
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => setField('notes', e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-700">
          <button className="btn-secondary" onClick={onClose}>{t.cancel}</button>
          <button
            className="btn-primary"
            onClick={() => { if (form.supplierId && form.lineItems.length > 0 && isValidDate(form.date)) onSave(form, updateInv) }}
          >{t.save}</button>
        </div>
      </div>
    </div>
  )
}

const EMPTY_INVOICE = (): Omit<PurchaseInvoice, 'id' | 'createdAt'> => ({
  supplierId: '', projectId: undefined,
  lineItems: [EMPTY_LINE()],
  subtotal: 0, discountPercent: 0, discount: 0,
  taxPercent: 0, tax: 0, total: 0,
  paidAmount: 0, date: today(), dueDate: undefined,
  currency: undefined, exchangeRate: undefined,
  status: 'draft', notes: '',
})

export default function PurchaseInvoices() {
  const t = useT(L)
  const { purchaseInvoices, suppliers, addPurchaseInvoice, updatePurchaseInvoice, deletePurchaseInvoice } = useStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PurchaseInvoiceStatus | 'all'>('all')
  const [modal, setModal] = useState<{ open: boolean; invoice?: PurchaseInvoice }>({ open: false })

  const q = search.toLowerCase()
  const filtered = purchaseInvoices
    .filter(inv => {
      const matchStatus = statusFilter === 'all' || inv.status === statusFilter
      const sup = suppliers.find(s => s.id === inv.supplierId)
      const matchSearch = inv.id.toLowerCase().includes(q) ||
        (sup?.name ?? '').toLowerCase().includes(q) ||
        String(inv.total).includes(q) ||
        String(inv.paidAmount).includes(q)
      return matchStatus && matchSearch
    })
    .sort((a, b) => b.date.localeCompare(a.date))

  function handleSave(data: Omit<PurchaseInvoice, 'id' | 'createdAt'>, updateInv: boolean) {
    if (modal.invoice) {
      updatePurchaseInvoice(modal.invoice.id, data)
    } else {
      addPurchaseInvoice(data, updateInv)
      if (updateInv) alert(t.invUpdated)
    }
    setModal({ open: false })
  }

  const totals = filtered.reduce((acc, inv) => ({
    total: acc.total + inv.total,
    paid:  acc.paid + inv.paidAmount,
  }), { total: 0, paid: 0 })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
          <p className="text-gray-500 text-sm">{t.subtitle.replace('{n}', String(purchaseInvoices.length))}</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal({ open: true })}>
          <Plus className="w-4 h-4" /> {t.newInvoice}
        </button>
      </div>

      {/* Summary cards */}
      {purchaseInvoices.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card py-3">
            <p className="text-xs text-gray-500">{t.colTotal}</p>
            <p className="text-xl font-bold text-white">{formatCurrency(totals.total)}</p>
          </div>
          <div className="card py-3">
            <p className="text-xs text-gray-500">{t.colPaid}</p>
            <p className="text-xl font-bold text-green-400">{formatCurrency(totals.paid)}</p>
          </div>
          <div className="card py-3">
            <p className="text-xs text-gray-500">{t.colRemaining}</p>
            <p className="text-xl font-bold text-red-400">{formatCurrency(totals.total - totals.paid)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input className="input pl-9" placeholder={t.searchPh} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value as PurchaseInvoiceStatus | 'all')}>
          <option value="all">{t.allStatuses}</option>
          {STATUSES.map(s => <option key={s} value={s}>{t[STATUS_KEY[s]]}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <ShoppingCart className="w-12 h-12 text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">{t.empty}</p>
          <p className="text-gray-600 text-sm mt-1">{t.emptyHint}</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colId}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colDate}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colSupplier}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colStatus}</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colTotal}</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">{t.colPaid}</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">{t.colRemaining}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => {
                const sup = suppliers.find(s => s.id === inv.supplierId)
                const rem = inv.total - inv.paidAmount
                return (
                  <tr key={inv.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-yellow-500">{inv.id}</td>
                    <td className="px-5 py-3 text-gray-300">{formatDate(inv.date)}</td>
                    <td className="px-5 py-3 text-gray-300">{sup?.name ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`badge ${statusColor(inv.status)}`}>{t[STATUS_KEY[inv.status]]}</span>
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-white">
                      <span>{formatCurrency(inv.total, inv.currency ?? 'ILS')}</span>
                      {inv.currency && inv.currency !== 'ILS' && inv.exchangeRate && inv.exchangeRate > 0 && (
                        <p className="text-xs text-yellow-400 font-normal">≈ {formatCurrency(inv.total * inv.exchangeRate, 'ILS')}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right text-green-400 hidden md:table-cell">{formatCurrency(inv.paidAmount, inv.currency ?? 'ILS')}</td>
                    <td className="px-5 py-3 text-right hidden md:table-cell">
                      <span className={rem > 0 ? 'text-red-400' : 'text-gray-500'}>{formatCurrency(rem, inv.currency ?? 'ILS')}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        {inv.status !== 'paid' && (
                          <button
                            className="text-gray-500 hover:text-green-400"
                            title={t.markPaid}
                            onClick={() => updatePurchaseInvoice(inv.id, { status: 'paid', paidAmount: inv.total })}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button className="text-gray-500 hover:text-yellow-400" onClick={() => setModal({ open: true, invoice: inv })}>
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button className="text-gray-500 hover:text-red-400" onClick={() => { if (confirm(t.confirmDelete)) deletePurchaseInvoice(inv.id) }}>
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
          initial={modal.invoice ? {
            supplierId: modal.invoice.supplierId,
            projectId: modal.invoice.projectId,
            lineItems: modal.invoice.lineItems,
            subtotal: modal.invoice.subtotal,
            discountPercent: modal.invoice.discountPercent,
            discount: modal.invoice.discount,
            taxPercent: modal.invoice.taxPercent,
            tax: modal.invoice.tax,
            total: modal.invoice.total,
            paidAmount: modal.invoice.paidAmount,
            currency: modal.invoice.currency,
            exchangeRate: modal.invoice.exchangeRate,
            date: modal.invoice.date,
            dueDate: modal.invoice.dueDate,
            status: modal.invoice.status,
            notes: modal.invoice.notes,
          } : EMPTY_INVOICE()}
          onSave={handleSave}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  )
}
