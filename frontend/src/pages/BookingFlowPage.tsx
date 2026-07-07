import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { differenceInDays } from 'date-fns'
import { ArrowLeft, ArrowRight, CheckCircle, Shield, IdCard, Clock } from 'lucide-react'
import Layout from '../components/Layout'
import SignaturePad from '../components/SignaturePad'
import BookingLocationField from '../components/BookingLocationField'
import BookingPriceBreakdown from '../components/BookingPriceBreakdown'
import { useAuth } from '../lib/auth'
import api from '../lib/api'
import { parseStoredLocation, resolveLocationValue, type BookingLocationKey } from '../lib/bookingLocations'
import { toTimeInputValue, formatBookingTime } from '../lib/bookingTime'
import type { Car, Driver, Booking, Settings } from '../types'
import { useTranslation } from '../i18n/LanguageProvider'

type Step = 'details' | 'summary' | 'contract' | 'sign' | 'pay'

export default function BookingFlowPage() {
  const { t, formatDate, dir } = useTranslation()
  const { carId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [step, setStep] = useState<Step>('details')
  const [car, setCar] = useState<Car | null>(null)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [pickupDate, setPickupDate] = useState(searchParams.get('pickup') || '')
  const [pickupTime, setPickupTime] = useState('10:00')
  const [returnDate, setReturnDate] = useState(searchParams.get('return') || '')
  const [returnTime, setReturnTime] = useState('20:00')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [pickupLocationKey, setPickupLocationKey] = useState<BookingLocationKey | ''>('')
  const [pickupLocationCustom, setPickupLocationCustom] = useState('')
  const [dropoffLocationKey, setDropoffLocationKey] = useState<BookingLocationKey | ''>('')
  const [dropoffLocationCustom, setDropoffLocationCustom] = useState('')
  const [withDriver, setWithDriver] = useState(false)
  const [driverId, setDriverId] = useState('')
  const [hasGccLicense, setHasGccLicense] = useState(false)

  const stepKeys: Step[] = ['details', 'summary', 'contract', 'sign', 'pay']

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/book/${carId}` } })
      return
    }
    const existingBookingId = searchParams.get('booking')

    Promise.all([
      api.get(`/cars/${carId}`),
      api.get('/drivers'),
      api.get('/settings'),
      existingBookingId ? api.get(`/bookings/${existingBookingId}`) : Promise.resolve(null),
    ]).then(([carRes, driversRes, settingsRes, bookingRes]) => {
      setCar(carRes.data.car)
      setDrivers(driversRes.data.drivers || [])
      setSettings(settingsRes.data)

      if (bookingRes?.data?.booking) {
        const b: Booking = bookingRes.data.booking
        setBooking(b)
        setPickupDate(b.pickup_date.slice(0, 10))
        setPickupTime(toTimeInputValue(b.pickup_time) || '10:00')
        setReturnDate(b.return_date.slice(0, 10))
        setReturnTime(toTimeInputValue(b.return_time) || '20:00')
        setAdditionalNotes(b.additional_notes || '')
        const pickupParsed = parseStoredLocation(b.pickup_location, t)
        const dropoffParsed = parseStoredLocation(b.dropoff_location, t)
        setPickupLocationKey(pickupParsed.key)
        setPickupLocationCustom(pickupParsed.custom)
        setDropoffLocationKey(dropoffParsed.key)
        setDropoffLocationCustom(dropoffParsed.custom)
        setWithDriver(b.with_driver)
        setDriverId(b.driver_id ? String(b.driver_id) : '')

        if (b.contract?.signed_at) {
          setStep('pay')
        } else if (b.contract) {
          setStep('summary')
        } else {
          setStep('summary')
        }
      }
    }).catch(() => setError(t('booking.loadFailed')))
  }, [carId, isAuthenticated, navigate, searchParams, t])

  useEffect(() => {
    if (withDriver && drivers.length > 0 && !driverId) {
      setDriverId(String(drivers[0].id))
    }
    if (!withDriver) {
      setDriverId('')
    } else {
      setHasGccLicense(false)
    }
  }, [withDriver, drivers, driverId])

  const days = pickupDate && returnDate
    ? Math.max(1, differenceInDays(new Date(returnDate), new Date(pickupDate)) + 1)
    : 1
  const carCost = car ? parseFloat(car.daily_price) * days : 0
  const driverDailyRate = settings?.driver_daily_rate ?? 25
  const driverCost = withDriver ? driverDailyRate * days : 0
  const totalPrice = carCost + driverCost

  const getBookingDays = (b: Booking) =>
    b.driver_hours ?? Math.max(1, differenceInDays(new Date(b.return_date), new Date(b.pickup_date)) + 1)

  const getBookingPricing = (b: Booking) => {
    const bookingDays = getBookingDays(b)
    const bookingCarCost = parseFloat(b.car_cost)
    const bookingDriverCost = parseFloat(b.driver_cost)
    const bookingTotal = parseFloat(b.total_price)
    const bookingDailyCarRate = b.car
      ? parseFloat(b.car.daily_price)
      : bookingCarCost / bookingDays
    const bookingDriverDailyRate = b.with_driver && bookingDays > 0
      ? bookingDriverCost / bookingDays
      : driverDailyRate

    return {
      days: bookingDays,
      dailyCarRate: bookingDailyCarRate,
      carCost: bookingCarCost,
      driverDailyRate: bookingDriverDailyRate,
      driverCost: bookingDriverCost,
      totalPrice: bookingTotal,
    }
  }

  const createBooking = async () => {
    setError('')

    if (!pickupDate || !returnDate) {
      setError(t('booking.selectDates'))
      return
    }
    const pickupLocation = resolveLocationValue(pickupLocationKey, pickupLocationCustom, t)
    const dropoffLocation = resolveLocationValue(dropoffLocationKey, dropoffLocationCustom, t)

    if (!pickupLocationKey || !dropoffLocationKey) {
      setError(t('booking.selectLocationRequired'))
      return
    }
    if (!pickupLocation || !dropoffLocation) {
      setError(t('booking.enterLocations'))
      return
    }
    if (withDriver && !driverId) {
      setError(t('booking.selectDriverOrUncheck'))
      return
    }
    if (withDriver && drivers.length === 0) {
      setError(t('booking.noDriversUncheck'))
      return
    }
    if (!withDriver && !hasGccLicense) {
      setError(t('booking.confirmGccLicense'))
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post('/bookings', {
        car_id: Number(carId),
        pickup_date: pickupDate,
        pickup_time: pickupTime || null,
        return_date: returnDate,
        return_time: returnTime || null,
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
        additional_notes: additionalNotes.trim() || null,
        with_driver: withDriver,
        driver_id: withDriver ? Number(driverId) : null,
      })
      setBooking(data.booking)
      setStep('summary')
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
      const firstFieldError = res?.errors ? Object.values(res.errors).flat()[0] : null
      setError(firstFieldError || res?.message || t('booking.createFailed'))
    } finally {
      setLoading(false)
    }
  }

  const generateContract = async () => {
    if (!booking) return
    setLoading(true)
    try {
      await api.post(`/bookings/${booking.id}/contract`)
      const res = await api.get(`/bookings/${booking.id}/contract/pdf`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      setPdfUrl(url)
      setStep('contract')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || t('booking.contractFailed'))
    } finally {
      setLoading(false)
    }
  }

  const signContract = async (signatureData: string) => {
    if (!booking) return
    setError('')
    setLoading(true)
    try {
      await api.post(`/bookings/${booking.id}/sign`, { signature_data: signatureData })
      setStep('pay')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || t('booking.signFailed'))
    } finally {
      setLoading(false)
    }
  }

  const proceedToPayment = async () => {
    if (!booking) return
    setLoading(true)
    try {
      const { data } = await api.post('/payments/checkout', { booking_id: booking.id })
      window.location.href = data.checkout_url
    } catch {
      setError(t('booking.paymentFailed'))
      setLoading(false)
    }
  }

  if (!car) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center text-roma-muted">{t('common.loading')}</div>
      </Layout>
    )
  }

  const stepIndex = stepKeys.indexOf(step)
  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft
  const ContinueIcon = dir === 'rtl' ? ArrowLeft : ArrowRight

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-roma-muted hover:text-primary mb-6 transition-colors">
          <BackIcon className="w-4 h-4" /> {t('booking.backToCars')}
        </Link>

        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {stepKeys.map((key, i) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${i <= stepIndex ? 'bg-primary text-white shadow-[0_0_12px_rgba(224,38,48,0.4)]' : 'bg-roma-elevated text-roma-muted border border-roma-border'}`}>
                {i < stepIndex ? <CheckCircle className="w-5 h-5" /> : i + 1}
              </div>
              <span className={`text-sm whitespace-nowrap uppercase tracking-wide ${i <= stepIndex ? 'text-primary font-semibold' : 'text-roma-subtle'}`} style={{ fontFamily: 'var(--font-display)' }}>{t(`booking.steps.${key}`)}</span>
              {i < stepKeys.length - 1 && <div className={`w-8 h-0.5 ${i < stepIndex ? 'bg-primary' : 'bg-roma-border'}`} />}
            </div>
          ))}
        </div>

        <div className="card-elevated p-6">
          <h2 className="text-xl font-bold text-white mb-1 tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>{t('booking.bookTitle', { name: car.name })}</h2>
          <p className="text-roma-muted text-sm mb-6">{t('booking.carMeta', { brand: car.brand, model: car.model, price: parseFloat(car.daily_price).toFixed(2) })}</p>

          {error && <div className="alert-error mb-4">{error}</div>}

          {step === 'details' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="pickup-date">{t('booking.pickupDateTime')}</label>
                  <div className="input-date-time-row">
                    <input id="pickup-date" type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className="input input-date" required />
                    <input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className="input input-time" dir="ltr" aria-label={t('booking.pickupTime')} />
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="return-date">{t('booking.returnDateTime')}</label>
                  <div className="input-date-time-row">
                    <input id="return-date" type="date" value={returnDate} min={pickupDate} onChange={(e) => setReturnDate(e.target.value)} className="input input-date" required />
                    <input type="time" value={returnTime} onChange={(e) => setReturnTime(e.target.value)} className="input input-time" dir="ltr" aria-label={t('booking.returnTime')} />
                  </div>
                </div>
              </div>
              <BookingLocationField
                id="pickup-location"
                label={t('booking.pickupLocation')}
                selectKey={pickupLocationKey}
                customText={pickupLocationCustom}
                onSelectKeyChange={setPickupLocationKey}
                onCustomTextChange={setPickupLocationCustom}
                purpose="pickup"
              />
              <BookingLocationField
                id="dropoff-location"
                label={t('booking.dropoffLocation')}
                selectKey={dropoffLocationKey}
                customText={dropoffLocationCustom}
                onSelectKeyChange={setDropoffLocationKey}
                onCustomTextChange={setDropoffLocationCustom}
                purpose="dropoff"
              />
              <div>
                <label className="label" htmlFor="additional-notes">{t('booking.additionalNotes')}</label>
                <textarea
                  id="additional-notes"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder={t('booking.additionalNotesPlaceholder')}
                  rows={3}
                  className="input resize-y min-h-[88px]"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={withDriver} onChange={(e) => setWithDriver(e.target.checked)} className="w-4 h-4 accent-primary rounded" />
                <span className="text-sm font-medium text-white">{t('booking.includeDriver', { rate: driverDailyRate.toFixed(2) })}</span>
              </label>
              {withDriver && (
                <div className="ps-7 space-y-3">
                  <div>
                    <label className="label">{t('booking.selectDriver')}</label>
                    {drivers.length === 0 ? (
                      <p className="text-sm text-amber-400">{t('booking.noDriversAvailable')}</p>
                    ) : (
                      <select value={driverId} onChange={(e) => setDriverId(e.target.value)} className="input" required>
                        <option value="">{t('booking.chooseDriver')}</option>
                        {drivers.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <p className="text-xs text-roma-muted">{t('booking.driverDaysNote', { days, rate: driverDailyRate.toFixed(2) })}</p>
                  <div className="rounded-lg border border-amber-800/40 bg-amber-950/30 p-3">
                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-200">{t('booking.driverHoursTitle')}</p>
                        <p className="text-xs text-roma-muted mt-1">{t('booking.driverHoursLimit')}</p>
                        <p className="text-xs text-roma-muted mt-0.5">{t('booking.driverHoursSchedule')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-4 pt-2">
                <div className="card p-4 md:p-5 border-primary/15 bg-roma-dark/50">
                  <div className="flex items-start gap-3">
                    <div className="feature-icon-ring w-11 h-11 shrink-0">
                      <Shield className="w-5 h-5 text-primary" strokeWidth={1.75} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                        {t('booking.securityDepositTitle')}
                      </h3>
                      <p className="text-sm text-roma-muted leading-relaxed">
                        {t('booking.securityDepositText')}
                      </p>
                    </div>
                  </div>
                </div>

                {!withDriver && (
                  <label className="card p-4 md:p-5 border-roma-border hover:border-primary/30 transition-colors cursor-pointer flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={hasGccLicense}
                      onChange={(e) => setHasGccLicense(e.target.checked)}
                      className="w-4 h-4 mt-1 accent-primary rounded shrink-0"
                      required
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <IdCard className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm font-semibold text-white">{t('booking.gccLicenseLabel')}</span>
                      </div>
                      <p className="text-xs text-roma-muted leading-relaxed">{t('booking.gccLicenseHint')}</p>
                    </div>
                  </label>
                )}
              </div>
              <BookingPriceBreakdown
                days={days}
                dailyCarRate={car ? parseFloat(car.daily_price) : 0}
                carCost={carCost}
                withDriver={withDriver}
                driverDailyRate={driverDailyRate}
                driverCost={driverCost}
                totalPrice={totalPrice}
              />
              <button type="button" onClick={createBooking} disabled={loading || (!withDriver && !hasGccLicense)} className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? t('booking.creatingBooking') : t('common.continue')} {!loading && <ContinueIcon className="w-4 h-4" />}
              </button>
            </div>
          )}

          {step === 'summary' && booking && (() => {
            const pricing = getBookingPricing(booking)
            return (
            <div className="space-y-4">
              <div className="bg-roma-dark rounded-lg p-4 space-y-2 text-sm border border-roma-border">
                <div className="flex justify-between"><span className="text-roma-muted">{t('booking.bookingNumber')}</span><span className="font-medium text-white">{booking.id}</span></div>
                <div className="flex justify-between gap-4"><span className="text-roma-muted shrink-0">{t('common.dates')}</span><span className="text-white text-end">{formatDate(booking.pickup_date, 'MMM d')}{booking.pickup_time ? ` · ${formatBookingTime(booking.pickup_time)}` : ''} — {formatDate(booking.return_date, 'MMM d, yyyy')}{booking.return_time ? ` · ${formatBookingTime(booking.return_time)}` : ''}</span></div>
                <div className="flex justify-between gap-4"><span className="text-roma-muted shrink-0">{t('booking.pickup')}</span><span className="text-white text-end">{booking.pickup_location}</span></div>
                <div className="flex justify-between gap-4"><span className="text-roma-muted shrink-0">{t('booking.dropoff')}</span><span className="text-white text-end">{booking.dropoff_location}</span></div>
                {booking.with_driver && booking.driver && (
                  <div className="flex justify-between gap-4"><span className="text-roma-muted shrink-0">{t('booking.selectDriver')}</span><span className="text-white text-end">{booking.driver.name}</span></div>
                )}
                {booking.additional_notes && (
                  <div className="flex justify-between gap-4 pt-2 border-t border-roma-border/50"><span className="text-roma-muted shrink-0">{t('booking.additionalNotes')}</span><span className="text-white text-sm text-end whitespace-pre-wrap">{booking.additional_notes}</span></div>
                )}
              </div>

              <BookingPriceBreakdown
                days={pricing.days}
                dailyCarRate={pricing.dailyCarRate}
                carCost={pricing.carCost}
                withDriver={booking.with_driver}
                driverDailyRate={pricing.driverDailyRate}
                driverCost={pricing.driverCost}
                totalPrice={pricing.totalPrice}
                showDepositNote
              />

              <button onClick={generateContract} disabled={loading} className="btn-primary w-full py-3">
                {t('booking.generateContract')}
              </button>
            </div>
            )
          })()}

          {step === 'contract' && pdfUrl && (
            <div className="space-y-4">
              <iframe src={pdfUrl} className="w-full h-96 border border-roma-border rounded-lg bg-white" title={t('booking.contractPdf')} />
              <button onClick={() => setStep('sign')} className="btn-primary w-full py-3">
                {t('booking.readContractSign')}
              </button>
            </div>
          )}

          {step === 'sign' && (
            <div className="space-y-4">
              <p className="text-sm text-roma-muted">{t('booking.signHint')}</p>
              <SignaturePad onSign={(data) => signContract(data)} />
              {loading && <p className="text-sm text-primary">{t('booking.processingSignature')}</p>}
            </div>
          )}

          {step === 'pay' && booking && (
            <div className="space-y-4 text-center">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
              <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>{t('booking.contractSigned')}</h3>
              <p className="text-roma-muted text-sm">{t('booking.proceedToPayment')}</p>
              <div className="text-3xl font-bold text-primary">{parseFloat(booking.total_price).toFixed(2)} {t('common.omr')}</div>
              <button onClick={proceedToPayment} disabled={loading} className="btn-primary w-full py-3">
                {t('booking.payWithThawani')}
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
