/** Normalize API time (HH:mm:ss) to HTML time input value (HH:mm). */
export function toTimeInputValue(time?: string | null): string {
  if (!time) return ''
  return time.slice(0, 5)
}

/** Format time for display (24h HH:mm). */
export function formatBookingTime(time?: string | null): string {
  if (!time) return ''
  return time.slice(0, 5)
}
