import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { Search, Calendar, Car as CarIcon, ArrowRight, MessageCircle } from 'lucide-react'
import Layout from '../components/Layout'
import CarCard from '../components/CarCard'
import FeatureCard, { FEATURE_KEYS } from '../components/FeatureCard'
import FaqSection from '../components/FaqSection'
import HeroSlideBackground from '../components/HeroSlideBackground'
import api from '../lib/api'
import { openWhatsApp, whatsappUrl } from '../lib/contact'
import { HERO_SLIDE_IMAGES } from '../lib/heroSlides'
import type { Car } from '../types'
import { useTranslation } from '../i18n/LanguageProvider'

export default function HomePage() {
  const { t, dir } = useTranslation()
  const navigate = useNavigate()
  const [cars, setCars] = useState<Car[]>([])
  const [pickupDate, setPickupDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateError, setDateError] = useState('')

  useEffect(() => {
    fetchCars()
  }, [])

  const fetchCars = async (pickup?: string, ret?: string) => {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string> = {}
      if (pickup && ret) {
        params.pickup_date = pickup
        params.return_date = ret
      }
      const { data } = await api.get('/cars', { params })
      setCars(data.cars)
    } catch {
      setError(t('common.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pickupDate || !returnDate) {
      setDateError(t('home.selectDatesHint'))
      return
    }
    setDateError('')
    navigate(`/browse?pickup=${pickupDate}&return=${returnDate}`)
  }

  const today = format(new Date(), 'yyyy-MM-dd')

  return (
    <Layout>
      {/* Hero */}
      <section className="relative min-h-[580px] md:min-h-[640px] flex items-end overflow-hidden">
        <HeroSlideBackground images={HERO_SLIDE_IMAGES} />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 md:pb-14 pt-32">
          <div className="max-w-3xl mb-8 md:mb-10">
            <div className="accent-line mb-5" />
            <h1 className="text-[clamp(1.125rem,4vw,3.25rem)] font-bold text-white leading-tight tracking-wide text-balance">
              {t('home.heroLine1')}
            </h1>
            <p
              className="mt-4 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-primary tracking-widest uppercase drop-shadow-[0_2px_12px_rgba(224,38,48,0.35)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t('home.heroLine2')}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={whatsappUrl(t('home.whatsappBookingMessage'))}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.preventDefault()
                  openWhatsApp(t('home.whatsappBookingMessage'))
                }}
                className="inline-flex items-center gap-2 py-2.5 px-5 rounded-lg text-sm font-semibold text-white bg-[#25D366] hover:bg-[#1fb855] transition-colors shadow-[0_4px_20px_rgba(37,211,102,0.25)]"
              >
                <MessageCircle className="w-4 h-4" />
                {t('home.instantWhatsApp')}
              </a>
            </div>
          </div>

          <form
            onSubmit={handleSearch}
            className="card-elevated p-5 md:p-6 backdrop-blur-md bg-roma-card/85 border-white/10 shadow-[0_12px_48px_rgba(0,0,0,0.45)] max-w-4xl"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-roma-muted mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              {t('home.searchLabel')}
            </p>
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-end">
              <div className="flex-1">
                <label className="label" htmlFor="home-pickup-date">
                  <Calendar className="w-4 h-4 inline me-1 text-primary" /> {t('home.pickupDate')}
                </label>
                <input
                  id="home-pickup-date"
                  type="date"
                  min={today}
                  value={pickupDate}
                  onChange={(e) => { setPickupDate(e.target.value); setDateError('') }}
                  className="input"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="label" htmlFor="home-return-date">
                  <Calendar className="w-4 h-4 inline me-1 text-primary" /> {t('home.returnDate')}
                </label>
                <input
                  id="home-return-date"
                  type="date"
                  min={pickupDate || today}
                  value={returnDate}
                  onChange={(e) => { setReturnDate(e.target.value); setDateError('') }}
                  className="input"
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full md:w-auto px-10 py-3 shrink-0">
                <Search className="w-4 h-4" /> {t('home.searchCars')}
              </button>
            </div>
            {dateError && <p className="text-sm text-amber-300 mt-3" role="alert">{dateError}</p>}
          </form>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent z-10" />
      </section>

      {/* Why Choose Us */}
      <section className="relative bg-roma-black border-b border-roma-border overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(224,38,48,0.06),transparent_70%)] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center mb-12 md:mb-14 max-w-2xl mx-auto">
            <div className="accent-line mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide uppercase" style={{ fontFamily: 'var(--font-display)' }}>
              {t('home.whyChooseUs')}
            </h2>
            <p className="text-sm text-roma-muted mt-3 leading-relaxed">{t('home.whyChooseUsSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-5 md:gap-6">
            {FEATURE_KEYS.map((key, i) => (
              <FeatureCard key={key} featureKey={key} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Fleet preview */}
      <section id="fleet" className="relative border-t border-roma-border overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(224,38,48,0.05),transparent_70%)] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
            <div className="flex items-center gap-4">
              <div className="feature-icon-ring w-12 h-12 shrink-0">
                <CarIcon className="w-5 h-5 text-primary" strokeWidth={1.75} />
              </div>
              <div>
                <div className="accent-line mb-3" />
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide uppercase" style={{ fontFamily: 'var(--font-display)' }}>
                  {t('home.ourFleet')}
                </h2>
                <p className="text-sm text-roma-muted mt-1">{t('home.fleetSubtitle')}</p>
              </div>
            </div>
            <Link to="/browse" className="btn-secondary py-2.5 px-6 text-sm inline-flex shrink-0 self-start sm:self-auto">
              {t('browse.viewAll')}
              <ArrowRight className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
            </Link>
          </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-elevated h-[400px] animate-pulse bg-roma-elevated" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 card-elevated border-primary/15">
            <p className="text-sm text-roma-muted mb-4">{error}</p>
            <button type="button" onClick={() => fetchCars()} className="btn-secondary py-2.5 px-6 text-sm">
              {t('common.retry')}
            </button>
          </div>
        ) : cars.length === 0 ? (
          <div className="text-center py-16 card-elevated border-primary/15">
            <p className="text-lg text-white">{t('home.noCarsTitle')}</p>
            <p className="text-sm text-roma-muted mt-2 mb-6">{t('home.noCarsHint')}</p>
            <Link to="/browse" className="btn-primary py-3 px-8 inline-flex">{t('browse.viewAll')}</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
            {cars.slice(0, 3).map((car) => (
              <CarCard key={car.id} car={car} pickupDate={pickupDate} returnDate={returnDate} />
            ))}
          </div>
        )}
        </div>
      </section>

      <FaqSection />
    </Layout>
  )
}
