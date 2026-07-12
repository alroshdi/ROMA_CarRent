import { MessageCircle } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageProvider'
import { openWhatsApp, whatsappUrl } from '../lib/contact'

type WhatsAppButtonProps = {
  messageKey?: string
  message?: string
  messageParams?: Record<string, string | number>
  labelKey?: string
  className?: string
  iconOnly?: boolean
  variant?: 'solid' | 'compact'
}

export default function WhatsAppButton({
  messageKey = 'common.whatsappInquiry',
  message,
  messageParams,
  labelKey = 'contact.contactWhatsApp',
  className = '',
  iconOnly = false,
  variant = 'solid',
}: WhatsAppButtonProps) {
  const { t } = useTranslation()
  const text = message ?? t(messageKey, messageParams)
  const href = whatsappUrl(text)

  const baseClass = variant === 'compact'
    ? 'inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm text-white bg-[#25D366] hover:bg-[#1fb855] px-2.5 sm:px-3 py-2 rounded-lg font-medium transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/60'
    : 'inline-flex items-center justify-center gap-2 py-3 px-6 rounded-lg text-sm font-semibold text-white bg-[#25D366] hover:bg-[#1fb855] transition-colors shadow-[0_4px_20px_rgba(37,211,102,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/60'

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={iconOnly ? t('common.whatsappSupport') : undefined}
      onClick={(e) => {
        e.preventDefault()
        openWhatsApp(text)
      }}
      className={`${baseClass} ${className}`.trim()}
    >
      <MessageCircle className="w-4 h-4 shrink-0" />
      {!iconOnly && t(labelKey)}
    </a>
  )
}
