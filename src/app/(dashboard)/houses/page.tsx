'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, isDemo } from '@/lib/supabase/client'
import { DEMO_HOUSES } from '@/lib/demo-data'
import type { House, HouseType } from '@/types/database'
import { HOUSE_TYPE_LABELS } from '@/types/database'
import EmptyState from '@/components/EmptyState'
import Modal from '@/components/Modal'
import { Home, Plus, MapPin } from 'lucide-react'

export default function HousesPage() {
  const router = useRouter()
  const supabase = isDemo() ? null : createClient()

  const [houses, setHouses] = useState<House[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    house_type: 'house' as HouseType,
    area: '',
    year_built: '',
  })

  useEffect(() => {
    loadHouses()
  }, [])

  async function loadHouses() {
    setLoading(true)
    if (isDemo()) {
      setHouses(DEMO_HOUSES)
      setLoading(false)
      return
    }
    const { data } = await supabase!
      .from('houses')
      .select('*')
      .order('created_at', { ascending: false })

    setHouses(data || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isDemo()) {
      setModalOpen(false)
      return
    }
    setSubmitting(true)

    const { data: { user } } = await supabase!.auth.getUser()
    if (!user) return

    const { error } = await supabase!.from('houses').insert({
      name: formData.name,
      address: formData.address || null,
      city: formData.city || null,
      house_type: formData.house_type,
      area: formData.area ? Number(formData.area) : null,
      year_built: formData.year_built ? Number(formData.year_built) : null,
      user_id: user.id,
    })

    setSubmitting(false)

    if (!error) {
      setModalOpen(false)
      setFormData({ name: '', address: '', city: '', house_type: 'house', area: '', year_built: '' })
      loadHouses()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    )
  }

  return (
    <div>
      {isDemo() && (
        <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Демо-режим — данные показаны для примера. Подключите Supabase для полной функциональности.
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Мои дома</h1>
        <button onClick={() => setModalOpen(true)} className="btn-primary inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Добавить дом
        </button>
      </div>

      {houses.length === 0 ? (
        <EmptyState
          icon={Home}
          title="Нет домов"
          description="Добавьте свой первый дом, чтобы начать вести учёт систем и обслуживания."
          action={
            <button onClick={() => setModalOpen(true)} className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Добавить дом
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {houses.map((house) => (
            <div
              key={house.id}
              onClick={() => router.push(`/houses/${house.id}`)}
              className="card p-5 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <Home className="w-5 h-5 text-brand-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{house.name}</h3>
                  {house.city && (
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {house.city}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                <span>{HOUSE_TYPE_LABELS[house.house_type]}</span>
                {house.area && <span>{house.area} м²</span>}
                {house.year_built && <span>{house.year_built} г.</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Добавить дом">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Название *</label>
            <input
              type="text"
              required
              className="input"
              placeholder="Мой дом"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Адрес</label>
            <input
              type="text"
              className="input"
              placeholder="ул. Примерная, д. 1"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Город</label>
            <input
              type="text"
              className="input"
              placeholder="Москва"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Тип дома</label>
            <select
              className="input"
              value={formData.house_type}
              onChange={(e) => setFormData({ ...formData, house_type: e.target.value as HouseType })}
            >
              {(Object.entries(HOUSE_TYPE_LABELS) as [HouseType, string][]).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Площадь (м²)</label>
              <input
                type="number"
                className="input"
                placeholder="120"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Год постройки</label>
              <input
                type="number"
                className="input"
                placeholder="2020"
                value={formData.year_built}
                onChange={(e) => setFormData({ ...formData, year_built: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Отмена
            </button>
            <button type="submit" disabled={submitting || !formData.name} className="btn-primary">
              {submitting ? 'Сохранение...' : 'Добавить'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
