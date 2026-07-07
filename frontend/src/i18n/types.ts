export type Locale = 'en' | 'ar'

export type TranslationDict = {
  [key: string]: string | TranslationDict
}

export const STORAGE_KEY = 'roma_car_language'

export function isLocale(value: string): value is Locale {
  return value === 'en' || value === 'ar'
}
