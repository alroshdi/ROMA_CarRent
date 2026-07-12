import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from '../i18n/LanguageProvider'

type EmbedStatus = 'success' | 'cancelled'

export default function PaymentEmbedCallbackPage({ status }: { status: EmbedStatus }) {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    const payload = { type: 'roma-payment' as const, status, sessionId }

    if (window.parent && window.parent !== window) {
      window.parent.postMessage(payload, window.location.origin)
      return
    }

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(payload, window.location.origin)
      window.close()
      return
    }

    if (sessionId) {
      const target = status === 'success' ? '/payment/success' : '/payment/cancel'
      window.location.replace(`${target}?session_id=${encodeURIComponent(sessionId)}`)
    }
  }, [status, sessionId])

  return (
    <div className="min-h-[200px] flex items-center justify-center bg-white text-gray-800 p-6">
      <p className="text-sm">{t('payment.embedProcessing')}</p>
    </div>
  )
}
