import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, ExternalLink, Loader2 } from 'lucide-react'
import api from '../lib/api'
import type { Booking } from '../types'
import { useTranslation } from '../i18n/LanguageProvider'

type ThawaniCheckoutEmbedProps = {
  bookingId: number
  gateway?: string
  onPaid: (booking: Booking) => void
  onCancelled: () => void
}

export default function ThawaniCheckoutEmbed({
  bookingId,
  gateway = 'thawani',
  onPaid,
  onCancelled,
}: ThawaniCheckoutEmbedProps) {
  const { t } = useTranslation()
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [awaitingPayment, setAwaitingPayment] = useState(false)
  const [popupBlocked, setPopupBlocked] = useState(false)
  const completed = useRef(false)
  const pollAttempts = useRef(0)
  const MAX_POLL_ATTEMPTS = 120

  const verifyPayment = useCallback(async (sid: string) => {
    if (completed.current) return
    pollAttempts.current += 1
    if (pollAttempts.current > MAX_POLL_ATTEMPTS) {
      setError(t('booking.paymentVerifyTimeout'))
      return
    }
    try {
      const { data } = await api.get(`/payments/success?session_id=${encodeURIComponent(sid)}`)
      const payment = data.payment as { status: string }
      if (payment.status === 'paid') {
        completed.current = true
        onPaid(data.booking as Booking)
      }
    } catch {
      /* keep polling until max attempts */
    }
  }, [onPaid, t])

  useEffect(() => {
    let cancelled = false
    completed.current = false
    pollAttempts.current = 0
    setLoading(true)
    setError('')
    setAwaitingPayment(false)
    setPopupBlocked(false)

    api.post('/payments/checkout', { booking_id: bookingId, gateway, embedded: true })
      .then(({ data }) => {
        if (cancelled) return
        const url = data.checkout_url as string | undefined
        const sid = data.session_id as string | undefined
        if (!url || !sid) {
          setError(t('booking.paymentFailed'))
          setLoading(false)
          return
        }
        setCheckoutUrl(url)
        setSessionId(sid)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        setError(msg || t('booking.paymentFailed'))
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [bookingId, gateway, t])

  useEffect(() => {
    if (!sessionId) return

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const data = event.data as { type?: string; status?: string; sessionId?: string | null }
      if (data?.type !== 'roma-payment') return

      if (data.status === 'cancelled') {
        if (!completed.current) {
          setAwaitingPayment(false)
          onCancelled()
        }
        return
      }

      if (data.status === 'success') {
        void verifyPayment(data.sessionId || sessionId)
      }
    }

    window.addEventListener('message', onMessage)
    const interval = window.setInterval(() => {
      if (awaitingPayment) {
        void verifyPayment(sessionId)
      }
    }, 2500)

    return () => {
      window.removeEventListener('message', onMessage)
      window.clearInterval(interval)
    }
  }, [sessionId, awaitingPayment, onCancelled, verifyPayment])

  const openCheckout = () => {
    if (!checkoutUrl) return
    setPopupBlocked(false)
    setAwaitingPayment(true)
    pollAttempts.current = 0

    const popup = window.open(checkoutUrl, '_blank', 'noopener,noreferrer')
    if (!popup) {
      setPopupBlocked(true)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-roma-muted">{t('booking.loadingPaymentPortal')}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/40 bg-red-950/30 p-6 text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-red-200">{error}</p>
      </div>
    )
  }

  if (!checkoutUrl) return null

  return (
    <div className="rounded-xl border border-roma-border overflow-hidden bg-roma-dark/40 p-6 space-y-4">
      {!awaitingPayment ? (
        <div className="text-center space-y-4">
          <p className="text-sm text-roma-muted">{t('booking.paymentNewTabHint')}</p>
          <button type="button" onClick={openCheckout} className="btn-primary w-full py-3 inline-flex items-center justify-center gap-2">
            <ExternalLink className="w-4 h-4" />
            {t('booking.openPaymentNow')}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-roma-muted">{t('booking.waitingForPayment')}</p>
          <button type="button" onClick={openCheckout} className="text-xs text-primary hover:underline">
            {t('booking.reopenPaymentPage')}
          </button>
        </div>
      )}

      {popupBlocked && (
        <div className="rounded-lg border border-amber-800/40 bg-amber-950/30 p-3 text-center">
          <p className="text-xs text-amber-200 mb-2">{t('booking.popupBlocked')}</p>
          <a
            href={checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {t('booking.openPaymentPage')}
          </a>
        </div>
      )}
    </div>
  )
}
