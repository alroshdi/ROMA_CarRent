import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, MessageCircle, AlertTriangle, Clock } from 'lucide-react'
import Layout from '../components/Layout'
import api from '../lib/api'
import type { Booking, Payment } from '../types'
import { useTranslation } from '../i18n/LanguageProvider'
import { openWhatsApp, whatsappUrl } from '../lib/contact'

export default function PaymentSuccessPage() {
  const { t, formatDate } = useTranslation()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [booking, setBooking] = useState<Booking | null>(null)
  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [whatsappSent, setWhatsappSent] = useState(false)

  useEffect(() => {
    if (!sessionId) {
      setError(t('payment.missingSession'))
      setLoading(false)
      return
    }

    let attempts = 0
    let cancelled = false

    const verify = () => {
      api.get(`/payments/success?session_id=${sessionId}`)
        .then((paymentRes) => {
          if (cancelled) return
          const paymentData = paymentRes.data.payment as Payment
          setPayment(paymentData)
          setBooking(paymentRes.data.booking)

          if (paymentData.status === 'paid') {
            setLoading(false)
            return
          }

          if (attempts < 5) {
            attempts += 1
            window.setTimeout(verify, 2000)
            return
          }

          setLoading(false)
        })
        .catch(() => {
          if (cancelled) return
          setError(t('payment.verifyFailed'))
          setLoading(false)
        })
    }

    verify()

    return () => {
      cancelled = true
    }
  }, [sessionId, t])

  const isPaid = payment?.status === 'paid'
  const isPending = payment?.status === 'initiated'
  const isFailed = payment?.status === 'failed'

  const waMessage = booking && isPaid
    ? t('payment.whatsappBooking', {
        id: booking.id,
        car: booking.car?.name || t('common.car'),
        pickup: formatDate(booking.pickup_date, 'MMM d, yyyy'),
        return: formatDate(booking.return_date, 'MMM d, yyyy'),
      })
    : null

  const waLink = waMessage ? whatsappUrl(waMessage) : null

  const handleWhatsAppClick = () => {
    if (!waMessage) return
    openWhatsApp(waMessage)
    setWhatsappSent(true)
    if (booking) {
      sessionStorage.setItem(`whatsapp_sent_booking_${booking.id}`, '1')
    }
  }

  useEffect(() => {
    if (booking && isPaid) {
      const sent = sessionStorage.getItem(`whatsapp_sent_booking_${booking.id}`)
      if (sent === '1') setWhatsappSent(true)
    }
  }, [booking, isPaid])

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        {loading ? (
          <div className="card-elevated p-8">
            <Clock className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" aria-hidden />
            <p className="text-roma-muted">{t('payment.verifying')}</p>
          </div>
        ) : error ? (
          <div className="card-elevated p-8">
            <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-4" aria-hidden />
            <h1 className="text-xl font-bold text-white mb-3" style={{ fontFamily: 'var(--font-display)' }}>{t('payment.verifyFailed')}</h1>
            <p className="alert-error mb-6">{error}</p>
            <Link to="/my-bookings" className="btn-secondary py-2.5 px-6 text-sm inline-flex">
              {t('payment.viewBookings')}
            </Link>
          </div>
        ) : isFailed ? (
          <div className="card-elevated p-8">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" aria-hidden />
            <h1 className="text-xl font-bold text-white mb-3" style={{ fontFamily: 'var(--font-display)' }}>{t('payment.failedTitle')}</h1>
            <p className="text-roma-muted mb-6">{t('payment.failedMessage')}</p>
            <Link to="/my-bookings" className="btn-primary py-2.5 px-6 text-sm inline-flex">
              {t('payment.retryPayment')}
            </Link>
          </div>
        ) : isPending ? (
          <div className="card-elevated p-8">
            <Clock className="w-16 h-16 text-amber-400 mx-auto mb-4" aria-hidden />
            <h1 className="text-xl font-bold text-white mb-3" style={{ fontFamily: 'var(--font-display)' }}>{t('payment.pendingTitle')}</h1>
            <p className="text-roma-muted mb-6">{t('payment.pendingMessage')}</p>
            <Link to="/my-bookings" className="btn-secondary py-2.5 px-6 text-sm inline-flex">
              {t('payment.viewBookings')}
            </Link>
          </div>
        ) : (
          <div className="card-elevated p-8">
            <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2 tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>{t('payment.confirmed')}</h1>
            {booking && (
              <>
                <p className="text-roma-muted mb-4">{t('payment.bookingSummary', { id: booking.id, car: booking.car?.name || t('common.car') })}</p>
                <p className="text-sm text-roma-muted mb-6">
                  {t('payment.dateRange', {
                    from: formatDate(booking.pickup_date, 'MMM d'),
                    to: formatDate(booking.return_date, 'MMM d, yyyy'),
                  })}
                </p>
              </>
            )}

            {!whatsappSent ? (
              <>
                <p className="text-sm text-amber-200/90 mb-6 leading-relaxed">{t('payment.whatsappRequired')}</p>
                {waLink && (
                  <button
                    type="button"
                    onClick={handleWhatsAppClick}
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-[#25D366] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#1fb855] transition-colors shadow-[0_0_24px_rgba(37,211,102,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/60"
                  >
                    <MessageCircle className="w-5 h-5" /> {t('payment.openWhatsApp')}
                  </button>
                )}
                <p className="mt-4 text-xs text-roma-subtle">{t('payment.whatsappRequiredHint')}</p>
              </>
            ) : (
              <>
                <p className="text-sm text-emerald-400 mb-6">{t('payment.whatsappSent')}</p>
                {waLink && (
                  <button
                    type="button"
                    onClick={handleWhatsAppClick}
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-[#25D366]/90 text-white px-6 py-3 rounded-lg font-medium hover:bg-[#1fb855] transition-colors mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/60"
                  >
                    <MessageCircle className="w-5 h-5" /> {t('payment.openWhatsAppAgain')}
                  </button>
                )}
                <div>
                  <Link to="/my-bookings" className="text-sm text-primary hover:underline font-medium">
                    {t('payment.viewBookings')}
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
