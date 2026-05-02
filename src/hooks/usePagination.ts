/**
 * usePagination (Step 6)
 * ---------------------------------------------------------------
 * Client-side pagination for in-memory collections. Drop-in: pass
 * an array, get back the slice + pager controls.
 *
 * Memoized so the slice is only recomputed when inputs change.
 * Safe when the underlying array is replaced (common with Zustand
 * reactive reads) — the effect clamps the page back into range.
 *
 * Not wired into any component by default (per Step-9 UI rule).
 * Components that hit performance ceilings (Payments, Checks,
 * Stock Movements on large data sets) can opt in.
 */

import { useEffect, useMemo, useState } from 'react'

export interface PaginationResult<T> {
  page: number
  pageSize: number
  pageCount: number
  total: number
  items: T[]               // the current page slice
  setPage: (n: number) => void
  nextPage: () => void
  prevPage: () => void
  setPageSize: (n: number) => void
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginationOptions {
  initialPage?: number
  initialPageSize?: number
}

export function usePagination<T>(
  source: T[],
  options: PaginationOptions = {},
): PaginationResult<T> {
  const [page, setPageState]         = useState(options.initialPage ?? 1)
  const [pageSize, setPageSizeState] = useState(options.initialPageSize ?? 25)

  const total     = source.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  // Clamp the page if the source shrinks.
  useEffect(() => {
    if (page > pageCount) setPageState(pageCount)
  }, [page, pageCount])

  const items = useMemo(() => {
    const start = (page - 1) * pageSize
    return source.slice(start, start + pageSize)
  }, [source, page, pageSize])

  const setPage = (n: number) => setPageState(Math.min(Math.max(1, n), pageCount))
  const setPageSize = (n: number) => {
    setPageSizeState(Math.max(1, n))
    setPageState(1)
  }

  return {
    page,
    pageSize,
    pageCount,
    total,
    items,
    setPage,
    setPageSize,
    nextPage: () => setPage(page + 1),
    prevPage: () => setPage(page - 1),
    hasNext: page < pageCount,
    hasPrev: page > 1,
  }
}
