import { useState, useRef } from 'react'
import { useStore } from '../store/useStore'
import { formatCurrency, formatDate, today, uid } from '../utils/helpers'
import { Plus, Pencil, Trash2, X, Search, FileText, ArrowRight, Share2, PackagePlus, Printer, Image as ImageIcon } from 'lucide-react'
import ShareModal from './ShareModal'
import { useT } from '../hooks/useT'
import type { Quotation, QuotationStatus, ReceiptLineItem } from '../types'
import SearchableSelect from './SearchableSelect'
import type { SelectOption } from './SearchableSelect'
import { ItemImage } from './ItemImage'
import { saveImage, resolveImageSrc } from '../services/imageService'

const STATUSES: QuotationStatus[] = ['draft', 'sent', 'accepted', 'rejected', 'expired']
const CURRENCIES = ['ILS', 'USD', 'EUR', 'JOD', 'EGP', 'SAR', 'AED', 'GBP']

const L = {
  en: {
    title: 'Quotations / Estimates',
    count: '{n} quotations',
    newQuotation: 'New Quotation',
    searchPlaceholder: 'Search quotations…',
    allStatuses: 'All Statuses',
    noQuotations: 'No quotations yet',
    createHint: 'Create estimates before starting work',
    converted: 'Converted',
    clientLabel: 'Client:',
    itemsValid: '{n} items • Valid until {date}',
    toProjectBtn: 'To Project',
    whatsappBtn: 'Share',
    printBtn: 'Print PDF',
    toProjectTooltip: 'Convert to Project',
    shareTooltip: 'Share (WhatsApp / Email)',
    confirmDelete: 'Delete?',
    confirmConvert: 'Mark this quotation as accepted and convert to project?',
    projectCreated: 'Project {id} created successfully!',
    modalEdit: 'Edit Quotation',
    modalNew: 'New Quotation',
    titleField: 'Title *',
    titlePlaceholder: 'Electrical wiring estimate…',
    client: 'Client *',
    choose: '-- Select --',
    chooseClient: 'Search client…',
    status: 'Status',
    validUntil: 'Valid Until',
    lineItems: 'Line Items',
    addLine: 'Add Line',
    itemSearchPlaceholder: 'Search items or type…',
    descriptionPlaceholder: 'Description…',
    qty: 'Qty',
    price: 'Price',
    discountPercent: 'Discount %',
    taxPercent: 'Tax (VAT) %',
    subtotal: 'Subtotal',
    discount: 'Discount',
    tax: 'Tax',
    total: 'Total',
    notes: 'Notes',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    createQuotation: 'Create Quotation',
    currency: 'Currency',
    exchangeRate: 'Exchange Rate (1 {cur} = ? {def})',
    convertedTotal: '≈ {amount} {def}',
    // statuses
    stDraft: 'Draft',
    stSent: 'Sent',
    stAccepted: 'Accepted',
    stRejected: 'Rejected',
    stExpired: 'Expired',
    // quick item creation
    quickCreate: 'Quick Create Item',
    quickName: 'Item Name *',
    quickCategory: 'Category *',
    quickUnit: 'Unit',
    quickSell: 'Selling Price',
    quickCancel: 'Cancel',
    quickSave: 'Create & Select',
    // WhatsApp template
    waQuotation: 'Quotation',
    waClient: 'Client',
    waSubtotal: 'Subtotal',
    waDiscount: 'Discount',
    waTax: 'Tax',
    waTotal: 'Total',
    waValidUntil: 'Valid until',
    // line item extra columns
    brand: 'Brand',
    brandPh: 'Brand / Manufacturer',
    specs: 'Specs',
    specsPh: 'Technical specifications…',
    photo: 'Photo',
    clearPhoto: 'Clear photo',
    // print
    pQuotation: 'Quotation',
    pDate: 'Date',
    pValid: 'Valid Until',
    pClient: 'Client',
    pDesc: 'Description',
    pBrand: 'Brand',
    pSpecs: 'Specifications',
    pQty: 'Qty',
    pUnit: 'Unit',
    pUnitPrice: 'Unit Price',
    pTotal: 'Total',
    pNotes: 'Notes',
    pPreparedBy: 'Prepared by',
    pMsg: 'Thank you for your trust. This quotation is valid for the period above.',
  },
  ar: {
    title: 'عروض الأسعار / التقديرات',
    count: '{n} عرض',
    newQuotation: 'عرض جديد',
    searchPlaceholder: 'بحث في العروض...',
    allStatuses: 'جميع الحالات',
    noQuotations: 'لا توجد عروض بعد',
    createHint: 'أنشئ تقديرات قبل بدء العمل',
    converted: 'تم التحويل',
    clientLabel: 'العميل:',
    itemsValid: '{n} بند • صالح حتى {date}',
    toProjectBtn: 'إلى مشروع',
    whatsappBtn: 'مشاركة',
    printBtn: 'طباعة PDF',
    toProjectTooltip: 'تحويل إلى مشروع',
    shareTooltip: 'مشاركة (واتساب / بريد)',
    confirmDelete: 'حذف؟',
    confirmConvert: 'هل تريد اعتماد هذا العرض وتحويله إلى مشروع؟',
    projectCreated: 'تم إنشاء المشروع {id} بنجاح!',
    modalEdit: 'تعديل العرض',
    modalNew: 'عرض جديد',
    titleField: 'العنوان *',
    titlePlaceholder: 'تقدير أعمال كهرباء...',
    client: 'العميل *',
    choose: '-- اختر --',
    chooseClient: 'ابحث عن عميل...',
    status: 'الحالة',
    validUntil: 'صالح حتى',
    lineItems: 'البنود',
    addLine: 'إضافة بند',
    itemSearchPlaceholder: 'ابحث عن صنف أو اكتب...',
    descriptionPlaceholder: 'الوصف...',
    qty: 'الكمية',
    price: 'السعر',
    discountPercent: 'الخصم %',
    taxPercent: 'الضريبة (ض.ق.م) %',
    subtotal: 'المجموع الفرعي',
    discount: 'الخصم',
    tax: 'الضريبة',
    total: 'الإجمالي',
    notes: 'ملاحظات',
    cancel: 'إلغاء',
    saveChanges: 'حفظ التغييرات',
    createQuotation: 'إنشاء عرض',
    currency: 'العملة',
    exchangeRate: 'سعر الصرف (1 {cur} = ? {def})',
    convertedTotal: '≈ {amount} {def}',
    // statuses
    stDraft: 'مسودة',
    stSent: 'مُرسل',
    stAccepted: 'مقبول',
    stRejected: 'مرفوض',
    stExpired: 'منتهي',
    // quick item creation
    quickCreate: 'إنشاء صنف سريع',
    quickName: 'اسم الصنف *',
    quickCategory: 'الفئة *',
    quickUnit: 'الوحدة',
    quickSell: 'سعر البيع',
    quickCancel: 'إلغاء',
    quickSave: 'إنشاء واختيار',
    // WhatsApp template
    waQuotation: 'عرض سعر',
    waClient: 'العميل',
    waSubtotal: 'المجموع الفرعي',
    waDiscount: 'الخصم',
    waTax: 'الضريبة',
    waTotal: 'الإجمالي',
    waValidUntil: 'صالح حتى',
    // line item extra columns
    brand: 'الماركة',
    brandPh: 'الماركة / المصنّع',
    specs: 'المواصفات',
    specsPh: 'المواصفات الفنية...',
    photo: 'الصورة',
    clearPhoto: 'حذف الصورة',
    // print
    pQuotation: 'عرض سعر',
    pDate: 'التاريخ',
    pValid: 'صالح حتى',
    pClient: 'العميل',
    pDesc: 'الوصف',
    pBrand: 'الماركة',
    pSpecs: 'المواصفات',
    pQty: 'الكمية',
    pUnit: 'الوحدة',
    pUnitPrice: 'سعر الوحدة',
    pTotal: 'الإجمالي',
    pNotes: 'ملاحظات',
    pPreparedBy: 'أُعد بواسطة',
    pMsg: 'شكراً لثقتكم. هذا العرض ساري خلال المدة المذكورة أعلاه.',
  },
} as const

const STATUS_KEY: Record<QuotationStatus, keyof typeof L.en> = {
  draft: 'stDraft',
  sent: 'stSent',
  accepted: 'stAccepted',
  rejected: 'stRejected',
  expired: 'stExpired',
}

function statusColor(s: string) {
  const map: Record<string, string> = {
    draft: 'bg-gray-700 text-gray-300', sent: 'bg-blue-900 text-blue-300',
    accepted: 'bg-green-900 text-green-300', rejected: 'bg-red-900 text-red-300',
    expired: 'bg-yellow-900 text-yellow-300',
  }
  return map[s] ?? 'bg-gray-700 text-gray-300'
}

const EMPTY_LINE = (): ReceiptLineItem => ({ id: uid(), description: '', quantity: 1, unitPrice: 0, total: 0, brand: '', specs: '', photo: '' })

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

function Modal({
  initial, onSave, onClose,
}: {
  initial: Omit<Quotation, 'id' | 'createdAt'>
  onSave: (d: Omit<Quotation, 'id' | 'createdAt'>) => void
  onClose: () => void
}) {
  const t = useT(L)
  const { clients, items, settings, addItem, getLatestRate } = useStore()
  const defaultCurrency = settings.currency || 'ILS'
  const [form, setForm] = useState({
    ...initial,
    currency: initial.currency ?? defaultCurrency,
    exchangeRate: initial.exchangeRate ?? 1,
  })
  const [quickLineIdx, setQuickLineIdx] = useState<number | null>(null)
  const [quickItem, setQuickItem] = useState(EMPTY_QUICK())
  const setField = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }))

  // Photo upload per line item
  const photoFileRef = useRef<HTMLInputElement>(null)
  const photoLineIdxRef = useRef<number>(-1)

  async function handleLinePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const idx = photoLineIdxRef.current
    if (!file || idx < 0) return
    try {
      const ref = await saveImage(file)
      updateLine(idx, 'photo', ref)
    } catch {
      const reader = new FileReader()
      reader.onload = ev => updateLine(idx, 'photo', ev.target?.result as string)
      reader.readAsDataURL(file)
    }
    if (e.target) e.target.value = ''
  }

  const isForeign = form.currency !== defaultCurrency
  const convertedTotal = form.total * (form.exchangeRate ?? 1)

  function handleCurrencyChange(cur: string) {
    const oldRate = form.exchangeRate ?? 1
    const newRate = cur === defaultCurrency ? 1 : (getLatestRate(cur) ?? 1)
    setForm(f => {
      // Re-price all existing lines: convert via ILS (old_price * old_rate / new_rate)
      const lines = f.lineItems.map(l => {
        const priceInIls = l.unitPrice * oldRate
        const newPrice = newRate > 0 ? priceInIls / newRate : l.unitPrice
        const rounded = Math.round(newPrice * 1000) / 1000
        return { ...l, unitPrice: rounded, total: l.quantity * rounded }
      })
      return { ...f, currency: cur, exchangeRate: newRate, lineItems: lines, ...calcTotals(lines, f.discountPercent, f.taxPercent) }
    })
  }

  function handleQuickCreate(idx: number) {
    if (!quickItem.name.trim() || !quickItem.category.trim()) return
    const newItem = addItem({
      name: quickItem.name.trim(),
      description: '',
      category: quickItem.category.trim(),
      unit: quickItem.unit || 'pcs',
      minStock: 0,
      costPrice: 0,
      sellingPrice: quickItem.sellingPrice,
      sku: '',
      imageUrl: '',
    })
    // Fix closure bug: use newItem directly instead of calling fillFromItem (stale items[])
    const price = isForeign && form.exchangeRate > 0
      ? quickItem.sellingPrice / form.exchangeRate
      : quickItem.sellingPrice
    const lines = form.lineItems.map((l, i) => {
      if (i !== idx) return l
      return { ...l, itemId: newItem.id, description: newItem.name, unitPrice: price, total: l.quantity * price }
    })
    const totals = calcTotals(lines, form.discountPercent, form.taxPercent)
    setForm(f => ({ ...f, lineItems: lines, ...totals }))
    setQuickLineIdx(null)
    setQuickItem(EMPTY_QUICK())
  }

  const itemOptions: SelectOption[] = items.map(i => ({
    value: i.id,
    label: i.name,
    sub: `${formatCurrency(i.sellingPrice, form.currency)} • ${i.category}`,
  }))

  const clientOptions: SelectOption[] = clients.map(c => ({
    value: c.id,
    label: c.name,
    sub: c.phone || c.email || '',
  }))

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
  }

  function addLine() {
    setForm(f => ({ ...f, lineItems: [...f.lineItems, EMPTY_LINE()] }))
  }
  function removeLine(idx: number) {
    const lines = form.lineItems.filter((_, i) => i !== idx)
    const totals = calcTotals(lines, form.discountPercent, form.taxPercent)
    setForm(f => ({ ...f, lineItems: lines, ...totals }))
  }
  function updateTaxDiscount(dp: number, tp: number) {
    const totals = calcTotals(form.lineItems, dp, tp)
    setForm(f => ({ ...f, discountPercent: dp, taxPercent: tp, ...totals }))
  }
  function fillFromItem(idx: number, itemId: string) {
    const item = items.find(i => i.id === itemId)
    if (!item) return
    // In foreign currency, divide selling price by exchange rate to get local display
    const price = isForeign && form.exchangeRate > 0 ? item.sellingPrice / form.exchangeRate : item.sellingPrice
    const lines = form.lineItems.map((l, i) => {
      if (i !== idx) return l
      return {
        ...l,
        itemId,
        description: item.name,
        unit: item.unit,
        unitPrice: price,
        total: l.quantity * price,
        // Auto-fill brand / specs / photo from item (user can override per line)
        brand: item.brand || l.brand || '',
        specs: item.specs || l.specs || '',
        photo: item.imageUrl || l.photo || '',
      }
    })
    const totals = calcTotals(lines, form.discountPercent, form.taxPercent)
    setForm(f => ({ ...f, lineItems: lines, ...totals }))
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
          <h2 className="font-semibold text-white">{initial.title ? t.modalEdit : t.modalNew}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">{t.titleField}</label>
            <input className="input" value={form.title} onChange={e => setField('title', e.target.value)} placeholder={t.titlePlaceholder} />
          </div>

          {/* Searchable client */}
          <div>
            <label className="label">{t.client}</label>
            <SearchableSelect
              options={clientOptions}
              value={form.clientId}
              onChange={val => setField('clientId', val ?? '')}
              placeholder={t.chooseClient}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t.status}</label>
              <select className="input" value={form.status} onChange={e => setField('status', e.target.value as QuotationStatus)}>
                {STATUSES.map(s => <option key={s} value={s}>{t[STATUS_KEY[s]]}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t.validUntil}</label>
              <input className="input" type="date" value={form.validUntil} onChange={e => setField('validUntil', e.target.value)} />
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
            <label className="label mb-2">{t.lineItems}</label>
            <div className="space-y-3">
              {form.lineItems.map((line, idx) => (
                <div key={line.id} className="bg-gray-900/30 rounded-lg p-3 space-y-2">
                  {/* Row 1: number + item search + quick-create + delete */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-6 shrink-0">{idx + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <SearchableSelect
                        options={itemOptions}
                        value={line.itemId ?? line.description}
                        onChange={(val) => {
                          if (!val) {
                            // Cleared — unlink item, keep description blank
                            const lines = form.lineItems.map((l, i) =>
                              i !== idx ? l : { ...l, itemId: undefined, description: '' }
                            )
                            setForm(f => ({ ...f, lineItems: lines, ...calcTotals(lines, f.discountPercent, f.taxPercent) }))
                          } else if (items.find(i => i.id === val)) {
                            // Known item ID selected from list
                            fillFromItem(idx, val)
                          } else {
                            // Free text typed by user
                            const lines = form.lineItems.map((l, i) =>
                              i !== idx ? l : { ...l, itemId: undefined, description: val }
                            )
                            setForm(f => ({ ...f, lineItems: lines, ...calcTotals(lines, f.discountPercent, f.taxPercent) }))
                          }
                        }}
                        placeholder={t.itemSearchPlaceholder}
                        allowCustom
                      />
                    </div>
                    <button
                      className="text-gray-500 hover:text-yellow-400 shrink-0"
                      title={t.quickCreate}
                      onClick={() => { setQuickLineIdx(quickLineIdx === idx ? null : idx); setQuickItem(EMPTY_QUICK()) }}
                    ><PackagePlus className="w-4 h-4" /></button>
                    <button className="text-gray-600 hover:text-red-400 shrink-0" onClick={() => { removeLine(idx); if (quickLineIdx === idx) setQuickLineIdx(null) }}><X className="w-4 h-4" /></button>
                  </div>
                  {/* Row 2: description + qty + price + total */}
                  <div className="flex gap-2 ml-8">
                    <div className="flex-1 min-w-0">
                      <input className="input text-xs" value={line.description} onChange={e => updateLine(idx, 'description', e.target.value)} placeholder={t.descriptionPlaceholder} />
                    </div>
                    <div className="w-20 shrink-0">
                      <input className="input text-xs text-center" type="number" min={0} step="0.001" value={line.quantity} onChange={e => updateLine(idx, 'quantity', parseFloat(e.target.value) || 0)} placeholder={t.qty} />
                    </div>
                    <div className="w-28 shrink-0">
                      <input className="input text-xs text-right" type="number" min={0} step="0.01" value={line.unitPrice} onChange={e => updateLine(idx, 'unitPrice', parseFloat(e.target.value) || 0)} placeholder={t.price} />
                    </div>
                    <div className="w-24 shrink-0 text-right">
                      <p className="text-sm font-medium text-white py-2">{formatCurrency(line.total, form.currency)}</p>
                    </div>
                  </div>
                  {/* Row 3: brand + specs + photo */}
                  <div className="flex gap-2 ml-8 items-center">
                    <div className="w-36 shrink-0">
                      <input
                        className="input text-xs"
                        value={line.brand ?? ''}
                        onChange={e => updateLine(idx, 'brand', e.target.value)}
                        placeholder={t.brandPh}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        className="input text-xs"
                        value={line.specs ?? ''}
                        onChange={e => updateLine(idx, 'specs', e.target.value)}
                        placeholder={t.specsPh}
                      />
                    </div>
                    {/* Photo thumbnail + upload / clear */}
                    <div className="shrink-0 flex items-center gap-1">
                      {line.photo ? (
                        <div className="relative group">
                          <ItemImage
                            src={line.photo}
                            className="w-10 h-10 rounded-lg object-cover border border-gray-600 cursor-pointer"
                            onClick={() => { photoLineIdxRef.current = idx; photoFileRef.current?.click() }}
                          />
                          <button
                            type="button"
                            title={t.clearPhoto}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-white text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => updateLine(idx, 'photo', '')}
                          >×</button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          title={t.photo}
                          className="w-10 h-10 rounded-lg border border-dashed border-gray-600 hover:border-yellow-500 flex items-center justify-center text-gray-600 hover:text-yellow-400 transition-colors"
                          onClick={() => { photoLineIdxRef.current = idx; photoFileRef.current?.click() }}
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Inline quick-create item form */}
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
                        <input className="input text-xs" type="number" min={0} step="0.01" placeholder={t.quickSell}
                          value={quickItem.sellingPrice || ''} onChange={e => setQuickItem(q => ({ ...q, sellingPrice: parseFloat(e.target.value) || 0 }))} />
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
            {/* Add line button at bottom, square style */}
            <button
              className="mt-2 w-full border border-dashed border-gray-600 hover:border-yellow-500 text-gray-500 hover:text-yellow-400 rounded-lg py-2 text-sm flex items-center justify-center gap-1 transition-colors"
              onClick={addLine}
            >
              <Plus className="w-4 h-4" /> {t.addLine}
            </button>
            {/* Shared hidden file input for line-item photos */}
            <input
              ref={photoFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLinePhotoUpload}
            />
          </div>

          {/* Totals */}
          <div className="bg-gray-900/50 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t.discountPercent}</label>
                <input className="input" type="number" min={0} max={100} step="0.1" value={form.discountPercent}
                  onChange={e => updateTaxDiscount(parseFloat(e.target.value) || 0, form.taxPercent)} />
              </div>
              <div>
                <label className="label">{t.taxPercent}</label>
                <input className="input" type="number" min={0} max={100} step="0.1" value={form.taxPercent}
                  onChange={e => updateTaxDiscount(form.discountPercent, parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            <div className="space-y-1.5 pt-2 border-t border-gray-700">
              <div className="flex justify-between text-sm text-gray-400"><span>{t.subtotal}</span><span>{formatCurrency(form.subtotal, form.currency)}</span></div>
              {form.discount > 0 && <div className="flex justify-between text-sm text-red-400"><span>{t.discount} ({form.discountPercent}%)</span><span>-{formatCurrency(form.discount, form.currency)}</span></div>}
              {form.tax > 0 && <div className="flex justify-between text-sm text-gray-400"><span>{t.tax} ({form.taxPercent}%)</span><span>{formatCurrency(form.tax, form.currency)}</span></div>}
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
          <button className="btn-primary" onClick={() => { if (form.title.trim() && form.clientId) onSave(form) }}>
            {initial.title ? t.saveChanges : t.createQuotation}
          </button>
        </div>
      </div>
    </div>
  )
}

const EMPTY_QUOTATION = (): Omit<Quotation, 'id' | 'createdAt'> => ({
  clientId: '', projectId: undefined, status: 'draft', title: '',
  lineItems: [EMPTY_LINE()],
  subtotal: 0, discountPercent: 0, discount: 0, taxPercent: 16, tax: 0, total: 0,
  currency: undefined, exchangeRate: undefined,
  validUntil: '', notes: '',
})

export default function Quotations() {
  const t = useT(L)
  const { quotations, clients, items, settings, addQuotation, updateQuotation, deleteQuotation, convertQuotationToProject } = useStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<QuotationStatus | 'all'>('all')
  const [modal, setModal] = useState<{ open: boolean; quotation?: Quotation }>({ open: false })
  const [shareTarget, setShareTarget] = useState<Quotation | null>(null)

  const filtered = quotations.filter(q => {
    const matchStatus = statusFilter === 'all' || q.status === statusFilter
    const matchSearch = q.title.toLowerCase().includes(search.toLowerCase()) || q.id.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  function handleSave(data: Omit<Quotation, 'id' | 'createdAt'>) {
    if (modal.quotation) updateQuotation(modal.quotation.id, data)
    else addQuotation(data)
    setModal({ open: false })
  }

  function handleConvert(id: string) {
    const q = quotations.find(q => q.id === id)
    if (!q) return
    if (q.status !== 'accepted') {
      if (confirm(t.confirmConvert)) {
        updateQuotation(id, { status: 'accepted' })
        setTimeout(() => {
          const project = convertQuotationToProject(id)
          if (project) alert(t.projectCreated.replace('{id}', project.id))
        }, 50)
      }
      return
    }
    const project = convertQuotationToProject(id)
    if (project) alert(t.projectCreated.replace('{id}', project.id))
  }

  async function buildPdfHtml(q: Quotation): Promise<string> {
    const client = clients.find(c => c.id === q.clientId)
    const cur = q.currency || settings.currency || 'ILS'
    // Resolve all line-item photos (may be IndexedDB refs or base64)
    const resolvedPhotos = await Promise.all(
      q.lineItems.map(l => resolveImageSrc(l.photo || ''))
    )
    const hasBrand = q.lineItems.some(l => l.brand)
    const hasSpecs = q.lineItems.some(l => l.specs)
    const hasPhoto = resolvedPhotos.some(Boolean)
    const rows = q.lineItems.map((l, i) => {
      const unit  = l.unit || (l.itemId ? items.find(it => it.id === l.itemId)?.unit : '') || ''
      const photo = resolvedPhotos[i]
      return `
      <tr>
        ${hasPhoto ? `<td style="padding:4px 8px;border-bottom:1px solid #eee;width:56px;text-align:center">${photo ? `<img src="${photo}" style="width:48px;height:48px;object-fit:cover;border-radius:4px;border:1px solid #e5e7eb" />` : ''}</td>` : ''}
        <td style="padding:6px 10px;border-bottom:1px solid #eee">
          <strong>${i + 1}. ${l.description}</strong>
          ${l.brand ? `<div style="font-size:11px;color:#555;margin-top:1px">${l.brand}</div>` : ''}
          ${l.specs ? `<div style="font-size:10px;color:#777;font-style:italic">${l.specs}</div>` : ''}
        </td>
        ${hasBrand ? `<td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:11px;color:#444">${l.brand || '—'}</td>` : ''}
        ${hasSpecs ? `<td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:11px;color:#555;font-style:italic">${l.specs || '—'}</td>` : ''}
        <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center">${l.quantity}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center">${unit}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">${l.unitPrice.toFixed(2)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">${l.total.toFixed(2)}</td>
      </tr>`
    }).join('')
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${t.pQuotation} ${q.id}</title>
<style>
  body{font-family:Arial,sans-serif;padding:30px;color:#111;max-width:900px;margin:0 auto}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;border-bottom:2px solid #f59e0b;padding-bottom:12px}
  .company{font-size:20px;font-weight:bold;color:#1e3a5f}
  .id{font-size:12px;color:#888;font-family:monospace}
  table{width:100%;border-collapse:collapse;font-size:13px;margin-top:12px}
  th{background:#f3f4f6;padding:8px 10px;text-align:left;border-bottom:2px solid #e5e7eb}
  th.right{text-align:right} th.center{text-align:center}
  .totals{margin-top:12px;text-align:right;font-size:13px}
  .totals td{padding:3px 10px}
  .total-row td{font-size:16px;font-weight:bold;border-top:2px solid #111;padding-top:6px}
  .footer{margin-top:24px;padding:12px;background:#fffbeb;border:1px solid #f59e0b;border-radius:8px;font-size:12px;color:#92400e}
  .meta{font-size:12px;color:#666;margin-bottom:4px}
  @media print{body{padding:0}}
</style></head><body>
  <div class="header">
    <div>
      <div class="company">${settings.companyName || 'Company'}</div>
      ${settings.companyPhone ? `<div class="meta">${settings.companyPhone}</div>` : ''}
      ${settings.companyAddress ? `<div class="meta">${settings.companyAddress}</div>` : ''}
    </div>
    <div style="text-align:right">
      <div style="font-size:18px;font-weight:bold;color:#f59e0b">${t.pQuotation}</div>
      <div class="id">${q.id}</div>
      <div class="meta">${t.pDate}: ${formatDate(today())}</div>
      ${q.validUntil ? `<div class="meta">${t.pValid}: ${formatDate(q.validUntil)}</div>` : ''}
    </div>
  </div>
  ${client ? `<div style="margin-bottom:16px"><strong>${t.pClient}:</strong> ${client.name}${client.phone ? ` — ${client.phone}` : ''}</div>` : ''}
  <table>
    <thead><tr>
      ${hasPhoto ? '<th style="width:56px"></th>' : ''}
      <th>${t.pDesc}</th>
      ${hasBrand ? `<th>${t.pBrand}</th>` : ''}
      ${hasSpecs ? `<th>${t.pSpecs}</th>` : ''}
      <th class="center">${t.pQty}</th>
      <th class="center">${t.pUnit}</th>
      <th class="right">${t.pUnitPrice} (${cur})</th>
      <th class="right">${t.pTotal} (${cur})</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <table class="totals" style="width:auto;margin-left:auto;margin-top:8px">
    ${q.discount > 0 ? `<tr><td>${t.discount} (${q.discountPercent}%)</td><td class="right">-${q.discount.toFixed(2)} ${cur}</td></tr>` : ''}
    ${q.tax > 0 ? `<tr><td>${t.tax} (${q.taxPercent}%)</td><td class="right">${q.tax.toFixed(2)} ${cur}</td></tr>` : ''}
    <tr class="total-row"><td>${t.total}</td><td style="padding-left:24px">${q.total.toFixed(2)} ${cur}</td></tr>
  </table>
  ${q.notes ? `<div style="margin-top:16px;font-size:12px;color:#555"><strong>${t.pNotes}:</strong> ${q.notes}</div>` : ''}
  <div class="footer">${t.pMsg}</div>
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

  async function handleShareWhatsApp(q: Quotation, phone: string) {
    const html = await buildPdfHtml(q)
    // Open print-to-PDF dialog first
    openPrintWindow(html)
    // After a brief delay open WhatsApp so user can attach the saved PDF
    const clean = phone.replace(/\s+/g, '').replace(/^00/, '+')
    const numOnly = clean.replace(/[^\d+]/g, '')
    setTimeout(() => {
      const msg = encodeURIComponent(`${t.pQuotation}: ${q.title} (${q.id})`)
      window.open(`https://wa.me/${numOnly}?text=${msg}`, '_blank')
    }, 1500)
    setShareTarget(null)
  }

  function handleShareEmail(q: Quotation, email: string) {
    const client = clients.find(c => c.id === q.clientId)
    const cur = q.currency || settings.currency || 'ILS'
    const lines = q.lineItems.map(l => `  - ${l.description}: ${l.quantity} × ${l.unitPrice.toFixed(2)} = ${l.total.toFixed(2)} ${cur}`).join('\n')
    const body = [
      `${t.pQuotation}: ${q.title}`,
      `${t.pClient}: ${client?.name ?? ''}`,
      `ID: ${q.id}`,
      '',
      lines,
      '',
      `${t.subtotal}: ${q.subtotal.toFixed(2)} ${cur}`,
      q.discount > 0 ? `${t.discount}: -${q.discount.toFixed(2)} ${cur}` : '',
      q.tax > 0 ? `${t.tax}: ${q.tax.toFixed(2)} ${cur}` : '',
      `${t.total}: ${q.total.toFixed(2)} ${cur}`,
      q.validUntil ? `\n${t.pValid}: ${formatDate(q.validUntil)}` : '',
      q.notes ? `\n${t.pNotes}: ${q.notes}` : '',
    ].filter(Boolean).join('\n')
    const subject = encodeURIComponent(`${t.pQuotation}: ${q.title} — ${q.id}`)
    window.open(`mailto:${email}?subject=${subject}&body=${encodeURIComponent(body)}`, '_blank')
    setShareTarget(null)
  }

  async function printQuotation(q: Quotation) {
    openPrintWindow(await buildPdfHtml(q))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
          <p className="text-gray-500 text-sm">{t.count.replace('{n}', String(quotations.length))}</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal({ open: true })}>
          <Plus className="w-4 h-4" /> {t.newQuotation}
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input className="input pl-9" placeholder={t.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value as QuotationStatus | 'all')}>
          <option value="all">{t.allStatuses}</option>
          {STATUSES.map(s => <option key={s} value={s}>{t[STATUS_KEY[s]]}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <FileText className="w-12 h-12 text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">{t.noQuotations}</p>
          <p className="text-gray-600 text-sm mt-1">{t.createHint}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(q => {
            const client = clients.find(c => c.id === q.clientId)
            const cur = q.currency || settings.currency || 'ILS'
            return (
              <div key={q.id} className="card hover:border-gray-600 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-yellow-500">{q.id}</span>
                      <span className={`badge ${statusColor(q.status)}`}>{t[STATUS_KEY[q.status]]}</span>
                      {q.projectId && <span className="badge bg-purple-900 text-purple-300">{t.converted}</span>}
                      {q.currency && q.currency !== (settings.currency || 'ILS') && (
                        <span className="badge bg-blue-900/40 text-blue-300">{q.currency}</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-white mt-1">{q.title}</h3>
                    <p className="text-sm text-gray-400">{t.clientLabel} <span className="text-gray-300">{client?.name ?? '—'}</span></p>
                    <p className="text-xs text-gray-500 mt-1">{t.itemsValid.replace('{n}', String(q.lineItems.length)).replace('{date}', formatDate(q.validUntil))}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold text-white">{formatCurrency(q.total, cur)}</p>
                    {q.currency && q.currency !== (settings.currency || 'ILS') && q.exchangeRate && (
                      <p className="text-xs text-yellow-400">≈ {formatCurrency(q.total * q.exchangeRate, settings.currency || 'ILS')}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-2 justify-end flex-wrap">
                      {!q.projectId && (
                        <button
                          className="text-xs px-2 py-1 rounded bg-green-900/40 text-green-400 hover:bg-green-900/70 transition-colors flex items-center gap-1"
                          onClick={() => handleConvert(q.id)}
                          title={t.toProjectTooltip}
                        ><ArrowRight className="w-3 h-3" /> {t.toProjectBtn}</button>
                      )}
                      <button
                        className="text-xs px-2 py-1 rounded bg-blue-900/40 text-blue-300 hover:bg-blue-900/70 transition-colors flex items-center gap-1"
                        onClick={() => printQuotation(q)}
                        title={t.printBtn}
                      ><Printer className="w-3 h-3" /> {t.printBtn}</button>
                      <button
                        className="text-xs px-2 py-1 rounded bg-green-900/40 text-green-400 hover:bg-green-900/70 transition-colors flex items-center gap-1"
                        onClick={() => setShareTarget(q)}
                        title={t.shareTooltip}
                      ><Share2 className="w-3 h-3" /> {t.whatsappBtn}</button>
                      <button className="text-gray-500 hover:text-yellow-400" onClick={() => setModal({ open: true, quotation: q })}>
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button className="text-gray-500 hover:text-red-400" onClick={() => { if (confirm(t.confirmDelete)) deleteQuotation(q.id) }}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal.open && (
        <Modal
          initial={modal.quotation ? {
            clientId: modal.quotation.clientId, projectId: modal.quotation.projectId,
            status: modal.quotation.status, title: modal.quotation.title,
            lineItems: modal.quotation.lineItems, subtotal: modal.quotation.subtotal,
            discountPercent: modal.quotation.discountPercent, discount: modal.quotation.discount,
            taxPercent: modal.quotation.taxPercent, tax: modal.quotation.tax, total: modal.quotation.total,
            currency: modal.quotation.currency, exchangeRate: modal.quotation.exchangeRate,
            validUntil: modal.quotation.validUntil, notes: modal.quotation.notes,
          } : EMPTY_QUOTATION()}
          onSave={handleSave}
          onClose={() => setModal({ open: false })}
        />
      )}

      {shareTarget && (() => {
        const client = clients.find(c => c.id === shareTarget.clientId)
        return (
          <ShareModal
            docId={shareTarget.id}
            docTitle={shareTarget.title}
            defaultPhone={client?.phone ?? ''}
            defaultEmail={client?.email ?? ''}
            onDownload={() => { printQuotation(shareTarget); setShareTarget(null) }}
            onWhatsApp={phone => handleShareWhatsApp(shareTarget, phone)}
            onEmail={email => handleShareEmail(shareTarget, email)}
            onClose={() => setShareTarget(null)}
          />
        )
      })()}
    </div>
  )
}
