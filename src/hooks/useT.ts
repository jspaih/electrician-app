/**
 * useT — shared hook for per-component bilingual dictionaries.
 *
 * Usage:
 *   const L = { en: { title: 'Dashboard' }, ar: { title: 'لوحة التحكم' } } as const
 *   const t = useT(L)
 *   <h1>{t.title}</h1>
 *
 * The hook subscribes narrowly to the language slice of the store
 * so a language change re-renders every consumer, and unrelated
 * state changes don't.
 */

import { useStore } from '../store/useStore'

export type Lang = 'en' | 'ar'

export type Bilingual<T extends Record<string, string>> = {
  en: T
  ar: T
}

export function useLang(): Lang {
  return useStore(s => s.settings.language)
}

export function useT<T extends Record<string, string>>(dict: Bilingual<T>): T {
  const lang = useLang()
  return dict[lang] ?? dict.en
}
