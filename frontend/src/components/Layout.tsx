import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Logo from './Logo'
import LanguageSwitcher from './LanguageSwitcher'
import Footer from './Footer'
import UserMenu from './UserMenu'
import WhatsAppButton from './WhatsAppButton'
import { useAuth } from '../lib/auth'
import { useTranslation } from '../i18n/LanguageProvider'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated, logout } = useAuth()
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/browse', label: t('nav.browseCars') },
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') },
  ]

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="bg-roma-black/95 backdrop-blur-md border-b border-roma-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[4.5rem] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="sm:hidden p-2 -ms-2 rounded-lg text-roma-muted hover:text-white hover:bg-roma-elevated transition-colors"
              aria-label={t('admin.openMenu')}
              aria-expanded={menuOpen}
            >
              <Menu className="w-5 h-5" />
            </button>
            <Logo height={44} />
          </div>

          <nav className="hidden sm:flex items-center gap-1 sm:gap-2" aria-label={t('nav.main')}>
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to} className="btn-ghost text-sm px-3 py-2">
                {label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <UserMenu />
                <button
                  type="button"
                  onClick={logout}
                  className="text-sm text-roma-muted hover:text-primary font-medium px-2 transition-colors hidden md:inline"
                >
                  {t('common.logout')}
                </button>
              </>
            ) : (
              <Link to="/login" className="btn-primary text-sm px-4 py-2">
                {t('common.login')}
              </Link>
            )}
            <WhatsAppButton variant="compact" labelKey="home.support247" />
            <LanguageSwitcher iconOnly />
          </nav>

          <div className="flex sm:hidden items-center gap-1 shrink-0">
            <WhatsAppButton variant="compact" iconOnly />
            {isAuthenticated ? <UserMenu /> : (
              <Link to="/login" className="btn-primary text-xs px-3 py-2">
                {t('common.login')}
              </Link>
            )}
            <LanguageSwitcher iconOnly />
          </div>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
      </header>

      {menuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 bg-black/60 z-[60] sm:hidden"
            onClick={closeMenu}
            aria-label={t('admin.closeMenu')}
          />
          <aside
            className="fixed inset-y-0 start-0 z-[70] w-72 max-w-[85vw] bg-roma-black border-e border-roma-border flex flex-col sm:hidden animate-in slide-in-from-start duration-200"
            aria-label={t('nav.main')}
          >
            <div className="flex items-center justify-between p-4 border-b border-roma-border">
              <Logo height={36} />
              <button
                type="button"
                onClick={closeMenu}
                className="p-2 rounded-lg text-roma-muted hover:text-white hover:bg-roma-elevated"
                aria-label={t('admin.closeMenu')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={closeMenu}
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-roma-muted hover:text-white hover:bg-roma-elevated transition-colors"
                >
                  {label}
                </Link>
              ))}
              {isAuthenticated && (
                <>
                  <Link to="/profile" onClick={closeMenu} className="block px-4 py-3 rounded-xl text-sm font-medium text-roma-muted hover:text-white hover:bg-roma-elevated transition-colors">
                    {t('nav.profile')}
                  </Link>
                  <Link to="/my-bookings" onClick={closeMenu} className="block px-4 py-3 rounded-xl text-sm font-medium text-roma-muted hover:text-white hover:bg-roma-elevated transition-colors">
                    {t('nav.myBookings')}
                  </Link>
                </>
              )}
            </nav>
            <div className="p-4 border-t border-roma-border space-y-3">
              <WhatsAppButton className="w-full justify-center py-2.5" labelKey="home.support247" />
              {isAuthenticated ? (
                <button type="button" onClick={() => { logout(); closeMenu() }} className="btn-secondary w-full py-2.5 text-sm">
                  {t('common.logout')}
                </button>
              ) : (
                <Link to="/login" onClick={closeMenu} className="btn-primary w-full py-2.5 text-sm text-center">
                  {t('common.login')}
                </Link>
              )}
            </div>
          </aside>
        </>
      )}

      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
