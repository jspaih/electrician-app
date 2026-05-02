import { useState, useRef, useMemo, useCallback, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import {
  useItems, useStockMovements, useSuppliers, useProjects,
  usePurchaseInvoices, useStoreActions, useTableData,
} from '../hooks/useSelectors'
import { usePagination } from '../hooks/usePagination'
import { PaginationControls } from './PaginationControls'
import { saveImage, isImageRef } from '../services/imageService'
import { ItemImage } from './ItemImage'
import { formatCurrency, formatDate, today } from '../utils/helpers'
import { Plus, Pencil, Trash2, X, Search, Package, AlertTriangle, Image, ZoomIn } from 'lucide-react'
import { useT } from '../hooks/useT'
import type { Item, StockMovement, StockMovementType } from '../types'

/** Parse a reference ID out of a notes string (e.g. "Auto from purchase invoice PUR2026000001")
 *  and return the route to navigate to, or null if not found. */
function parseRefRoute(notes: string): { id: string; route: string } | null {
  const match = notes.match(/\b(PUR|RCP|QOT|PAY|CHK|WRK|PRJ)\d{10}\b/)
  if (!match) return null
  const id = match[0]
  const prefix = match[1]
  const routeMap: Record<string, string> = {
    PUR: '/purchase-invoices',
    RCP: '/receipts',
    QOT: '/quotations',
    PAY: '/payments',
    CHK: '/checks',
    WRK: '/work-orders',
    PRJ: '/projects',
  }
  return { id, route: routeMap[prefix] ?? '/' }
}

const CATEGORIES = ['Cable & Wire', 'Conduit & Pipe', 'Panels & Breakers', 'Outlets & Switches', 'Lighting', 'Tools', 'Consumables', 'Other']
const UNITS = ['piece', 'meter', 'roll', 'box', 'set', 'kg', 'liter', 'pair']

const L = {
  en: {
    title: 'Inventory',
    itemsCount: '{n} items',
    newItem: 'New Item',
    searchPlaceholder: 'Search items…',
    allCategories: 'All categories',
    noItems: 'No items',
    colId: 'ID',
    colItem: 'Item',
    colCategory: 'Category',
    colStock: 'Stock',
    colCost: 'Cost',
    colSelling: 'Selling',
    minLabel: 'Min: {n}',
    stockBtn: '± Stock',
    historyBtn: 'History',
    historyTitle: 'Stock history ({n} movements)',
    noMovements: 'No movements recorded.',
    modalEditItem: 'Edit Item',
    modalNewItem: 'New Item',
    itemName: 'Item Name (English) *',
    itemNamePlaceholder: 'Cable 2.5mm², 16A breaker…',
    itemNameAr: 'Item Name (Arabic)',
    itemNameArPh: 'اسم الصنف بالعربية',
    colUnit: 'Unit',
    totalCostValue: 'Total Cost Value',
    salvageValue: 'Salvage Value',
    stockSummary: 'Stock Summary',
    costFromInvoice: 'From invoice',
    category: 'Category',
    unit: 'Unit',
    description: 'Description',
    minStockAlert: 'Low Stock Alert',
    costPrice: 'Cost Price',
    sellingPrice: 'Selling Price',
    defaultSupplier: 'Default Supplier',
    none: '— None —',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    addItem: 'Add Item',
    movementTitle: 'Stock Movement — {name}',
    currentStock: 'Current stock:',
    movementType: 'Movement Type',
    inBtn: '+ In',
    outBtn: '− Out',
    adjustBtn: '⟳ Adjust',
    newQuantity: 'New Quantity',
    quantity: 'Quantity',
    date: 'Date',
    unitCost: 'Unit Cost (optional)',
    linkProject: 'Link to Project (optional)',
    noneDash: '— None —',
    notes: 'Notes',
    notesPlaceholder: 'Purchase order, usage details…',
    recordMovement: 'Record Movement',
    sku: 'SKU',
    skuPh: 'ELE-001',
    serialNumber: 'Serial Number',
    serialNumberPh: 'SN-123456…',
    photo: 'Item Photo',
    addPhoto: 'Add Photo',
    changePhoto: 'Change Photo',
    brand: 'Brand',
    brandPh: 'Schneider, ABB, Legrand…',
    specs: 'Specifications',
    specsPh: '2.5mm², 16A, 230V…',
    colSku: 'SKU',
    confirmDelete: 'Delete this item and all its stock movements?',
    // Category labels
    catCableWire: 'Cable & Wire',
    catConduitPipe: 'Conduit & Pipe',
    catPanelsBreakers: 'Panels & Breakers',
    catOutletsSwitches: 'Outlets & Switches',
    catLighting: 'Lighting',
    catTools: 'Tools',
    catConsumables: 'Consumables',
    catOther: 'Other',
    // Unit labels
    unitPiece: 'piece',
    unitMeter: 'meter',
    unitRoll: 'roll',
    unitBox: 'box',
    unitSet: 'set',
    unitKg: 'kg',
    unitLiter: 'liter',
    unitPair: 'pair',
  },
  ar: {
    title: 'المخزون',
    itemsCount: '{n} صنف',
    newItem: 'صنف جديد',
    searchPlaceholder: 'بحث في الأصناف...',
    allCategories: 'جميع الفئات',
    noItems: 'لا توجد أصناف',
    colId: 'المعرّف',
    colItem: 'الصنف',
    colCategory: 'الفئة',
    colStock: 'المخزون',
    colCost: 'التكلفة',
    colSelling: 'البيع',
    minLabel: 'الحد الأدنى: {n}',
    stockBtn: '± مخزون',
    historyBtn: 'السجل',
    historyTitle: 'سجل المخزون ({n} حركة)',
    noMovements: 'لا توجد حركات مسجلة.',
    modalEditItem: 'تعديل الصنف',
    modalNewItem: 'صنف جديد',
    itemName: 'اسم الصنف (إنجليزي) *',
    itemNamePlaceholder: 'Cable 2.5mm², 16A breaker…',
    itemNameAr: 'اسم الصنف (عربي)',
    itemNameArPh: 'كابل 2.5mm²، قاطع 16A...',
    colUnit: 'الوحدة',
    totalCostValue: 'إجمالي قيمة التكلفة',
    salvageValue: 'قيمة المبيعات',
    stockSummary: 'ملخص المخزون',
    costFromInvoice: 'من الفاتورة',
    category: 'الفئة',
    unit: 'الوحدة',
    description: 'الوصف',
    minStockAlert: 'تنبيه الحد الأدنى للمخزون',
    costPrice: 'سعر التكلفة',
    sellingPrice: 'سعر البيع',
    defaultSupplier: 'المورد الافتراضي',
    none: '— لا يوجد —',
    cancel: 'إلغاء',
    saveChanges: 'حفظ التغييرات',
    addItem: 'إضافة صنف',
    movementTitle: 'حركة المخزون — {name}',
    currentStock: 'المخزون الحالي:',
    movementType: 'نوع الحركة',
    inBtn: '+ وارد',
    outBtn: '− صادر',
    adjustBtn: '⟳ تسوية',
    newQuantity: 'الكمية الجديدة',
    quantity: 'الكمية',
    date: 'التاريخ',
    unitCost: 'تكلفة الوحدة (اختياري)',
    linkProject: 'ربط بمشروع (اختياري)',
    noneDash: '— لا يوجد —',
    notes: 'ملاحظات',
    notesPlaceholder: 'طلب شراء، تفاصيل الاستخدام...',
    recordMovement: 'تسجيل الحركة',
    sku: 'رمز الصنف (SKU)',
    skuPh: 'ELE-001',
    serialNumber: 'الرقم التسلسلي',
    serialNumberPh: 'SN-123456...',
    photo: 'صورة الصنف',
    addPhoto: 'إضافة صورة',
    changePhoto: 'تغيير الصورة',
    brand: 'الماركة',
    brandPh: 'Schneider, ABB, Legrand…',
    specs: 'المواصفات',
    specsPh: '2.5mm², 16A, 230V…',
    colSku: 'الرمز',
    confirmDelete: 'حذف هذا الصنف وجميع حركات المخزون الخاصة به؟',
    // Category labels
    catCableWire: 'كابلات وأسلاك',
    catConduitPipe: 'مواسير ومجاري',
    catPanelsBreakers: 'لوحات وقواطع',
    catOutletsSwitches: 'مقابس ومفاتيح',
    catLighting: 'إنارة',
    catTools: 'أدوات',
    catConsumables: 'مواد استهلاكية',
    catOther: 'أخرى',
    // Unit labels
    unitPiece: 'قطعة',
    unitMeter: 'متر',
    unitRoll: 'لفة',
    unitBox: 'صندوق',
    unitSet: 'طقم',
    unitKg: 'كغم',
    unitLiter: 'لتر',
    unitPair: 'زوج',
  },
} as const

const CATEGORY_KEY: Record<string, keyof typeof L.en> = {
  'Cable & Wire': 'catCableWire',
  'Conduit & Pipe': 'catConduitPipe',
  'Panels & Breakers': 'catPanelsBreakers',
  'Outlets & Switches': 'catOutletsSwitches',
  'Lighting': 'catLighting',
  'Tools': 'catTools',
  'Consumables': 'catConsumables',
  'Other': 'catOther',
}

const UNIT_KEY: Record<string, keyof typeof L.en> = {
  piece: 'unitPiece',
  meter: 'unitMeter',
  roll: 'unitRoll',
  box: 'unitBox',
  set: 'unitSet',
  kg: 'unitKg',
  liter: 'unitLiter',
  pair: 'unitPair',
}

const EMPTY_ITEM: Omit<Item, 'id' | 'createdAt'> = {
  name: '', nameAr: '', description: '', category: 'Cable & Wire', unit: 'meter',
  minStock: 10, costPrice: 0, sellingPrice: 0, supplierId: '', sku: '', imageUrl: '',
  brand: '', specs: '', serialNumber: '',
}

function ItemModal({
  initial, onSave, onClose,
}: {
  initial: Omit<Item, 'id' | 'createdAt'>
  onSave: (d: Omit<Item, 'id' | 'createdAt'>) => void
  onClose: () => void
}) {
  const t = useT(L)
  const suppliers = useSuppliers()
  const [form, setForm] = useState(initial)
  const set = (k: keyof typeof form, v: string | number) => setForm(f => ({ ...f, [k]: v }))
  const fileRef = useRef<HTMLInputElement>(null)

  /**
   * Save uploaded image to IndexedDB via imageService and store only
   * a short ref string on the item. Falls back to legacy base64 if
   * IndexedDB is unavailable so the form still works.
   */
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const ref = await saveImage(file)
      setForm(f => ({ ...f, imageUrl: ref }))
    } catch {
      // Fallback: read as base64 dataUrl
      const reader = new FileReader()
      reader.onload = ev => setForm(f => ({ ...f, imageUrl: ev.target?.result as string }))
      reader.readAsDataURL(file)
    }
    if (e.target) e.target.value = ''
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 sticky top-0 bg-gray-800">
          <h2 className="font-semibold text-white">{initial.name ? t.modalEditItem : t.modalNewItem}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Image upload */}
          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-600 flex items-center justify-center cursor-pointer hover:border-yellow-500 transition-colors overflow-hidden shrink-0"
              onClick={() => fileRef.current?.click()}
            >
              {form.imageUrl ? (
                <ItemImage src={form.imageUrl} className="w-full h-full object-cover" />
              ) : (
                <Image className="w-7 h-7 text-gray-600" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-300">{t.photo}</p>
              <button className="text-xs text-yellow-400 hover:text-yellow-300 mt-1" onClick={() => fileRef.current?.click()}>
                {form.imageUrl ? t.changePhoto : t.addPhoto}
              </button>
              {form.imageUrl && (
                <button className="text-xs text-red-400 hover:text-red-300 ml-3" onClick={() => setForm(f => ({ ...f, imageUrl: '' }))}>
                  <X className="w-3 h-3 inline" /> Remove
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t.itemName}</label>
              <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder={t.itemNamePlaceholder} />
            </div>
            <div>
              <label className="label">{t.itemNameAr}</label>
              <input className="input" dir="rtl" value={form.nameAr ?? ''} onChange={e => set('nameAr', e.target.value)} placeholder={t.itemNameArPh} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t.category}</label>
              <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{t[CATEGORY_KEY[c]] ?? c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t.unit}</label>
              <select className="input" value={form.unit} onChange={e => set('unit', e.target.value)}>
                {UNITS.map(u => <option key={u} value={u}>{t[UNIT_KEY[u]] ?? u}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">{t.sku}</label>
              <input className="input" value={form.sku ?? ''} onChange={e => set('sku', e.target.value)} placeholder={t.skuPh} />
            </div>
            <div>
              <label className="label">{t.serialNumber}</label>
              <input className="input" value={form.serialNumber ?? ''} onChange={e => set('serialNumber', e.target.value)} placeholder={t.serialNumberPh} />
            </div>
            <div>
              <label className="label">{t.description}</label>
              <input className="input" value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
          </div>
          {/* Brand + Specs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t.brand}</label>
              <input className="input" value={form.brand ?? ''} onChange={e => set('brand', e.target.value)} placeholder={t.brandPh} />
            </div>
            <div>
              <label className="label">{t.specs}</label>
              <input className="input" value={form.specs ?? ''} onChange={e => set('specs', e.target.value)} placeholder={t.specsPh} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">{t.minStockAlert}</label>
              <input className="input" type="number" min={0} value={form.minStock} onChange={e => set('minStock', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="label">{t.costPrice}</label>
              <input className="input" type="number" min={0} step="0.01" value={form.costPrice} onChange={e => set('costPrice', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="label">{t.sellingPrice}</label>
              <input className="input" type="number" min={0} step="0.01" value={form.sellingPrice} onChange={e => set('sellingPrice', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          {suppliers.length > 0 && (
            <div>
              <label className="label">{t.defaultSupplier}</label>
              <select className="input" value={form.supplierId} onChange={e => set('supplierId', e.target.value)}>
                <option value="">{t.none}</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-700">
          <button className="btn-secondary" onClick={onClose}>{t.cancel}</button>
          <button className="btn-primary" onClick={() => { if (form.name.trim()) onSave(form) }}>
            {initial.name ? t.saveChanges : t.addItem}
          </button>
        </div>
      </div>
    </div>
  )
}

function MovementModal({
  itemId, itemName, currentStock, onSave, onClose,
}: {
  itemId: string; itemName: string; currentStock: number
  onSave: (d: Omit<StockMovement, 'id'>) => void
  onClose: () => void
}) {
  const t = useT(L)
  const projects = useProjects()
  const [form, setForm] = useState<{
    type: StockMovementType; quantity: number; projectId: string; notes: string; date: string; unitCost: number
  }>({ type: 'in', quantity: 1, projectId: '', notes: '', date: today(), unitCost: 0 })
  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="font-semibold text-white">{t.movementTitle.replace('{name}', itemName)}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="text-sm text-gray-400">{t.currentStock} <span className="text-white font-semibold">{currentStock}</span></div>
          <div>
            <label className="label">{t.movementType}</label>
            <div className="grid grid-cols-3 gap-2">
              {(['in', 'out', 'adjustment'] as StockMovementType[]).map(mt => (
                <button
                  key={mt}
                  onClick={() => set('type', mt)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    form.type === mt
                      ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                      : 'border-gray-600 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {mt === 'in' ? t.inBtn : mt === 'out' ? t.outBtn : t.adjustBtn}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{form.type === 'adjustment' ? t.newQuantity : t.quantity}</label>
              <input className="input" type="number" min={0} value={form.quantity} onChange={e => set('quantity', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="label">{t.date}</label>
              <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
          </div>
          {form.type === 'in' && (
            <div>
              <label className="label">{t.unitCost}</label>
              <input className="input" type="number" min={0} step="0.01" value={form.unitCost} onChange={e => set('unitCost', parseFloat(e.target.value) || 0)} />
            </div>
          )}
          {form.type === 'out' && projects.length > 0 && (
            <div>
              <label className="label">{t.linkProject}</label>
              <select className="input" value={form.projectId} onChange={e => set('projectId', e.target.value)}>
                <option value="">{t.noneDash}</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">{t.notes}</label>
            <input className="input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder={t.notesPlaceholder} />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-700">
          <button className="btn-secondary" onClick={onClose}>{t.cancel}</button>
          <button
            className="btn-primary"
            onClick={() => onSave({ itemId, type: form.type, quantity: form.quantity, projectId: form.projectId || undefined, unitCost: form.unitCost || undefined, notes: form.notes, date: form.date })}
          >
            {t.recordMovement}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Inventory() {
  const t = useT(L)
  const navigate = useNavigate()

  // Narrow subscriptions
  const items            = useItems()
  const stockMovements   = useStockMovements()
  const purchaseInvoices = usePurchaseInvoices()
  const receipts         = useStore(s => s.receipts)
  const { addItem, updateItem, deleteItem, addStockMovement } = useStoreActions()
  const settings = useStore(s => s.settings)
  const lang = settings.language

  // Stable derived ref (function identity never changes in Zustand)
  const getItemStock = useStore(s => s.getItemStock)

  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [itemModal, setItemModal] = useState<{ open: boolean; item?: Item }>({ open: false })
  const [mvModal, setMvModal]     = useState<{ open: boolean; item?: Item }>({ open: false })
  const [showHistory, setShowHistory] = useState<string | null>(null)
  const [zoomImage, setZoomImage] = useState<string | null>(null)

  // Memoized stock map — recomputed only when stockMovements or items change.
  // Avoids the per-row O(n) scan that getItemStock(id) triggers on every render.
  const stockByItemId = useMemo(() => {
    const map = new Map<string, number>()
    // Group movements by itemId, sort chronologically, fold to current stock
    const byItem = new Map<string, StockMovement[]>()
    for (const m of stockMovements) {
      const arr = byItem.get(m.itemId) ?? []
      arr.push(m)
      byItem.set(m.itemId, arr)
    }
    for (const [itemId, movements] of byItem) {
      const sorted = [...movements].sort((a, b) => a.date.localeCompare(b.date))
      let stock = 0
      for (const m of sorted) {
        if (m.type === 'in')              stock += m.quantity
        else if (m.type === 'out')        stock -= m.quantity
        else if (m.type === 'adjustment') stock = m.quantity
      }
      map.set(itemId, stock)
    }
    // Items with no movements default to 0
    for (const item of items) if (!map.has(item.id)) map.set(item.id, 0)
    return map
  }, [items, stockMovements])

  // Memoized history map — same idea
  const historyByItemId = useMemo(() => {
    const map = new Map<string, StockMovement[]>()
    for (const m of stockMovements) {
      const arr = map.get(m.itemId) ?? []
      arr.push(m)
      map.set(m.itemId, arr)
    }
    return map
  }, [stockMovements])

  // Latest purchase cost per item from purchase invoices — overrides item.costPrice
  const avgCostFromInvoice = useMemo(() => {
    const map = new Map<string, number>()
    // Sort oldest → newest so the last write wins (most recent price)
    const sorted = [...purchaseInvoices].sort((a, b) => a.date.localeCompare(b.date))
    for (const inv of sorted) {
      for (const line of inv.lineItems) {
        if (!line.itemId || !line.unitPrice) continue
        map.set(line.itemId, line.unitPrice)
      }
    }
    return map
  }, [purchaseInvoices])

  // Total sales revenue per item from receipts (sales invoices use Receipt type)
  const salesRevenueByItem = useMemo(() => {
    const map = new Map<string, { qty: number; revenue: number }>()
    for (const receipt of receipts) {
      for (const line of receipt.lineItems) {
        if (!line.itemId) continue
        const cur = map.get(line.itemId) ?? { qty: 0, revenue: 0 }
        cur.qty += line.quantity
        cur.revenue += line.total
        map.set(line.itemId, cur)
      }
    }
    return map
  }, [receipts])

  // Summary: total cost value = Σ(current_stock × effective_cost)
  // Effective cost = latest purchase invoice price, fallback to item.costPrice
  const totalCostValue = useMemo(() =>
    items.reduce((sum, item) => {
      const stock = stockByItemId.get(item.id) ?? 0
      const cost = avgCostFromInvoice.get(item.id) ?? item.costPrice
      return sum + Math.max(0, stock) * cost
    }, 0),
    [items, stockByItemId, avgCostFromInvoice]
  )

  const totalSalvageValue = useMemo(() =>
    Array.from(salesRevenueByItem.values()).reduce((sum, v) => sum + v.revenue, 0),
    [salesRevenueByItem]
  )

  // Filter + search via memoized helper
  const filtered = useTableData(items, {
    search,
    searchFields: ['id', 'name', 'sku'],
    filter: useCallback(
      (i: Item) => catFilter === 'all' || i.category === catFilter,
      [catFilter],
    ),
  })

  // Pagination
  const {
    items: pageItems,
    page, pageCount, pageSize, hasNext, hasPrev,
    setPage, setPageSize,
  } = usePagination(filtered, { initialPageSize: 50 })

  function handleSaveItem(data: Omit<Item, 'id' | 'createdAt'>) {
    if (itemModal.item) updateItem(itemModal.item.id, data)
    else addItem(data)
    setItemModal({ open: false })
  }

  // Image zoom modal
  if (zoomImage) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setZoomImage(null)}>
        <div className="relative max-w-2xl w-full">
          <ItemImage src={zoomImage} className="w-full max-h-[80vh] object-contain rounded-xl" />
          <button className="absolute top-3 right-3 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80" onClick={() => setZoomImage(null)}>
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  function handleMovement(data: Omit<StockMovement, 'id'>) {
    addStockMovement(data)
    setMvModal({ open: false })
  }

  function handleDelete(id: string) {
    if (confirm(t.confirmDelete)) {
      deleteItem(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
          <p className="text-gray-500 text-sm">{t.itemsCount.replace('{n}', String(items.length))}</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setItemModal({ open: true })}>
          <Plus className="w-4 h-4" /> {t.newItem}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card py-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">{t.itemsCount.replace('{n}', String(items.length))}</p>
          <p className="text-xl font-bold text-white mt-1">{items.length}</p>
        </div>
        <div className="card py-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">{t.totalCostValue}</p>
          <p className="text-xl font-bold text-yellow-400 mt-1">{formatCurrency(totalCostValue)}</p>
        </div>
        <div className="card py-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">{t.salvageValue}</p>
          <p className="text-xl font-bold text-green-400 mt-1">{formatCurrency(totalSalvageValue)}</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input className="input pl-9" placeholder={t.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="all">{t.allCategories}</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{t[CATEGORY_KEY[c]] ?? c}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <Package className="w-12 h-12 text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">{t.noItems}</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="w-10 px-3 py-3" />
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colId}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colItem}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">{t.colCategory}</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">{t.colUnit}</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colStock}</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">{t.colCost}</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">{t.colSelling}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {pageItems.map(item => {
                const stock = stockByItemId.get(item.id) ?? 0
                const isLow = stock <= item.minStock
                const history = historyByItemId.get(item.id) ?? []
                return (
                  <Fragment key={item.id}>
                    <tr className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                      <td className="px-3 py-2">
                        {item.imageUrl ? (
                          <div
                            className="w-9 h-9 rounded-lg overflow-hidden cursor-pointer relative group"
                            onClick={() => setZoomImage(item.imageUrl!)}
                          >
                            <ItemImage src={item.imageUrl} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ZoomIn className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-gray-700/50 flex items-center justify-center">
                            <Package className="w-4 h-4 text-gray-600" />
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-yellow-500">
                        <span>{item.id}</span>
                        {item.sku && <p className="text-blue-400 mt-0.5">{item.sku}</p>}
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-white">
                          {lang === 'ar' && item.nameAr ? item.nameAr : item.name}
                        </p>
                        {item.nameAr && lang !== 'ar' && <p className="text-xs text-gray-500" dir="rtl">{item.nameAr}</p>}
                        {!item.nameAr && item.description && <p className="text-xs text-gray-500 truncate">{item.description}</p>}
                      </td>
                      <td className="px-5 py-3 text-gray-400 hidden md:table-cell">{t[CATEGORY_KEY[item.category]] ?? item.category}</td>
                      <td className="px-5 py-3 text-center hidden lg:table-cell">
                        <span className="badge bg-gray-700 text-gray-300 text-xs">{t[UNIT_KEY[item.unit]] ?? item.unit}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isLow && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                          <span className={`font-semibold ${isLow ? 'text-red-400' : 'text-white'}`}>
                            {stock}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">{t.minLabel.replace('{n}', String(item.minStock))}</p>
                      </td>
                      <td className="px-5 py-3 text-right text-gray-300 hidden md:table-cell">
                        {(() => {
                          const invoiceCost = avgCostFromInvoice.get(item.id)
                          return (
                            <>
                              <p>{formatCurrency(invoiceCost ?? item.costPrice)}</p>
                              {invoiceCost && invoiceCost !== item.costPrice && (
                                <p className="text-xs text-blue-400">{t.costFromInvoice}</p>
                              )}
                            </>
                          )
                        })()}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-300 hidden lg:table-cell">{formatCurrency(item.sellingPrice)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            className="text-xs px-2 py-1 rounded bg-green-900/40 text-green-400 hover:bg-green-900/70 transition-colors"
                            onClick={() => setMvModal({ open: true, item })}
                          >{t.stockBtn}</button>
                          <button
                            className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                            onClick={() => setShowHistory(showHistory === item.id ? null : item.id)}
                          >{t.historyBtn}</button>
                          <button
                            className="text-gray-500 hover:text-yellow-400 transition-colors"
                            onClick={() => setItemModal({ open: true, item })}
                          ><Pencil className="w-4 h-4" /></button>
                          <button
                            className="text-gray-500 hover:text-red-400 transition-colors"
                            onClick={() => handleDelete(item.id)}
                          ><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                    {showHistory === item.id && (
                      <tr className="bg-gray-900/50">
                        <td colSpan={9} className="px-5 py-3">
                          <p className="text-xs font-semibold text-gray-400 mb-2">{t.historyTitle.replace('{n}', String(history.length))}</p>
                          {history.length === 0 ? (
                            <p className="text-xs text-gray-600">{t.noMovements}</p>
                          ) : (
                            <div className="space-y-1">
                              {[...history].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map(m => {
                                const ref = m.notes ? parseRefRoute(m.notes) : null
                                const noteText = m.notes || '—'
                                return (
                                  <div key={m.id} className="flex items-center gap-3 text-xs flex-wrap">
                                    <span className={`font-mono ${m.type === 'in' ? 'text-green-400' : m.type === 'out' ? 'text-red-400' : 'text-yellow-400'}`}>
                                      {m.type === 'in' ? '+' : m.type === 'out' ? '-' : '='}{m.quantity}
                                    </span>
                                    <span className="text-gray-500">{formatDate(m.date)}</span>
                                    {ref ? (
                                      <span className="text-gray-400">
                                        {noteText.replace(ref.id, '')}
                                        <button
                                          className="font-mono text-blue-400 hover:text-blue-300 underline"
                                          onClick={() => navigate(ref.route)}
                                        >{ref.id}</button>
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">{noteText}</span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>

          <PaginationControls
            page={page}
            pageCount={pageCount}
            pageSize={pageSize}
            total={filtered.length}
            hasNext={hasNext}
            hasPrev={hasPrev}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      {itemModal.open && (
        <ItemModal
          initial={itemModal.item ? {
            name: itemModal.item.name, nameAr: itemModal.item.nameAr ?? '',
            description: itemModal.item.description,
            category: itemModal.item.category, unit: itemModal.item.unit,
            minStock: itemModal.item.minStock, costPrice: itemModal.item.costPrice,
            sellingPrice: itemModal.item.sellingPrice, supplierId: itemModal.item.supplierId ?? '',
            sku: itemModal.item.sku ?? '', imageUrl: itemModal.item.imageUrl ?? '',
            serialNumber: itemModal.item.serialNumber ?? '',
          } : EMPTY_ITEM}
          onSave={handleSaveItem}
          onClose={() => setItemModal({ open: false })}
        />
      )}

      {mvModal.open && mvModal.item && (
        <MovementModal
          itemId={mvModal.item.id}
          itemName={mvModal.item.name}
          currentStock={stockByItemId.get(mvModal.item.id) ?? getItemStock(mvModal.item.id)}
          onSave={handleMovement}
          onClose={() => setMvModal({ open: false })}
        />
      )}
    </div>
  )
}
