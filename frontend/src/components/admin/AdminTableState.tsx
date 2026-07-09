import { Loader2, Inbox, AlertTriangle } from 'lucide-react'
import { useTranslation } from '../../i18n/LanguageProvider'

type AdminTableStateProps = {
  colSpan: number
  loading?: boolean
  error?: string | null
  empty?: boolean
  emptyMessage?: string
  onRetry?: () => void
}

export default function AdminTableState({
  colSpan,
  loading,
  error,
  empty,
  emptyMessage,
  onRetry,
}: AdminTableStateProps) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <tr>
        <td colSpan={colSpan} className="py-16 text-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-2" aria-hidden />
          <p className="text-sm text-roma-muted">{t('common.loading')}</p>
        </td>
      </tr>
    )
  }

  if (error) {
    return (
      <tr>
        <td colSpan={colSpan} className="py-12 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" aria-hidden />
          <p className="text-sm text-roma-muted mb-3">{error}</p>
          {onRetry && (
            <button type="button" onClick={onRetry} className="btn-secondary text-sm px-4 py-2">
              {t('common.retry')}
            </button>
          )}
        </td>
      </tr>
    )
  }

  if (empty) {
    return (
      <tr>
        <td colSpan={colSpan} className="py-16 text-center">
          <Inbox className="w-8 h-8 text-roma-subtle mx-auto mb-3" aria-hidden />
          <p className="text-sm text-roma-muted">{emptyMessage ?? t('common.noRecords')}</p>
        </td>
      </tr>
    )
  }

  return null
}
