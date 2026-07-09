import { Fragment, useEffect, useState } from 'react'
import {
  Calendar,
  Pencil,
  ChevronDown,
  ChevronUp,
  FileText,
  Download,
  User,
  Car,
  MapPin,
  Clock,
  PenLine,
} from 'lucide-react'
import api from '../../lib/api'
import type { Booking, Driver } from '../../types'
import { useTranslation } from '../../i18n/LanguageProvider'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminFormCard from '../../components/admin/AdminFormCard'
import AdminTableShell from '../../components/admin/AdminTableShell'
import ResultModal from '../../components/ResultModal'
import { formatBookingTime } from '../../lib/bookingTime'
import { getRentalDays, addRentalDays } from '../../lib/rentalDays'

type AdminBooking = Booking & {
  customer?: { id: number; name: string; phone: string; email?: string | null }
}

function bookingDays(booking: AdminBooking): number {
  return booking.rental_days ?? getRentalDays(booking.pickup_date, booking.return_date)
}

const statusOptions = ['pending', 'confirmed', 'active', 'completed', 'cancelled'] as const

type EditForm = {
  id: number
  status: Booking['status']
  rental_days: number
  with_driver: boolean
}

export default function AdminBookingsPage() {
  const { t, formatDate, tStatus } = useTranslation()
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [editing, setEditing] = useState<EditForm | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [downloadError, setDownloadError] = useState(false)

  const fetchBookings = () => api.get('/admin/bookings').then(({ data }) => setBookings(data.bookings || data.data || []))

  useEffect(() => {
    fetchBookings()
    api.get('/admin/drivers').then(({ data }) => setDrivers(data.drivers || []))
  }, [])

  const openEdit = (booking: AdminBooking) => {
    setEditing({
      id: booking.id,
      status: booking.status,
      rental_days: bookingDays(booking),
      with_driver: booking.with_driver,
    })
    setExpandedId(booking.id)
    setError('')
    setShowForm(true)
  }

  const save = async () => {
    if (!editing) return
    setError('')
    setSaving(true)

    try {
      const { data } = await api.put(`/admin/bookings/${editing.id}`, {
        status: editing.status,
        rental_days: editing.rental_days,
        with_driver: editing.with_driver,
      })
      setBookings((prev) => prev.map((b) => (b.id === editing.id ? data.booking : b)))
      setShowForm(false)
      setEditing(null)
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
      const firstFieldError = res?.errors ? Object.values(res.errors).flat()[0] : null
      setError(firstFieldError || res?.message || t('admin.bookingSaveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const downloadContract = async (bookingId: number) => {
    try {
      const { data } = await api.get(`/admin/bookings/${bookingId}/contract/pdf`, { responseType: 'blob' })
      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = `contract_booking_${bookingId}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      setDownloadError(true)
    }
  }

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const editingBooking = editing ? bookings.find((b) => b.id === editing.id) : null

  return (
    <div>
      <AdminPageHeader icon={Calendar} title={t('admin.bookings')} subtitle={t('admin.bookingsSubtitle')} />

      <ResultModal
        open={downloadError}
        title={t('admin.contractDownloadFailed')}
        message={t('admin.contractDownloadFailed')}
        variant="warning"
        onClose={() => setDownloadError(false)}
      />

      {showForm && editing && editingBooking && (
        <AdminFormCard>
          <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            {t('admin.editBooking')} #{editing.id}
          </h3>
          <p className="text-xs text-roma-muted mb-4">
            {editingBooking.customer?.name} · {editingBooking.car?.name}
          </p>
          {error && <div className="alert-error mb-4">{error}</div>}
          <div className="rounded-lg border border-roma-border bg-roma-dark/50 p-3 mb-4 text-sm space-y-1">
            <p className="text-roma-muted">{t('admin.datesAndDays')}</p>
            <p className="text-white">
              {formatDate(editingBooking.pickup_date, 'MMM d, yyyy')}
              {editingBooking.pickup_time ? ` · ${formatBookingTime(editingBooking.pickup_time)}` : ''}
              {' → '}
              {formatDate(addRentalDays(editingBooking.pickup_date, editing.rental_days), 'MMM d, yyyy')}
              {editingBooking.return_time ? ` · ${formatBookingTime(editingBooking.return_time)}` : ''}
            </p>
            <p className="text-primary font-semibold">{t('booking.rentalDaysCount', { days: editing.rental_days })}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label">{t('common.status')}</label>
              <select
                className="input text-sm"
                value={editing.status}
                onChange={(e) => setEditing({ ...editing, status: e.target.value as Booking['status'] })}
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{tStatus(s)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t('common.payment')}</label>
              <p className="input text-sm bg-roma-dark/50 text-roma-muted cursor-not-allowed">
                {tStatus(editingBooking.payment_status)}
              </p>
            </div>
            <div>
              <label className="label">{t('admin.rentalDays')}</label>
              <input
                type="number"
                min={1}
                max={365}
                className="input text-sm"
                value={editing.rental_days}
                onChange={(e) => setEditing({ ...editing, rental_days: Math.max(1, Number(e.target.value) || 1) })}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-roma-muted pb-2.5">
                <input
                  type="checkbox"
                  checked={editing.with_driver}
                  onChange={(e) => setEditing({ ...editing, with_driver: e.target.checked })}
                  className="w-4 h-4 accent-primary rounded"
                />
                {t('admin.withDriver')}
              </label>
            </div>
          </div>
          <p className="text-xs text-roma-muted mt-3">{t('admin.bookingEditHint')}</p>
          <div className="flex gap-2 mt-5 pt-4 border-t border-roma-border">
            <button type="button" onClick={save} disabled={saving} className="btn-primary text-sm px-5 py-2">
              {saving ? t('profile.saving') : t('common.save')}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); setError('') }} className="btn-secondary text-sm px-5 py-2">
              {t('common.cancel')}
            </button>
          </div>
        </AdminFormCard>
      )}

      <AdminTableShell>
        <table className="w-full text-sm table-shell border-0 rounded-none min-w-[1100px]">
          <thead>
            <tr>
              <th>#</th>
              <th>{t('common.customer')}</th>
              <th>{t('common.car')}</th>
              <th>{t('admin.rentalDays')}</th>
              <th>{t('common.dates')}</th>
              <th>{t('common.total')}</th>
              <th>{t('common.status')}</th>
              <th>{t('common.payment')}</th>
              <th>{t('admin.driver')}</th>
              <th>{t('admin.contract')}</th>
              <th className="text-end">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="text-roma-muted">
            {bookings.map((b) => {
              const days = bookingDays(b)
              const expanded = expandedId === b.id
              const contract = b.contract
              const signed = Boolean(contract?.signed_at)

              return (
                <Fragment key={b.id}>
                  <tr className={expanded ? 'bg-roma-dark/30' : undefined}>
                    <td className="text-primary font-bold">#{b.id}</td>
                    <td>
                      <p className="text-white font-medium">{b.customer?.name || `#${b.customer_id}`}</p>
                      {b.customer?.phone && <p className="text-xs" dir="ltr">{b.customer.phone}</p>}
                    </td>
                    <td>{b.car?.name || `#${b.car_id}`}</td>
                    <td className="text-white font-semibold whitespace-nowrap">{t('booking.rentalDaysCount', { days })}</td>
                    <td className="whitespace-nowrap text-xs">
                      <div>
                        {formatDate(b.pickup_date, 'MMM d')}
                        {b.pickup_time ? ` ${formatBookingTime(b.pickup_time)}` : ''}
                        {' — '}
                        {formatDate(b.return_date, 'MMM d')}
                        {b.return_time ? ` ${formatBookingTime(b.return_time)}` : ''}
                      </div>
                      <p className="text-primary/90 text-[11px] mt-1 font-medium">{t('admin.daysCalculated', { days })}</p>
                    </td>
                    <td className="text-white font-medium whitespace-nowrap">{parseFloat(b.total_price).toFixed(2)} {t('common.omr')}</td>
                    <td><span className="badge border bg-roma-dark border-roma-border">{tStatus(b.status)}</span></td>
                    <td><span className="badge border bg-roma-dark border-roma-border">{tStatus(b.payment_status)}</span></td>
                    <td className="text-xs">{b.with_driver ? (b.driver?.name || t('admin.withDriver')) : t('admin.withoutDriver')}</td>
                    <td>
                      {contract ? (
                        <span className={`badge border text-[10px] ${signed ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50' : 'bg-amber-950/60 text-amber-300 border-amber-800/50'}`}>
                          {signed ? t('admin.signed') : t('admin.unsigned')}
                        </span>
                      ) : (
                        <span className="text-roma-subtle text-xs">—</span>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="flex flex-wrap justify-end gap-1">
                        <button type="button" onClick={() => openEdit(b)} className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-primary hover:bg-primary/10 text-xs">
                          <Pencil className="w-3.5 h-3.5" /> {t('common.edit')}
                        </button>
                        <button type="button" onClick={() => toggleExpand(b.id)} className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-roma-muted hover:text-white hover:bg-roma-elevated text-xs">
                          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          {t('admin.details')}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded && (
                    <tr className="bg-roma-dark/20">
                      <td colSpan={11} className="p-0">
                        <BookingDetailsPanel
                          booking={b}
                          days={days}
                          drivers={drivers}
                          onDownload={() => downloadContract(b.id)}
                          t={t}
                          formatDate={formatDate}
                          tStatus={tStatus}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </AdminTableShell>
    </div>
  )
}

function BookingDetailsPanel({
  booking,
  days,
  drivers,
  onDownload,
  t,
  formatDate,
  tStatus,
}: {
  booking: AdminBooking
  days: number
  drivers: Driver[]
  onDownload: () => void
  t: (key: string, params?: Record<string, string | number>) => string
  formatDate: (date: string | Date, fmt: string) => string
  tStatus: (status: string) => string
}) {
  const contract = booking.contract

  return (
    <div className="p-5 md:p-6 border-t border-roma-border/60 space-y-5">
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <DetailBlock icon={User} title={t('common.customer')}>
          <p className="text-white font-medium">{booking.customer?.name}</p>
          <p dir="ltr">{booking.customer?.phone}</p>
          {booking.customer?.email && <p dir="ltr">{booking.customer.email}</p>}
        </DetailBlock>

        <DetailBlock icon={Car} title={t('common.car')}>
          <p className="text-white font-medium">{booking.car?.name}</p>
          {booking.car?.plate_number && <p>{booking.car.plate_number}</p>}
          <p>{parseFloat(booking.car?.daily_price || '0').toFixed(2)} {t('common.omrPerDay')}</p>
        </DetailBlock>

        <DetailBlock icon={Calendar} title={t('admin.rentalPeriod')}>
          <p className="font-semibold text-primary">{t('booking.rentalDaysCount', { days })}</p>
          <p className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(booking.pickup_date, 'MMM d, yyyy')}
            {booking.pickup_time ? ` · ${formatBookingTime(booking.pickup_time)}` : ''}
          </p>
          <p className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(booking.return_date, 'MMM d, yyyy')}
            {booking.return_time ? ` · ${formatBookingTime(booking.return_time)}` : ''}
          </p>
        </DetailBlock>

        <DetailBlock icon={MapPin} title={t('booking.pickupLocation')}>
          <p>{booking.pickup_location}</p>
          <p className="text-roma-subtle mt-2">{t('booking.dropoffLocation')}</p>
          <p>{booking.dropoff_location}</p>
        </DetailBlock>

        <DetailBlock icon={User} title={t('admin.driverService')}>
          <p>{booking.with_driver ? t('admin.withDriver') : t('admin.withoutDriver')}</p>
          {booking.with_driver && booking.driver && (
            <p>{booking.driver.name} · <span dir="ltr">{booking.driver.phone}</span></p>
          )}
          {booking.with_driver && !booking.driver && drivers.length > 0 && (
            <p className="text-roma-subtle text-xs">{t('admin.noDriverAssigned')}</p>
          )}
        </DetailBlock>

        <DetailBlock icon={FileText} title={t('admin.priceBreakdown')}>
          <p>{t('booking.carRentalSubtotal')}: <span className="text-white">{parseFloat(booking.car_cost).toFixed(2)} {t('common.omr')}</span></p>
          <p>{t('booking.driverRentalSubtotal')}: <span className="text-white">{parseFloat(booking.driver_cost).toFixed(2)} {t('common.omr')}</span></p>
          <p className="font-semibold text-white mt-1">{t('common.total')}: {parseFloat(booking.total_price).toFixed(2)} {t('common.omr')}</p>
        </DetailBlock>
      </div>

      {booking.additional_notes && (
        <div className="rounded-xl border border-roma-border bg-roma-black/40 p-4">
          <p className="text-xs uppercase tracking-wide text-roma-subtle mb-1">{t('booking.additionalNotes')}</p>
          <p className="text-sm">{booking.additional_notes}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-roma-border bg-roma-black/40 p-4">
          <p className="text-xs uppercase tracking-wide text-roma-subtle mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {t('admin.contract')}
          </p>
          {!contract ? (
            <p className="text-sm text-roma-muted">{t('admin.noContract')}</p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm">
                {t('common.status')}:{' '}
                <span className={contract.signed_at ? 'text-emerald-300' : 'text-amber-300'}>
                  {contract.signed_at ? t('admin.signed') : t('admin.unsigned')}
                </span>
              </p>
              {contract.signed_at && (
                <p className="text-xs text-roma-muted">
                  {t('admin.signedAt')}: {formatDate(contract.signed_at, 'MMM d, yyyy HH:mm')}
                </p>
              )}
              <button type="button" onClick={onDownload} className="btn-secondary py-2 px-4 text-xs inline-flex">
                <Download className="w-3.5 h-3.5" />
                {contract.signed_pdf_path ? t('admin.downloadSignedContract') : t('admin.downloadContract')}
              </button>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-roma-border bg-roma-black/40 p-4">
          <p className="text-xs uppercase tracking-wide text-roma-subtle mb-3 flex items-center gap-2">
            <PenLine className="w-4 h-4" />
            {t('admin.signature')}
          </p>
          {contract?.signature_data ? (
            <div className="rounded-lg border border-roma-border bg-white p-2 inline-block">
              <img src={contract.signature_data} alt={t('admin.signature')} className="max-h-24 max-w-full object-contain" />
            </div>
          ) : (
            <p className="text-sm text-roma-muted">{t('admin.noSignature')}</p>
          )}
        </div>
      </div>

      {booking.payments && booking.payments.length > 0 && (
        <div className="rounded-xl border border-roma-border bg-roma-black/40 p-4">
          <p className="text-xs uppercase tracking-wide text-roma-subtle mb-3">{t('admin.payments')}</p>
          <div className="space-y-2">
            {booking.payments.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 text-sm border-b border-roma-border/50 pb-2 last:border-0 last:pb-0">
                <span>#{p.id}</span>
                <span className="text-white">{parseFloat(p.amount).toFixed(2)} {t('common.omr')}</span>
                <span className="badge border bg-roma-dark border-roma-border">{tStatus(p.status)}</span>
                {p.thawani_session_id && <span className="text-xs font-mono" dir="ltr">{p.thawani_session_id.slice(0, 16)}…</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-xs text-roma-subtle">
        <span>{t('admin.refundStatus')}: {tStatus(booking.refund_status)}</span>
        {booking.cancelled_at && <span>{t('admin.cancelledAt')}: {formatDate(booking.cancelled_at, 'MMM d, yyyy')}</span>}
        {booking.created_at && <span>{t('admin.createdAt')}: {formatDate(booking.created_at, 'MMM d, yyyy')}</span>}
      </div>
    </div>
  )
}

function DetailBlock({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof User
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-roma-border bg-roma-black/40 p-4">
      <p className="text-xs uppercase tracking-wide text-roma-subtle mb-2 flex items-center gap-2">
        <Icon className="w-3.5 h-3.5" />
        {title}
      </p>
      <div className="text-sm space-y-1">{children}</div>
    </div>
  )
}
