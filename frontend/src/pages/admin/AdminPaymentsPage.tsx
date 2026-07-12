import { useEffect, useState } from 'react'
import { CreditCard } from 'lucide-react'
import api from '../../lib/api'
import type { Payment } from '../../types'
import { useTranslation } from '../../i18n/LanguageProvider'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminTableShell from '../../components/admin/AdminTableShell'

export default function AdminPaymentsPage() {
  const { t, formatDate, tStatus } = useTranslation()
  const [payments, setPayments] = useState<(Payment & { booking?: { id: number; car?: { name: string } } })[]>([])

  useEffect(() => {
    api.get('/admin/payments').then(({ data }) => setPayments(data.data || data.payments || []))
  }, [])

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      paid: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50',
      initiated: 'bg-amber-950/60 text-amber-300 border-amber-800/50',
      failed: 'bg-red-950/60 text-red-300 border-red-800/50',
      refunded: 'bg-roma-elevated text-roma-muted border-roma-border',
    }
    return map[s] || 'bg-roma-elevated text-roma-muted border-roma-border'
  }

  return (
    <div>
      <AdminPageHeader icon={CreditCard} title={t('admin.payments')} subtitle={t('admin.paymentsSubtitle')} />

      <AdminTableShell>
        <table className="w-full text-sm table-shell border-0 rounded-none">
          <thead>
            <tr><th>ID</th><th>{t('common.booking')}</th><th>{t('admin.gateway')}</th><th>{t('common.amount')}</th><th>{t('admin.session')}</th><th>{t('common.status')}</th><th>{t('common.date')}</th></tr>
          </thead>
          <tbody className="text-roma-muted">
            {payments.map((p) => (
              <tr key={p.id}>
                <td className="text-primary font-bold">{p.id}</td>
                <td className="text-white">#{p.booking?.id || p.booking_id} — {p.booking?.car?.name}</td>
                <td className="capitalize">{p.gateway}</td>
                <td className="font-semibold text-white">{parseFloat(p.amount).toFixed(2)} {p.currency || t('common.omr')}</td>
                <td className="text-xs font-mono text-roma-subtle">{p.external_session_id?.slice(0, 16)}…</td>
                <td><span className={`badge border ${statusColor(p.status)}`}>{tStatus(p.status)}</span></td>
                <td>{(p as Payment & { created_at?: string }).created_at ? formatDate((p as Payment & { created_at: string }).created_at, 'MMM d, yyyy') : t('common.notAvailable')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableShell>
    </div>
  )
}
