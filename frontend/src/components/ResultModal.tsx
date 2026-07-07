import { useEffect } from 'react'
import { CheckCircle, AlertTriangle, X } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageProvider'

interface ResultModalProps {
  open: boolean
  title: string
  message: string
  variant?: 'success' | 'warning' | 'info'
  onClose: () => void
}

export default function ResultModal({
  open,
  title,
  message,
  variant = 'success',
  onClose,
}: ResultModalProps) {
  const { t } = useTranslation()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const styles = {
    success: { bg: 'bg-emerald-950/60 border-emerald-800/50', icon: 'text-emerald-400' },
    warning: { bg: 'bg-amber-950/60 border-amber-800/50', icon: 'text-amber-400' },
    info: { bg: 'bg-blue-950/60 border-blue-800/50', icon: 'text-blue-400' },
  }[variant]

  const Icon = variant === 'warning' ? AlertTriangle : CheckCircle

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div role="dialog" aria-modal="true" className="relative w-full max-w-md card-elevated p-6">
        <button type="button" onClick={onClose} className="absolute top-4 end-4 text-roma-muted hover:text-white transition-colors" aria-label={t('common.close')}>
          <X className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-start gap-4">
          <div className={`shrink-0 p-3 rounded-full border ${styles.bg}`}>
            <Icon className={`w-7 h-7 ${styles.icon}`} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white tracking-wide mb-2" style={{ fontFamily: 'var(--font-display)' }}>{title}</h2>
            <p className="text-sm text-roma-muted leading-relaxed">{message}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="btn-primary w-full mt-6 py-2.5 text-sm">{t('common.ok')}</button>
      </div>
    </div>
  )
}
