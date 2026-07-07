import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import Logo from '../../components/Logo'
import LanguageSwitcher from '../../components/LanguageSwitcher'
import api from '../../lib/api'
import { useTranslation } from '../../i18n/LanguageProvider'

export default function AdminLoginPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/admin/auth/login', { email, password })
      localStorage.setItem('admin_token', data.token)
      localStorage.setItem('admin', JSON.stringify(data.admin))
      navigate('/admin')
    } catch {
      setError(t('admin.invalidCredentials'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-roma-black relative overflow-hidden px-4">
      <div className="absolute top-4 end-4 z-10">
        <LanguageSwitcher />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(224,38,48,0.1),transparent_65%)]" />
      <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />

      <form onSubmit={handleSubmit} className="relative card-elevated p-8 md:p-10 w-full max-w-md border-primary/15">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="flex justify-center mb-6">
          <Logo height={52} to={false} />
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-primary" />
          <p className="text-center text-xs text-roma-subtle uppercase tracking-[0.2em] font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            {t('admin.access')}
          </p>
        </div>
        <p className="text-center text-sm text-roma-muted mb-6">{t('admin.loginHint')}</p>

        {error && <div className="alert-error mb-4">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="label">{t('common.email')}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" dir="ltr" required />
          </div>
          <div>
            <label className="label">{t('common.password')}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 mt-2">
            {loading ? t('admin.signingIn') : t('common.signIn')}
          </button>
        </div>
      </form>
    </div>
  )
}
