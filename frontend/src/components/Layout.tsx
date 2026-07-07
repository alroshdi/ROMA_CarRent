import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import Logo from './Logo'
import LanguageSwitcher from './LanguageSwitcher'
import Footer from './Footer'
import UserMenu from './UserMenu'
import { useAuth } from '../lib/auth'
import { useTranslation } from '../i18n/LanguageProvider'
import { whatsappUrl } from '../lib/contact'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated, logout } = useAuth()
  const { t } = useTranslation()

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="bg-roma-black/95 backdrop-blur-md border-b border-roma-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[4.5rem] flex items-center justify-between">
          <Logo height={44} />
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link to="/" className="btn-ghost text-sm px-3 py-2 hidden sm:inline-flex">{t('nav.home')}</Link>
            <Link to="/browse" className="btn-ghost text-sm px-3 py-2 hidden sm:inline-flex">{t('nav.browseCars')}</Link>
            <Link to="/about" className="btn-ghost text-sm px-3 py-2 hidden md:inline-flex">{t('nav.about')}</Link>
            <Link to="/contact" className="btn-ghost text-sm px-3 py-2 hidden sm:inline-flex">{t('nav.contact')}</Link>
            {isAuthenticated ? (
              <>
                <UserMenu />
                <button onClick={logout} className="text-sm text-roma-muted hover:text-primary font-medium px-2 transition-colors hidden sm:inline">
                  {t('common.logout')}
                </button>
              </>
            ) : (
              <Link to="/login" className="btn-primary text-sm px-4 py-2">
                {t('common.login')}
              </Link>
            )}
            <a
              href={whatsappUrl(t('common.whatsappInquiry'))}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-white bg-[#25D366] hover:bg-[#1fb855] px-3 py-2 rounded-lg font-medium transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">{t('common.contact')}</span>
            </a>
            <LanguageSwitcher iconOnly />
          </nav>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
      </header>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
