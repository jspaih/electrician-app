import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, X, ChevronDown } from 'lucide-react'
import { useT } from '../hooks/useT'

const L = {
  en: {
    defaultPh: 'Search or select...',
    noResultsCustom: 'Press Enter or click away to use typed text',
    noResults: 'No items',
    selected: 'selected',
  },
  ar: {
    defaultPh: 'ابحث أو اختر...',
    noResultsCustom: 'اضغط Enter أو انقر خارجاً لاستخدام النص المكتوب',
    noResults: 'لا توجد عناصر',
    selected: 'مختار',
  },
} as const

export interface SelectOption {
  value: string
  label: string
  sub?: string   // secondary text (e.g. price, category)
}

interface Props {
  options: SelectOption[]
  value: string             // item ID when selected; free text when no match
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  allowCustom?: boolean     // allow typing free text not in the list
  required?: boolean
  className?: string
}

export default function SearchableSelect({
  options, value, onChange, placeholder, label,
  allowCustom = false, required = false, className = '',
}: Props) {
  const t = useT(L)
  const ph = placeholder ?? t.defaultPh
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // What the selected option is (if value matches a known option)
  const selected = options.find(o => o.value === value)
  // What to display in the closed trigger button
  const displayValue = selected?.label ?? (allowCustom ? value : '')

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase()) ||
    (o.sub?.toLowerCase().includes(query.toLowerCase()))
  )

  // Commit: called when closing with a typed (non-selected) text
  const commitFreeText = useCallback(() => {
    if (!allowCustom || !open) return
    // If exact label match → treat as selecting that option
    const exactMatch = options.find(
      o => o.label.toLowerCase() === query.toLowerCase()
    )
    if (exactMatch) {
      onChange(exactMatch.value)
    } else if (query.trim()) {
      onChange(query.trim())
    }
    // if query is empty AND value already empty → no-op
  }, [allowCustom, open, query, options, onChange])

  // Close on outside click — commit free text if any
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        commitFreeText()
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [commitFreeText])

  function handleOpen() {
    setOpen(true)
    // Pre-fill input with the current display text so user can edit it
    const sel = options.find(o => o.value === value)
    setQuery(sel ? sel.label : (allowCustom ? value : ''))
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 30)
  }

  function handleSelect(val: string) {
    onChange(val)
    setOpen(false)
    setQuery('')
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
    setOpen(false)
    setQuery('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      // Cancel — revert to whatever was there before
      setOpen(false)
      setQuery('')
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered.length === 1) {
        handleSelect(filtered[0].value)
      } else if (allowCustom && query.trim()) {
        // Commit free text immediately on Enter
        const exactMatch = options.find(
          o => o.label.toLowerCase() === query.toLowerCase()
        )
        if (exactMatch) {
          handleSelect(exactMatch.value)
        } else {
          onChange(query.trim())
          setOpen(false)
          setQuery('')
        }
      }
    } else if (e.key === 'ArrowDown' && filtered.length > 0) {
      // Could add keyboard navigation here later
    }
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      {label && <label className="label">{label}{required && ' *'}</label>}

      {/* Display / trigger */}
      {!open ? (
        <button
          type="button"
          className="input w-full text-left flex items-center justify-between gap-2 cursor-pointer"
          onClick={handleOpen}
        >
          <span className={displayValue ? 'text-gray-100' : 'text-gray-500'}>
            {displayValue || ph}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {value && (
              <span
                className="text-gray-500 hover:text-red-400 transition-colors"
                onClick={handleClear}
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </div>
        </button>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <input
            ref={inputRef}
            className="input pl-9 w-full"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={ph}
            onKeyDown={handleKeyDown}
          />
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-40 top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 italic">
              {allowCustom ? t.noResultsCustom : t.noResults}
            </div>
          ) : (
            filtered.map(opt => (
              <button
                key={opt.value}
                type="button"
                className={`w-full text-left px-4 py-2.5 hover:bg-gray-700 transition-colors flex items-center justify-between gap-2 ${
                  opt.value === value ? 'bg-yellow-500/10 text-yellow-300' : 'text-gray-200'
                }`}
                onMouseDown={e => e.preventDefault()} // prevent losing focus before click fires
                onClick={() => handleSelect(opt.value)}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{opt.label}</p>
                  {opt.sub && <p className="text-xs text-gray-500 truncate">{opt.sub}</p>}
                </div>
                {opt.value === value && <span className="text-yellow-400 text-xs shrink-0">{t.selected}</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
