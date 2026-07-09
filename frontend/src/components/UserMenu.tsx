import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { User, ChevronDown, ClipboardList } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useTranslation } from '../i18n/LanguageProvider'

export default function UserMenu() {
  const { customer } = useAuth()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const items = [
    { to: '/profile', icon: User, label: t('nav.profile') },
    { to: '/my-bookings', icon: ClipboardList, label: t('nav.myBookings') },
  ]

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm text-roma-muted hover:text-white hover:bg-roma-elevated border border-transparent hover:border-roma-border transition-colors"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t('nav.account')}
      >
        <User className="w-4 h-4 text-primary shrink-0" />
        <span className="hidden sm:inline max-w-[7rem] truncate">{customer?.name}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute top-full end-0 mt-1.5 min-w-[11rem] py-1 rounded-lg border border-roma-border bg-roma-card shadow-[0_8px_32px_rgba(0,0,0,0.55)] z-50 overflow-hidden"
          role="menu"
        >
          <div className="px-3 py-2 border-b border-roma-border sm:hidden">
            <p className="text-xs text-roma-subtle uppercase tracking-wide">{t('nav.account')}</p>
            <p className="text-sm font-medium text-white truncate">{customer?.name}</p>
          </div>
          {items.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-roma-muted hover:text-white hover:bg-roma-elevated transition-colors"
            >
              <Icon className="w-4 h-4 text-primary shrink-0" />
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
