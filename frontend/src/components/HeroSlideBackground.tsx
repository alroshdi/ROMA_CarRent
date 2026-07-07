import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageProvider'

interface HeroSlideBackgroundProps {
  images: string[]
  autoPlayMs?: number
}

export default function HeroSlideBackground({ images, autoPlayMs = 6000 }: HeroSlideBackgroundProps) {
  const { dir } = useTranslation()
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  const count = images.length
  const goTo = useCallback(
    (index: number) => setActive(((index % count) + count) % count),
    [count],
  )
  const next = useCallback(() => goTo(active + 1), [active, goTo])
  const prev = useCallback(() => goTo(active - 1), [active, goTo])

  useEffect(() => {
    if (count <= 1 || paused) return
    const timer = setInterval(next, autoPlayMs)
    return () => clearInterval(timer)
  }, [count, paused, next, autoPlayMs])

  if (count === 0) return null

  const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft
  const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight

  return (
    <>
      {images.map((src, i) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${i === active ? 'opacity-100 z-0' : 'opacity-0 z-0'}`}
          aria-hidden={i !== active}
        >
          <img
            src={src}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[9000ms] ease-out ${i === active ? 'scale-105' : 'scale-100'}`}
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-roma-black via-roma-black/75 to-roma-black/40 z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-r from-roma-black/60 via-transparent to-roma-black/30 z-[1]" />

      {count > 1 && (
        <div
          className="absolute bottom-28 md:bottom-32 inset-x-0 z-[2] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between pointer-events-none"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="flex items-center gap-2 pointer-events-auto">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => goTo(i)}
                className={`h-1 rounded-full transition-all duration-300 ${i === active ? 'w-10 bg-primary shadow-[0_0_12px_rgba(224,38,48,0.6)]' : 'w-4 bg-white/30 hover:bg-white/50'}`}
                aria-label={`Slide ${i + 1}`}
                aria-current={i === active}
              />
            ))}
          </div>
          <div className="flex gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={prev}
              className="p-2 rounded-full border border-white/20 bg-black/40 backdrop-blur-sm text-white hover:border-primary hover:text-primary transition-colors"
              aria-label="Previous slide"
            >
              <PrevIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={next}
              className="p-2 rounded-full border border-white/20 bg-black/40 backdrop-blur-sm text-white hover:border-primary hover:text-primary transition-colors"
              aria-label="Next slide"
            >
              <NextIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
