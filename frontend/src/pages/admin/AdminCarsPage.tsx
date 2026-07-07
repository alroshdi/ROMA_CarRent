import { useEffect, useRef, useState } from 'react'
import { Plus, Pencil, Trash2, Car, Upload } from 'lucide-react'
import api from '../../lib/api'
import type { Car as CarType } from '../../types'
import { useTranslation } from '../../i18n/LanguageProvider'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminFormCard from '../../components/admin/AdminFormCard'
import AdminTableShell from '../../components/admin/AdminTableShell'
import ConfirmModal from '../../components/ConfirmModal'
import {
  CAR_BRANDS,
  CAR_FUEL_TYPES,
  CAR_STATUS_OPTIONS,
  CAR_TRANSMISSIONS,
  carStatusLabelKey,
  fuelLabelKey,
  transmissionLabelKey,
} from '../../lib/carOptions'

const emptyCar = {
  name: '',
  brand: 'Toyota',
  model: '',
  plate_number: '',
  daily_price: '',
  status: 'available' as const,
  features: { seats: 5, transmission: 'Automatic', fuel: 'Petrol' },
  images: [] as string[],
}

const textFields = ['name', 'model', 'plate_number', 'daily_price'] as const

export default function AdminCarsPage() {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [cars, setCars] = useState<CarType[]>([])
  const [editing, setEditing] = useState<Partial<CarType> | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<CarType | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetch = () => api.get('/admin/cars').then(({ data }) => setCars(data.cars || []))
  useEffect(() => { fetch() }, [])

  const closeForm = () => {
    setShowForm(false)
    setEditing(null)
    setImageFile(null)
    setImagePreview(null)
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const openCreate = () => {
    setEditing(emptyCar)
    setImageFile(null)
    setImagePreview(null)
    setError('')
    setShowForm(true)
  }

  const openEdit = (car: CarType) => {
    setEditing({
      ...car,
      brand: CAR_BRANDS.includes(car.brand as typeof CAR_BRANDS[number]) ? car.brand : 'Other',
      daily_price: String(car.daily_price),
      features: {
        seats: car.features?.seats ?? 5,
        transmission: CAR_TRANSMISSIONS.includes(String(car.features?.transmission) as typeof CAR_TRANSMISSIONS[number])
          ? String(car.features?.transmission)
          : 'Automatic',
        fuel: CAR_FUEL_TYPES.includes(String(car.features?.fuel) as typeof CAR_FUEL_TYPES[number])
          ? String(car.features?.fuel)
          : 'Petrol',
      },
    })
    setImageFile(null)
    setImagePreview(car.images?.[0] || null)
    setError('')
    setShowForm(true)
  }

  const save = async () => {
    if (!editing) return
    setSaving(true)
    setError('')

    const formData = new FormData()
    formData.append('name', editing.name?.trim() || '')
    formData.append('brand', editing.brand?.trim() || '')
    formData.append('model', editing.model?.trim() || '')
    formData.append('plate_number', editing.plate_number?.trim() || '')
    formData.append('daily_price', String(editing.daily_price || 0))
    formData.append('status', editing.status || 'available')
    formData.append('features', JSON.stringify(editing.features || {}))
    if (imageFile) formData.append('image', imageFile)

    try {
      if (editing.id) {
        await api.put(`/admin/cars/${editing.id}`, formData)
      } else {
        await api.post('/admin/cars', formData)
      }
      closeForm()
      fetch()
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
      const firstFieldError = res?.errors ? Object.values(res.errors).flat()[0] : null
      setError(firstFieldError || res?.message || t('admin.carSaveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const onImageChange = (file: File | null) => {
    setImageFile(file)
    if (file) {
      setImagePreview(URL.createObjectURL(file))
    } else if (editing?.images?.[0]) {
      setImagePreview(editing.images[0])
    } else {
      setImagePreview(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return
    setDeleting(true)
    try {
      await api.delete(`/admin/cars/${deleteTarget.id}`)
      setDeleteTarget(null)
      fetch()
    } finally {
      setDeleting(false)
    }
  }

  const featureVal = (car: CarType, key: 'seats' | 'transmission' | 'fuel') => {
    const v = car.features?.[key]
    if (v === undefined || v === null) return '—'
    if (key === 'transmission') return t(transmissionLabelKey(String(v)))
    if (key === 'fuel') return t(fuelLabelKey(String(v)))
    return String(v)
  }

  return (
    <div>
      <ConfirmModal
        open={!!deleteTarget}
        title={t('common.delete')}
        message={deleteTarget ? t('admin.deleteCarNamed', { name: deleteTarget.name }) : t('admin.deleteCar')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />

      <AdminPageHeader
        icon={Car}
        title={t('admin.cars')}
        subtitle={t('admin.carsSubtitle')}
        action={
          <button onClick={openCreate} className="btn-primary text-sm px-5 py-2.5">
            <Plus className="w-4 h-4" /> {t('admin.addCar')}
          </button>
        }
      />

      {showForm && editing && (
        <AdminFormCard>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {textFields.map((f) => (
              <div key={f}>
                <label className="label">{t(`admin.fields.${f}`)}</label>
                <input
                  value={(editing as Record<string, unknown>)[f] as string || ''}
                  onChange={(e) => setEditing({ ...editing, [f]: e.target.value })}
                  className="input text-sm"
                  dir={f === 'plate_number' || f === 'daily_price' ? 'ltr' : undefined}
                />
              </div>
            ))}

            <div>
              <label className="label">{t('admin.fields.brand')}</label>
              <select
                className="input text-sm"
                value={editing.brand || 'Toyota'}
                onChange={(e) => setEditing({ ...editing, brand: e.target.value })}
              >
                {CAR_BRANDS.map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">{t('admin.fields.status')}</label>
              <select
                className="input text-sm"
                value={editing.status || 'available'}
                onChange={(e) => setEditing({ ...editing, status: e.target.value as CarType['status'] })}
              >
                {CAR_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{t(carStatusLabelKey(status))}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">{t('admin.fields.seats')}</label>
              <input
                type="number"
                min={1}
                value={editing.features?.seats ?? 5}
                onChange={(e) => setEditing({ ...editing, features: { ...editing.features, seats: Number(e.target.value) || 5 } })}
                className="input text-sm"
              />
            </div>

            <div>
              <label className="label">{t('admin.fields.transmission')}</label>
              <select
                className="input text-sm"
                value={String(editing.features?.transmission ?? 'Automatic')}
                onChange={(e) => setEditing({ ...editing, features: { ...editing.features, transmission: e.target.value } })}
              >
                {CAR_TRANSMISSIONS.map((opt) => (
                  <option key={opt} value={opt}>{t(transmissionLabelKey(opt))}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">{t('admin.fields.fuel')}</label>
              <select
                className="input text-sm"
                value={String(editing.features?.fuel ?? 'Petrol')}
                onChange={(e) => setEditing({ ...editing, features: { ...editing.features, fuel: e.target.value } })}
              >
                {CAR_FUEL_TYPES.map((opt) => (
                  <option key={opt} value={opt}>{t(fuelLabelKey(opt))}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="label">{t('admin.carImage')}</label>
              <div className="flex flex-col sm:flex-row gap-4">
                {imagePreview && (
                  <img src={imagePreview} alt="" className="w-32 h-24 object-cover rounded-lg border border-roma-border shrink-0" />
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 rounded-xl border-2 border-dashed border-roma-border hover:border-primary/40 bg-roma-dark/40 p-5 text-center transition-colors group"
                >
                  <Upload className="w-7 h-7 text-roma-subtle group-hover:text-primary mx-auto mb-2 transition-colors" />
                  <p className="text-sm font-medium text-white">
                    {imageFile ? imageFile.name : (editing.id ? t('admin.replaceCarImage') : t('admin.uploadCarImage'))}
                  </p>
                  <p className="text-xs text-roma-muted mt-1">{t('admin.carImageHint')}</p>
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={(e) => onImageChange(e.target.files?.[0] || null)}
              />
            </div>
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

      <AdminTableShell>
        <table className="w-full text-sm table-shell border-0 rounded-none min-w-[1000px]">
          <thead>
            <tr>
              <th>{t('common.name')}</th>
              <th>{t('admin.fields.brand')}</th>
              <th>{t('admin.fields.model')}</th>
              <th>{t('admin.plate')}</th>
              <th>{t('admin.pricePerDay')}</th>
              <th>{t('admin.fields.seats')}</th>
              <th>{t('admin.fields.transmission')}</th>
              <th>{t('admin.fields.fuel')}</th>
              <th>{t('common.status')}</th>
              <th className="text-end">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="text-roma-muted">
            {cars.map((car) => (
              <tr key={car.id}>
                <td className="font-medium text-white whitespace-nowrap">{car.name}</td>
                <td>{car.brand}</td>
                <td>{car.model}</td>
                <td dir="ltr">{car.plate_number}</td>
                <td className="text-white whitespace-nowrap">{parseFloat(car.daily_price).toFixed(2)} {t('common.omr')}</td>
                <td>{featureVal(car, 'seats')}</td>
                <td>{featureVal(car, 'transmission')}</td>
                <td>{featureVal(car, 'fuel')}</td>
                <td>
                  <span className="badge border bg-roma-dark text-roma-muted border-roma-border">
                    {t(carStatusLabelKey(car.status))}
                  </span>
                </td>
                <td className="text-end whitespace-nowrap">
                  <button type="button" onClick={() => openEdit(car)} className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors me-1"><Pencil className="w-4 h-4 inline" /></button>
                  <button type="button" onClick={() => setDeleteTarget(car)} className="p-2 rounded-lg text-red-400 hover:bg-red-950/30 transition-colors"><Trash2 className="w-4 h-4 inline" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableShell>
    </div>
  )
}
