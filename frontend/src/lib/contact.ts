export const CONTACT_PHONE_DISPLAY = '+968 97103009'
export const CONTACT_PHONE_DIAL = '+96897103009'
export const CONTACT_DIAL_CODE = '+968'
export const CONTACT_INSTAGRAM_HANDLE = 'Roma.car3'
export const CONTACT_INSTAGRAM_URL = 'https://www.instagram.com/roma.car3/'

export function whatsappUrl(text?: string): string {
  const base = `https://wa.me/${CONTACT_PHONE_DIAL.replace(/\D/g, '')}`
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}

export function openWhatsApp(text?: string): void {
  window.open(whatsappUrl(text), '_blank', 'noopener,noreferrer')
}

export const GULF_DIAL_CODES = [
  { code: '+968', countryKey: 'oman' },
  { code: '+971', countryKey: 'uae' },
  { code: '+966', countryKey: 'saudi' },
  { code: '+965', countryKey: 'kuwait' },
  { code: '+973', countryKey: 'bahrain' },
  { code: '+974', countryKey: 'qatar' },
] as const

export type GulfCountryKey = (typeof GULF_DIAL_CODES)[number]['countryKey']

export function formatGulfPhone(dialCode: string, localNumber: string): string {
  const digits = localNumber.replace(/\D/g, '')
  return `${dialCode}${digits}`
}
