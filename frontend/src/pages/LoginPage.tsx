import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Layout from '../components/Layout'
import Logo from '../components/Logo'
import { useAuth } from '../lib/auth'
import { openWhatsApp, whatsappUrl } from '../lib/contact'
import { useTranslation } from '../i18n/LanguageProvider'
import { GULF_DIAL_CODES, CONTACT_DIAL_CODE, formatGulfPhone } from '../lib/contact'
import { isValidEmail, isValidGulfPhone, normalizeEmail } from '../lib/validation'

export default function LoginPage() {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [dialCode, setDialCode] = useState(CONTACT_DIAL_CODE)
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const redirectAfterAuth = () => {
    const from = (location.state as { from?: string } | null)?.from
    if (from && from !== '/login') {
      navigate(from, { replace: true })
      return
    }
    navigate('/', { replace: true })
  }

  const validateCredentials = (forRegister: boolean): string | null => {
    if (!isValidGulfPhone(dialCode, phone)) return t('login.invalidPhone')
    if (forRegister && !isValidEmail(normalizeEmail(email))) return t('login.invalidEmail')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validationError = validateCredentials(mode === 'register')
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    const fullPhone = formatGulfPhone(dialCode, phone)
    const normalizedEmail = normalizeEmail(email)

    try {
      if (mode === 'login') {
        await login(fullPhone, pin)
      } else {
        if (!name.trim()) {
          setError(t('login.nameRequired'))
          setLoading(false)
          return
        }
        if (pin !== pinConfirm) {
          setError(t('login.pinMismatch'))
          setLoading(false)
          return
        }
        await register(name.trim(), normalizedEmail, fullPhone, pin, pinConfirm)
      }
      redirectAfterAuth()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
      const firstFieldError = msg?.errors
        ? (msg.errors.email?.[0] || msg.errors.phone?.[0] || Object.values(msg.errors).flat()[0])
        : null
      setError(firstFieldError || msg?.message || t('login.authFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="card-elevated p-8">
          <div className="flex justify-center mb-6">
            <Logo height={48} to={false} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 text-center tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
            {mode === 'login' ? t('login.welcomeBack') : t('login.createAccount')}
          </h1>
          <p className="text-roma-muted text-sm mb-6 text-center">
            {mode === 'login' ? t('login.loginHint') : t('login.registerHint')}
          </p>

          <div className="flex mb-6 bg-roma-dark rounded-lg p-1 border border-roma-border">
            <button type="button" onClick={() => setMode('login')} className={`flex-1 py-2 rounded-md text-sm font-semibold transition uppercase tracking-wide ${mode === 'login' ? 'bg-primary text-white' : 'text-roma-muted hover:text-white'}`} style={{ fontFamily: 'var(--font-display)' }}>
              {t('common.login')}
            </button>
            <button type="button" onClick={() => setMode('register')} className={`flex-1 py-2 rounded-md text-sm font-semibold transition uppercase tracking-wide ${mode === 'register' ? 'bg-primary text-white' : 'text-roma-muted hover:text-white'}`} style={{ fontFamily: 'var(--font-display)' }}>
              {t('common.register')}
            </button>
          </div>

          {error && <div className="alert-error mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {mode === 'register' && (
              <>
                <div>
                  <label className="label" htmlFor="register-name">{t('login.fullName')}</label>
                  <input id="register-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="input" required />
                </div>
                <div>
                  <label className="label" htmlFor="auth-email">{t('login.emailAddress')}</label>
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('login.emailPlaceholder')}
                    className="input"
                    dir="ltr"
                    autoComplete="email"
                    required
                  />
                </div>
              </>
            )}
            <div>
              <label className="label" htmlFor="login-phone">{t('login.phoneNumber')}</label>
              <div className="input-phone-row">
                <select
                  id="login-dial-code"
                  value={dialCode}
                  onChange={(e) => setDialCode(e.target.value)}
                  className="input input-dial-code"
                  dir="ltr"
                  aria-label={t('contact.form.countryCode')}
                >
                  {GULF_DIAL_CODES.map(({ code, countryKey }) => (
                    <option key={code} value={code}>
                      {code} {t(`contact.form.countries.${countryKey}`)}
                    </option>
                  ))}
                </select>
                <input
                  id="login-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d\s-]/g, ''))}
                  placeholder={t('login.phonePlaceholder')}
                  className="input input-phone"
                  dir="ltr"
                  autoComplete="tel-national"
                  inputMode="numeric"
                  required
                />
              </div>
              <p className="text-[11px] text-roma-subtle mt-1.5">{t('login.phoneHint')}</p>
            </div>
            <div>
              <label className="label" htmlFor="login-pin">{t('login.pin')}</label>
              <input id="login-pin" type="password" value={pin} onChange={(e) => setPin(e.target.value)} maxLength={6} minLength={4} className="input" required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            </div>
            {mode === 'register' && (
              <div>
                <label className="label" htmlFor="login-pin-confirm">{t('login.confirmPin')}</label>
                <input id="login-pin-confirm" type="password" value={pinConfirm} onChange={(e) => setPinConfirm(e.target.value)} maxLength={6} minLength={4} className="input" required autoComplete="new-password" />
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? t('login.pleaseWait') : mode === 'login' ? t('common.signIn') : t('login.createAccount')}
            </button>
          </form>

          {mode === 'login' && (
            <p className="text-xs text-roma-muted mt-4 text-center">
              {t('login.forgotPin')}{' '}
              <a
                href={whatsappUrl(t('login.forgotPinWhatsApp'))}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.preventDefault()
                  openWhatsApp(t('login.forgotPinWhatsApp'))
                }}
                className="text-primary hover:underline"
              >
                {t('login.whatsappSupportLink')}
              </a>.
            </p>
          )}
        </div>
      </div>
    </Layout>
  )
}
