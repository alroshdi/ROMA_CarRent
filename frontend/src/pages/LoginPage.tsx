import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Logo from '../components/Logo'
import { useAuth } from '../lib/auth'
import { useTranslation } from '../i18n/LanguageProvider'

export default function LoginPage() {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(phone, pin)
      } else {
        if (pin !== pinConfirm) {
          setError(t('login.pinMismatch'))
          setLoading(false)
          return
        }
        await register(name, phone, pin, pinConfirm)
      }
      navigate('/')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
      setError(msg?.errors?.phone?.[0] || msg?.message || t('login.authFailed'))
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="label">{t('login.fullName')}</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input" required />
              </div>
            )}
            <div>
              <label className="label">{t('login.phoneNumber')}</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('login.phonePlaceholder')} className="input" required />
            </div>
            <div>
              <label className="label">{t('login.pin')}</label>
              <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} maxLength={6} minLength={4} className="input" required />
            </div>
            {mode === 'register' && (
              <div>
                <label className="label">{t('login.confirmPin')}</label>
                <input type="password" value={pinConfirm} onChange={(e) => setPinConfirm(e.target.value)} maxLength={6} minLength={4} className="input" required />
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? t('login.pleaseWait') : mode === 'login' ? t('common.signIn') : t('login.createAccount')}
            </button>
          </form>

          {mode === 'login' && (
            <p className="text-xs text-roma-muted mt-4 text-center">
              {t('login.forgotPin')} <Link to="/contact" className="text-primary hover:underline">{t('login.whatsappSupportLink')}</Link>.
            </p>
          )}
        </div>
      </div>
    </Layout>
  )
}
