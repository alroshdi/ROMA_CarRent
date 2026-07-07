import {
  LayoutDashboard,
  Car,
  UserCircle,
  Users,
  Calendar,
  FileText,
  CreditCard,
  Settings,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

export type AdminNavItem = {
  to: string
  icon: LucideIcon
  labelKey: string
  descKey: string
  end?: boolean
}

export const adminNavItems: AdminNavItem[] = [
  { to: '/admin', icon: LayoutDashboard, labelKey: 'admin.dashboard', descKey: 'admin.dashboardSubtitle', end: true },
  { to: '/admin/revenue', icon: TrendingUp, labelKey: 'admin.revenue', descKey: 'admin.revenueSubtitle' },
  { to: '/admin/cars', icon: Car, labelKey: 'admin.cars', descKey: 'admin.carsSubtitle' },
  { to: '/admin/drivers', icon: UserCircle, labelKey: 'admin.drivers', descKey: 'admin.driversSubtitle' },
  { to: '/admin/customers', icon: Users, labelKey: 'admin.customers', descKey: 'admin.customersSubtitle' },
  { to: '/admin/bookings', icon: Calendar, labelKey: 'admin.bookings', descKey: 'admin.bookingsSubtitle' },
  { to: '/admin/templates', icon: FileText, labelKey: 'admin.templates', descKey: 'admin.templatesSubtitle' },
  { to: '/admin/payments', icon: CreditCard, labelKey: 'admin.payments', descKey: 'admin.paymentsSubtitle' },
  { to: '/admin/settings', icon: Settings, labelKey: 'admin.settings', descKey: 'admin.settingsSubtitle' },
]

export function getActiveAdminNavItem(pathname: string) {
  return adminNavItems.find(({ to, end }) => (end ? pathname === to : pathname.startsWith(to)))
}
