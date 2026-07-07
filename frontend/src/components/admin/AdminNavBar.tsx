import { NavLink } from 'react-router-dom'
import { useTranslation } from '../../i18n/LanguageProvider'
import { adminNavItems } from '../../lib/adminNav'

type AdminNavBarProps = {
  onNavigate?: () => void
  variant?: 'horizontal' | 'sidebar'
}

export default function AdminNavBar({ onNavigate, variant = 'horizontal' }: AdminNavBarProps) {
  const { t } = useTranslation()

  if (variant === 'sidebar') {
    return (
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {adminNavItems.map(({ to, icon: Icon, labelKey, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-[0_0_16px_rgba(224,38,48,0.35)]'
                  : 'text-roma-muted hover:bg-roma-elevated hover:text-white border border-transparent hover:border-roma-border'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2 : 1.75} />
                {t(labelKey)}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    )
  }

  return (
    <nav
      className="sticky top-14 z-20 bg-roma-black/95 backdrop-blur-md border-b border-roma-border"
      aria-label={t('admin.navigation')}
    >
      <div className="overflow-x-auto scrollbar-thin">
        <div className="flex items-center gap-1.5 px-4 sm:px-6 lg:px-8 py-2.5 min-w-max lg:min-w-0 lg:flex-wrap">
          {adminNavItems.map(({ to, icon: Icon, labelKey, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                  isActive
                    ? 'bg-primary text-white shadow-[0_0_12px_rgba(224,38,48,0.3)]'
                    : 'text-roma-muted hover:text-white hover:bg-roma-elevated border border-transparent hover:border-roma-border'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={isActive ? 2 : 1.75} />
                  {t(labelKey)}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
