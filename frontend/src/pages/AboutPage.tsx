import { Link } from 'react-router-dom'
import { Target, Compass, Car, CheckCircle2, MapPin, Shield, Sparkles } from 'lucide-react'
import Layout from '../components/Layout'
import Logo from '../components/Logo'
import { useTranslation } from '../i18n/LanguageProvider'
import { HERO_SLIDE_IMAGES } from '../lib/heroSlides'

const SERVICE_KEYS = [
  'dailyWeeklyMonthly',
  'individualsFamilies',
  'withOrWithoutDriver',
  'deliveryPickup',
  'electronicContracts',
  'longTermCorporate',
  'vehicleTypes',
  'vipTransport',
  'maintenanceInsurance',
] as const

const HIGHLIGHT_KEYS = ['location', 'quality', 'trust'] as const

export default function AboutPage() {
  const { t } = useTranslation()
  const heroImage = HERO_SLIDE_IMAGES[0] || '/image/slide.jpg'

  return (
    <Layout>
      {/* Hero */}
      <section className="relative min-h-[320px] md:min-h-[380px] flex items-end overflow-hidden border-b border-roma-border">
        <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-roma-black via-roma-black/80 to-roma-black/50" />
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 md:pb-14 pt-28">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="accent-line mb-4" />
              <h1 className="text-3xl md:text-5xl font-bold text-white tracking-wide uppercase" style={{ fontFamily: 'var(--font-display)' }}>
                {t('about.title')}
              </h1>
              <p className="text-roma-muted mt-3 max-w-xl text-base md:text-lg leading-relaxed">
                {t('about.heroSubtitle')}
              </p>
            </div>
            <Logo height={48} to={false} className="hidden md:block shrink-0 opacity-90" />
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20 space-y-16 md:space-y-20">
        {/* Intro */}
        <div className="card-elevated p-6 md:p-10 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <p className="text-roma-muted leading-relaxed text-base md:text-lg max-w-3xl">
            {t('about.intro')}
          </p>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {HIGHLIGHT_KEYS.map((key) => {
            const Icon = key === 'location' ? MapPin : key === 'quality' ? Sparkles : Shield
            return (
              <div key={key} className="card p-5 md:p-6 text-center hover:border-primary/35 transition-colors">
                <div className="feature-icon-ring mx-auto mb-4 w-12 h-12">
                  <Icon className="w-5 h-5 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                  {t(`about.highlights.${key}Title`)}
                </h3>
                <p className="text-xs text-roma-muted leading-relaxed">{t(`about.highlights.${key}Text`)}</p>
              </div>
            )
          })}
        </div>

        {/* Vision & Mission */}
        <div>
          <div className="text-center mb-10">
            <div className="accent-line mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
              {t('about.visionMissionTitle')}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <article className="card-elevated p-6 md:p-8 border-primary/15 hover:border-primary/30 transition-colors group">
              <div className="flex items-center gap-3 mb-5">
                <div className="feature-icon-ring w-12 h-12">
                  <Target className="w-5 h-5 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="text-lg font-bold text-primary uppercase tracking-widest" style={{ fontFamily: 'var(--font-display)' }}>
                  {t('about.visionLabel')}
                </h3>
              </div>
              <p className="text-roma-muted leading-relaxed text-sm md:text-base">
                {t('about.visionText')}
              </p>
              <div className="w-10 h-0.5 rounded-full bg-roma-border group-hover:w-16 group-hover:bg-primary transition-all duration-500 mt-6" />
            </article>

            <article className="card-elevated p-6 md:p-8 border-primary/15 hover:border-primary/30 transition-colors group">
              <div className="flex items-center gap-3 mb-5">
                <div className="feature-icon-ring w-12 h-12">
                  <Compass className="w-5 h-5 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="text-lg font-bold text-primary uppercase tracking-widest" style={{ fontFamily: 'var(--font-display)' }}>
                  {t('about.missionLabel')}
                </h3>
              </div>
              <p className="text-roma-muted leading-relaxed text-sm md:text-base">
                {t('about.missionText')}
              </p>
              <div className="w-10 h-0.5 rounded-full bg-roma-border group-hover:w-16 group-hover:bg-primary transition-all duration-500 mt-6" />
            </article>
          </div>
        </div>

        {/* Services */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="feature-icon-ring w-11 h-11">
              <Car className="w-5 h-5 text-primary" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide uppercase" style={{ fontFamily: 'var(--font-display)' }}>
                {t('about.servicesTitle')}
              </h2>
              <p className="text-sm text-roma-muted mt-1">{t('about.servicesSubtitle')}</p>
            </div>
          </div>
          <ul className="grid sm:grid-cols-2 gap-4">
            {SERVICE_KEYS.map((key, i) => (
              <li
                key={key}
                className="card p-4 md:p-5 flex gap-3 items-start hover:border-primary/35 hover:shadow-[0_0_20px_rgba(224,38,48,0.08)] transition-all duration-300"
              >
                <span className="text-[10px] font-bold text-primary/80 mt-1 shrink-0 w-5" style={{ fontFamily: 'var(--font-display)' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm md:text-base text-roma-muted leading-relaxed">{t(`about.services.${key}`)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="card-elevated p-8 md:p-10 text-center border-primary/20 bg-[radial-gradient(ellipse_at_center,rgba(224,38,48,0.08),transparent_70%)]">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-3 uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
            {t('about.ctaTitle')}
          </h2>
          <p className="text-sm text-roma-muted mb-6 max-w-md mx-auto">{t('about.ctaSubtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/browse" className="btn-primary py-3 px-8">
              {t('nav.browseCars')}
            </Link>
            <Link to="/contact" className="btn-secondary py-3 px-8">
              {t('nav.contact')}
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}
