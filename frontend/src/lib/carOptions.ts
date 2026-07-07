import type { Car } from '../types'

export const CAR_BRANDS = [
  'Toyota',
  'Nissan',
  'Hyundai',
  'Kia',
  'Honda',
  'BMW',
  'Mercedes-Benz',
  'Ford',
  'Chevrolet',
  'Mitsubishi',
  'Lexus',
  'GMC',
  'Isuzu',
  'Other',
] as const

export const CAR_TRANSMISSIONS = ['Automatic', 'Manual'] as const

export const CAR_FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric'] as const

export const CAR_STATUS_OPTIONS: Car['status'][] = ['available', 'inactive', 'maintenance']

export function transmissionLabelKey(value: string): string {
  return value.toLowerCase() === 'manual'
    ? 'admin.transmissionOptions.manual'
    : 'admin.transmissionOptions.automatic'
}

export function fuelLabelKey(value: string): string {
  const map: Record<string, string> = {
    Petrol: 'admin.fuelOptions.petrol',
    Diesel: 'admin.fuelOptions.diesel',
    Hybrid: 'admin.fuelOptions.hybrid',
    Electric: 'admin.fuelOptions.electric',
  }
  return map[value] || 'admin.fuelOptions.petrol'
}

export function carStatusLabelKey(status: Car['status']): string {
  const map: Record<Car['status'], string> = {
    available: 'admin.carStatus.available',
    inactive: 'admin.carStatus.unavailable',
    maintenance: 'admin.carStatus.maintenance',
  }
  return map[status]
}
