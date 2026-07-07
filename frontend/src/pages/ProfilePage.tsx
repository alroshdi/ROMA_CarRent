import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  User,
  Phone,
  Mail,
  Lock,
  Save,
  ShieldCheck,
  ClipboardList,
  IdCard,
  Upload,
  Trash2,
  Car,
  Calendar,
  ArrowUpRight,
} from 'lucide-react'
import Layout from '../components/Layout'
import Logo from '../components/Logo'
import { useAuth } from '../lib/auth'
import api from '../lib/api'
import { useTranslation } from '../i18n/LanguageProvider'
import { HERO_SLIDE_IMAGES } from '../lib/heroSlides'
import { isValidEmail, normalizeEmail } from '../lib/validation'
import type { Booking } from '../types'
import { formatBookingTime } from '../lib/bookingTime'

function isUpcoming(status: string) {
  return ['pending', 'confirmed', 'active'].includes(status)
}

export default function ProfilePage() {
  const { t, formatDate, tStatus } = useTranslation()
  const { customer, setCustomer } = useAuth()
  const heroImage = HERO_SLIDE_IMAGES[0] || '/image/slide.jpg'
  const licenseInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [newPinConfirm, setNewPinConfirm] = useState('')
  const [changePin, setChangePin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLicense, setUploadingLicense] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    Promise.all([api.get('/auth/me'), api.get('/bookings')])
      .then(([meRes, bookingsRes]) => {
        const c = meRes.data.customer
        setCustomer(c)
        setName(c.name)
        setEmail(c.email || '')
        setPhone(c.phone)
        setBookings(bookingsRes.data.bookings || [])
      })
      .catch(() => setError(t('profile.loadFailed')))
      .finally(() => setLoading(false))
  }, [])

  const bookingStats = useMemo(() => ({
    total: bookings.length,
    upcoming: bookings.filter((b) => isUpcoming(b.status)).length,
    completed: bookings.filter((b) => b.status === 'completed').length,
  }), [bookings])

  const recentBookings = useMemo(
    () => [...bookings].sort((a, b) => b.id - a.id).slice(0, 3),
    [bookings],
  )

  const initials = (name || customer?.name || '?')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (email.trim() && !isValidEmail(normalizeEmail(email))) {
      setError(t('login.invalidEmail'))
      return
    }

    if (changePin) {
      if (newPin !== newPinConfirm) {
        setError(t('login.pinMismatch'))
        return
      }
      if (!currentPin) {
        setError(t('profile.currentPinRequired'))
        return
      }
    }

    setSaving(true)
    try {
      const payload: Record<string, string> = {
        name: name.trim(),
        phone: phone.trim(),
        email: normalizeEmail(email),
      }
      if (changePin && newPin) {
        payload.current_pin = currentPin
        payload.pin = newPin
        payload.pin_confirmation = newPinConfirm
      }

      const { data } = await api.put('/auth/profile', payload)
      setCustomer(data.customer)
      setName(data.customer.name)
      setEmail(data.customer.email || '')
      setPhone(data.customer.phone)
      setCurrentPin('')
      setNewPin('')
      setNewPinConfirm('')
      setChangePin(false)
      setSuccess(t('profile.saved'))
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
      const firstFieldError = res?.errors ? Object.values(res.errors).flat()[0] : null
      setError(firstFieldError || res?.message || t('profile.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setSuccess('')
    setUploadingLicense(true)

    const formData = new FormData()
    formData.append('license', file)

    try {
      const { data } = await api.post('/auth/profile/license', formData)
      setCustomer(data.customer)
      setSuccess(t('profile.licenseUploaded'))
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
      const firstFieldError = res?.errors ? Object.values(res.errors).flat()[0] : null
      setError(firstFieldError || res?.message || t('profile.licenseUploadFailed'))
    } finally {
      setUploadingLicense(false)
      if (licenseInputRef.current) licenseInputRef.current.value = ''
    }
  }

  const handleLicenseRemove = async () => {
    setError('')
    setSuccess('')
    setUploadingLicense(true)
    try {
      const { data } = await api.delete('/auth/profile/license')
      setCustomer(data.customer)
      setSuccess(t('profile.licenseRemoved'))
    } catch {
      setError(t('profile.licenseUploadFailed'))
    } finally {
      setUploadingLicense(false)
    }
  }

  return (
    <Layout>
      <section className="relative min-h-[240px] md:min-h-[280px] flex items-end overflow-hidden border-b border-roma-border">
        <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-roma-black via-roma-black/85 to-roma-black/55" />
        <div className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 md:pb-10 pt-28">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="accent-line mb-4" />
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-wide uppercase" style={{ fontFamily: 'var(--font-display)' }}>
                {t('profile.title')}
              </h1>
              <p className="text-roma-muted mt-2 text-sm md:text-base">{t('profile.subtitle')}</p>
            </div>
            <Logo height={40} to={false} className="hidden md:block shrink-0 opacity-90" />
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 space-y-6">
        {loading ? (
          <div className="card-elevated p-8 animate-pulse space-y-4">
            <div className="h-16 w-16 rounded-full bg-roma-elevated mx-auto" />
            <div className="h-10 bg-roma-elevated rounded" />
            <div className="h-10 bg-roma-elevated rounded" />
          </div>
        ) : (
          <>
            <div className="card-elevated p-6 md:p-8 text-center border-primary/10">
              <div className="w-16 h-16 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto mb-4 text-xl font-bold text-primary" style={{ fontFamily: 'var(--font-display)' }}>
                {initials}
              </div>
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{customer?.name}</h2>
              <p className="text-sm text-roma-muted mt-1" dir="ltr">{customer?.phone}</p>
              <p className="text-sm text-roma-muted mt-1 flex items-center justify-center gap-1.5" dir="ltr">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                {customer?.email || t('profile.emailNotSet')}
              </p>
              <div className="flex flex-wrap justify-center gap-3 mt-5">
                <Link to="/my-bookings" className="btn-secondary py-2 px-4 text-sm inline-flex">
                  <ClipboardList className="w-4 h-4" />
                  {t('nav.myBookings')}
                </Link>
                <span className={`badge border ${customer?.is_active ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/40' : 'bg-red-950/50 text-red-300 border-red-800/40'}`}>
                  <ShieldCheck className="w-3 h-3 inline me-1 -mt-0.5" />
                  {customer?.is_active ? t('profile.activeAccount') : t('profile.inactiveAccount')}
                </span>
              </div>
            </div>

            {error && <div className="alert-error">{error}</div>}
            {success && <div className="alert-success">{success}</div>}

            <div className="card-elevated p-6 md:p-8 border-primary/10">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-1 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                <ClipboardList className="w-4 h-4 text-primary" />
                {t('profile.bookingOverview')}
              </h3>
              <p className="text-xs text-roma-muted mb-5">{t('profile.bookingOverviewHint')}</p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: t('profile.totalBookings'), value: bookingStats.total },
                  { label: t('profile.upcomingBookings'), value: bookingStats.upcoming },
                  { label: t('profile.completedBookings'), value: bookingStats.completed },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-roma-border bg-roma-dark/50 p-3 text-center">
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="text-[11px] text-roma-muted mt-1">{label}</p>
                  </div>
                ))}
              </div>

              {recentBookings.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-roma-border rounded-xl">
                  <Car className="w-8 h-8 text-roma-subtle mx-auto mb-2" />
                  <p className="text-sm text-roma-muted mb-4">{t('profile.noBookingsYet')}</p>
                  <Link to="/browse" className="btn-primary py-2.5 px-6 text-sm inline-flex">{t('profile.browseCars')}</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-wide text-roma-subtle">{t('profile.recentBookings')}</p>
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-roma-border bg-roma-dark/40 p-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">{booking.car?.name || t('common.car')}</p>
                        <p className="text-xs text-roma-muted mt-1">
                          {t('profile.bookingRef', { id: booking.id })} · {tStatus(booking.status)}
                        </p>
                        <p className="text-xs text-roma-subtle mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(booking.pickup_date, 'MMM d')}
                          {booking.pickup_time ? ` · ${formatBookingTime(booking.pickup_time)}` : ''}
                          {' — '}
                          {formatDate(booking.return_date, 'MMM d, yyyy')}
                        </p>
                      </div>
                      {isUpcoming(booking.status) && (
                        <Link
                          to={`/book/${booking.car_id}?booking=${booking.id}`}
                          className="btn-secondary py-2 px-4 text-xs shrink-0 inline-flex self-start sm:self-center"
                        >
                          {t('profile.continueBooking')}
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  ))}
                  <Link to="/my-bookings" className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-2">
                    {t('profile.viewAllBookings')}
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>

            <div className="card-elevated p-6 md:p-8 border-primary/10">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-1 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                <IdCard className="w-4 h-4 text-primary" />
                {t('profile.drivingLicense')}
              </h3>
              <p className="text-xs text-roma-muted mb-5 leading-relaxed">{t('profile.drivingLicenseHint')}</p>

              {customer?.driving_license_url ? (
                <div className="space-y-4">
                  <a
                    href={customer.driving_license_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-xl border border-roma-border bg-roma-dark"
                  >
                    <img
                      src={customer.driving_license_url}
                      alt={t('profile.drivingLicense')}
                      className="w-full max-h-56 object-contain bg-black/30"
                    />
                  </a>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => licenseInputRef.current?.click()}
                      disabled={uploadingLicense}
                      className="btn-secondary py-2.5 px-4 text-sm inline-flex"
                    >
                      <Upload className="w-4 h-4" />
                      {uploadingLicense ? t('profile.licenseUploading') : t('profile.replaceLicense')}
                    </button>
                    <button
                      type="button"
                      onClick={handleLicenseRemove}
                      disabled={uploadingLicense}
                      className="inline-flex items-center gap-2 py-2.5 px-4 text-sm rounded-lg border border-red-900/40 text-red-300 hover:bg-red-950/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t('profile.removeLicense')}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => licenseInputRef.current?.click()}
                  disabled={uploadingLicense}
                  className="w-full rounded-xl border-2 border-dashed border-roma-border hover:border-primary/40 bg-roma-dark/40 p-8 text-center transition-colors group"
                >
                  <Upload className="w-8 h-8 text-roma-subtle group-hover:text-primary mx-auto mb-3 transition-colors" />
                  <p className="text-sm font-medium text-white">
                    {uploadingLicense ? t('profile.licenseUploading') : t('profile.uploadLicense')}
                  </p>
                  <p className="text-xs text-roma-muted mt-2">{t('profile.licenseFormats')}</p>
                </button>
              )}

              <input
                ref={licenseInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleLicenseUpload}
              />
            </div>

            <form onSubmit={handleSubmit} className="card-elevated p-6 md:p-8 space-y-6 border-primary/10 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                  <User className="w-4 h-4 text-primary" />
                  {t('profile.personalInfo')}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="label" htmlFor="profile-name">{t('login.fullName')}</label>
                    <input id="profile-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="input" required />
                  </div>
                  <div>
                    <label className="label" htmlFor="profile-email">{t('profile.registeredEmail')}</label>
                    <div className="relative">
                      <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-roma-subtle pointer-events-none" />
                      <input
                        id="profile-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('login.emailPlaceholder')}
                        className="input ps-10"
                        dir="ltr"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label" htmlFor="profile-phone">{t('login.phoneNumber')}</label>
                    <div className="relative">
                      <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-roma-subtle pointer-events-none" />
                      <input
                        id="profile-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="input ps-10"
                        dir="ltr"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-roma-border">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                    <Lock className="w-4 h-4 text-primary" />
                    {t('profile.changePin')}
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-roma-muted">
                    <input
                      type="checkbox"
                      checked={changePin}
                      onChange={(e) => {
                        setChangePin(e.target.checked)
                        if (!e.target.checked) {
                          setCurrentPin('')
                          setNewPin('')
                          setNewPinConfirm('')
                        }
                      }}
                      className="w-4 h-4 accent-primary rounded"
                    />
                    {t('profile.updatePinToggle')}
                  </label>
                </div>

                {changePin && (
                  <div className="space-y-4 bg-roma-dark/50 rounded-lg p-4 border border-roma-border">
                    <div>
                      <label className="label" htmlFor="profile-current-pin">{t('profile.currentPin')}</label>
                      <input id="profile-current-pin" type="password" value={currentPin} onChange={(e) => setCurrentPin(e.target.value)} maxLength={6} minLength={4} className="input" required={changePin} />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label" htmlFor="profile-new-pin">{t('profile.newPin')}</label>
                        <input id="profile-new-pin" type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)} maxLength={6} minLength={4} className="input" required={changePin} />
                      </div>
                      <div>
                        <label className="label" htmlFor="profile-confirm-pin">{t('login.confirmPin')}</label>
                        <input id="profile-confirm-pin" type="password" value={newPinConfirm} onChange={(e) => setNewPinConfirm(e.target.value)} maxLength={6} minLength={4} className="input" required={changePin} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" disabled={saving} className="btn-primary w-full py-3.5">
                <Save className="w-4 h-4" />
                {saving ? t('profile.saving') : t('profile.saveChanges')}
              </button>
            </form>
          </>
        )}
      </div>
    </Layout>
  )
}
