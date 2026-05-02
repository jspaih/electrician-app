import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { formatCurrency, formatDate, today } from '../utils/helpers'
import { BarChart3 } from 'lucide-react'
import type { StockMovementType } from '../types'
import { useT } from '../hooks/useT'

const L = {
  en: {
    title: 'Stock Movement Report',
    subtitle: 'Analyze inventory flows by item, category, and date range',
    from: 'From Date',
    to: 'To Date',
    category: 'Category',
    allCategories: 'All Categories',
    itemFrom: 'From Item (Code)',
    itemTo: 'To Item (Code)',
    allItems: 'All Items',
    movementType: 'Movement Type',
    allTypes: 'All Types',
    typeIn: 'Stock In',
    typeOut: 'Stock Out',
    typeAdj: 'Adjustment',
    colDate: 'Date',
    colItem: 'Item',
    colCode: 'Code',
    colCategory: 'Category',
    colType: 'Type',
    colQty: 'Qty',
    colUnit: 'Unit',
    colCost: 'Unit Cost',
    colTotal: 'Total Cost',
    colNotes: 'Notes',
    totalIn: 'Total In',
    totalOut: 'Total Out',
    totalValue: 'Total Value',
    movements: '{n} movement(s)',
    noData: 'No movements match the selected filters',
    summaryTitle: 'Item Summary',
    colCurrentStock: 'Current Stock',
    colTotalInQty: 'Total In',
    colTotalOutQty: 'Total Out',
    colUnitCost: 'Unit Cost',
  },
  ar: {
    title: 'تقرير حركات المخزون',
    subtitle: 'تحليل حركات المخزون حسب الصنف والفئة والفترة الزمنية',
    from: 'من تاريخ',
    to: 'إلى تاريخ',
    category: 'الفئة',
    allCategories: 'جميع الفئات',
    itemFrom: 'من كود صنف',
    itemTo: 'إلى كود صنف',
    allItems: 'جميع الأصناف',
    movementType: 'نوع الحركة',
    allTypes: 'جميع الأنواع',
    typeIn: 'وارد',
    typeOut: 'صادر',
    typeAdj: 'تسوية',
    colDate: 'التاريخ',
    colItem: 'الصنف',
    colCode: 'الكود',
    colCategory: 'الفئة',
    colType: 'النوع',
    colQty: 'الكمية',
    colUnit: 'الوحدة',
    colCost: 'تكلفة الوحدة',
    colTotal: 'إجمالي التكلفة',
    colNotes: 'ملاحظات',
    totalIn: 'إجمالي الوارد',
    totalOut: 'إجمالي الصادر',
    totalValue: 'إجمالي القيمة',
    movements: '{n} حركة',
    noData: 'لا توجد حركات تطابق المرشحات المحددة',
    summaryTitle: 'ملخص الأصناف',
    colCurrentStock: 'المخزون الحالي',
    colTotalInQty: 'إجمالي الوارد',
    colTotalOutQty: 'إجمالي الصادر',
    colUnitCost: 'تكلفة الوحدة',
  },
} as const

const TYPE_KEY: Record<StockMovementType, keyof typeof L.en> = {
  in: 'typeIn',
  out: 'typeOut',
  adjustment: 'typeAdj',
}

function typeColor(type: StockMovementType) {
  return type === 'in' ? 'bg-green-900 text-green-300'
    : type === 'out' ? 'bg-red-900 text-red-300'
    : 'bg-yellow-900 text-yellow-300'
}

export default function InventoryReport() {
  const t = useT(L)
  const { items, stockMovements, getItemStock, settings } = useStore()
  const defaultCurrency = settings.currency || 'ILS'

  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1)
    return d.toISOString().split('T')[0]
  })
  const [toDate, setToDate] = useState(today)
  const [category, setCategory] = useState('')
  const [itemFromId, setItemFromId] = useState('')
  const [itemToId, setItemToId] = useState('')
  const [mvType, setMvType] = useState<StockMovementType | 'all'>('all')
  const [view, setView] = useState<'movements' | 'summary'>('movements')

  const categories = useMemo(() => [...new Set(items.map(i => i.category))].sort(), [items])

  const filteredItems = useMemo(() => {
    let list = items
    if (category) list = list.filter(i => i.category === category)
    if (itemFromId) {
      const idx = list.findIndex(i => i.id === itemFromId)
      if (idx >= 0) list = list.slice(idx)
    }
    if (itemToId) {
      const idx = list.findIndex(i => i.id === itemToId)
      if (idx >= 0) list = list.slice(0, idx + 1)
    }
    return list
  }, [items, category, itemFromId, itemToId])

  const filteredItemIds = new Set(filteredItems.map(i => i.id))

  const movements = useMemo(() =>
    stockMovements
      .filter(m => {
        if (!filteredItemIds.has(m.itemId)) return false
        if (m.date < fromDate || m.date > toDate) return false
        if (mvType !== 'all' && m.type !== mvType) return false
        return true
      })
      .sort((a, b) => b.date.localeCompare(a.date)),
    [stockMovements, filteredItemIds, fromDate, toDate, mvType]
  )

  const stats = useMemo(() => {
    let totalIn = 0, totalOut = 0, totalValue = 0
    for (const m of movements) {
      if (m.type === 'in') { totalIn += m.quantity; totalValue += m.quantity * (m.unitCost ?? 0) }
      else if (m.type === 'out') { totalOut += m.quantity }
    }
    return { totalIn, totalOut, totalValue }
  }, [movements])

  // Per-item summary
  const itemSummary = useMemo(() => {
    const map: Record<string, { inQty: number; outQty: number }> = {}
    for (const m of movements) {
      if (!map[m.itemId]) map[m.itemId] = { inQty: 0, outQty: 0 }
      if (m.type === 'in') map[m.itemId].inQty += m.quantity
      else if (m.type === 'out') map[m.itemId].outQty += m.quantity
    }
    return map
  }, [movements])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t.title}</h1>
        <p className="text-gray-500 text-sm">{t.subtitle}</p>
      </div>

      {/* Filters */}
      <div className="card space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="label">{t.from}</label>
            <input className="input" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>
          <div>
            <label className="label">{t.to}</label>
            <input className="input" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
          <div>
            <label className="label">{t.category}</label>
            <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">{t.allCategories}</option>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t.itemFrom}</label>
            <select className="input" value={itemFromId} onChange={e => setItemFromId(e.target.value)}>
              <option value="">{t.allItems}</option>
              {filteredItems.map(i => <option key={i.id} value={i.id}>{i.id} — {i.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t.itemTo}</label>
            <select className="input" value={itemToId} onChange={e => setItemToId(e.target.value)}>
              <option value="">{t.allItems}</option>
              {filteredItems.map(i => <option key={i.id} value={i.id}>{i.id} — {i.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t.movementType}</label>
            <select className="input" value={mvType} onChange={e => setMvType(e.target.value as StockMovementType | 'all')}>
              <option value="all">{t.allTypes}</option>
              <option value="in">{t.typeIn}</option>
              <option value="out">{t.typeOut}</option>
              <option value="adjustment">{t.typeAdj}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      {movements.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card py-3">
            <p className="text-xs text-gray-500">{t.totalIn}</p>
            <p className="text-xl font-bold text-green-400">{stats.totalIn.toLocaleString()}</p>
          </div>
          <div className="card py-3">
            <p className="text-xs text-gray-500">{t.totalOut}</p>
            <p className="text-xl font-bold text-red-400">{stats.totalOut.toLocaleString()}</p>
          </div>
          <div className="card py-3">
            <p className="text-xs text-gray-500">{t.totalValue}</p>
            <p className="text-xl font-bold text-yellow-400">{formatCurrency(stats.totalValue)}</p>
          </div>
        </div>
      )}

      {/* View toggle */}
      <div className="flex gap-2">
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'movements' ? 'bg-yellow-500 text-gray-900' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          onClick={() => setView('movements')}
        >
          {t.movements.replace('{n}', String(movements.length))}
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'summary' ? 'bg-yellow-500 text-gray-900' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          onClick={() => setView('summary')}
        >
          {t.summaryTitle}
        </button>
      </div>

      {movements.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <BarChart3 className="w-12 h-12 text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">{t.noData}</p>
        </div>
      ) : view === 'movements' ? (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colDate}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colItem}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">{t.colCode}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">{t.colCategory}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colType}</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colQty}</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">{t.colCost}</th>
              </tr>
            </thead>
            <tbody>
              {movements.map(m => {
                const item = items.find(i => i.id === m.itemId)
                return (
                  <tr key={m.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 text-gray-300">{formatDate(m.date)}</td>
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{item?.name ?? m.itemId}</p>
                      {m.notes && <p className="text-xs text-gray-500">{m.notes}</p>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-yellow-500 hidden md:table-cell">{item?.id ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">{item?.category ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${typeColor(m.type)}`}>{t[TYPE_KEY[m.type]]}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      <span className={m.type === 'in' ? 'text-green-400' : m.type === 'out' ? 'text-red-400' : 'text-yellow-400'}>
                        {m.type === 'in' ? '+' : m.type === 'out' ? '-' : ''}{m.quantity} {item?.unit ?? ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 hidden md:table-cell">
                      {m.unitCost ? formatCurrency(m.unitCost) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Summary view */
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colItem}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">{t.colCategory}</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colCurrentStock}</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">{t.colUnitCost}</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colTotalInQty}</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.colTotalOutQty}</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.filter(i => itemSummary[i.id]).map(item => {
                const s = itemSummary[item.id] ?? { inQty: 0, outQty: 0 }
                const currentStock = getItemStock(item.id)
                const isLow = currentStock <= item.minStock
                return (
                  <tr key={item.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{item.name}</p>
                      <p className="font-mono text-xs text-yellow-500">{item.id}{item.sku ? ` • ${item.sku}` : ''}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{item.category}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${isLow ? 'text-red-400' : 'text-white'}`}>
                        {currentStock} {item.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <p className="text-gray-300">{formatCurrency(item.costPrice, defaultCurrency)}</p>
                      {item.costCurrency && item.costCurrency !== defaultCurrency && item.costExchangeRate && item.costExchangeRate > 0 && (
                        <p className="text-xs text-yellow-400">
                          {formatCurrency(item.costPrice / item.costExchangeRate, item.costCurrency)} {item.costCurrency}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-green-400 font-medium">+{s.inQty}</td>
                    <td className="px-4 py-3 text-right text-red-400 font-medium">-{s.outQty}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
