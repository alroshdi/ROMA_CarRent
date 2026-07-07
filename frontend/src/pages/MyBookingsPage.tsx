import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { differenceInHours } from 'date-fns'
import {
  Calendar,
  MapPin,
  XCircle,
  ClipboardList,
  Clock,
  CheckCircle2,
  Car,
  ArrowUpRight,
  User,
  CreditCard,
} from 'lucide-react'
import Layout from '../components/Layout'
import Logo from '../components/Logo'
import ConfirmModal from '../components/ConfirmModal'
import ResultModal from '../components/ResultModal'
import api from '../lib/api'
import { useAuth } from '../lib/auth'
import type { Booking } from '../types'
import { useTranslation } from '../i18n/LanguageProvider'
import { mapCancelResultMessage } from '../i18n/utils'
import { HERO_SLIDE_IMAGES } from '../lib/heroSlides'
import { formatBookingTime } from '../lib/bookingTime'

const statusColors: Record<string, string> = {
  pending: 'bg-amber-950/60 text-amber-300 border-amber-800/50',
  confirmed: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50',
  active: 'bg-blue-950/60 text-blue-300 border-blue-800/50',
  completed: 'bg-roma-elevated text-roma-muted border-roma-border',
  cancelled: 'bg-red-950/60 text-red-300 border-red-800/50',
}

const paymentColors: Record<string, string> = {
  paid: 'bg-emerald-950/50 text-emerald-300 border-emerald-800/40',
  unpaid: 'bg-amber-950/50 text-amber-300 border-amber-800/40',
  refunded: 'bg-roma-elevated text-roma-muted border-roma-border',
}

type FilterKey = 'all' | 'upcoming' | 'completed' | 'cancelled'

const FILTER_KEYS: FilterKey[] = ['all', 'upcoming', 'completed', 'cancelled']

function isOutside48Hours(pickupDate: string): boolean {
  return differenceInHours(new Date(pickupDate), new Date()) >= 48
}

function isUpcoming(status: string) {
  return ['pending', 'confirmed', 'active'].includes(status)
}

function BookingCardSkeleton() {
  return (
    <div className="card-elevated overflow-hidden animate-pulse flex flex-col sm:flex-row">
      <div className="sm:w-44 md:w-52 h-40 sm:h-auto bg-roma-elevated shrink-0" />
      <div className="p-5 flex-1 space-y-4">
        <div className="h-5 bg-roma-elevated rounded w-1/2" />
        <div className="h-4 bg-roma-elevated rounded w-1/3" />
        <div className="h-4 bg-roma-elevated rounded w-2/3" />
        <div className="h-10 bg-roma-elevated rounded w-full mt-4" />
      </div>
    </div>
  )
}

export default function MyBookingsPage() {
  const { t, formatDate, tStatus } = useTranslation()
  const { customer } = useAuth()
  const heroImage = HERO_SLIDE_IMAGES[0] || '/image/slide.jpg'

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [cancelError, setCancelError] = useState('')
  const [cancelModal, setCancelModal] = useState<{
    booking: Booking
    outsideWindow: boolean
    wasPaid: boolean
  } | null>(null)
  const [resultModal, setResultModal] = useState<{
    title: string
    message: string
    variant: 'success' | 'warning' | 'info'
  } | null>(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    api.get('/bookings').then(({ data }) => {
      setBookings(data.bookings)
      setLoading(false)
    })
  }, [])

  const stats = useMemo(() => ({
    total: bookings.length,
    upcoming: bookings.filter((b) => isUpcoming(b.status)).length,
    completed: bookings.filter((b) => b.status === 'completed').length,
  }), [bookings])

  const filteredBookings = useMemo(() => {
    if (filter === 'all') return bookings
    if (filter === 'upcoming') return bookings.filter((b) => isUpcoming(b.status))
    if (filter === 'completed') return bookings.filter((b) => b.status === 'completed')
    return bookings.filter((b) => b.status === 'cancelled')
  }, [bookings, filter])

  const openCancelModal = (booking: Booking) => {
    const outsideWindow = isOutside48Hours(booking.pickup_date)
    const wasPaid = booking.payment_status === 'paid'
    setCancelError('')
    setCancelModal({ booking, outsideWindow, wasPaid })
  }

  const confirmCancel = async () => {
    if (!cancelModal) return
    setCancelling(true)
    setCancelError('')
    const wasPaid = cancelModal.wasPaid
    try {
      const { data } = await api.post(`/bookings/${cancelModal.booking.id}/cancel`)
      setBookings((prev) => prev.map((b) => (b.id === cancelModal.booking.id ? data.booking : b)))
      setCancelModal(null)

      const outsideWindow = data.outside_refund_window ?? isOutside48Hours(cancelModal.booking.pickup_date)
      const refundEligible = data.refund_eligible
      const refundAmount = data.refund_amount ? parseFloat(data.refund_amount) : parseFloat(cancelModal.booking.total_price)

      const message = mapCancelResultMessage(outsideWindow, refundEligible, wasPaid, t, refundAmount)
      const variant = !outsideWindow && wasPaid && !refundEligible ? 'warning' : 'success'

      setResultModal({
        title: t('bookings.cancelledTitle'),
        message,
        variant,
      })
    } catch {
      setCancelError(t('bookings.cancelFailed'))
    } finally {
      setCancelling(false)
    }
  }

  const cancelConfirmMessage = () => {
    if (!cancelModal) return ''
    const { outsideWindow, wasPaid } = cancelModal
    if (outsideWindow && wasPaid) return t('bookings.confirm.outsidePaid')
    if (outsideWindow && !wasPaid) return t('bookings.confirm.outsideUnpaid')
    if (!outsideWindow && wasPaid) return t('bookings.confirm.withinPaid')
    return t('bookings.confirm.defaultMessage')
  }

  const cancelTitle = () => {
    if (!cancelModal) return t('bookings.confirm.default')
    if (cancelModal.outsideWindow) {
      return cancelModal.wasPaid ? t('bookings.confirm.refundEligible') : t('bookings.confirm.default')
    }
    return cancelModal.wasPaid ? t('bookings.confirm.noRefund') : t('bookings.confirm.default')
  }

  return (
    <Layout>
      <ConfirmModal
        open={!!cancelModal}
        title={cancelTitle()}
        message={cancelConfirmMessage()}
        variant={cancelModal?.outsideWindow ? 'info' : 'warning'}
        confirmLabel={t('bookings.confirm.yesCancel')}
        cancelLabel={t('bookings.confirm.keep')}
        loading={cancelling}
        onConfirm={confirmCancel}
        onCancel={() => !cancelling && setCancelModal(null)}
      />

      <ResultModal
        open={!!resultModal}
        title={resultModal?.title ?? ''}
        message={resultModal?.message ?? ''}
        variant={resultModal?.variant ?? 'success'}
        onClose={() => setResultModal(null)}
      />

      {/* Hero */}
      <section className="relative min-h-[260px] md:min-h-[300px] flex items-end overflow-hidden border-b border-roma-border">
        <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-roma-black via-roma-black/85 to-roma-black/55" />
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 md:pb-12 pt-28">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="accent-line mb-4" />
              <h1 className="text-3xl md:text-5xl font-bold text-white tracking-wide uppercase" style={{ fontFamily: 'var(--font-display)' }}>
                {t('bookings.title')}
              </h1>
              <p className="text-roma-muted mt-3 max-w-xl text-base md:text-lg leading-relaxed">
                {customer?.name
                  ? t('bookings.heroSubtitleNamed', { name: customer.name })
                  : t('bookings.heroSubtitle')}
              </p>
            </div>
            <Logo height={48} to={false} className="hidden md:block shrink-0 opacity-90" />
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {cancelError && !cancelModal && <div className="alert-error mb-6">{cancelError}</div>}

        {/* Stats */}
        {!loading && bookings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5 mb-8 md:mb-10">
            {[
              { key: 'total', value: stats.total, icon: ClipboardList, label: t('bookings.statsTotal') },
              { key: 'upcoming', value: stats.upcoming, icon: Clock, label: t('bookings.statsUpcoming') },
              { key: 'completed', value: stats.completed, icon: CheckCircle2, label: t('bookings.statsCompleted') },
            ].map(({ key, value, icon: Icon, label }) => (
              <div key={key} className="card-elevated p-5 flex items-center gap-4 border-primary/10">
                <div className="feature-icon-ring w-12 h-12 shrink-0">
                  <Icon className="w-5 h-5 text-primary" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{value}</p>
                  <p className="text-xs text-roma-muted uppercase tracking-wide">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        {!loading && bookings.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {FILTER_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === key
                    ? 'bg-primary text-white shadow-[0_0_16px_rgba(224,38,48,0.35)]'
                    : 'bg-roma-card text-roma-muted border border-roma-border hover:border-primary/40 hover:text-white'
                }`}
              >
                {t(`bookings.filter.${key}`)}
              </button>
            ))}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="space-y-5">
            {[1, 2, 3].map((i) => (
              <BookingCardSkeleton key={i} />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="card-elevated p-12 md:p-16 text-center border-primary/15 bg-[radial-gradient(ellipse_at_center,rgba(224,38,48,0.06),transparent_70%)]">
            <div className="feature-icon-ring w-16 h-16 mx-auto mb-6">
              <ClipboardList className="w-7 h-7 text-primary" strokeWidth={1.75} />
            </div>
            <p className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              {t('bookings.noBookings')}
            </p>
            <p className="text-sm text-roma-muted max-w-md mx-auto mb-6">{t('bookings.emptyHint')}</p>
            <Link to="/browse" className="btn-primary py-3 px-8 inline-flex">
              {t('bookings.browseCars')}
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-roma-muted">{t('bookings.noFilterResults')}</p>
            <button type="button" onClick={() => setFilter('all')} className="btn-secondary py-2.5 px-6 mt-4 text-sm">
              {t('bookings.filter.all')}
            </button>
          </div>
        ) : (
          <div className="space-y-5 md:space-y-6">
            {filteredBookings.map((booking) => {
              const image = booking.car?.images?.[0] || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=250&fit=crop'
              const canComplete = booking.status === 'pending' && booking.payment_status === 'unpaid'
              const canCancel = !['cancelled', 'completed'].includes(booking.status)

              return (
                <article
                  key={booking.id}
                  className="card-elevated overflow-hidden group hover:border-primary/35 hover:shadow-[0_0_28px_rgba(224,38,48,0.1)] transition-all duration-300 flex flex-col sm:flex-row"
                >
                  <div className="relative sm:w-44 md:w-52 h-44 sm:h-auto shrink-0 overflow-hidden bg-roma-dark">
                    <img
                      src={image}
                      alt={booking.car?.name || ''}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-roma-black/80 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-roma-black/40" />
                    <span className="absolute bottom-3 start-3 text-lg font-bold text-white drop-shadow-lg sm:hidden" style={{ fontFamily: 'var(--font-display)' }}>
                      {parseFloat(booking.total_price).toFixed(2)} {t('common.omr')}
                    </span>
                  </div>

                  <div className="p-5 md:p-6 flex flex-col flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                      <div className="min-w-0">
                        <h3 className="font-bold text-lg text-white tracking-wide truncate" style={{ fontFamily: 'var(--font-display)' }}>
                          {booking.car?.name || t('car.carNumber', { id: booking.car_id })}
                        </h3>
                        <p className="text-xs text-roma-subtle mt-0.5">{t('bookings.bookingNumber', { id: booking.id })}</p>
                        {booking.car && (
                          <p className="text-sm text-roma-muted mt-1">{booking.car.brand} {booking.car.model}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <span className={`badge border ${statusColors[booking.status]}`}>
                          {tStatus(booking.status)}
                        </span>
                        <span className={`badge border ${paymentColors[booking.payment_status] || paymentColors.unpaid}`}>
                          <CreditCard className="w-3 h-3 inline me-1 -mt-0.5" />
                          {tStatus(booking.payment_status)}
                        </span>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 text-sm text-roma-muted mb-4">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary shrink-0" />
                        <span>
                          {formatDate(booking.pickup_date, 'MMM d')}{booking.pickup_time ? ` · ${formatBookingTime(booking.pickup_time)}` : ''} — {formatDate(booking.return_date, 'MMM d, yyyy')}{booking.return_time ? ` · ${formatBookingTime(booking.return_time)}` : ''}
                        </span>
                      </span>
                      <span className="flex items-center gap-2 min-w-0">
                        <MapPin className="w-4 h-4 text-primary shrink-0" />
                        <span className="truncate">{booking.pickup_location}</span>
                      </span>
                      {booking.with_driver && (
                        <span className="flex items-center gap-2 sm:col-span-2">
                          <User className="w-4 h-4 text-primary shrink-0" />
                          {t('bookings.withDriver')}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-roma-border mt-auto">
                      <span className="font-bold text-primary text-xl hidden sm:block" style={{ fontFamily: 'var(--font-display)' }}>
                        {parseFloat(booking.total_price).toFixed(2)} {t('common.omr')}
                      </span>
                      <div className="flex flex-wrap gap-3 sm:justify-end">
                        {canComplete && (
                          <Link
                            to={`/book/${booking.car_id}?booking=${booking.id}`}
                            className="btn-primary py-2.5 px-5 text-sm inline-flex"
                          >
                            {t('bookings.completeBooking')}
                            <ArrowUpRight className="w-4 h-4" />
                          </Link>
                        )}
                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => openCancelModal(booking)}
                            className="inline-flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 border border-red-900/50 hover:border-red-700/50 px-4 py-2.5 rounded-lg transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            {t('bookings.cancel')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* CTA */}
        {!loading && bookings.length > 0 && (
          <div className="mt-14 md:mt-16 card-elevated p-8 md:p-10 text-center border-primary/20 bg-[radial-gradient(ellipse_at_center,rgba(224,38,48,0.08),transparent_70%)]">
            <div className="feature-icon-ring w-14 h-14 mx-auto mb-5">
              <Car className="w-6 h-6 text-primary" strokeWidth={1.75} />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-3 uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
              {t('bookings.ctaTitle')}
            </h2>
            <p className="text-sm text-roma-muted mb-6 max-w-md mx-auto">{t('bookings.ctaSubtitle')}</p>
            <Link to="/browse" className="btn-primary py-3 px-8 inline-flex">
              {t('bookings.browseCars')}
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </Layout>
  )
}
