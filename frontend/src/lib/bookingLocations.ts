export const BOOKING_LOCATION_KEYS = [
  'salalah_airport',
  'salalah_city_center',
  'home_salalah',
  'other',
] as const

export type BookingLocationKey = (typeof BOOKING_LOCATION_KEYS)[number]

type Translate = (key: string, params?: Record<string, string | number>) => string

export function locationLabel(key: BookingLocationKey, t: Translate): string {
  if (key === 'other') return ''
  return t(`booking.locations.${key}`)
}

export function resolveLocationValue(key: BookingLocationKey | '', custom: string, t: Translate): string {
  if (!key) return ''
  if (key === 'other') return custom.trim()
  return locationLabel(key, t)
}

export function parseStoredLocation(stored: string, t: Translate): { key: BookingLocationKey; custom: string } {
  for (const key of BOOKING_LOCATION_KEYS) {
    if (key === 'other') continue
    if (stored === t(`booking.locations.${key}`)) {
      return { key, custom: '' }
    }
  }
  return { key: 'other', custom: stored }
}
