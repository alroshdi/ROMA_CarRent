import { MessageCircle } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageProvider'
import { openWhatsApp, whatsappUrl } from '../lib/contact'
import {
  BOOKING_LOCATION_KEYS,
  type BookingLocationKey,
} from '../lib/bookingLocations'

type BookingLocationFieldProps = {
  id: string
  label: string
  selectKey: BookingLocationKey | ''
  customText: string
  onSelectKeyChange: (key: BookingLocationKey | '') => void
  onCustomTextChange: (text: string) => void
  purpose: 'pickup' | 'dropoff'
}

export default function BookingLocationField({
  id,
  label,
  selectKey,
  customText,
  onSelectKeyChange,
  onCustomTextChange,
  purpose,
}: BookingLocationFieldProps) {
  const { t } = useTranslation()

  const waMessage = t(purpose === 'pickup' ? 'booking.locations.homeWhatsAppPickup' : 'booking.locations.homeWhatsAppDropoff')
  const waLink = whatsappUrl(waMessage)

  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <select
        id={id}
        value={selectKey}
        onChange={(e) => {
          onSelectKeyChange(e.target.value as BookingLocationKey | '')
          onCustomTextChange('')
        }}
        className="input cursor-pointer"
        required
      >
        <option value="">{t('booking.selectLocation')}</option>
        {BOOKING_LOCATION_KEYS.map((key) => (
          <option key={key} value={key}>
            {t(`booking.locations.${key}`)}
          </option>
        ))}
      </select>

      {selectKey === 'hotel' && (
        <input
          type="text"
          value={customText}
          onChange={(e) => onCustomTextChange(e.target.value)}
          placeholder={t('booking.locations.hotelNamePlaceholder')}
          className="input mt-3"
          required
        />
      )}

      {selectKey === 'other' && (
        <input
          type="text"
          value={customText}
          onChange={(e) => onCustomTextChange(e.target.value)}
          placeholder={t('booking.otherLocationPlaceholder')}
          className="input mt-3"
          required
        />
      )}

      {selectKey === 'home_salalah' && (
        <div className="mt-3 rounded-lg border border-[#25D366]/30 bg-[#25D366]/10 p-3">
          <p className="text-xs text-roma-muted leading-relaxed mb-3">{t('booking.locations.homeHint')}</p>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault()
              openWhatsApp(waMessage)
            }}
            className="inline-flex items-center gap-2 text-sm font-medium text-white bg-[#25D366] hover:bg-[#1fb855] px-3 py-2 rounded-lg transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            {t('booking.locations.sendLocationWhatsApp')}
          </a>
        </div>
      )}
    </div>
  )
}
