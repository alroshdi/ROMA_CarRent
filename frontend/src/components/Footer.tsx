import { Link } from 'react-router-dom'
import { Phone, MessageCircle, MapPin } from 'lucide-react'
import Logo from './Logo'
import {
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_DIAL,
  CONTACT_INSTAGRAM_HANDLE,
  CONTACT_INSTAGRAM_URL,
  whatsappUrl,
} from '../lib/contact'
import { useAuth } from '../lib/auth'
import { useTranslation } from '../i18n/LanguageProvider'

export default function Footer() {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuth()
  const waLink = whatsappUrl(t('common.whatsappInquiry'))

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/browse', label: t('nav.browseCars') },
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') },
    ...(isAuthenticated
      ? [{ to: '/my-bookings', label: t('nav.myBookings') }]
      : [{ to: '/login', label: t('common.login') }]),
  ]

  return (
    <footer className="mt-auto bg-roma-black border-t border-roma-border">
      <div className="h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-4">
            <Logo height={40} to="/" />
            <p className="text-sm text-roma-muted mt-4 leading-relaxed max-w-xs">
              {t('footer.tagline')}
            </p>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-5 text-sm font-medium text-white bg-[#25D366] hover:bg-[#1fb855] px-4 py-2.5 rounded-lg transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              {t('footer.chatWhatsApp')}
            </a>
          </div>

          {/* Quick links */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em] mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              {t('footer.quickLinks')}
            </h3>
            <ul className="space-y-2.5">
              {navLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm text-roma-muted hover:text-primary transition-colors inline-flex items-center gap-1 group"
                  >
                    <span className="w-0 group-hover:w-2 h-px bg-primary transition-all duration-200" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-5">
            <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em] mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              {t('footer.contactUs')}
            </h3>
            <ul className="space-y-4">
              <li>
                <a
                  href={`tel:${CONTACT_PHONE_DIAL}`}
                  className="flex items-start gap-3 text-sm text-roma-muted hover:text-white transition-colors group"
                >
                  <span className="p-2 rounded-lg bg-roma-elevated border border-roma-border group-hover:border-primary/40 transition-colors shrink-0">
                    <Phone className="w-4 h-4 text-primary" />
                  </span>
                  <span>
                    <span className="block text-xs text-roma-subtle mb-0.5">{t('common.phone')}</span>
                    <span className="text-white font-medium" dir="ltr">{CONTACT_PHONE_DISPLAY}</span>
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={CONTACT_INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 text-sm text-roma-muted hover:text-white transition-colors group"
                >
                  <span className="p-2 rounded-lg bg-roma-elevated border border-roma-border group-hover:border-primary/40 transition-colors shrink-0">
                    <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </span>
                  <span>
                    <span className="block text-xs text-roma-subtle mb-0.5">Instagram</span>
                    <span className="text-white font-medium" dir="ltr">{CONTACT_INSTAGRAM_HANDLE}</span>
                  </span>
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-roma-muted">
                <span className="p-2 rounded-lg bg-roma-elevated border border-roma-border shrink-0">
                  <MapPin className="w-4 h-4 text-primary" />
                </span>
                <span>
                  <span className="block text-xs text-roma-subtle mb-0.5">{t('footer.location')}</span>
                  <span className="text-white">{t('footer.locationValue')}</span>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-roma-border bg-roma-black/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-center sm:text-start">
          <p className="text-xs text-roma-subtle">
            &copy; {new Date().getFullYear()} {t('common.brandName')}. {t('common.allRightsReserved')}
          </p>
          <p className="text-xs text-roma-subtle">{t('footer.serving')}</p>
        </div>
      </div>
    </footer>
  )
}
