import { useEffect, useRef } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageProvider'

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'warning' | 'info'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'warning',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onCancel()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    cancelRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onCancel, loading])

  if (!open) return null

  const iconBg = variant === 'warning' ? 'bg-amber-950/60 border-amber-800/50' : 'bg-emerald-950/60 border-emerald-800/50'
  const iconColor = variant === 'warning' ? 'text-amber-400' : 'text-emerald-400'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => !loading && onCancel()}
        aria-hidden
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        tabIndex={-1}
        className="relative w-full max-w-md card-elevated p-6 animate-in fade-in zoom-in duration-200 outline-none"
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="absolute top-4 end-4 text-roma-muted hover:text-white transition-colors"
          aria-label={t('common.close')}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-start gap-4">
          <div className={`shrink-0 p-3 rounded-full border ${iconBg}`}>
            <AlertTriangle className={`w-7 h-7 ${iconColor}`} />
          </div>
          <div className="flex-1">
            <h2 id="confirm-modal-title" className="text-lg font-bold text-white tracking-wide mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              {title}
            </h2>
            <p className="text-sm text-roma-muted leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={loading} className="btn-secondary flex-1 py-2.5 text-sm">
            {cancelLabel ?? t('common.goBack')}
          </button>
          <button type="button" onClick={onConfirm} disabled={loading} className="btn-primary flex-1 py-2.5 text-sm">
            {loading ? t('common.processing') : (confirmLabel ?? t('common.continue'))}
          </button>
        </div>
      </div>
    </div>
  )
}
