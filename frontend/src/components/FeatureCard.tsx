import { Car, FileText, Shield, MapPin, Wrench } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageProvider'

const FEATURE_CONFIG = {
  driver: { icon: Car, accent: 'from-primary/20 to-primary/5' },
  contracts: { icon: FileText, accent: 'from-blue-500/15 to-blue-500/5' },
  insurance: { icon: Shield, accent: 'from-emerald-500/15 to-emerald-500/5' },
  delivery: { icon: MapPin, accent: 'from-amber-500/15 to-amber-500/5' },
  maintenance: { icon: Wrench, accent: 'from-violet-500/15 to-violet-500/5' },
} as const

export type FeatureKey = keyof typeof FEATURE_CONFIG

interface FeatureCardProps {
  featureKey: FeatureKey
  index: number
}

export default function FeatureCard({ featureKey, index }: FeatureCardProps) {
  const { t } = useTranslation()
  const { icon: Icon, accent } = FEATURE_CONFIG[featureKey]

  return (
    <article
      className="feature-card group relative overflow-hidden rounded-2xl border border-roma-border bg-roma-card p-6 md:p-7 transition-all duration-500 hover:border-primary/35 hover:shadow-[0_8px_40px_rgba(224,38,48,0.12)]"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/0 to-transparent group-hover:via-primary/60 transition-all duration-500" />

      <div className="relative flex flex-col items-start gap-5">
        <div className="flex items-center justify-between w-full">
          <div className="feature-icon-ring">
            <Icon className="w-6 h-6 text-primary" strokeWidth={1.75} />
          </div>
          <span
            className="text-[10px] font-bold text-roma-subtle/60 tracking-[0.2em] group-hover:text-primary/70 transition-colors"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>

        <p className="text-base md:text-[1.05rem] font-semibold text-white leading-snug group-hover:text-white transition-colors">
          {t(`home.why.${featureKey}`)}
        </p>

        <div className="w-8 h-0.5 rounded-full bg-roma-border group-hover:w-12 group-hover:bg-primary transition-all duration-500" />
      </div>
    </article>
  )
}

export const FEATURE_KEYS: FeatureKey[] = ['driver', 'contracts', 'insurance', 'delivery', 'maintenance']
