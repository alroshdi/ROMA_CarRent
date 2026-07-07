import { useEffect, useState } from 'react'
import { Settings, Save } from 'lucide-react'
import api from '../../lib/api'
import { useTranslation } from '../../i18n/LanguageProvider'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminFormCard from '../../components/admin/AdminFormCard'

export default function AdminSettingsPage() {
  const { t } = useTranslation()
  const [driverDailyRate, setDriverDailyRate] = useState('25')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    api.get('/admin/settings')
      .then(({ data }) => setDriverDailyRate(String(data.driver_daily_rate ?? 25)))
      .catch(() => setError(t('admin.settingsLoadFailed')))
      .finally(() => setLoading(false))
  }, [t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)
    try {
      const { data } = await api.put('/admin/settings', {
        driver_daily_rate: parseFloat(driverDailyRate),
      })
      setDriverDailyRate(String(data.driver_daily_rate))
      setSuccess(t('admin.settingsSaved'))
    } catch {
      setError(t('admin.settingsSaveFailed'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-roma-muted animate-pulse">{t('common.loading')}</div>
  }

  return (
    <div className="max-w-2xl">
      <AdminPageHeader icon={Settings} title={t('admin.settings')} subtitle={t('admin.settingsSubtitle')} />

      {error && <div className="alert-error mb-4">{error}</div>}
      {success && <div className="alert-success mb-4">{success}</div>}

      <form onSubmit={handleSubmit}>
        <AdminFormCard>
          <div className="flex items-start gap-4">
            <div className="feature-icon-ring w-12 h-12 shrink-0">
              <Settings className="w-5 h-5 text-primary" strokeWidth={1.75} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                {t('admin.driverDailyRateTitle')}
              </h2>
              <p className="text-sm text-roma-muted mb-4">{t('admin.driverDailyRateHint')}</p>
              <label className="label" htmlFor="driver-daily-rate">{t('admin.driverDailyRateLabel')}</label>
              <div className="flex gap-3 items-end">
                <input
                  id="driver-daily-rate"
                  type="number"
                  min={0}
                  step="0.01"
                  value={driverDailyRate}
                  onChange={(e) => setDriverDailyRate(e.target.value)}
                  className="input max-w-xs"
                  dir="ltr"
                  required
                />
                <span className="text-sm text-roma-muted pb-2.5">{t('common.omrPerDay')}</span>
              </div>
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary py-3 px-6 mt-6">
            <Save className="w-4 h-4" />
            {saving ? t('admin.savingSettings') : t('admin.saveSettings')}
          </button>
        </AdminFormCard>
      </form>
    </div>
  )
}
