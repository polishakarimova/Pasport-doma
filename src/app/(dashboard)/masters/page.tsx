'use client'

import { useEffect, useState } from 'react'
import { createClient, isDemo } from '@/lib/supabase/client'
import { DEMO_MASTERS } from '@/lib/demo-data'
import type { Master, MaintenanceType } from '@/types/database'
import { MAINTENANCE_TYPE_LABELS } from '@/types/database'
import { formatDate, formatCurrency } from '@/lib/utils'
import Modal from '@/components/Modal'
import EmptyState from '@/components/EmptyState'
import { Users, Plus, Phone, Wrench, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

interface LogWithRelations {
  id: string
  date: string
  type: MaintenanceType
  comment: string | null
  cost: number | null
  systems: { name: string } | null
  houses: { name: string } | null
}

const MAINTENANCE_TYPE_COLORS: Record<MaintenanceType, string> = {
  maintenance: 'bg-blue-100 text-blue-700',
  repair: 'bg-orange-100 text-orange-700',
  installation: 'bg-green-100 text-green-700',
  inspection: 'bg-purple-100 text-purple-700',
  replacement: 'bg-red-100 text-red-700',
}

export default function MastersPage() {
  const supabase = isDemo() ? null : createClient()

  const [masters, setMasters] = useState<Master[]>([])
  const [loading, setLoading] = useState(true)

  // Expanded card
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [logsMap, setLogsMap] = useState<Record<string, LogWithRelations[]>>({})
  const [logsLoading, setLogsLoading] = useState<string | null>(null)

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMaster, setEditingMaster] = useState<Master | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    specialization: '',
    notes: '',
  })

  useEffect(() => {
    loadMasters()
  }, [])

  async function loadMasters() {
    setLoading(true)

    if (isDemo()) {
      setMasters(DEMO_MASTERS)
      setLoading(false)
      return
    }

    const {
      data: { user },
    } = await supabase!.auth.getUser()
    if (!user) return

    const { data: masters } = await supabase!
      .from('masters')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setMasters(masters || [])
    setLoading(false)
  }

  async function loadLogs(masterId: string) {
    if (logsMap[masterId]) return
    if (isDemo()) { setLogsMap((prev) => ({ ...prev, [masterId]: [] })); return }

    setLogsLoading(masterId)

    const { data: logs } = await supabase!
      .from('maintenance_logs')
      .select('*, systems(name), houses(name)')
      .eq('master_id', masterId)
      .order('date', { ascending: false })

    setLogsMap((prev) => ({
      ...prev,
      [masterId]: (logs as LogWithRelations[]) || [],
    }))
    setLogsLoading(null)
  }

  function handleToggleExpand(masterId: string) {
    if (expandedId === masterId) {
      setExpandedId(null)
    } else {
      setExpandedId(masterId)
      loadLogs(masterId)
    }
  }

  function openAddModal() {
    setEditingMaster(null)
    setFormData({ name: '', phone: '', specialization: '', notes: '' })
    setModalOpen(true)
  }

  function openEditModal(master: Master) {
    setEditingMaster(master)
    setFormData({
      name: master.name,
      phone: master.phone || '',
      specialization: master.specialization || '',
      notes: master.notes || '',
    })
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isDemo()) { setModalOpen(false); return }
    setSubmitting(true)

    const {
      data: { user },
    } = await supabase!.auth.getUser()
    if (!user) return

    const payload = {
      name: formData.name,
      phone: formData.phone || null,
      specialization: formData.specialization || null,
      notes: formData.notes || null,
    }

    if (editingMaster) {
      const { error } = await supabase!
        .from('masters')
        .update(payload)
        .eq('id', editingMaster.id)

      if (!error) {
        setModalOpen(false)
        setEditingMaster(null)
        loadMasters()
      }
    } else {
      const { error } = await supabase!
        .from('masters')
        .insert({ ...payload, user_id: user.id })

      if (!error) {
        setModalOpen(false)
        loadMasters()
      }
    }

    setSubmitting(false)
  }

  async function handleDelete(masterId: string) {
    if (!confirm('Удалить мастера? Это действие нельзя отменить.')) return
    if (isDemo()) return

    setDeleting(true)

    const { error } = await supabase!
      .from('masters')
      .delete()
      .eq('id', masterId)

    if (!error) {
      setModalOpen(false)
      setEditingMaster(null)
      setExpandedId(null)
      loadMasters()
    }

    setDeleting(false)
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Мастера</h1>
        <button
          onClick={openAddModal}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Добавить мастера
        </button>
      </div>

      {masters.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Нет мастеров"
          description="Добавьте мастеров и специалистов, которые обслуживают ваш дом."
          action={
            <button
              onClick={openAddModal}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Добавить мастера
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {masters.map((master) => {
            const isExpanded = expandedId === master.id
            const logs = logsMap[master.id]
            const isLoadingLogs = logsLoading === master.id

            return (
              <div key={master.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-gray-900">
                      {master.name}
                    </h3>

                    {master.phone && (
                      <a
                        href={`tel:${master.phone}`}
                        className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 mt-1"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {master.phone}
                      </a>
                    )}

                    {master.specialization && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-1">
                        <Wrench className="w-3.5 h-3.5 text-gray-400" />
                        {master.specialization}
                      </div>
                    )}

                    {master.notes && (
                      <p className="text-sm text-gray-500 mt-1">{master.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(master)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                      title="Редактировать"
                    >
                      <Wrench className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(master.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expand toggle */}
                <button
                  onClick={() => handleToggleExpand(master.id)}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mt-3 w-full"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  История работ
                </button>

                {/* Expanded logs */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    {isLoadingLogs ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-600" />
                      </div>
                    ) : !logs || logs.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-3">
                        Нет записей о работах
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {logs.map((log) => (
                          <div
                            key={log.id}
                            className="flex items-start justify-between gap-3 text-sm"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-gray-500">
                                  {formatDate(log.date)}
                                </span>
                                <span
                                  className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                    MAINTENANCE_TYPE_COLORS[log.type]
                                  }`}
                                >
                                  {MAINTENANCE_TYPE_LABELS[log.type]}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-gray-500 mt-0.5">
                                {log.systems && <span>{log.systems.name}</span>}
                                {log.houses && (
                                  <span className="text-gray-400">
                                    {log.houses.name}
                                  </span>
                                )}
                              </div>
                            </div>
                            {log.cost != null && log.cost > 0 && (
                              <span className="font-medium text-gray-900 whitespace-nowrap">
                                {formatCurrency(log.cost)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingMaster(null)
        }}
        title={editingMaster ? 'Редактировать мастера' : 'Добавить мастера'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Имя *</label>
            <input
              type="text"
              required
              className="input"
              placeholder="ФИО мастера"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="label">Телефон</label>
            <input
              type="tel"
              className="input"
              placeholder="+7 (999) 123-45-67"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
          </div>

          <div>
            <label className="label">Специализация</label>
            <input
              type="text"
              className="input"
              placeholder="Электрик, сантехник..."
              value={formData.specialization}
              onChange={(e) =>
                setFormData({ ...formData, specialization: e.target.value })
              }
            />
          </div>

          <div>
            <label className="label">Заметки</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Дополнительная информация..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <div>
              {editingMaster && (
                <button
                  type="button"
                  onClick={() => handleDelete(editingMaster.id)}
                  disabled={deleting}
                  className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting ? 'Удаление...' : 'Удалить'}
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false)
                  setEditingMaster(null)
                }}
                className="btn-secondary"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
              >
                {submitting
                  ? 'Сохранение...'
                  : editingMaster
                    ? 'Сохранить'
                    : 'Добавить'}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
