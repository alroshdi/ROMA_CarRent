import { useEffect, useState } from 'react'
import { Car, Users, Calendar, DollarSign, LayoutDashboard } from 'lucide-react'
import api from '../../lib/api'
import { useTranslation } from '../../i18n/LanguageProvider'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminStatCard from '../../components/admin/AdminStatCard'

interface AnalyticsData {
  summary: {
    total_cars: number
    available_cars: number
    total_customers: number
    total_bookings: number
    pending_bookings: number
    total_revenue: number
    monthly_revenue: number
  }
  bookings_by_status: Record<string, number>
  recent_bookings: Array<{
    id: number
    status: string
    total_price: string
    customer?: { name: string }
    car?: { name: string }
    created_at: string
  }>
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-300 border-amber-800/40',
  confirmed: 'bg-emerald-500/20 text-emerald-300 border-emerald-800/40',
  active: 'bg-blue-500/20 text-blue-300 border-blue-800/40',
  completed: 'bg-roma-elevated text-roma-muted border-roma-border',
  cancelled: 'bg-red-500/20 text-red-300 border-red-800/40',
}

const statusBarColors: Record<string, string> = {
  pending: 'bg-amber-500',
  confirmed: 'bg-emerald-500',
  active: 'bg-blue-500',
  completed: 'bg-roma-muted',
  cancelled: 'bg-red-500',
}

export default function AdminDashboardPage() {
  const { t, tStatus } = useTranslation()
  const [data, setData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    api.get('/admin/analytics').then(({ data: res }) => setData(res))
  }, [])

  if (!data) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-roma-elevated rounded w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card-elevated h-32 bg-roma-elevated" />
          ))}
        </div>
      </div>
    )
  }

  const cards = [
    { labelKey: 'admin.totalCars', value: data.summary.total_cars, sub: t('admin.availableCount', { count: data.summary.available_cars }), icon: Car },
    { labelKey: 'admin.customersLabel', value: data.summary.total_customers, sub: t('admin.registered'), icon: Users },
    { labelKey: 'admin.bookingsLabel', value: data.summary.total_bookings, sub: t('admin.pendingCount', { count: data.summary.pending_bookings }), icon: Calendar },
    { labelKey: 'admin.totalRevenue', value: `${data.summary.total_revenue.toFixed(2)} ${t('common.omr')}`, sub: t('admin.monthlyRevenue', { amount: data.summary.monthly_revenue.toFixed(2) }), icon: DollarSign },
  ]

  const maxStatusCount = Math.max(...Object.values(data.bookings_by_status), 1)

  return (
    <div>
      <AdminPageHeader
        icon={LayoutDashboard}
        title={t('admin.dashboard')}
        subtitle={t('admin.dashboardSubtitle')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-8">
        {cards.map(({ labelKey, value, sub, icon }) => (
          <AdminStatCard key={labelKey} label={t(labelKey)} value={value} sub={sub} icon={icon} />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card-elevated p-5 md:p-6 border-primary/10">
          <h2 className="font-bold mb-5 text-white tracking-wide uppercase text-sm" style={{ fontFamily: 'var(--font-display)' }}>
            {t('admin.bookingsByStatus')}
          </h2>
          <div className="space-y-4">
            {Object.entries(data.bookings_by_status).map(([status, count]) => (
              <div key={status}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-roma-muted">{tStatus(status)}</span>
                  <span className="font-semibold text-white">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-roma-dark overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${statusBarColors[status] || 'bg-primary'}`}
                    style={{ width: `${(count / maxStatusCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-elevated p-5 md:p-6 border-primary/10">
          <h2 className="font-bold mb-5 text-white tracking-wide uppercase text-sm" style={{ fontFamily: 'var(--font-display)' }}>
            {t('admin.recentBookings')}
          </h2>
          <div className="space-y-3">
            {data.recent_bookings.length === 0 ? (
              <p className="text-sm text-roma-muted">{t('admin.noRecentBookings')}</p>
            ) : (
              data.recent_bookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-roma-dark/50 border border-roma-border hover:border-primary/25 transition-colors">
                  <div className="min-w-0">
                    <span className="font-bold text-primary text-sm">#{b.id}</span>
                    <p className="text-sm text-white truncate mt-0.5">{b.customer?.name}</p>
                    <p className="text-xs text-roma-muted truncate">{b.car?.name}</p>
                  </div>
                  <span className={`badge border shrink-0 text-[10px] ${statusColors[b.status] || 'bg-roma-elevated text-roma-muted border-roma-border'}`}>
                    {tStatus(b.status)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
