import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, UserCircle } from 'lucide-react'
import api from '../../lib/api'
import type { Driver } from '../../types'
import { useTranslation } from '../../i18n/LanguageProvider'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminFormCard from '../../components/admin/AdminFormCard'
import AdminTableShell from '../../components/admin/AdminTableShell'
import ConfirmModal from '../../components/ConfirmModal'

const empty = { name: '', phone: '', license_number: '', status: 'active' as const }
const fieldKeys = ['name', 'phone', 'license_number'] as const

export default function AdminDriversPage() {
  const { t, tStatus } = useTranslation()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [editing, setEditing] = useState<Partial<Driver> | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetch = () => api.get('/admin/drivers').then(({ data }) => setDrivers(data.drivers || []))
  useEffect(() => { fetch() }, [])

  const save = async () => {
    if (!editing) return
    if (editing.id) await api.put(`/admin/drivers/${editing.id}`, editing)
    else await api.post('/admin/drivers', editing)
    setShowForm(false); setEditing(null); fetch()
  }

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return
    setDeleting(true)
    try {
      await api.delete(`/admin/drivers/${deleteTarget.id}`)
      setDeleteTarget(null)
      fetch()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <ConfirmModal
        open={!!deleteTarget}
        title={t('common.delete')}
        message={deleteTarget ? t('admin.deleteDriverNamed', { name: deleteTarget.name }) : t('admin.deleteDriver')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />
      <AdminPageHeader
        icon={UserCircle}
        title={t('admin.drivers')}
        subtitle={t('admin.driversSubtitle')}
        action={
          <button onClick={() => { setEditing(empty); setShowForm(true) }} className="btn-primary text-sm px-5 py-2.5">
            <Plus className="w-4 h-4" /> {t('admin.addDriver')}
          </button>
        }
      />

      {showForm && editing && (
        <AdminFormCard>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fieldKeys.map((f) => (
              <div key={f}>
                <label className="label">{t(`admin.fields.${f}`)}</label>
                <input value={(editing as Record<string, string>)[f] || ''} onChange={(e) => setEditing({ ...editing, [f]: e.target.value })} className="input text-sm" dir={f === 'phone' ? 'ltr' : undefined} />
              </div>
            ))}
            <div>
              <label className="label">{t('admin.fields.status')}</label>
              <select value={editing.status || 'active'} onChange={(e) => setEditing({ ...editing, status: e.target.value as Driver['status'] })} className="input text-sm">
                <option value="active">{t('common.active')}</option>
                <option value="inactive">{t('common.inactive')}</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-5 pt-4 border-t border-roma-border">
            <button onClick={save} className="btn-primary text-sm px-5 py-2">{t('common.save')}</button>
            <button onClick={() => { setShowForm(false); setEditing(null) }} className="btn-secondary text-sm px-5 py-2">{t('common.cancel')}</button>
          </div>
        </AdminFormCard>
      )}

      <AdminTableShell>
        <table className="w-full text-sm table-shell border-0 rounded-none">
          <thead><tr><th>{t('common.name')}</th><th>{t('common.phone')}</th><th>{t('admin.license')}</th><th>{t('common.status')}</th><th className="text-end">{t('common.actions')}</th></tr></thead>
          <tbody className="text-roma-muted">
            {drivers.map((d) => (
              <tr key={d.id}>
                <td className="font-medium text-white">{d.name}</td>
                <td dir="ltr">{d.phone}</td>
                <td>{d.license_number}</td>
                <td><span className={`badge border ${d.status === 'active' ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/40' : 'bg-roma-elevated text-roma-muted border-roma-border'}`}>{tStatus(d.status)}</span></td>
                <td className="text-end">
                  <button onClick={() => { setEditing(d); setShowForm(true) }} className="p-2 rounded-lg text-primary hover:bg-primary/10 me-1"><Pencil className="w-4 h-4 inline" /></button>
                  <button onClick={() => setDeleteTarget(d)} className="p-2 rounded-lg text-red-400 hover:bg-red-950/30"><Trash2 className="w-4 h-4 inline" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableShell>
    </div>
  )
}
