import { useState } from 'react'
import { useStore } from '../store/useStore'
import { formatCurrency, formatDate, today, uid, isValidDate } from '../utils/helpers'
import { Plus, Trash2, X, Search, Receipt as ReceiptIcon, Printer, Share2, AlertTriangle, PackagePlus, Shield } from 'lucide-react'
import ShareModal from './ShareModal'
import type { Receipt, ReceiptLineItem } from '../types'
import SearchableSelect from './SearchableSelect'
import type { SelectOption } from './SearchableSelect'
import { useT } from '../hooks/useT'

const CURRENCIES = ['ILS', 'USD', 'EUR', 'JOD', 'EGP', 'SAR', 'AED', 'GBP']

const L = {
  en: {
    title: 'Sales Invoices',
    subtitle: '{n} invoice(s)',
    newInvoice: 'New Sales Invoice',
    searchPh: 'Search by ID, client, project, amount…',
    empty: 'No sales invoices yet',
    emptyHint: 'Create sales invoices for clients — inventory will be deducted automatically',
    modalTitle: 'New Sales Invoice',
    modalEdit: 'Edit Sales Invoice',
    client: 'Client *',
    chooseClient: 'Search client…',
    project: 'Project',
    chooseProject: '-- Select project --',
    date: 'Date',
    lines: 'Invoice Lines',
    addLine: 'Add Line',
    searchItem: 'Search item or type…',
    description: 'Description…',
    qty: 'Qty',
    price: 'Price',
    discount: 'Discount %',
    tax: 'Tax (VAT) %',
    subtotal: 'Subtotal',
    discountLbl: 'Discount',
    taxLbl: 'Tax',
    total: 'Total',
    currency: 'Currency',
    exchangeRate: 'Exchange Rate (1 {cur} = ? {def})',
    convertedTotal: '≈ {amount} {def}',
    notes: 'Notes',
    cancel: 'Cancel',
    save: 'Save Invoice',
    colId: 'ID',
    colDate: 'Date',
    colClient: 'Client',
    colProject: 'Project',
    colLines: 'Lines',
    colTotal: 'Total',
    colStatus: 'Status',
    statusPaid: 'Paid',
    statusPartial: 'Partial',
    statusUnpaid: 'Unpaid',
    paidLabel: 'Paid:',
    linesCount: '{n} line(s)',
    confirmDelete: 'Delete this sales invoice?',
    print: 'Print',
    waShare: 'Share via WhatsApp',
    // stock warnings
    noStock: 'No stock for: {name}',
    lowStock: 'Low stock for: {name} (only {n} left)',
    // quick create
    quickCreate: 'Quick Create Item',
    quickName: 'Item Name *',
    quickCategory: 'Category *',
    quickUnit: 'Unit',
    quickSell: 'Selling Price',
    quickCancel: 'Cancel',
    quickSave: 'Create & Select',
    activateWarranty: 'Activate Warranty',
    warrantySerial: 'Serial Number',
    warrantyEnd: 'Warranty End Date *',
    warrantyCancel: 'Cancel',
    warrantySave: 'Save Warranty',
    // print
    pInvoice: 'Invoice',
    pDate: 'Date',
    pClient: 'Client',
    pDesc: 'Description',
    pQty: 'Qty',
    pUnitPrice: 'Unit Price',
    pTotal: 'Total',
    pNotes: 'Notes',
    pThankYou: 'Thank you for your business!',
  },
  ar: {
    title: 'فواتير المبيعات',
    subtitle: '{n} فاتورة',
    newInvoice: 'فاتورة مبيعات جديدة',
    searchPh: 'بحث بالمعرّف أو العميل أو المشروع أو المبلغ...',
    empty: 'لا توجد فواتير مبيعات بعد',
    emptyHint: 'أنشئ فواتير مبيعات للعملاء — سيتم خصم المخزون تلقائياً',
    modalTitle: 'فاتورة مبيعات جديدة',
    modalEdit: 'تعديل فاتورة المبيعات',
    client: 'العميل *',
    chooseClient: 'ابحث عن عميل...',
    project: 'المشروع',
    chooseProject: '-- اختر المشروع --',
    date: 'التاريخ',
    lines: 'بنود الفاتورة',
    addLine: 'إضافة بند',
    searchItem: 'ابحث عن صنف أو اكتب...',
    description: 'الوصف...',
    qty: 'الكمية',
    price: 'السعر',
    discount: 'الخصم %',
    tax: 'الضريبة (ض.ق.م) %',
    subtotal: 'المجموع الفرعي',
    discountLbl: 'الخصم',
    taxLbl: 'الضريبة',
    total: 'الإجمالي',
    currency: 'العملة',
    exchangeRate: 'سعر الصرف (1 {cur} = ? {def})',
    convertedTotal: '≈ {amount} {def}',
    notes: 'ملاحظات',
    cancel: 'إلغاء',
    save: 'حفظ الفاتورة',
    colId: 'المعرّف',
    colDate: 'التاريخ',
    colClient: 'العميل',
    colProject: 'المشروع',
    colLines: 'البنود',
    colTotal: 'الإجمالي',
    colStatus: 'الحالة',
    statusPaid: 'مدفوعة',
    statusPartial: 'جزئية',
    statusUnpaid: 'غير مدفوعة',
    paidLabel: 'المدفوع:',
    linesCount: '{n} بند',
    confirmDelete: 'حذف فاتورة المبيعات هذه؟',
    print: 'طباعة',
    waShare: 'مشاركة عبر واتساب',
    // stock warnings
    noStock: 'لا يوجد مخزون لـ: {name}',
    lowStock: 'مخزون منخفض لـ: {name} (متبقٍّ {n} فقط)',
    // quick create
    quickCreate: 'إنشاء صنف سريع',
    quickName: 'اسم الصنف *',
    quickCategory: 'الفئة *',
    quickUnit: 'الوحدة',
    quickSell: 'سعر البيع',
    quickCancel: 'إلغاء',
    quickSave: 'إنشاء واختيار',
    activateWarranty: 'تفعيل الضمان',
    warrantySerial: 'الرقم التسلسلي',
    warrantyEnd: 'تاريخ انتهاء الضمان *',
    warrantyCancel: 'إلغاء',
    warrantySave: 'حفظ الضمان',
    // print
    pInvoice: 'فاتورة',
    pDate: 'التاريخ',
    pClient: 'العميل',
    pDesc: 'الوصف',
    pQty: 'الكمية',
    pUnitPrice: 'سعر الوحدة',
    pTotal: 'الإجمالي',
    pNotes: 'ملاحظات',
    pThankYou: 'شكراً لتعاملكم معنا!',
  },
} as const

const EMPTY_LINE = (): ReceiptLineItem => ({ id: uid(), description: '', quantity: 1, unitPrice: 0, total: 0 })

const ITEM_CATEGORIES = [
  'Wiring', 'Panels', 'Lighting', 'Sockets & Switches',
  'Cables', 'Tools', 'Safety', 'HVAC', 'Other',
]
const ITEM_UNITS = ['pcs', 'm', 'kg', 'set', 'box', 'roll', 'pair', 'hour', 'day']

function calcTotals(lineItems: ReceiptLineItem[], discountPercent: number, taxPercent: number) {
  const subtotal = lineItems.reduce((s, l) => s + l.total, 0)
  const discount = subtotal * (discountPercent / 100)
  const afterDiscount = subtotal - discount
  const tax = afterDiscount * (taxPercent / 100)
  const total = afterDiscount + tax
  return { subtotal, discount, tax, total }
}

const EMPTY_QUICK = () => ({ name: '', category: '', unit: 'pcs', sellingPrice: 0 })

type InvoiceForm = Omit<Receipt, 'id' | 'createdAt'> & { currency: string; exchangeRate: number }

function Modal({
  initial, onSave, onClose,
}: {
  initial: InvoiceForm
  onSave: (d: InvoiceForm) => void
  onClose: () => void
}) {
  const t = useT(L)
  const { clients, projects, items, settings, addItem, addWarranty, getItemStock, getLatestRate } = useStore()
  const defaultCurrency = settings.currency || 'ILS'
  const [form, setForm] = useState(initial)
  const [quickLineIdx, setQuickLineIdx] = useState<number | null>(null)
  const [quickItem, setQuickItem] = useState(EMPTY_QUICK())
  const [stockWarnings, setStockWarnings] = useState<string[]>([])
  const [warrantyLineIdx, setWarrantyLineIdx] = useState<number | null>(null)
  const [warrantyForm, setWarrantyForm] = useState({ serialNumber: '', endDate: '' })
  const setField = (k: keyof InvoiceForm, v: any) => setForm(f => ({ ...f, [k]: v }))

  const isForeign = form.currency !== defaultCurrency
  const convertedTotal = form.total * form.exchangeRate

  function handleCurrencyChange(cur: string) {
    const oldRate = form.exchangeRate ?? 1
    const newRate = cur === defaultCurrency ? 1 : (getLatestRate(cur) ?? 1)
    setForm(f => {
      const lines = f.lineItems.map(l => {
        const priceInIls = l.unitPrice * oldRate
        const newPrice = newRate > 0 ? priceInIls / newRate : l.unitPrice
        const rounded = Math.round(newPrice * 1000) / 1000
        return { ...l, unitPrice: rounded, total: l.quantity * rounded }
      })
      return { ...f, currency: cur, exchangeRate: newRate, lineItems: lines, ...calcTotals(lines, f.discountPercent, f.taxPercent) }
    })
  }

  const filteredProjects = form.clientId ? projects.filter(p => p.clientId === form.clientId) : projects

  const clientOptions: SelectOption[] = clients.map(c => ({
    value: c.id, label: c.name, sub: c.phone || '',
  }))

  const itemOptions: SelectOption[] = items.map(i => {
    const stock = getItemStock(i.id)
    return {
      value: i.id,
      label: i.name,
      sub: `${formatCurrency(i.sellingPrice, form.currency)} • Stock: ${stock}`,
    }
  })

  function checkStock(lines: ReceiptLineItem[]) {
    const warnings: string[] = []
    for (const line of lines) {
      if (!line.itemId) continue
      const item = items.find(i => i.id === line.itemId)
      if (!item) continue
      const stock = getItemStock(line.itemId)
      if (stock <= 0) {
        warnings.push(t.noStock.replace('{name}', item.name))
      } else if (stock < line.quantity) {
        warnings.push(t.lowStock.replace('{name}', item.name).replace('{n}', String(stock)))
      } else if (stock <= item.minStock) {
        warnings.push(t.lowStock.replace('{name}', item.name).replace('{n}', String(stock)))
      }
    }
    setStockWarnings(warnings)
  }

  function updateLine(idx: number, key: keyof ReceiptLineItem, val: string | number) {
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
    checkStock(lines)
  }

  function fillFromItem(idx: number, itemId: string) {
    const item = items.find(i => i.id === itemId)
    if (!item) return
    const price = isForeign && form.exchangeRate > 0 ? item.sellingPrice / form.exchangeRate : item.sellingPrice
    const lines = form.lineItems.map((l, i) => {
      if (i !== idx) return l
      return { ...l, itemId, description: item.name, unitPrice: price, total: l.quantity * price }
    })
    const totals = calcTotals(lines, form.discountPercent, form.taxPercent)
    setForm(f => ({ ...f, lineItems: lines, ...totals }))
    checkStock(lines)
  }

  function handleQuickCreate(idx: number) {
    if (!quickItem.name.trim() || !quickItem.category.trim()) return
    const newItem = addItem({
      name: quickItem.name.trim(), description: '',
      category: quickItem.category.trim(), unit: quickItem.unit || 'pcs',
      minStock: 0, costPrice: 0, sellingPrice: quickItem.sellingPrice,
      sku: '', imageUrl: '',
    })
    // Fix closure bug: use newItem directly
    const price = isForeign && form.exchangeRate > 0 ? quickItem.sellingPrice / form.exchangeRate : quickItem.sellingPrice
    const lines = form.lineItems.map((l, i) => {
      if (i !== idx) return l
      return { ...l, itemId: newItem.id, description: newItem.name, unitPrice: price, total: l.quantity * price }
    })
    const totals = calcTotals(lines, form.discountPercent, form.taxPercent)
    setForm(f => ({ ...f, lineItems: lines, ...totals }))
    checkStock(lines)
    setQuickLineIdx(null)
    setQuickItem(EMPTY_QUICK())
  }

  function addLine() {
    setForm(f => ({ ...f, lineItems: [...f.lineItems, EMPTY_LINE()] }))
  }

  function removeLine(idx: number) {
    const lines = form.lineItems.filter((_, i) => i !== idx)
    const totals = calcTotals(lines, form.discountPercent, form.taxPercent)
    setForm(f => ({ ...f, lineItems: lines, ...totals }))
    checkStock(lines)
  }

  function updateTaxDiscount(discountPercent: number, taxPercent: number) {
    const totals = calcTotals(form.lineItems, discountPercent, taxPercent)
    setForm(f => ({ ...f, discountPercent, taxPercent, ...totals }))
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
          <h2 className="font-semibold text-white">{initial.clientId ? t.modalEdit : t.modalTitle}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Searchable client */}
          <div>
            <label className="label">{t.client}</label>
            <SearchableSelect
              options={clientOptions}
              value={form.clientId ?? ''}
              onChange={val => { setField('clientId', val ?? ''); setField('projectId', '') }}
              placeholder={t.chooseClient}
            />
          </div>

          {/* Searchable project */}
          <div>
            <label className="label">{t.project}</label>
            <select className="input" value={form.projectId ?? ''} onChange={e => setField('projectId', e.target.value || undefined)}>
              <option value="">{t.chooseProject}</option>
              {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t.date}</label>
              <input className="input" type="date" value={form.date} onChange={e => setField('date', e.target.value)} />
            </div>
            {/* Currency */}
            <div>
              <label className="label">{t.currency}</label>
              <select className="input" value={form.currency} onChange={e => handleCurrencyChange(e.target.value)}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
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
                value={form.exchangeRate || ''}
                onChange={e => setField('exchangeRate', parseFloat(e.target.value) || 0)}
              />
            </div>
          )}

          {/* Stock warnings */}
          {stockWarnings.length > 0 && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3 space-y-1">
              {stockWarnings.map((w, i) => (
                <p key={i} className="text-xs text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 shrink-0" /> {w}
                </p>
              ))}
            </div>
          )}

          {/* Line items */}
          <div>
            <label className="label mb-2">{t.lines}</label>
            <div className="space-y-3">
              {form.lineItems.map((line, idx) => (
                <div key={line.id} className="bg-gray-900/30 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-6 shrink-0">{idx + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <SearchableSelect
                        options={itemOptions}
                        value={line.itemId ?? line.description}
                        onChange={(val) => {
                          if (!val) {
                            const lines = form.lineItems.map((l, i) =>
                              i !== idx ? l : { ...l, itemId: undefined, description: '' }
                            )
                            setForm(f => ({ ...f, lineItems: lines, ...calcTotals(lines, f.discountPercent, f.taxPercent) }))
                          } else if (items.find(i => i.id === val)) {
                            fillFromItem(idx, val)
                          } else {
                            // Free text
                            const lines = form.lineItems.map((l, i) =>
                              i !== idx ? l : { ...l, itemId: undefined, description: val }
                            )
                            setForm(f => ({ ...f, lineItems: lines, ...calcTotals(lines, f.discountPercent, f.taxPercent) }))
                          }
                        }}
                        placeholder={t.searchItem}
                        allowCustom
                      />
                    </div>
                    <button
                      className="text-gray-500 hover:text-yellow-400 shrink-0"
                      title={t.quickCreate}
                      onClick={() => { setQuickLineIdx(quickLineIdx === idx ? null : idx); setQuickItem(EMPTY_QUICK()); setWarrantyLineIdx(null) }}
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
                    <button className="text-gray-600 hover:text-red-400 shrink-0" onClick={() => { removeLine(idx); if (quickLineIdx === idx) setQuickLineIdx(null); if (warrantyLineIdx === idx) setWarrantyLineIdx(null) }}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-2 ml-8">
                    <div className="flex-1">
                      <input className="input text-xs" value={line.description} onChange={e => updateLine(idx, 'description', e.target.value)} placeholder={t.description} />
                    </div>
                    <div className="w-20">
                      <input className="input text-xs" type="number" min={0} step="0.001" value={line.quantity} onChange={e => updateLine(idx, 'quantity', parseFloat(e.target.value) || 0)} placeholder={t.qty} />
                    </div>
                    <div className="w-28">
                      <input className="input text-xs" type="number" min={0} step="0.01" value={line.unitPrice} onChange={e => updateLine(idx, 'unitPrice', parseFloat(e.target.value) || 0)} placeholder={t.price} />
                    </div>
                    <div className="w-24 text-right">
                      <p className="text-sm font-medium text-white py-2">{formatCurrency(line.total, form.currency)}</p>
                    </div>
                  </div>
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
                                clientId: form.clientId ?? '',
                                notes: '',
                              })
                              setWarrantyLineIdx(null)
                            }}
                          >{t.warrantySave}</button>
                        </div>
                      </div>
                    )
                  })()}
                  {/* Quick create panel */}
                  {quickLineIdx === idx && (
                    <div className="ml-8 bg-gray-800 border border-yellow-500/40 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-semibold text-yellow-400 flex items-center gap-1.5">
                        <PackagePlus className="w-3.5 h-3.5" /> {t.quickCreate}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <input className="input text-xs" placeholder={t.quickName} value={quickItem.name} onChange={e => setQuickItem(q => ({ ...q, name: e.target.value }))} />
                        <select className="input text-xs" value={quickItem.category} onChange={e => setQuickItem(q => ({ ...q, category: e.target.value }))}>
                          <option value="">{t.quickCategory}</option>
                          {ITEM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select className="input text-xs" value={quickItem.unit} onChange={e => setQuickItem(q => ({ ...q, unit: e.target.value }))}>
                          {ITEM_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                        <input className="input text-xs" type="number" min={0} step="0.01" placeholder={t.quickSell} value={quickItem.sellingPrice || ''} onChange={e => setQuickItem(q => ({ ...q, sellingPrice: parseFloat(e.target.value) || 0 }))} />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button className="btn-secondary text-xs py-1 px-3" onClick={() => setQuickLineIdx(null)}>{t.quickCancel}</button>
                        <button className="btn-primary text-xs py-1 px-3" onClick={() => handleQuickCreate(idx)}>{t.quickSave}</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button
              className="mt-2 w-full border border-dashed border-gray-600 hover:border-yellow-500 text-gray-500 hover:text-yellow-400 rounded-lg py-2 text-sm flex items-center justify-center gap-1 transition-colors"
              onClick={addLine}
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
                  {isForeign && form.exchangeRate > 0 && (
                    <p className="text-xs text-yellow-400 font-normal mt-0.5">
                      {t.convertedTotal
                        .replace('{amount}', formatCurrency(convertedTotal, defaultCurrency))
                        .replace('{def}', defaultCurrency)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="label">{t.notes}</label>
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => setField('notes', e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-700">
          <button className="btn-secondary" onClick={onClose}>{t.cancel}</button>
          <button
            className="btn-primary"
            onClick={() => { if (form.lineItems.length > 0 && form.clientId && isValidDate(form.date)) onSave(form) }}
          >{t.save}</button>
        </div>
      </div>
    </div>
  )
}

const EMPTY_INVOICE = (defaultCurrency: string): InvoiceForm => ({
  entityType: 'client',
  projectId: '', clientId: '', supplierId: '', paymentId: '',
  lineItems: [EMPTY_LINE()],
  subtotal: 0, discountPercent: 0, discount: 0, taxPercent: 0, tax: 0, total: 0,
  currency: defaultCurrency, exchangeRate: 1,
  date: today(), notes: '',
})

export default function SalesInvoices() {
  const t = useT(L)
  const {
    receipts, clients, projects, settings,
    addReceipt, deleteReceipt, addStockMovement,
    getSalesInvoicePaid, getSalesInvoiceStatus,
  } = useStore()
  const defaultCurrency = settings.currency || 'ILS'
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [shareTarget, setShareTarget] = useState<Receipt | null>(null)

  // Only show client receipts
  const q = search.toLowerCase()
  const filtered = receipts
    .filter(r => r.entityType === 'client' || (!r.entityType && r.clientId))
    .filter(r => {
      const client  = clients.find(c => c.id === r.clientId)
      const project = projects.find(p => p.id === r.projectId)
      return (
        r.id.toLowerCase().includes(q) ||
        (client?.name ?? '').toLowerCase().includes(q) ||
        (project?.name ?? '').toLowerCase().includes(q) ||
        String(r.total).includes(q)
      )
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  function handleSave(data: InvoiceForm) {
    const { currency, exchangeRate, ...rest } = data
    const receipt = addReceipt({ ...rest, entityType: 'client', currency, exchangeRate })
    // Auto-deduct inventory for line items with itemId
    for (const line of data.lineItems) {
      if (line.itemId && line.quantity > 0) {
        addStockMovement({
          itemId: line.itemId,
          type: 'out',
          quantity: line.quantity,
          projectId: data.projectId || undefined,
          notes: `Auto from sales invoice ${receipt.id}`,
          date: data.date,
        })
      }
    }
    setModal(false)
  }

  function buildInvoiceHtml(r: Receipt): string {
    const client  = clients.find(c => c.id === r.clientId)
    const project = projects.find(p => p.id === r.projectId)
    const cur = r.currency || defaultCurrency
    const rows = r.lineItems.map((l, i) => `
      <tr>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${i+1}. ${l.description}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center">${l.quantity}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">${l.unitPrice.toFixed(2)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">${l.total.toFixed(2)}</td>
      </tr>`).join('')
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${t.pInvoice} ${r.id}</title>
<style>body{font-family:Arial,sans-serif;padding:30px;color:#111;max-width:800px;margin:0 auto}
table{width:100%;border-collapse:collapse;font-size:13px}
th{background:#f3f4f6;padding:8px 10px;text-align:left;border-bottom:2px solid #e5e7eb}
th.right{text-align:right}th.center{text-align:center}
.footer{margin-top:20px;text-align:center;color:#666;font-size:12px}
@media print{body{padding:0}}</style></head>
<body>
  <div style="display:flex;justify-content:space-between;margin-bottom:20px;border-bottom:2px solid #f59e0b;padding-bottom:12px">
    <div><strong style="font-size:18px">${settings.companyName||'Company'}</strong><br>${settings.companyPhone||''}</div>
    <div style="text-align:right"><strong style="font-size:18px;color:#f59e0b">${t.pInvoice}</strong><br><span style="font-family:monospace;font-size:12px">${r.id}</span><br>${t.pDate}: ${formatDate(r.date)}</div>
  </div>
  ${client ? `<p><strong>${t.pClient}:</strong> ${client.name}${project?` — ${project.name}`:''}</p>` : ''}
  <table><thead><tr><th>${t.pDesc}</th><th class="center">${t.pQty}</th><th class="right">${t.pUnitPrice} (${cur})</th><th class="right">${t.pTotal} (${cur})</th></tr></thead>
  <tbody>${rows}</tbody></table>
  <table style="width:auto;margin-left:auto;margin-top:8px;font-size:13px">
    ${r.discount>0?`<tr><td>${t.discountLbl} (${r.discountPercent}%)</td><td style="padding-left:16px">-${r.discount.toFixed(2)}</td></tr>`:''}
    ${r.tax>0?`<tr><td>${t.taxLbl} (${r.taxPercent}%)</td><td>${r.tax.toFixed(2)}</td></tr>`:''}
    <tr><td style="font-weight:bold;font-size:16px;border-top:2px solid #111">${t.total}</td><td style="font-weight:bold;font-size:16px;border-top:2px solid #111;padding-left:16px">${r.total.toFixed(2)} ${cur}</td></tr>
  </table>
  ${r.notes?`<p style="font-size:12px;color:#555;margin-top:12px"><strong>${t.pNotes}:</strong> ${r.notes}</p>`:''}
  <div class="footer">${t.pThankYou}</div>
</body></html>`
  }

  function openPrintWindow(html: string) {
    const win = window.open('', '_blank', 'width=820,height=700')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()
  }

  function printInvoice(r: Receipt) {
    openPrintWindow(buildInvoiceHtml(r))
  }

  function handleShareWhatsApp(r: Receipt, phone: string) {
    openPrintWindow(buildInvoiceHtml(r))
    const clean = phone.replace(/\s+/g, '').replace(/^00/, '+').replace(/[^\d+]/g, '')
    setTimeout(() => {
      const client = clients.find(c => c.id === r.clientId)
      const cur = r.currency || defaultCurrency
      const msg = encodeURIComponent(`${t.pInvoice}: ${r.id}\n${client ? client.name : ''}\n${t.total}: ${r.total.toFixed(2)} ${cur}`)
      window.open(`https://wa.me/${clean}?text=${msg}`, '_blank')
    }, 1500)
    setShareTarget(null)
  }

  function handleShareEmail(r: Receipt, email: string) {
    const client  = clients.find(c => c.id === r.clientId)
    const project = projects.find(p => p.id === r.projectId)
    const cur = r.currency || defaultCurrency
    const lines = r.lineItems.map(l => `  - ${l.description}: ${l.quantity} × ${l.unitPrice.toFixed(2)} = ${l.total.toFixed(2)} ${cur}`).join('\n')
    const body = [
      `${t.pInvoice}: ${r.id}`,
      `${t.pDate}: ${formatDate(r.date)}`,
      client ? `${t.pClient}: ${client.name}` : '',
      project ? `Project: ${project.name}` : '',
      '',
      lines,
      '',
      r.discount > 0 ? `${t.discountLbl}: -${r.discount.toFixed(2)} ${cur}` : '',
      r.tax > 0 ? `${t.taxLbl}: ${r.tax.toFixed(2)} ${cur}` : '',
      `${t.total}: ${r.total.toFixed(2)} ${cur}`,
      r.notes ? `\nNotes: ${r.notes}` : '',
    ].filter(Boolean).join('\n')
    const subject = encodeURIComponent(`${t.pInvoice} ${r.id} — ${client?.name ?? ''}`)
    window.open(`mailto:${email}?subject=${subject}&body=${encodeURIComponent(body)}`, '_blank')
    setShareTarget(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
          <p className="text-gray-500 text-sm">{t.subtitle.replace('{n}', String(filtered.length))}</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal(true)}>
          <Plus className="w-4 h-4" /> {t.newInvoice}
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input className="input pl-9 max-w-lg" placeholder={t.searchPh} value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <ReceiptIcon className="w-12 h-12 text-gray-600 mb-3" />
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
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">{t.colClient}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">{t.colProject}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">{t.colLines}</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colTotal}</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colStatus}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const client  = clients.find(c => c.id === r.clientId)
                const project = projects.find(p => p.id === r.projectId)
                const cur = r.currency || defaultCurrency
                const status = getSalesInvoiceStatus(r.id)
                const paid   = getSalesInvoicePaid(r.id)
                const statusBadge = {
                  paid:    { class: 'bg-green-900/50 text-green-300',  label: t.statusPaid },
                  partial: { class: 'bg-yellow-900/50 text-yellow-300', label: t.statusPartial },
                  unpaid:  { class: 'bg-red-900/50 text-red-300',      label: t.statusUnpaid },
                }[status]
                return (
                  <tr key={r.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-yellow-500">{r.id}</td>
                    <td className="px-5 py-3 text-gray-300">{formatDate(r.date)}</td>
                    <td className="px-5 py-3 text-gray-300 hidden md:table-cell">{client?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-300 hidden lg:table-cell">{project?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{t.linesCount.replace('{n}', String(r.lineItems.length))}</td>
                    <td className="px-5 py-3 text-right">
                      <span className="font-bold text-white">{formatCurrency(r.total, cur)}</span>
                      {r.currency && r.currency !== defaultCurrency && r.exchangeRate && r.exchangeRate > 0 && (
                        <p className="text-xs text-yellow-400">≈ {formatCurrency(r.total * r.exchangeRate, defaultCurrency)}</p>
                      )}
                      {status === 'partial' && (
                        <p className="text-xs text-yellow-500 mt-0.5">{t.paidLabel} {formatCurrency(paid, cur)}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded font-medium ${statusBadge.class}`}>
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button className="text-gray-500 hover:text-green-400" title={t.waShare}
                          onClick={() => setShareTarget(r)}>
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button className="text-gray-500 hover:text-blue-400" onClick={() => printInvoice(r)}>
                          <Printer className="w-4 h-4" />
                        </button>
                        <button className="text-gray-500 hover:text-red-400" onClick={() => { if (confirm(t.confirmDelete)) deleteReceipt(r.id) }}>
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

      {modal && (
        <Modal
          initial={EMPTY_INVOICE(defaultCurrency)}
          onSave={handleSave}
          onClose={() => setModal(false)}
        />
      )}

      {shareTarget && (() => {
        const client = clients.find(c => c.id === shareTarget.clientId)
        return (
          <ShareModal
            docId={shareTarget.id}
            docTitle={client?.name ?? shareTarget.id}
            defaultPhone={client?.phone ?? ''}
            defaultEmail={client?.email ?? ''}
            onDownload={() => { printInvoice(shareTarget); setShareTarget(null) }}
            onWhatsApp={phone => handleShareWhatsApp(shareTarget, phone)}
            onEmail={email => handleShareEmail(shareTarget, email)}
            onClose={() => setShareTarget(null)}
          />
        )
      })()}
    </div>
  )
}
