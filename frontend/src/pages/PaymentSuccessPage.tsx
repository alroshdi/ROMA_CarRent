import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, MessageCircle } from 'lucide-react'
import Layout from '../components/Layout'
import api from '../lib/api'
import type { Booking } from '../types'
import { useTranslation } from '../i18n/LanguageProvider'
import { whatsappUrl } from '../lib/contact'

export default function PaymentSuccessPage() {
  const { t, formatDate } = useTranslation()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!sessionId) {
      setLoading(false)
      return
    }
    api.get(`/payments/success?session_id=${sessionId}`)
      .then((paymentRes) => {
        setBooking(paymentRes.data.booking)
        setLoading(false)
      })
      .catch(() => {
        setError(t('payment.verifyFailed'))
        setLoading(false)
      })
  }, [sessionId, t])

  const waLink = booking
    ? whatsappUrl(
        t('payment.whatsappBooking', {
          id: booking.id,
          car: booking.car?.name || t('common.car'),
          pickup: formatDate(booking.pickup_date, 'MMM d, yyyy'),
          return: formatDate(booking.return_date, 'MMM d, yyyy'),
        }),
      )
    : null

  useEffect(() => {
    if (waLink && booking) {
      const timer = setTimeout(() => window.open(waLink, '_blank'), 3000)
      return () => clearTimeout(timer)
    }
  }, [waLink, booking])

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        {loading ? (
          <p className="text-roma-muted">{t('payment.verifying')}</p>
        ) : error ? (
          <div className="alert-error p-6">{error}</div>
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
            <p className="text-sm text-roma-muted mb-6">{t('payment.redirectWhatsApp')}</p>
            {waLink && (
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#1fb855] transition-colors">
                <MessageCircle className="w-5 h-5" /> {t('payment.openWhatsApp')}
              </a>
            )}
            <div className="mt-4">
              <Link to="/my-bookings" className="text-sm text-primary hover:underline">{t('payment.viewBookings')}</Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
