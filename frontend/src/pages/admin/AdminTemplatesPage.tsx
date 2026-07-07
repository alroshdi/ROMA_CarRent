import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, FileText } from 'lucide-react'
import api from '../../lib/api'
import type { ContractTemplate } from '../../types'
import { useTranslation } from '../../i18n/LanguageProvider'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminFormCard from '../../components/admin/AdminFormCard'

const defaultContent = `<h2>Car Rental Agreement</h2>
<p>This agreement is between ROMA CAR and {{customer_name}} (Phone: {{customer_phone}}).</p>
<p><strong>Vehicle:</strong> {{car_name}} ({{car_plate}})</p>
<p><strong>Rental Period:</strong> {{pickup_date}} to {{return_date}}</p>
<p><strong>Pickup Location:</strong> {{pickup_location}}</p>
<p><strong>Drop-off Location:</strong> {{dropoff_location}}</p>
<p><strong>Total Price:</strong> {{total_price}} OMR</p>
<p>The customer acknowledges the accuracy of their details and agrees to the terms and conditions of this rental agreement.</p>`

export default function AdminTemplatesPage() {
  const { t } = useTranslation()
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [editing, setEditing] = useState<Partial<ContractTemplate> | null>(null)
  const [showForm, setShowForm] = useState(false)

  const fetch = () => api.get('/admin/contract-templates').then(({ data }) => setTemplates(data.templates || data.contract_templates || []))
  useEffect(() => { fetch() }, [])

  const save = async () => {
    if (!editing) return
    if (editing.id) await api.put(`/admin/contract-templates/${editing.id}`, editing)
    else await api.post('/admin/contract-templates', editing)
    setShowForm(false); setEditing(null); fetch()
  }

  const remove = async (id: number) => {
    if (!confirm(t('admin.deleteTemplate'))) return
    await api.delete(`/admin/contract-templates/${id}`)
    fetch()
  }

  return (
    <div>
      <AdminPageHeader
        icon={FileText}
        title={t('admin.templates')}
        subtitle={t('admin.templatesSubtitle')}
        action={
          <button onClick={() => { setEditing({ title: t('admin.standardAgreement'), content: defaultContent, is_active: true }); setShowForm(true) }} className="btn-primary text-sm px-5 py-2.5">
            <Plus className="w-4 h-4" /> {t('admin.addTemplate')}
          </button>
        }
      />

      {showForm && editing && (
        <AdminFormCard>
          <div className="space-y-4">
            <div>
              <label className="label">{t('common.title')}</label>
              <input value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="input text-sm" />
            </div>
            <div>
              <label className="label">{t('admin.contentHint')}</label>
              <textarea value={editing.content || ''} onChange={(e) => setEditing({ ...editing, content: e.target.value })} rows={12} className="input text-sm font-mono resize-y" dir="ltr" />
            </div>
            <label className="flex items-center gap-2 text-sm text-roma-muted cursor-pointer">
              <input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} className="accent-primary w-4 h-4 rounded" />
              {t('common.active')}
            </label>
          </div>
          <div className="flex gap-2 mt-5 pt-4 border-t border-roma-border">
            <button onClick={save} className="btn-primary text-sm px-5 py-2">{t('common.save')}</button>
            <button onClick={() => { setShowForm(false); setEditing(null) }} className="btn-secondary text-sm px-5 py-2">{t('common.cancel')}</button>
          </div>
        </AdminFormCard>
      )}

      <div className="space-y-3">
        {templates.map((tmpl) => (
          <div key={tmpl.id} className="card-elevated p-4 md:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-primary/30 transition-colors group">
            <div>
              <h3 className="font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{tmpl.title}</h3>
              <span className={`inline-block mt-1.5 badge border text-[10px] ${tmpl.is_active ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/40' : 'bg-roma-elevated text-roma-subtle border-roma-border'}`}>
                {tmpl.is_active ? t('common.active') : t('common.inactive')}
              </span>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => { setEditing(tmpl); setShowForm(true) }} className="p-2 rounded-lg text-primary hover:bg-primary/10"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => remove(tmpl.id)} className="p-2 rounded-lg text-red-400 hover:bg-red-950/30"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
