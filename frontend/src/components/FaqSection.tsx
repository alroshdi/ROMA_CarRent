import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageProvider'

export const FAQ_KEYS = [
  'howToBook',
  'driverOption',
  'documents',
  'locations',
  'payment',
  'cancellation',
  'deposit',
  'support',
] as const

export type FaqKey = (typeof FAQ_KEYS)[number]

export default function FaqSection() {
  const { t } = useTranslation()
  const [openKey, setOpenKey] = useState<FaqKey | null>(FAQ_KEYS[0])

  const toggle = (key: FaqKey) => {
    setOpenKey((current) => (current === key ? null : key))
  }

  return (
    <section id="faq" className="relative border-t border-roma-border overflow-hidden bg-roma-black">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(224,38,48,0.07),transparent_65%)] pointer-events-none" />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-10 md:mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/25 mb-4">
            <HelpCircle className="w-6 h-6 text-primary" strokeWidth={1.75} />
          </div>
          <div className="accent-line mx-auto mb-4" />
          <h2
            className="text-2xl md:text-3xl font-bold text-white tracking-wide uppercase"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('home.faq.title')}
          </h2>
          <p className="text-sm text-roma-muted mt-3 leading-relaxed max-w-xl mx-auto">{t('home.faq.subtitle')}</p>
        </div>

        <div className="space-y-3">
          {FAQ_KEYS.map((key, index) => {
            const isOpen = openKey === key
            return (
              <article
                key={key}
                className={`rounded-2xl border transition-all duration-300 ${
                  isOpen
                    ? 'border-primary/35 bg-roma-card shadow-[0_8px_32px_rgba(224,38,48,0.08)]'
                    : 'border-roma-border bg-roma-card/60 hover:border-primary/20'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(key)}
                  className="flex w-full items-start gap-4 px-5 py-4 md:px-6 md:py-5 text-start"
                  aria-expanded={isOpen}
                >
                  <span
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-roma-dark text-[11px] font-bold text-primary border border-roma-border"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm md:text-base font-semibold text-white leading-snug pe-2">
                      {t(`home.faq.${key}.q`)}
                    </span>
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 text-roma-muted transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`}
                    strokeWidth={1.75}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 md:px-6 md:pb-6 ps-[4.25rem] md:ps-[4.75rem] text-sm text-roma-muted leading-relaxed border-t border-roma-border/50 pt-4">
                      {t(`home.faq.${key}.a`)}
                    </p>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
