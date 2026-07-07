export interface Car {
  id: number
  name: string
  brand: string
  model: string
  plate_number: string
  daily_price: string
  images: string[] | null
  status: 'available' | 'maintenance' | 'inactive'
  features: Record<string, string | number> | null
}

export interface Driver {
  id: number
  name: string
  phone: string
  license_number: string
  status: 'active' | 'inactive'
}

export interface Customer {
  id: number
  name: string
  phone: string
  is_active: boolean
}

export interface Booking {
  id: number
  customer_id: number
  car_id: number
  driver_id: number | null
  pickup_date: string
  pickup_time: string | null
  return_date: string
  return_time: string | null
  pickup_location: string
  dropoff_location: string
  additional_notes: string | null
  with_driver: boolean
  driver_hours: number | null
  driver_cost: string
  car_cost: string
  total_price: string
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'
  payment_status: 'unpaid' | 'paid' | 'refunded'
  cancelled_at: string | null
  refund_status: 'none' | 'requested' | 'refunded' | 'rejected'
  car?: Car
  driver?: Driver
  contract?: Contract
  payments?: Payment[]
}

export interface Contract {
  id: number
  booking_id: number
  pdf_path: string
  signed_pdf_path: string | null
  signed_at: string | null
}

export interface Payment {
  id: number
  booking_id: number
  thawani_session_id: string | null
  amount: string
  status: 'initiated' | 'paid' | 'failed' | 'refunded'
}

export interface ContractTemplate {
  id: number
  title: string
  content: string
  is_active: boolean
}

export interface Settings {
  whatsapp_number: string
  company: {
    name: string
    email: string
    address: string
  }
  driver_daily_rate: number
}

export interface Analytics {
  total_bookings: number
  total_revenue: number
  car_revenue: number
  driver_revenue: number
  bookings_today: number
  cancellation_rate: number
  with_driver_ratio: number
  avg_rental_days: number
  bookings_by_period: { label: string; count: number }[]
  revenue_by_period: { label: string; amount: number }[]
  top_cars: { name: string; bookings: number }[]
}

export interface Admin {
  id: number
  name: string
  email: string
}
