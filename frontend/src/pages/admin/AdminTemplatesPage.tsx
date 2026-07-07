import { useEffect, useRef, useState } from 'react'
import { Plus, Pencil, Trash2, FileText, Upload, Download } from 'lucide-react'
import api from '../../lib/api'
import type { ContractTemplate } from '../../types'
import { useTranslation } from '../../i18n/LanguageProvider'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminFormCard from '../../components/admin/AdminFormCard'
import ConfirmModal from '../../components/ConfirmModal'

type EditForm = {
  id?: number
  title: string
  is_active: boolean
  has_pdf?: boolean
}

export default function AdminTemplatesPage() {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [editing, setEditing] = useState<EditForm | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<ContractTemplate | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetch = () => api.get('/admin/contract-templates').then(({ data }) => setTemplates(data.templates || data.contract_templates || []))
  useEffect(() => { fetch() }, [])

  const openCreate = () => {
    setEditing({ title: t('admin.standardAgreement'), is_active: true })
    setPdfFile(null)
    setError('')
    setShowForm(true)
  }

  const openEdit = (tmpl: ContractTemplate) => {
    setEditing({ id: tmpl.id, title: tmpl.title, is_active: tmpl.is_active, has_pdf: tmpl.has_pdf })
    setPdfFile(null)
    setError('')
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditing(null)
    setPdfFile(null)
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const save = async () => {
    if (!editing) return
    if (!editing.id && !pdfFile) {
      setError(t('admin.templatePdfRequired'))
      return
    }

    setSaving(true)
    setError('')

    const formData = new FormData()
    formData.append('title', editing.title.trim())
    formData.append('is_active', editing.is_active ? '1' : '0')
    if (pdfFile) formData.append('pdf', pdfFile)

    try {
      if (editing.id) {
        await api.put(`/admin/contract-templates/${editing.id}`, formData)
      } else {
        await api.post('/admin/contract-templates', formData)
      }
      closeForm()
      fetch()
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
      const firstFieldError = res?.errors ? Object.values(res.errors).flat()[0] : null
      setError(firstFieldError || res?.message || t('admin.templateSaveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const downloadTemplate = async (id: number, title: string) => {
    try {
      const { data } = await api.get(`/admin/contract-templates/${id}/pdf`, { responseType: 'blob' })
      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = `${title.replace(/\s+/g, '_')}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      setError(t('admin.templateDownloadFailed'))
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return
    setDeleting(true)
    try {
      await api.delete(`/admin/contract-templates/${deleteTarget.id}`)
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
        message={deleteTarget ? t('admin.deleteTemplateNamed', { name: deleteTarget.title }) : t('admin.deleteTemplate')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />

      <AdminPageHeader
        icon={FileText}
        title={t('admin.templates')}
        subtitle={t('admin.templatesSubtitlePdf')}
        action={
          <button onClick={openCreate} className="btn-primary text-sm px-5 py-2.5">
            <Plus className="w-4 h-4" /> {t('admin.addTemplate')}
          </button>
        }
      />

      {error && !showForm && <div className="alert-error mb-6">{error}</div>}

      {showForm && editing && (
        <AdminFormCard>
          <div className="space-y-4">
            <div>
              <label className="label">{t('common.title')}</label>
              <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="input text-sm" required />
            </div>

            <div>
              <label className="label">{t('admin.templatePdf')}</label>
              {editing.has_pdf && !pdfFile && (
                <p className="text-xs text-roma-muted mb-2">{t('admin.templatePdfCurrent')}</p>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border-2 border-dashed border-roma-border hover:border-primary/40 bg-roma-dark/40 p-6 text-center transition-colors group"
              >
                <Upload className="w-8 h-8 text-roma-subtle group-hover:text-primary mx-auto mb-2 transition-colors" />
                <p className="text-sm font-medium text-white">
                  {pdfFile ? pdfFile.name : (editing.id ? t('admin.replaceTemplatePdf') : t('admin.uploadTemplatePdf'))}
                </p>
                <p className="text-xs text-roma-muted mt-1">{t('admin.templatePdfHint')}</p>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-roma-muted cursor-pointer">
              <input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} className="accent-primary w-4 h-4 rounded" />
              {t('common.active')}
            </label>
          </div>

          {error && <div className="alert-error mt-4">{error}</div>}

          <div className="flex gap-2 mt-5 pt-4 border-t border-roma-border">
            <button type="button" onClick={save} disabled={saving} className="btn-primary text-sm px-5 py-2">
              {saving ? t('profile.saving') : t('common.save')}
            </button>
            <button type="button" onClick={closeForm} className="btn-secondary text-sm px-5 py-2">{t('common.cancel')}</button>
          </div>
        </AdminFormCard>
      )}

      <div className="space-y-3">
        {templates.length === 0 && (
          <div className="card-elevated p-8 text-center text-roma-muted text-sm">{t('admin.noTemplates')}</div>
        )}
        {templates.map((tmpl) => (
          <div key={tmpl.id} className="card-elevated p-4 md:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-primary/30 transition-colors group">
            <div className="min-w-0">
              <h3 className="font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{tmpl.title}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className={`badge border text-[10px] ${tmpl.is_active ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/40' : 'bg-roma-elevated text-roma-subtle border-roma-border'}`}>
                  {tmpl.is_active ? t('common.active') : t('common.inactive')}
                </span>
                {tmpl.has_pdf ? (
                  <span className="badge border text-[10px] bg-red-950/40 text-primary border-primary/30">PDF</span>
                ) : (
                  <span className="badge border text-[10px] bg-amber-950/40 text-amber-300 border-amber-800/40">HTML</span>
                )}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              {tmpl.has_pdf && (
                <button
                  type="button"
                  onClick={() => downloadTemplate(tmpl.id, tmpl.title)}
                  className="p-2 rounded-lg text-roma-muted hover:text-white hover:bg-roma-elevated"
                  title={t('admin.downloadTemplatePdf')}
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => openEdit(tmpl)} className="p-2 rounded-lg text-primary hover:bg-primary/10"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => setDeleteTarget(tmpl)} className="p-2 rounded-lg text-red-400 hover:bg-red-950/30"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
