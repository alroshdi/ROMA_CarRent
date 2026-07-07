import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Car } from 'lucide-react'
import api from '../../lib/api'
import type { Car as CarType } from '../../types'
import { useTranslation } from '../../i18n/LanguageProvider'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminFormCard from '../../components/admin/AdminFormCard'
import AdminTableShell from '../../components/admin/AdminTableShell'

const emptyCar = { name: '', brand: '', model: '', plate_number: '', daily_price: '', status: 'available' as const, features: { seats: 5, transmission: 'Automatic', fuel: 'Petrol' }, images: [] as string[] }

const fieldKeys = ['name', 'brand', 'model', 'plate_number', 'daily_price'] as const

export default function AdminCarsPage() {
  const { t, tStatus } = useTranslation()
  const [cars, setCars] = useState<CarType[]>([])
  const [editing, setEditing] = useState<Partial<CarType> | null>(null)
  const [showForm, setShowForm] = useState(false)

  const fetch = () => api.get('/admin/cars').then(({ data }) => setCars(data.cars || []))
  useEffect(() => { fetch() }, [])

  const save = async () => {
    if (!editing) return
    const payload = { ...editing, daily_price: Number(editing.daily_price), features: editing.features || {} }
    if (editing.id) await api.put(`/admin/cars/${editing.id}`, payload)
    else await api.post('/admin/cars', payload)
    setShowForm(false)
    setEditing(null)
    fetch()
  }

  const remove = async (id: number) => {
    if (!confirm(t('admin.deleteCar'))) return
    await api.delete(`/admin/cars/${id}`)
    fetch()
  }

  return (
    <div>
      <AdminPageHeader
        icon={Car}
        title={t('admin.cars')}
        subtitle={t('admin.carsSubtitle')}
        action={
          <button onClick={() => { setEditing(emptyCar); setShowForm(true) }} className="btn-primary text-sm px-5 py-2.5">
            <Plus className="w-4 h-4" /> {t('admin.addCar')}
          </button>
        }
      />

      {showForm && editing && (
        <AdminFormCard>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fieldKeys.map((f) => (
              <div key={f}>
                <label className="label">{t(`admin.fields.${f}`)}</label>
                <input value={(editing as Record<string, unknown>)[f] as string || ''} onChange={(e) => setEditing({ ...editing, [f]: e.target.value })} className="input text-sm" />
              </div>
            ))}
            <div>
              <label className="label">{t('admin.fields.status')}</label>
              <select value={editing.status || 'available'} onChange={(e) => setEditing({ ...editing, status: e.target.value as CarType['status'] })} className="input text-sm">
                <option value="available">{t('status.available')}</option>
                <option value="maintenance">{t('status.maintenance')}</option>
                <option value="inactive">{t('status.inactive')}</option>
              </select>
            </div>
            <div>
              <label className="label">{t('admin.fields.imageUrl')}</label>
              <input value={editing.images?.[0] || ''} onChange={(e) => setEditing({ ...editing, images: [e.target.value] })} className="input text-sm" dir="ltr" />
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
          <thead>
            <tr>
              <th>{t('common.name')}</th>
              <th>{t('admin.plate')}</th>
              <th>{t('admin.pricePerDay')}</th>
              <th>{t('common.status')}</th>
              <th className="text-end">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="text-roma-muted">
            {cars.map((car) => (
              <tr key={car.id}>
                <td className="font-medium text-white">{car.name}</td>
                <td>{car.plate_number}</td>
                <td className="text-white">{parseFloat(car.daily_price).toFixed(2)} {t('common.omr')}</td>
                <td><span className="badge border bg-roma-dark text-roma-muted border-roma-border">{tStatus(car.status)}</span></td>
                <td className="text-end">
                  <button onClick={() => { setEditing(car); setShowForm(true) }} className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors me-1"><Pencil className="w-4 h-4 inline" /></button>
                  <button onClick={() => remove(car.id)} className="p-2 rounded-lg text-red-400 hover:bg-red-950/30 transition-colors"><Trash2 className="w-4 h-4 inline" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableShell>
    </div>
  )
}
