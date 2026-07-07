import { useState } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Car, Users, Calendar, FileText, CreditCard, LogOut, UserCircle, Settings, Menu, X, ExternalLink } from 'lucide-react'
import Logo from '../../components/Logo'
import LanguageSwitcher from '../../components/LanguageSwitcher'
import { useTranslation } from '../../i18n/LanguageProvider'

export default function AdminLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, labelKey: 'admin.dashboard', end: true },
    { to: '/admin/cars', icon: Car, labelKey: 'admin.cars' },
    { to: '/admin/drivers', icon: UserCircle, labelKey: 'admin.drivers' },
    { to: '/admin/customers', icon: Users, labelKey: 'admin.customers' },
    { to: '/admin/bookings', icon: Calendar, labelKey: 'admin.bookings' },
    { to: '/admin/templates', icon: FileText, labelKey: 'admin.templates' },
    { to: '/admin/payments', icon: CreditCard, labelKey: 'admin.payments' },
    { to: '/admin/settings', icon: Settings, labelKey: 'admin.settings' },
  ]

  const currentItem = navItems.find(({ to, end }) => (end ? location.pathname === to : location.pathname.startsWith(to)))

  const logout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin')
    navigate('/admin/login')
  }

  const navLink = (to: string, icon: typeof LayoutDashboard, label: string, end?: boolean) => {
    const active = end ? location.pathname === to : location.pathname.startsWith(to)
    const Icon = icon
    return (
      <Link
        key={to}
        to={to}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          active
            ? 'bg-primary text-white shadow-[0_0_16px_rgba(224,38,48,0.35)]'
            : 'text-roma-muted hover:bg-roma-elevated hover:text-white border border-transparent hover:border-roma-border'
        }`}
      >
        <Icon className="w-5 h-5 shrink-0" strokeWidth={active ? 2 : 1.75} />
        {label}
      </Link>
    )
  }

  const sidebarContent = (
    <>
      <div className="p-5 border-b border-roma-border">
        <Logo height={38} to="/admin" />
        <p className="text-[10px] text-roma-subtle mt-2.5 uppercase tracking-[0.2em] font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          {t('admin.panel')}
        </p>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon, labelKey, end }) => navLink(to, icon, t(labelKey), end))}
      </nav>
      <div className="p-3 border-t border-roma-border space-y-2">
        <LanguageSwitcher compact />
        <Link
          to="/"
          target="_blank"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-roma-muted hover:text-white hover:bg-roma-elevated transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          {t('admin.viewSite')}
        </Link>
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-roma-muted hover:text-primary hover:bg-red-950/20 border border-transparent hover:border-red-900/30 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          {t('common.logout')}
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen flex bg-roma-black">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 start-0 z-50 w-64 bg-roma-black border-e border-roma-border flex flex-col transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'
        }`}
      >
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden absolute top-4 end-4 p-1.5 text-roma-muted hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-roma-black/90 backdrop-blur-md border-b border-roma-border">
          <div className="h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
          <div className="px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-roma-muted hover:text-white hover:bg-roma-elevated"
              >
                <Menu className="w-5 h-5" />
              </button>
              <p className="text-sm font-semibold text-white truncate uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
                {currentItem ? t(currentItem.labelKey) : t('admin.panel')}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline text-xs text-roma-subtle uppercase tracking-wider">{t('admin.panel')}</span>
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" title="Online" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(224,38,48,0.04),transparent_50%)] pointer-events-none" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
