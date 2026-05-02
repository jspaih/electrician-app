import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useT } from '../hooks/useT'

const L = {
  en: {
    showing: 'Showing {from}–{to} of {total}',
    perPage: 'per page',
    page: 'Page {page} of {pageCount}',
  },
  ar: {
    showing: 'عرض {from}–{to} من {total}',
    perPage: 'في الصفحة',
    page: 'صفحة {page} من {pageCount}',
  },
} as const

interface Props {
  page:        number
  pageCount:   number
  pageSize:    number
  total:       number
  hasNext:     boolean
  hasPrev:     boolean
  onPageChange:     (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: number[]
}

/**
 * Standard pagination footer. Used by every list view that has
 * more than ~50 rows in production. Hidden when total is 0.
 */
export function PaginationControls({
  page, pageCount, pageSize, total, hasNext, hasPrev,
  onPageChange, onPageSizeChange,
  pageSizeOptions = [25, 50, 100, 200],
}: Props) {
  const t = useT(L)
  if (total === 0) return null

  const from = (page - 1) * pageSize + 1
  const to   = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-700">
      <div className="text-xs text-gray-500">
        {t.showing
          .replace('{from}',  String(from))
          .replace('{to}',    String(to))
          .replace('{total}', String(total))}
      </div>

      <div className="flex items-center gap-3">
        <select
          value={pageSize}
          onChange={e => onPageSizeChange(Number(e.target.value))}
          className="bg-gray-800 text-gray-300 text-xs rounded px-2 py-1 border border-gray-700 hover:border-gray-600"
        >
          {pageSizeOptions.map(n => (
            <option key={n} value={n}>{n} {t.perPage}</option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={!hasPrev}
            className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            title="First page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPrev}
            className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            title="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 text-xs text-gray-400 whitespace-nowrap">
            {t.page
              .replace('{page}', String(page))
              .replace('{pageCount}', String(pageCount))}
          </span>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNext}
            className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(pageCount)}
            disabled={!hasNext}
            className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            title="Last page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
