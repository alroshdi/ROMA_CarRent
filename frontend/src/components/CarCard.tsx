import { Link } from 'react-router-dom'
import { Users, Fuel, Settings, ArrowUpRight, CheckCircle2 } from 'lucide-react'
import type { Car } from '../types'
import { useTranslation } from '../i18n/LanguageProvider'
import { fuelLabelKey, transmissionLabelKey } from '../lib/carOptions'

interface CarCardProps {
  car: Car
  pickupDate?: string
  returnDate?: string
  featured?: boolean
}

export default function CarCard({ car, pickupDate, returnDate, featured = false }: CarCardProps) {
  const { t, dir } = useTranslation()
  const image = car.images?.[0] || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=250&fit=crop'
  const features = car.features || {}
  const bookUrl = pickupDate && returnDate
    ? `/book/${car.id}?pickup=${pickupDate}&return=${returnDate}`
    : `/book/${car.id}`

  return (
    <article className="card-elevated group hover:border-primary/35 hover:shadow-[0_0_32px_rgba(224,38,48,0.12)] transition-all duration-300 relative overflow-hidden flex flex-col h-full">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />

      <div className={`overflow-hidden bg-roma-dark relative shrink-0 ${featured ? 'aspect-[16/11]' : 'aspect-[16/10]'}`}>
        <img
          src={image}
          alt={car.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-roma-black via-roma-black/30 to-transparent" />

        <div className="absolute top-3 start-3 end-3 flex items-start justify-between gap-2">
          {featured ? (
            <span className="badge bg-primary/90 text-white border-0 text-[10px]">
              {t('home.slider.featured')}
            </span>
          ) : (
            <span className="badge bg-roma-black/70 text-emerald-300 border border-emerald-500/30 text-[10px] backdrop-blur-sm">
              <CheckCircle2 className="w-3 h-3 inline me-1 -mt-0.5" />
              {t('browse.available')}
            </span>
          )}
          <span className="badge bg-roma-black/70 text-white border border-white/10 text-[10px] backdrop-blur-sm">
            {car.brand}
          </span>
        </div>

        <div className="absolute bottom-3 start-3 end-3">
          <p className="text-white font-bold text-xl drop-shadow-lg" style={{ fontFamily: 'var(--font-display)' }}>
            {parseFloat(car.daily_price).toFixed(2)}
            <span className="text-sm font-normal text-roma-muted ms-1.5">{t('common.omrPerDay')}</span>
          </p>
        </div>
      </div>

      <div className="p-5 md:p-6 flex flex-col flex-1">
        <div className="mb-4">
          <h3 className="font-bold text-lg text-white tracking-wide group-hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-display)' }}>
            {car.name}
          </h3>
          <p className="text-sm text-roma-muted mt-0.5">{car.brand} {car.model}</p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-roma-muted mb-5">
          {features.seats && (
            <span className="flex items-center gap-1.5 bg-roma-dark px-2.5 py-1.5 rounded-lg border border-roma-border">
              <Users className="w-3.5 h-3.5 text-primary shrink-0" />
              {t('common.seats', { count: features.seats })}
            </span>
          )}
          {features.transmission && (
            <span className="flex items-center gap-1.5 bg-roma-dark px-2.5 py-1.5 rounded-lg border border-roma-border">
              <Settings className="w-3.5 h-3.5 text-primary shrink-0" />
              {t(transmissionLabelKey(String(features.transmission)))}
            </span>
          )}
          {features.fuel && (
            <span className="flex items-center gap-1.5 bg-roma-dark px-2.5 py-1.5 rounded-lg border border-roma-border">
              <Fuel className="w-3.5 h-3.5 text-primary shrink-0" />
              {t(fuelLabelKey(String(features.fuel)))}
            </span>
          )}
        </div>

        <Link
          to={bookUrl}
          className="btn-primary w-full py-3 text-sm mt-auto group/btn justify-center"
        >
          {t('car.bookNow')}
          <ArrowUpRight className={`w-4 h-4 transition-transform ${dir === 'rtl' ? 'group-hover/btn:-translate-x-0.5 group-hover/btn:-translate-y-0.5' : 'group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5'}`} />
        </Link>
      </div>
    </article>
  )
}
