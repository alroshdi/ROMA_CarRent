import { useEffect, useState } from 'react'
import { KeyRound, Users } from 'lucide-react'
import api from '../../lib/api'
import type { Customer } from '../../types'
import { useTranslation } from '../../i18n/LanguageProvider'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminTableShell from '../../components/admin/AdminTableShell'

export default function AdminCustomersPage() {
  const { t } = useTranslation()
  const [customers, setCustomers] = useState<(Customer & { bookings_count?: number })[]>([])
  const [resetPin, setResetPin] = useState<string | null>(null)

  useEffect(() => {
    api.get('/admin/customers').then(({ data }) => setCustomers(data.customers))
  }, [])

  const handleResetPin = async (id: number) => {
    if (!confirm(t('admin.resetPinConfirm'))) return
    const { data } = await api.post(`/admin/customers/${id}/reset-pin`)
    setResetPin(data.new_pin)
    alert(t('admin.resetPinAlert', { pin: data.new_pin }))
  }

  const toggleActive = async (customer: Customer) => {
    await api.put(`/admin/customers/${customer.id}`, { is_active: !customer.is_active })
    setCustomers((prev) => prev.map((c) => c.id === customer.id ? { ...c, is_active: !c.is_active } : c))
  }

  return (
    <div>
      <AdminPageHeader icon={Users} title={t('admin.customers')} subtitle={t('admin.customersSubtitle')} />

      {resetPin && (
        <div className="alert-warning mb-6 card-elevated border-amber-800/40">
          {t('admin.lastGeneratedPin')} <strong className="text-white">{resetPin}</strong> — {t('admin.shareViaWhatsApp')}
        </div>
      )}

      <AdminTableShell>
        <table className="w-full text-sm table-shell border-0 rounded-none">
          <thead>
            <tr><th>{t('common.name')}</th><th>{t('common.phone')}</th><th>{t('admin.bookingsCount')}</th><th>{t('common.status')}</th><th className="text-end">{t('common.actions')}</th></tr>
          </thead>
          <tbody className="text-roma-muted">
            {customers.map((c) => (
              <tr key={c.id}>
                <td className="font-medium text-white">{c.name}</td>
                <td dir="ltr">{c.phone}</td>
                <td>{c.bookings_count ?? 0}</td>
                <td>
                  <span className={`badge border ${c.is_active ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50' : 'bg-red-950/60 text-red-300 border-red-800/50'}`}>
                    {c.is_active ? t('common.active') : t('common.disabled')}
                  </span>
                </td>
                <td className="text-end space-x-1">
                  <button onClick={() => handleResetPin(c.id)} className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-amber-400 hover:bg-amber-950/30 text-xs">
                    <KeyRound className="w-3.5 h-3.5" /> {t('admin.resetPin')}
                  </button>
                  <button onClick={() => toggleActive(c)} className="px-2 py-1.5 rounded-lg text-xs text-roma-muted hover:text-primary hover:bg-roma-elevated">
                    {c.is_active ? t('common.disable') : t('common.enable')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableShell>
    </div>
  )
}
