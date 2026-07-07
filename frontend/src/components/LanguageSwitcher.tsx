import { useTranslation } from '../i18n/LanguageProvider'

interface LanguageSwitcherProps {
  compact?: boolean
  iconOnly?: boolean
}

export default function LanguageSwitcher({ compact = false, iconOnly = false }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useTranslation()

  const toggle = () => setLocale(locale === 'en' ? 'ar' : 'en')
  const target = locale === 'en' ? 'AR' : 'EN'

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={toggle}
        className="ms-1 shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-lg border border-roma-border bg-roma-elevated text-xs font-bold text-primary hover:border-primary hover:bg-primary/10 transition-colors"
        aria-label={t('common.language')}
        title={locale === 'en' ? t('common.arabic') : t('common.english')}
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {target}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-1.5 text-sm text-roma-muted hover:text-white px-2 py-2 rounded-lg transition-colors border border-transparent hover:border-roma-border"
      aria-label={t('common.language')}
      title={t('common.language')}
    >
      {!compact && (
        <span className="hidden sm:inline font-medium">
          {locale === 'en' ? t('common.arabic') : t('common.english')}
        </span>
      )}
      <span className="text-xs uppercase tracking-wide font-semibold text-primary" style={{ fontFamily: 'var(--font-display)' }}>
        {target}
      </span>
    </button>
  )
}
