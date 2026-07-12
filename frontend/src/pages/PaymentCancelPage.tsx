import { Link } from 'react-router-dom'
import { XCircle } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from '../i18n/LanguageProvider'

export default function PaymentCancelPage() {
  const { t } = useTranslation()

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="card-elevated p-8">
          <XCircle className="w-20 h-20 text-amber-400 mx-auto mb-4" aria-hidden />
          <h1 className="text-2xl font-bold text-white mb-2 tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
            {t('payment.cancelledTitle')}
          </h1>
          <p className="text-roma-muted mb-6">{t('payment.cancelledMessage')}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/my-bookings" className="btn-primary py-2.5 px-6 text-sm">
              {t('payment.viewBookings')}
            </Link>
            <Link to="/browse" className="btn-secondary py-2.5 px-6 text-sm">
              {t('nav.browseCars')}
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}
