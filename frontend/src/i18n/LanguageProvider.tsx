import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { format as fnsFormat } from 'date-fns'
import { ar as arLocale, enUS } from 'date-fns/locale'
import { en } from './locales/en'
import { ar } from './locales/ar'
import { STORAGE_KEY, isLocale, type Locale } from './types'
import { interpolate, resolveTranslation } from './utils'

const dictionaries = { en, ar } as const

function detectInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && isLocale(stored)) return stored
  } catch {
    /* ignore */
  }
  if (typeof navigator !== 'undefined' && navigator.language.startsWith('ar')) return 'ar'
  return 'en'
}

interface LanguageContextValue {
  locale: Locale
  dir: 'ltr' | 'rtl'
  setLocale: (locale: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
  formatDate: (date: Date | string, fmt: string) => string
  tStatus: (status: string) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectInitialLocale)

  const dir: 'ltr' | 'rtl' = locale === 'ar' ? 'rtl' : 'ltr'

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const value = resolveTranslation(dictionaries[locale], key) ?? resolveTranslation(en, key) ?? key
      return interpolate(value, vars)
    },
    [locale],
  )

  const formatDate = useCallback(
    (date: Date | string, fmt: string) =>
      fnsFormat(new Date(date), fmt, { locale: locale === 'ar' ? arLocale : enUS }),
    [locale],
  )

  const tStatus = useCallback(
    (status: string) => {
      const translated = t(`status.${status}`)
      return translated === `status.${status}` ? status : translated
    },
    [t],
  )

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = dir
    document.title = t('common.appTitle')
  }, [locale, dir, t])

  const value = useMemo(
    () => ({ locale, dir, setLocale, t, formatDate, tStatus }),
    [locale, dir, setLocale, t, formatDate, tStatus],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}

export function useTranslation() {
  return useLanguage()
}
