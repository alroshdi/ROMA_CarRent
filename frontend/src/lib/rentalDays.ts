/** Normalize API date (YYYY-MM-DD or ISO datetime) to YYYY-MM-DD. */
export function normalizeBookingDate(date: string): string {
  return date.slice(0, 10)
}

/** Rental days inclusive of pickup and return dates (matches backend BookingService). */
export function getRentalDays(pickupDate: string, returnDate: string): number {
  const pickup = normalizeBookingDate(pickupDate)
  const returnDay = normalizeBookingDate(returnDate)
  const start = new Date(`${pickup}T12:00:00`)
  const end = new Date(`${returnDay}T12:00:00`)
  const diffMs = end.getTime() - start.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  return Math.max(1, diffDays + 1)
}

export function addRentalDays(pickupDate: string, days: number): string {
  const date = new Date(`${normalizeBookingDate(pickupDate)}T12:00:00`)
  date.setDate(date.getDate() + days - 1)
  return date.toISOString().slice(0, 10)
}
