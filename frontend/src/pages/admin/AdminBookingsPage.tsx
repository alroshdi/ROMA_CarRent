import { useEffect, useState } from 'react'
import { Calendar } from 'lucide-react'
import api from '../../lib/api'
import type { Booking } from '../../types'
import { useTranslation } from '../../i18n/LanguageProvider'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminTableShell from '../../components/admin/AdminTableShell'

const statusOptions = ['pending', 'confirmed', 'active', 'completed', 'cancelled'] as const

export default function AdminBookingsPage() {
  const { t, formatDate, tStatus } = useTranslation()
  const [bookings, setBookings] = useState<Booking[]>([])

  useEffect(() => {
    api.get('/admin/bookings').then(({ data }) => setBookings(data.data || data.bookings || []))
  }, [])

  const updateStatus = async (id: number, status: string) => {
    await api.put(`/admin/bookings/${id}`, { status })
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: status as Booking['status'] } : b))
  }

  return (
    <div>
      <AdminPageHeader icon={Calendar} title={t('admin.bookings')} subtitle={t('admin.bookingsSubtitle')} />

      <AdminTableShell>
        <table className="w-full text-sm table-shell border-0 rounded-none">
          <thead>
            <tr>
              <th>#</th>
              <th>{t('common.customer')}</th>
              <th>{t('common.car')}</th>
              <th>{t('common.dates')}</th>
              <th>{t('common.total')}</th>
              <th>{t('common.status')}</th>
              <th>{t('common.payment')}</th>
              <th className="text-end">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="text-roma-muted">
            {bookings.map((b) => (
              <tr key={b.id}>
                <td className="text-primary font-bold">#{b.id}</td>
                <td className="text-white font-medium">{(b as Booking & { customer?: { name: string } }).customer?.name || `#${b.customer_id}`}</td>
                <td>{b.car?.name}</td>
                <td className="whitespace-nowrap">{formatDate(b.pickup_date, 'MMM d')} — {formatDate(b.return_date, 'MMM d')}</td>
                <td className="text-white font-medium">{parseFloat(b.total_price).toFixed(2)} {t('common.omr')}</td>
                <td><span className="badge border bg-roma-dark border-roma-border">{tStatus(b.status)}</span></td>
                <td><span className="badge border bg-roma-dark border-roma-border">{tStatus(b.payment_status)}</span></td>
                <td className="text-end">
                  <select value={b.status} onChange={(e) => updateStatus(b.id, e.target.value)} className="input text-xs py-1.5 px-2 w-auto inline-block min-w-[7rem]">
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{tStatus(s)}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableShell>
    </div>
  )
}
