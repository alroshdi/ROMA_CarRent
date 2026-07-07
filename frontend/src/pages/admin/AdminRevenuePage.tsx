import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  TrendingUp,
  DollarSign,
  RefreshCw,
  Car,
  UserCircle,
  Calendar,
  Filter,
  Clock,
  XCircle,
} from 'lucide-react'
import api from '../../lib/api'
import { useTranslation } from '../../i18n/LanguageProvider'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminStatCard from '../../components/admin/AdminStatCard'
import AdminTableShell from '../../components/admin/AdminTableShell'

type Period = 'day' | 'month' | 'year'

type RevenueData = {
  filters: { period: Period; from: string | null; to: string | null }
  summary: {
    total_collected: number
    total_refunded: number
    net_revenue: number
    pending_amount: number
    failed_amount: number
    paid_count: number
    refunded_count: number
    avg_transaction: number
    today_revenue: number
    month_revenue: number
    year_revenue: number
    car_revenue: number
    driver_revenue: number
  }
  status_breakdown: Record<string, { count: number; total: number }>
  period_breakdown: Array<{ label: string; collected: number; refunded: number; net: number; count: number }>
  top_cars: Array<{ name: string; revenue: number; bookings: number }>
  recent_transactions: Array<{
    id: number
    amount: string
    status: string
    created_at: string
    booking?: { id: number; customer?: { name: string }; car?: { name: string } }
  }>
}

const periodOptions: Period[] = ['day', 'month', 'year']

export default function AdminRevenuePage() {
  const { t, formatDate, tStatus } = useTranslation()
  const [data, setData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('month')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const fetchData = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ period })
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    api.get(`/admin/revenue?${params}`)
      .then(({ data: res }) => setData(res))
      .finally(() => setLoading(false))
  }, [period, from, to])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const maxBar = useMemo(
    () => Math.max(...(data?.period_breakdown.map((p) => p.net) || [1]), 1),
    [data],
  )

  const fmt = (n: number) => `${n.toFixed(2)} ${t('common.omr')}`

  if (loading && !data) {
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

  if (!data) return null

  const { summary } = data

  const statCards = [
    { label: t('admin.netRevenue'), value: fmt(summary.net_revenue), sub: t('admin.netRevenueHint'), icon: TrendingUp },
    { label: t('admin.totalCollected'), value: fmt(summary.total_collected), sub: t('admin.paidCount', { count: summary.paid_count }), icon: DollarSign },
    { label: t('admin.totalRefunded'), value: fmt(summary.total_refunded), sub: t('admin.refundedCount', { count: summary.refunded_count }), icon: RefreshCw },
    { label: t('admin.avgTransaction'), value: fmt(summary.avg_transaction), sub: t('admin.perPaidBooking'), icon: DollarSign },
  ]

  const quickPeriod = [
    { label: t('admin.todayRevenue'), value: fmt(summary.today_revenue), icon: Calendar },
    { label: t('admin.monthRevenueLabel'), value: fmt(summary.month_revenue), icon: Calendar },
    { label: t('admin.yearRevenueLabel'), value: fmt(summary.year_revenue), icon: Calendar },
  ]

  return (
    <div>
      <AdminPageHeader icon={TrendingUp} title={t('admin.revenue')} subtitle={t('admin.revenueSubtitle')} />

      <div className="card-elevated p-4 md:p-5 mb-6 border-primary/10">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
            {t('admin.filters')}
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="label">{t('admin.groupBy')}</label>
            <select className="input text-sm" value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
              {periodOptions.map((p) => (
                <option key={p} value={p}>{t(`admin.period.${p}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t('admin.dateFrom')}</label>
            <input type="date" className="input text-sm" dir="ltr" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">{t('admin.dateTo')}</label>
            <input type="date" className="input text-sm" dir="ltr" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-2">
            <button type="button" onClick={fetchData} className="btn-primary text-sm px-5 py-2.5 flex-1 sm:flex-none">
              {t('admin.applyFilters')}
            </button>
            <button
              type="button"
              onClick={() => { setFrom(''); setTo(''); setPeriod('month') }}
              className="btn-secondary text-sm px-5 py-2.5"
            >
              {t('admin.clearFilters')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(({ label, value, sub, icon }) => (
          <AdminStatCard key={label} label={label} value={value} sub={sub} icon={icon} />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {quickPeriod.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card-elevated p-4 border-primary/10 flex items-center gap-4">
            <div className="feature-icon-ring w-10 h-10 shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-roma-subtle uppercase tracking-wide">{label}</p>
              <p className="text-lg font-bold text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="card-elevated p-5 md:p-6 border-primary/10 lg:col-span-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-wide mb-5" style={{ fontFamily: 'var(--font-display)' }}>
            {t('admin.revenueTrend')}
          </h2>
          {data.period_breakdown.length === 0 ? (
            <p className="text-sm text-roma-muted">{t('admin.noRevenueData')}</p>
          ) : (
            <div className="space-y-3">
              {data.period_breakdown.map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-xs mb-1 gap-2">
                    <span className="text-roma-muted font-mono" dir="ltr">{row.label}</span>
                    <span className="text-white font-medium shrink-0">{fmt(row.net)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-roma-dark overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.max(4, (row.collected / maxBar) * 100)}%` }}
                      title={t('admin.collected')}
                    />
                    {row.refunded > 0 && (
                      <div
                        className="h-full bg-red-500/80"
                        style={{ width: `${Math.max(2, (row.refunded / maxBar) * 100)}%` }}
                        title={t('admin.refunded')}
                      />
                    )}
                  </div>
                  <p className="text-[10px] text-roma-subtle mt-0.5">
                    +{row.collected.toFixed(2)} / −{row.refunded.toFixed(2)} · {row.count} {t('admin.transactions')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card-elevated p-5 border-primary/10">
            <h3 className="text-xs font-bold text-white uppercase tracking-wide mb-4">{t('admin.revenueSplit')}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-roma-muted flex items-center gap-1.5"><Car className="w-3.5 h-3.5" />{t('admin.carRevenue')}</span>
                <span className="text-white font-medium">{fmt(summary.car_revenue)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-roma-muted flex items-center gap-1.5"><UserCircle className="w-3.5 h-3.5" />{t('admin.driverRevenue')}</span>
                <span className="text-white font-medium">{fmt(summary.driver_revenue)}</span>
              </div>
              <div className="flex justify-between gap-2 pt-2 border-t border-roma-border">
                <span className="text-roma-muted flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{t('admin.pending')}</span>
                <span className="text-amber-300">{fmt(summary.pending_amount)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-roma-muted flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" />{t('admin.failed')}</span>
                <span className="text-red-300">{fmt(summary.failed_amount)}</span>
              </div>
            </div>
          </div>

          <div className="card-elevated p-5 border-primary/10">
            <h3 className="text-xs font-bold text-white uppercase tracking-wide mb-4">{t('admin.topCarsRevenue')}</h3>
            {data.top_cars.length === 0 ? (
              <p className="text-xs text-roma-muted">{t('admin.noRevenueData')}</p>
            ) : (
              <div className="space-y-2">
                {data.top_cars.map((car, i) => (
                  <div key={car.name + i} className="flex justify-between gap-2 text-sm">
                    <span className="text-white truncate">{car.name}</span>
                    <span className="text-primary shrink-0">{car.revenue.toFixed(2)} {t('common.omr')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AdminTableShell>
        <div className="p-4 md:p-5 border-b border-roma-border">
          <h2 className="text-sm font-bold text-white uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
            {t('admin.recentTransactions')}
          </h2>
        </div>
        <table className="w-full text-sm table-shell border-0 rounded-none min-w-[720px]">
          <thead>
            <tr>
              <th>#</th>
              <th>{t('common.customer')}</th>
              <th>{t('common.car')}</th>
              <th>{t('common.amount')}</th>
              <th>{t('common.status')}</th>
              <th>{t('common.date')}</th>
            </tr>
          </thead>
          <tbody className="text-roma-muted">
            {data.recent_transactions.map((p) => (
              <tr key={p.id}>
                <td className="text-primary font-bold">#{p.id}</td>
                <td className="text-white">{p.booking?.customer?.name || '—'}</td>
                <td>{p.booking?.car?.name || '—'}</td>
                <td className="text-white font-medium">{parseFloat(p.amount).toFixed(2)} {t('common.omr')}</td>
                <td>
                  <span className={`badge border text-[10px] ${
                    p.status === 'paid' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50'
                    : p.status === 'refunded' ? 'bg-red-950/60 text-red-300 border-red-800/50'
                    : p.status === 'failed' ? 'bg-red-950/40 text-red-400 border-red-900/40'
                    : 'bg-amber-950/60 text-amber-300 border-amber-800/50'
                  }`}>
                    {tStatus(p.status)}
                  </span>
                </td>
                <td className="whitespace-nowrap text-xs">{formatDate(p.created_at, 'MMM d, yyyy HH:mm')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableShell>
    </div>
  )
}
