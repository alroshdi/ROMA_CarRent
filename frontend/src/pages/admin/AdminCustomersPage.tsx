import { useEffect, useState } from 'react'
import { KeyRound, Users, Pencil, IdCard } from 'lucide-react'
import api from '../../lib/api'
import type { Customer } from '../../types'
import { useTranslation } from '../../i18n/LanguageProvider'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminFormCard from '../../components/admin/AdminFormCard'
import AdminTableShell from '../../components/admin/AdminTableShell'
import ConfirmModal from '../../components/ConfirmModal'
import AdminTableState from '../../components/admin/AdminTableState'
import ResultModal from '../../components/ResultModal'

type AdminCustomer = Customer & {
  bookings_count?: number
  created_at?: string
  updated_at?: string
}

type EditCustomerForm = Partial<AdminCustomer> & { pin?: string }

export default function AdminCustomersPage() {
  const { t, formatDate } = useTranslation()
  const [customers, setCustomers] = useState<AdminCustomer[]>([])
  const [editing, setEditing] = useState<EditCustomerForm | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [resetPinTarget, setResetPinTarget] = useState<AdminCustomer | null>(null)
  const [resettingPin, setResettingPin] = useState(false)
  const [pinResult, setPinResult] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const fetchCustomers = () => {
    setLoading(true)
    setLoadError('')
    return api.get('/admin/customers')
      .then(({ data }) => setCustomers(data.customers))
      .catch(() => setLoadError(t('common.loadError')))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const openEdit = (customer: AdminCustomer) => {
    setEditing({
      id: customer.id,
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone,
      is_active: customer.is_active,
    })
    setError('')
    setShowForm(true)
  }

  const save = async () => {
    if (!editing?.id) return
    setError('')
    setSaving(true)

    try {
      const payload: Record<string, string | boolean> = {
        name: editing.name?.trim() || '',
        phone: editing.phone?.trim() || '',
        email: editing.email?.trim() || '',
        is_active: editing.is_active ?? true,
      }

      if (editing.pin?.trim()) {
        payload.pin = editing.pin.trim()
      }

      const { data } = await api.put(`/admin/customers/${editing.id}`, payload)
      setCustomers((prev) => prev.map((c) => (c.id === editing.id ? data.customer : c)))
      setShowForm(false)
      setEditing(null)
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
      const firstFieldError = res?.errors ? Object.values(res.errors).flat()[0] : null
      setError(firstFieldError || res?.message || t('admin.customerSaveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const confirmResetPin = async () => {
    if (!resetPinTarget) return
    setResettingPin(true)
    try {
      const { data } = await api.post(`/admin/customers/${resetPinTarget.id}/reset-pin`)
      setCustomers((prev) => prev.map((c) => (c.id === resetPinTarget.id ? data.customer : c)))
      setPinResult(data.new_pin)
      setResetPinTarget(null)
    } catch {
      setError(t('admin.pinResetFailed'))
      setResetPinTarget(null)
    } finally {
      setResettingPin(false)
    }
  }

  const toggleActive = async (customer: AdminCustomer) => {
    const { data } = await api.put(`/admin/customers/${customer.id}`, { is_active: !customer.is_active })
    setCustomers((prev) => prev.map((c) => (c.id === customer.id ? data.customer : c)))
  }

  const viewLicense = async (customerId: number) => {
    try {
      const { data } = await api.get(`/admin/customers/${customerId}/license`, { responseType: 'blob' })
      const url = URL.createObjectURL(data)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch {
      setError(t('admin.licenseViewFailed'))
    }
  }

  return (
    <div>
      <AdminPageHeader icon={Users} title={t('admin.customers')} subtitle={t('admin.customersSubtitle')} />

      <ConfirmModal
        open={!!resetPinTarget}
        title={t('admin.resetPin')}
        message={resetPinTarget ? t('admin.resetPinConfirmNamed', { name: resetPinTarget.name }) : t('admin.resetPinConfirm')}
        confirmLabel={t('admin.resetPin')}
        cancelLabel={t('common.cancel')}
        loading={resettingPin}
        onConfirm={confirmResetPin}
        onCancel={() => !resettingPin && setResetPinTarget(null)}
      />

      <ResultModal
        open={!!pinResult}
        title={t('admin.pinResetDone')}
        message={t('admin.resetPinResult', { pin: pinResult ?? '' })}
        variant="success"
        whatsappMessage={pinResult ? t('admin.sharePinWhatsApp', { pin: pinResult }) : undefined}
        onClose={() => setPinResult(null)}
      />

      {error && !showForm && <div className="alert-error mb-6">{error}</div>}

      {showForm && editing && (
        <AdminFormCard>
          <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            {t('admin.editCustomer')}
          </h3>
          {error && <div className="alert-error mb-4">{error}</div>}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">{t('common.name')}</label>
              <input className="input" value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">{t('common.email')}</label>
              <input type="email" className="input" dir="ltr" value={editing.email || ''} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
            </div>
            <div>
              <label className="label">{t('common.phone')}</label>
              <input type="tel" className="input" dir="ltr" value={editing.phone || ''} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} required />
            </div>
            <div>
              <label className="label">{t('admin.pinCode')}</label>
              <input
                type="text"
                className="input font-mono tracking-widest"
                dir="ltr"
                maxLength={6}
                value={editing.pin || ''}
                onChange={(e) => setEditing({ ...editing, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                placeholder={t('admin.pinPlaceholder')}
              />
              <p className="text-xs text-roma-muted mt-1.5">{t('admin.pinEditHint')}</p>
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-roma-muted">
                <input
                  type="checkbox"
                  checked={editing.is_active ?? true}
                  onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                  className="w-4 h-4 accent-primary rounded"
                />
                {t('admin.activeAccount')}
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-5 pt-4 border-t border-roma-border">
            <button type="button" onClick={save} disabled={saving} className="btn-primary text-sm px-5 py-2">
              {saving ? t('profile.saving') : t('common.save')}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); setError('') }} className="btn-secondary text-sm px-5 py-2">
              {t('common.cancel')}
            </button>
          </div>
        </AdminFormCard>
      )}

      <AdminTableShell>
        <table className="w-full text-sm table-shell border-0 rounded-none min-w-[960px]">
          <thead>
            <tr>
              <th>{t('common.name')}</th>
              <th>{t('common.phone')}</th>
              <th>{t('common.email')}</th>
              <th>{t('admin.pinCode')}</th>
              <th>{t('admin.drivingLicense')}</th>
              <th>{t('admin.bookingsCount')}</th>
              <th>{t('admin.registeredAt')}</th>
              <th>{t('common.status')}</th>
              <th className="text-end">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="text-roma-muted">
            <AdminTableState colSpan={9} loading={loading} error={loadError} empty={!loading && !loadError && customers.length === 0} onRetry={fetchCustomers} />
            {!loading && !loadError && customers.map((c) => (
              <tr key={c.id}>
                <td className="font-medium text-white whitespace-nowrap">{c.name}</td>
                <td dir="ltr" className="whitespace-nowrap">{c.phone}</td>
                <td dir="ltr" className="max-w-[180px] truncate">{c.email || '—'}</td>
                <td>
                  <span className="text-roma-subtle text-xs">{t('admin.pinHidden')}</span>
                </td>
                <td>
                  {c.has_driving_license ? (
                    <button
                      type="button"
                      onClick={() => viewLicense(c.id)}
                      className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                    >
                      <IdCard className="w-3.5 h-3.5" />
                      {t('admin.viewLicense')}
                    </button>
                  ) : (
                    <span className="text-roma-subtle text-xs">—</span>
                  )}
                </td>
                <td>{c.bookings_count ?? 0}</td>
                <td className="whitespace-nowrap text-xs">{c.created_at ? formatDate(c.created_at, 'MMM d, yyyy') : '—'}</td>
                <td>
                  <span className={`badge border ${c.is_active ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50' : 'bg-red-950/60 text-red-300 border-red-800/50'}`}>
                    {c.is_active ? t('common.active') : t('common.disabled')}
                  </span>
                </td>
                <td className="text-end">
                  <div className="flex flex-wrap justify-end gap-1">
                    <button type="button" onClick={() => openEdit(c)} className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-primary hover:bg-primary/10 text-xs">
                      <Pencil className="w-3.5 h-3.5" /> {t('common.edit')}
                    </button>
                    <button type="button" onClick={() => setResetPinTarget(c)} className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-amber-400 hover:bg-amber-950/30 text-xs">
                      <KeyRound className="w-3.5 h-3.5" /> {t('admin.resetPin')}
                    </button>
                    <button type="button" onClick={() => toggleActive(c)} className="px-2 py-1.5 rounded-lg text-xs text-roma-muted hover:text-primary hover:bg-roma-elevated">
                      {c.is_active ? t('common.disable') : t('common.enable')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableShell>
    </div>
  )
}
