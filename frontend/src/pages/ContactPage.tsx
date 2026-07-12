import { Link } from 'react-router-dom'
import { Phone, MessageCircle, MapPin, Clock, ArrowUpRight, type LucideIcon } from 'lucide-react'
import Layout from '../components/Layout'
import Logo from '../components/Logo'
import ContactMessageForm from '../components/ContactMessageForm'
import {
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_DIAL,
  CONTACT_INSTAGRAM_HANDLE,
  CONTACT_INSTAGRAM_URL,
  openWhatsApp,
  whatsappUrl,
} from '../lib/contact'
import { useTranslation } from '../i18n/LanguageProvider'
import { HERO_SLIDE_IMAGES } from '../lib/heroSlides'

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

function renderChannelIcon(
  key: string,
  Icon: LucideIcon | typeof InstagramIcon,
  accent: 'primary' | 'whatsapp',
) {
  const className = `w-5 h-5 ${accent === 'whatsapp' ? 'text-[#25D366]' : 'text-primary'}`
  if (key === 'instagram') return <InstagramIcon className={className} />
  const Lucide = Icon as LucideIcon
  return <Lucide className={className} strokeWidth={1.75} />
}

export default function ContactPage() {
  const { t } = useTranslation()
  const waMessage = t('common.whatsappInquiry')
  const waLink = whatsappUrl(waMessage)
  const heroImage = HERO_SLIDE_IMAGES[0] || '/image/slide.jpg'

  const channels: {
    key: string
    href: string
    external: boolean
    icon: LucideIcon | typeof InstagramIcon
    label: string
    value: string
    hint: string
    accent: 'primary' | 'whatsapp'
  }[] = [
    {
      key: 'phone',
      href: `tel:${CONTACT_PHONE_DIAL}`,
      external: false,
      icon: Phone,
      label: t('common.phone'),
      value: CONTACT_PHONE_DISPLAY,
      hint: t('contact.tapToCall'),
      accent: 'primary' as const,
    },
    {
      key: 'whatsapp',
      href: waLink,
      external: true,
      icon: MessageCircle,
      label: t('contact.whatsappChannel'),
      value: CONTACT_PHONE_DISPLAY,
      hint: t('contact.whatsappHint'),
      accent: 'whatsapp' as const,
    },
    {
      key: 'instagram',
      href: CONTACT_INSTAGRAM_URL,
      external: true,
      icon: InstagramIcon,
      label: 'Instagram',
      value: CONTACT_INSTAGRAM_HANDLE,
      hint: t('contact.followUs'),
      accent: 'primary' as const,
    },
  ]

  return (
    <Layout>
      {/* Hero */}
      <section className="relative min-h-[300px] md:min-h-[360px] flex items-end overflow-hidden border-b border-roma-border">
        <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-roma-black via-roma-black/80 to-roma-black/50" />
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 md:pb-14 pt-28">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="accent-line mb-4" />
              <h1 className="text-3xl md:text-5xl font-bold text-white tracking-wide uppercase" style={{ fontFamily: 'var(--font-display)' }}>
                {t('contact.title')}
              </h1>
              <p className="text-roma-muted mt-3 max-w-xl text-base md:text-lg leading-relaxed">
                {t('contact.heroSubtitle')}
              </p>
            </div>
            <Logo height={48} to={false} className="hidden md:block shrink-0 opacity-90" />
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20 space-y-14 md:space-y-16">
        {/* Contact channels */}
        <div>
          <div className="text-center mb-10">
            <div className="accent-line mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
              {t('contact.channelsTitle')}
            </h2>
            <p className="text-sm text-roma-muted mt-2 max-w-lg mx-auto">{t('contact.channelsSubtitle')}</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {channels.map(({ key, href, external, icon: Icon, label, value, hint, accent }) => (
              <a
                key={key}
                href={href}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                onClick={key === 'whatsapp' ? (e) => { e.preventDefault(); openWhatsApp(waMessage) } : undefined}
                className="card-elevated p-5 md:p-6 group hover:border-primary/35 transition-all duration-300 hover:shadow-[0_0_24px_rgba(224,38,48,0.1)] relative overflow-hidden"
              >
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div
                    className={`feature-icon-ring w-12 h-12 ${
                      accent === 'whatsapp' ? 'border-[#25D366]/30 bg-[#25D366]/10' : ''
                    }`}
                  >
                    {renderChannelIcon(key, Icon, accent)}
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-roma-subtle group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-roma-subtle mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                  {label}
                </p>
                <p className="text-lg md:text-xl font-bold text-white tracking-wide" style={{ fontFamily: 'var(--font-display)' }} dir="ltr">
                  {value}
                </p>
                <p className="text-xs text-roma-muted mt-2">{hint}</p>
              </a>
            ))}
          </div>
        </div>

        {/* Form + info */}
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-10 items-start">
          <aside className="lg:col-span-2 space-y-5">
            <div className="card-elevated p-6 md:p-7 border-primary/15">
              <div className="flex items-center gap-3 mb-4">
                <div className="feature-icon-ring w-11 h-11">
                  <MapPin className="w-5 h-5 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
                  {t('contact.locationTitle')}
                </h3>
              </div>
              <p className="text-sm text-roma-muted leading-relaxed">{t('contact.locationText')}</p>
            </div>

            <div className="card p-6 md:p-7">
              <div className="flex items-center gap-3 mb-4">
                <div className="feature-icon-ring w-11 h-11">
                  <Clock className="w-5 h-5 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
                  {t('contact.hoursTitle')}
                </h3>
              </div>
              <p className="text-sm text-roma-muted leading-relaxed">{t('contact.hoursText')}</p>
            </div>

            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault()
                openWhatsApp(waMessage)
              }}
              className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-lg text-sm font-semibold text-white bg-[#25D366] hover:bg-[#1fb855] transition-colors shadow-[0_4px_20px_rgba(37,211,102,0.25)]"
            >
              <MessageCircle className="w-5 h-5" />
              {t('contact.contactWhatsApp')}
            </a>
          </aside>

          <div className="lg:col-span-3">
            <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
                {t('contact.form.title')}
              </h2>
              <p className="text-sm text-roma-muted mt-2">{t('contact.formSubtitle')}</p>
            </div>
            <ContactMessageForm embedded />
          </div>
        </div>

        {/* CTA */}
        <div className="card-elevated p-8 md:p-10 text-center border-primary/20 bg-[radial-gradient(ellipse_at_center,rgba(224,38,48,0.08),transparent_70%)]">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-3 uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
            {t('contact.ctaTitle')}
          </h2>
          <p className="text-sm text-roma-muted mb-6 max-w-md mx-auto">{t('contact.ctaSubtitle')}</p>
          <Link to="/browse" className="btn-primary py-3 px-8 inline-flex">
            {t('nav.browseCars')}
          </Link>
        </div>
      </div>
    </Layout>
  )
}
