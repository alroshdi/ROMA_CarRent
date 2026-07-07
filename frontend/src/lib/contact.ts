export const CONTACT_PHONE_DISPLAY = '+968 97103009'
export const CONTACT_PHONE_DIAL = '+96897103009'
export const CONTACT_INSTAGRAM_HANDLE = 'Roma.car3'
export const CONTACT_INSTAGRAM_URL = 'https://www.instagram.com/roma.car3/'

export function whatsappUrl(text?: string): string {
  const base = `https://wa.me/${CONTACT_PHONE_DIAL.replace(/\D/g, '')}`
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
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
