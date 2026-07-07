import { useState } from 'react'

import { Outlet, useNavigate, useLocation } from 'react-router-dom'

import { LogOut, Menu, X } from 'lucide-react'

import Logo from '../../components/Logo'

import LanguageSwitcher from '../../components/LanguageSwitcher'

import AdminNavBar from '../../components/admin/AdminNavBar'

import { useTranslation } from '../../i18n/LanguageProvider'

import { getActiveAdminNavItem } from '../../lib/adminNav'



export default function AdminLayout() {

  const { t } = useTranslation()

  const navigate = useNavigate()

  const location = useLocation()

  const [sidebarOpen, setSidebarOpen] = useState(false)



  const currentItem = getActiveAdminNavItem(location.pathname)



  const logout = () => {

    localStorage.removeItem('admin_token')

    localStorage.removeItem('admin')

    navigate('/admin/login')

  }



  const sidebarContent = (

    <>

      <div className="p-5 border-b border-roma-border">

        <Logo height={38} to="/admin" />

        <p className="text-[10px] text-roma-subtle mt-2.5 uppercase tracking-[0.2em] font-bold" style={{ fontFamily: 'var(--font-display)' }}>

          {t('admin.panel')}

        </p>

      </div>

      <AdminNavBar variant="sidebar" onNavigate={() => setSidebarOpen(false)} />

    </>

  )



  return (

    <div className="min-h-screen flex bg-roma-black">

      {sidebarOpen && (

        <button

          type="button"

          className="fixed inset-0 bg-black/60 z-40 lg:hidden"

          onClick={() => setSidebarOpen(false)}

          aria-label={t('admin.closeMenu')}

        />

      )}



      <aside

        className={`fixed lg:static inset-y-0 start-0 z-50 w-64 bg-roma-black border-e border-roma-border flex flex-col transform transition-transform duration-300 lg:translate-x-0 ${

          sidebarOpen ? 'translate-x-0' : 'max-lg:-translate-x-full max-lg:rtl:translate-x-full'

        }`}

      >

        <button

          type="button"

          onClick={() => setSidebarOpen(false)}

          className="lg:hidden absolute top-4 end-4 p-1.5 text-roma-muted hover:text-white"

          aria-label={t('admin.closeMenu')}

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

                aria-label={t('admin.openMenu')}

              >

                <Menu className="w-5 h-5" />

              </button>

              <p className="text-sm font-semibold text-white truncate uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>

                {currentItem ? t(currentItem.labelKey) : t('admin.panel')}

              </p>

            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">

              <LanguageSwitcher compact />

              <button

                type="button"

                onClick={logout}

                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm text-roma-muted hover:text-primary hover:bg-red-950/20 border border-transparent hover:border-red-900/30 transition-colors"

              >

                <LogOut className="w-4 h-4" />

                <span className="hidden sm:inline">{t('common.logout')}</span>

              </button>

            </div>

          </div>

        </header>



        <AdminNavBar />



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


