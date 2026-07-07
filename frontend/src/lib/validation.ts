import { formatGulfPhone, GULF_DIAL_CODES } from './contact'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i

const GULF_LOCAL_LENGTH: Record<string, { min: number; max: number }> = {
  '+968': { min: 8, max: 8 },
  '+971': { min: 9, max: 9 },
  '+966': { min: 9, max: 9 },
  '+965': { min: 8, max: 8 },
  '+973': { min: 8, max: 8 },
  '+974': { min: 8, max: 8 },
}

const GULF_CODES = new Set(GULF_DIAL_CODES.map(({ code }) => code))

export function isValidEmail(email: string): boolean {
  const value = email.trim()
  if (!value || value.length > 255) return false
  return EMAIL_RE.test(value)
}

export function isValidGulfLocalPhone(dialCode: string, localNumber: string): boolean {
  if (!GULF_CODES.has(dialCode as (typeof GULF_DIAL_CODES)[number]['code'])) return false
  const digits = localNumber.replace(/\D/g, '')
  if (!/^\d+$/.test(digits) || digits.startsWith('0')) return false
  const rule = GULF_LOCAL_LENGTH[dialCode] ?? { min: 7, max: 10 }
  return digits.length >= rule.min && digits.length <= rule.max
}

export function isValidGulfPhone(dialCode: string, localNumber: string): boolean {
  if (!isValidGulfLocalPhone(dialCode, localNumber)) return false
  const full = formatGulfPhone(dialCode, localNumber)
  return /^\+(968|971|966|965|973|974)\d{7,10}$/.test(full)
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}
