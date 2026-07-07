import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { User, Phone, Lock, Save, ShieldCheck, ClipboardList } from 'lucide-react'
import Layout from '../components/Layout'
import Logo from '../components/Logo'
import { useAuth } from '../lib/auth'
import api from '../lib/api'
import { useTranslation } from '../i18n/LanguageProvider'
import { HERO_SLIDE_IMAGES } from '../lib/heroSlides'

export default function ProfilePage() {
  const { t } = useTranslation()
  const { customer, setCustomer } = useAuth()
  const heroImage = HERO_SLIDE_IMAGES[0] || '/image/slide.jpg'

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [newPinConfirm, setNewPinConfirm] = useState('')
  const [changePin, setChangePin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => {
        setCustomer(data.customer)
        setName(data.customer.name)
        setPhone(data.customer.phone)
      })
      .catch(() => setError(t('profile.loadFailed')))
      .finally(() => setLoading(false))
  }, [])

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
      const payload: Record<string, string> = { name: name.trim(), phone: phone.trim() }
      if (changePin && newPin) {
        payload.current_pin = currentPin
        payload.pin = newPin
        payload.pin_confirmation = newPinConfirm
      }

      const { data } = await api.put('/auth/profile', payload)
      setCustomer(data.customer)
      setName(data.customer.name)
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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {loading ? (
          <div className="card-elevated p-8 animate-pulse space-y-4">
            <div className="h-16 w-16 rounded-full bg-roma-elevated mx-auto" />
            <div className="h-10 bg-roma-elevated rounded" />
            <div className="h-10 bg-roma-elevated rounded" />
          </div>
        ) : (
          <>
            <div className="card-elevated p-6 md:p-8 mb-6 text-center border-primary/10">
              <div className="w-16 h-16 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto mb-4 text-xl font-bold text-primary" style={{ fontFamily: 'var(--font-display)' }}>
                {initials}
              </div>
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{customer?.name}</h2>
              <p className="text-sm text-roma-muted mt-1" dir="ltr">{customer?.phone}</p>
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

            {error && <div className="alert-error mb-4">{error}</div>}
            {success && <div className="alert-success mb-4">{success}</div>}

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
                    <input
                      id="profile-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input"
                      required
                    />
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
                      <input
                        id="profile-current-pin"
                        type="password"
                        value={currentPin}
                        onChange={(e) => setCurrentPin(e.target.value)}
                        maxLength={6}
                        minLength={4}
                        className="input"
                        required={changePin}
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label" htmlFor="profile-new-pin">{t('profile.newPin')}</label>
                        <input
                          id="profile-new-pin"
                          type="password"
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value)}
                          maxLength={6}
                          minLength={4}
                          className="input"
                          required={changePin}
                        />
                      </div>
                      <div>
                        <label className="label" htmlFor="profile-confirm-pin">{t('login.confirmPin')}</label>
                        <input
                          id="profile-confirm-pin"
                          type="password"
                          value={newPinConfirm}
                          onChange={(e) => setNewPinConfirm(e.target.value)}
                          maxLength={6}
                          minLength={4}
                          className="input"
                          required={changePin}
                        />
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
