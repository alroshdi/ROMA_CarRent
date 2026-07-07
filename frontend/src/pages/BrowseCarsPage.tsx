import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { Search, Calendar, Car, SlidersHorizontal, ArrowUpDown, X, MessageCircle } from 'lucide-react'
import Layout from '../components/Layout'
import Logo from '../components/Logo'
import CarCard from '../components/CarCard'
import api from '../lib/api'
import { HERO_SLIDE_IMAGES } from '../lib/heroSlides'
import { whatsappUrl } from '../lib/contact'
import type { Car as CarType } from '../types'
import { useTranslation } from '../i18n/LanguageProvider'

type SortOption = 'price-asc' | 'price-desc' | 'name'

function CarCardSkeleton() {
  return (
    <div className="card-elevated overflow-hidden animate-pulse">
      <div className="aspect-[16/10] bg-roma-elevated" />
      <div className="p-5 space-y-4">
        <div className="h-5 bg-roma-elevated rounded w-2/3" />
        <div className="h-4 bg-roma-elevated rounded w-1/2" />
        <div className="flex gap-2">
          <div className="h-7 bg-roma-elevated rounded w-16" />
          <div className="h-7 bg-roma-elevated rounded w-20" />
        </div>
        <div className="h-10 bg-roma-elevated rounded" />
      </div>
    </div>
  )
}

export default function BrowseCarsPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const heroImage = HERO_SLIDE_IMAGES[0] || '/image/slide.jpg'

  const [cars, setCars] = useState<CarType[]>([])
  const [pickupDate, setPickupDate] = useState(searchParams.get('pickup') || '')
  const [returnDate, setReturnDate] = useState(searchParams.get('return') || '')
  const [loading, setLoading] = useState(true)
  const [searched, setSearched] = useState(Boolean(searchParams.get('pickup') && searchParams.get('return')))
  const [brandFilter, setBrandFilter] = useState('')
  const [sort, setSort] = useState<SortOption>('price-asc')

  const today = format(new Date(), 'yyyy-MM-dd')
  const whatsAppLink = whatsappUrl(t('common.whatsappInquiry'))

  const fetchCars = async (pickup?: string, ret?: string) => {
    setLoading(true)
    const params: Record<string, string> = {}
    if (pickup && ret) {
      params.pickup_date = pickup
      params.return_date = ret
    }
    const { data } = await api.get('/cars', { params })
    setCars(data.cars)
    setLoading(false)
  }

  useEffect(() => {
    const pickup = searchParams.get('pickup') || ''
    const ret = searchParams.get('return') || ''
    setPickupDate(pickup)
    setReturnDate(ret)
    setSearched(Boolean(pickup && ret))
    fetchCars(pickup || undefined, ret || undefined)
  }, [searchParams])

  const brands = useMemo(() => {
    const set = new Set(cars.map((c) => c.brand).filter(Boolean))
    return Array.from(set).sort()
  }, [cars])

  const filteredCars = useMemo(() => {
    let list = brandFilter ? cars.filter((c) => c.brand === brandFilter) : [...cars]
    list.sort((a, b) => {
      if (sort === 'price-asc') return parseFloat(a.daily_price) - parseFloat(b.daily_price)
      if (sort === 'price-desc') return parseFloat(b.daily_price) - parseFloat(a.daily_price)
      return a.name.localeCompare(b.name)
    })
    return list
  }, [cars, brandFilter, sort])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pickupDate || !returnDate) return
    setSearched(true)
    setSearchParams({ pickup: pickupDate, return: returnDate })
  }

  const clearDates = () => {
    setPickupDate('')
    setReturnDate('')
    setSearched(false)
    setSearchParams({})
  }

  return (
    <Layout>
      {/* Hero */}
      <section className="relative min-h-[280px] md:min-h-[340px] flex items-end overflow-hidden border-b border-roma-border">
        <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-roma-black via-roma-black/85 to-roma-black/55" />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 md:pb-12 pt-28">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="accent-line mb-4" />
              <h1 className="text-3xl md:text-5xl font-bold text-white tracking-wide uppercase" style={{ fontFamily: 'var(--font-display)' }}>
                {t('browse.title')}
              </h1>
              <p className="text-roma-muted mt-3 max-w-xl text-base md:text-lg leading-relaxed">
                {t('browse.heroSubtitle')}
              </p>
            </div>
            <Logo height={48} to={false} className="hidden md:block shrink-0 opacity-90" />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {/* Search bar */}
        <form
          onSubmit={handleSearch}
          className="card-elevated p-5 md:p-6 border-primary/10 relative overflow-hidden mb-8 md:mb-10"
        >
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-roma-subtle mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            {t('browse.searchLabel')}
          </p>
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-end">
            <div className="flex-1 grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <Calendar className="w-4 h-4 inline me-1 text-primary" /> {t('home.pickupDate')}
                </label>
                <input
                  type="date"
                  min={today}
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">
                  <Calendar className="w-4 h-4 inline me-1 text-primary" /> {t('home.returnDate')}
                </label>
                <input
                  type="date"
                  min={pickupDate || today}
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="input"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <button
                type="submit"
                disabled={!pickupDate || !returnDate}
                className="btn-primary py-3 px-8 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Search className="w-4 h-4" /> {t('home.searchCars')}
              </button>
              {searched && (
                <button type="button" onClick={clearDates} className="btn-secondary py-3 px-6">
                  <X className="w-4 h-4" /> {t('browse.clearDates')}
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="feature-icon-ring w-11 h-11 shrink-0">
              <Car className="w-5 h-5 text-primary" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
                {searched
                  ? t('home.availableCars', { count: filteredCars.length })
                  : t('home.ourFleet')}
              </h2>
              <p className="text-xs text-roma-muted mt-0.5">
                {brandFilter
                  ? t('browse.resultsFiltered', { count: filteredCars.length, total: cars.length })
                  : t('browse.resultsCount', { count: filteredCars.length })}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {brands.length > 1 && (
              <div className="relative">
                <SlidersHorizontal className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-roma-subtle pointer-events-none" />
                <select
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  className="input ps-9 pe-8 py-2.5 text-sm min-w-[10rem] appearance-none cursor-pointer"
                  aria-label={t('browse.filterBrand')}
                >
                  <option value="">{t('browse.filterBrandAll')}</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="relative">
              <ArrowUpDown className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-roma-subtle pointer-events-none" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="input ps-9 pe-8 py-2.5 text-sm min-w-[11rem] appearance-none cursor-pointer"
                aria-label={t('browse.sortLabel')}
              >
                <option value="price-asc">{t('browse.sortPriceAsc')}</option>
                <option value="price-desc">{t('browse.sortPriceDesc')}</option>
                <option value="name">{t('browse.sortName')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CarCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredCars.length === 0 ? (
          <div className="card-elevated p-12 md:p-16 text-center border-primary/15 bg-[radial-gradient(ellipse_at_center,rgba(224,38,48,0.06),transparent_70%)]">
            <div className="feature-icon-ring w-16 h-16 mx-auto mb-6">
              <Car className="w-7 h-7 text-primary" strokeWidth={1.75} />
            </div>
            <p className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              {t('home.noCarsTitle')}
            </p>
            <p className="text-sm text-roma-muted max-w-md mx-auto mb-6">{t('home.noCarsHint')}</p>
            {searched ? (
              <button type="button" onClick={clearDates} className="btn-secondary py-3 px-8">
                {t('browse.showAll')}
              </button>
            ) : (
              <a
                href={whatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 py-3 px-8 rounded-lg text-sm font-semibold text-white bg-[#25D366] hover:bg-[#1fb855] transition-colors shadow-[0_4px_20px_rgba(37,211,102,0.25)]"
              >
                <MessageCircle className="w-4 h-4" />
                {t('contact.contactWhatsApp')}
              </a>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
            {filteredCars.map((car) => (
              <CarCard key={car.id} car={car} pickupDate={pickupDate} returnDate={returnDate} />
            ))}
          </div>
        )}

        {/* CTA */}
        {!loading && filteredCars.length > 0 && (
          <div className="mt-14 md:mt-16 card-elevated p-8 md:p-10 text-center border-primary/20 bg-[radial-gradient(ellipse_at_center,rgba(224,38,48,0.08),transparent_70%)]">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-3 uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
              {t('browse.ctaTitle')}
            </h2>
            <p className="text-sm text-roma-muted mb-6 max-w-md mx-auto">{t('browse.ctaSubtitle')}</p>
            <a
              href={whatsAppLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 py-3 px-8 rounded-lg text-sm font-semibold text-white bg-[#25D366] hover:bg-[#1fb855] transition-colors shadow-[0_4px_20px_rgba(37,211,102,0.25)]"
            >
              <MessageCircle className="w-4 h-4" />
              {t('contact.contactWhatsApp')}
            </a>
          </div>
        )}
      </div>
    </Layout>
  )
}
