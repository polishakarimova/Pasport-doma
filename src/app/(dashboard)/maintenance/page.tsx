'use client'

import { useEffect, useState } from 'react'
import { createClient, isDemo } from '@/lib/supabase/client'
import { DEMO_HOUSES, DEMO_SYSTEMS, DEMO_MASTERS, DEMO_MAINTENANCE } from '@/lib/demo-data'
import type { House, System, Master, MaintenanceLog, MaintenanceType } from '@/types/database'
import { MAINTENANCE_TYPE_LABELS } from '@/types/database'
import { formatDate, formatCurrency } from '@/lib/utils'
import Modal from '@/components/Modal'
import EmptyState from '@/components/EmptyState'
import { ClipboardList, Plus, Filter } from 'lucide-react'

type PeriodFilter = 'month' | '3months' | 'year' | 'all'

const PERIOD_LABELS: Record<PeriodFilter, string> = {
  month: 'Этот месяц',
  '3months': '3 месяца',
  year: 'Год',
  all: 'Все время',
}

const MAINTENANCE_TYPE_COLORS: Record<MaintenanceType, string> = {
  maintenance: 'bg-blue-100 text-blue-700',
  repair: 'bg-orange-100 text-orange-700',
  installation: 'bg-green-100 text-green-700',
  inspection: 'bg-purple-100 text-purple-700',
  replacement: 'bg-red-100 text-red-700',
}

interface LogWithRelations extends MaintenanceLog {
  systems: { name: string; house_id: string } | null
  houses: { name: string } | null
  masters: { name: string } | null
}

export default function MaintenancePage() {
  const supabase = isDemo() ? null : createClient()

  const [houses, setHouses] = useState<House[]>([])
  const [systems, setSystems] = useState<System[]>([])
  const [masters, setMasters] = useState<Master[]>([])
  const [logs, setLogs] = useState<LogWithRelations[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterHouse, setFilterHouse] = useState<string>('')
  const [filterSystem, setFilterSystem] = useState<string>('')
  const [filterPeriod, setFilterPeriod] = useState<PeriodFilter>('all')

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    house_id: '',
    system_id: '',
    date: new Date().toISOString().slice(0, 10),
    type: 'maintenance' as MaintenanceType,
    comment: '',
    cost: '',
    master_id: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  // Reset system filter when house filter changes
  useEffect(() => {
    setFilterSystem('')
  }, [filterHouse])

  // Reset form system when form house changes
  useEffect(() => {
    setFormData((prev) => ({ ...prev, system_id: '' }))
  }, [formData.house_id])

  async function loadData() {
    setLoading(true)

    if (isDemo()) {
      setHouses(DEMO_HOUSES)
      setSystems(DEMO_SYSTEMS)
      setMasters(DEMO_MASTERS)
      const demoLogs = DEMO_MAINTENANCE.map(m => ({
        ...m,
        systems: DEMO_SYSTEMS.find(s => s.id === m.system_id) ? { name: DEMO_SYSTEMS.find(s => s.id === m.system_id)!.name, house_id: m.house_id } : null,
        houses: DEMO_HOUSES.find(h => h.id === m.house_id) ? { name: DEMO_HOUSES.find(h => h.id === m.house_id)!.name } : null,
        masters: DEMO_MASTERS.find(ma => ma.id === m.master_id) ? { name: DEMO_MASTERS.find(ma => ma.id === m.master_id)!.name } : null,
      })) as LogWithRelations[]
      setLogs(demoLogs)
      setLoading(false)
      return
    }

    const {
      data: { user },
    } = await supabase!.auth.getUser()
    if (!user) return

    const [housesRes, systemsRes, mastersRes, logsRes] = await Promise.all([
      supabase!.from('houses').select('*').eq('user_id', user.id),
      supabase!.from('systems').select('*'),
      supabase!.from('masters').select('*').eq('user_id', user.id),
      supabase!
        .from('maintenance_logs')
        .select('*, systems(name, house_id), houses(name), masters(name)')
        .order('date', { ascending: false }),
    ])

    setHouses(housesRes.data || [])
    setSystems(systemsRes.data || [])
    setMasters(mastersRes.data || [])
    setLogs((logsRes.data as LogWithRelations[]) || [])
    setLoading(false)
  }

  // Filtered systems for house filter dropdown
  const filteredFilterSystems = filterHouse
    ? systems.filter((s) => s.house_id === filterHouse)
    : systems

  // Filtered systems for form dropdown
  const filteredFormSystems = formData.house_id
    ? systems.filter((s) => s.house_id === formData.house_id)
    : []

  // Apply filters to logs
  const filteredLogs = logs.filter((log) => {
    // House filter
    if (filterHouse && log.house_id !== filterHouse) return false

    // System filter
    if (filterSystem && log.system_id !== filterSystem) return false

    // Period filter
    if (filterPeriod !== 'all') {
      const logDate = new Date(log.date)
      const now = new Date()
      let start: Date

      if (filterPeriod === 'month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1)
      } else if (filterPeriod === '3months') {
        start = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      } else {
        start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      }

      if (logDate < start) return false
    }

    return true
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isDemo()) { setModalOpen(false); return }
    setSubmitting(true)

    const {
      data: { user },
    } = await supabase!.auth.getUser()
    if (!user) return

    const cost = formData.cost ? Number(formData.cost) : null

    const { data: newLog, error } = await supabase!
      .from('maintenance_logs')
      .insert({
        house_id: formData.house_id,
        system_id: formData.system_id || null,
        date: formData.date,
        type: formData.type,
        comment: formData.comment || null,
        cost,
        master_id: formData.master_id || null,
      })
      .select()
      .single()

    if (!error && newLog) {
      // If cost > 0, also insert an expense
      if (cost && cost > 0) {
        await supabase!.from('expenses').insert({
          house_id: formData.house_id,
          system_id: formData.system_id || null,
          maintenance_log_id: newLog.id,
          date: formData.date,
          amount: cost,
          comment: formData.comment || null,
        })
      }

      // Update system.last_maintenance_at if a system was selected
      if (formData.system_id) {
        await supabase!
          .from('systems')
          .update({ last_maintenance_at: formData.date })
          .eq('id', formData.system_id)
      }

      setModalOpen(false)
      setFormData({
        house_id: '',
        system_id: '',
        date: new Date().toISOString().slice(0, 10),
        type: 'maintenance',
        comment: '',
        cost: '',
        master_id: '',
      })
      loadData()
    }

    setSubmitting(false)
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
        <h1 className="text-2xl font-bold text-gray-900">Журнал работ</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Добавить запись
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Filter className="w-4 h-4 text-gray-400" />

        <select
          className="input w-auto"
          value={filterHouse}
          onChange={(e) => setFilterHouse(e.target.value)}
        >
          <option value="">Все дома</option>
          {houses.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>

        <select
          className="input w-auto"
          value={filterSystem}
          onChange={(e) => setFilterSystem(e.target.value)}
        >
          <option value="">Все системы</option>
          {filteredFilterSystems.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          className="input w-auto"
          value={filterPeriod}
          onChange={(e) => setFilterPeriod(e.target.value as PeriodFilter)}
        >
          {(Object.entries(PERIOD_LABELS) as [PeriodFilter, string][]).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            )
          )}
        </select>
      </div>

      {/* Log list */}
      {filteredLogs.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Нет записей"
          description="Записи о проведённых работах и обслуживании появятся здесь."
          action={
            <button
              onClick={() => setModalOpen(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Добавить запись
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div key={log.id} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm text-gray-500">
                      {formatDate(log.date)}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        MAINTENANCE_TYPE_COLORS[log.type]
                      }`}
                    >
                      {MAINTENANCE_TYPE_LABELS[log.type]}
                    </span>
                    {log.systems && (
                      <span className="text-sm font-medium text-gray-700">
                        {log.systems.name}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                    {log.houses && <span>{log.houses.name}</span>}
                    {log.masters && (
                      <span>Мастер: {log.masters.name}</span>
                    )}
                  </div>

                  {log.comment && (
                    <p className="text-sm text-gray-600 mt-1">{log.comment}</p>
                  )}
                </div>

                {log.cost != null && log.cost > 0 && (
                  <div className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                    {formatCurrency(log.cost)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add record modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Добавить запись"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Дом *</label>
            <select
              className="input"
              required
              value={formData.house_id}
              onChange={(e) =>
                setFormData({ ...formData, house_id: e.target.value })
              }
            >
              <option value="">Выберите дом</option>
              {houses.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Система</label>
            <select
              className="input"
              value={formData.system_id}
              onChange={(e) =>
                setFormData({ ...formData, system_id: e.target.value })
              }
              disabled={!formData.house_id}
            >
              <option value="">Без привязки к системе</option>
              {filteredFormSystems.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Дата *</label>
              <input
                type="date"
                required
                className="input"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Тип работы *</label>
              <select
                className="input"
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as MaintenanceType,
                  })
                }
              >
                {(
                  Object.entries(MAINTENANCE_TYPE_LABELS) as [
                    MaintenanceType,
                    string,
                  ][]
                ).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Комментарий</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Описание выполненных работ..."
              value={formData.comment}
              onChange={(e) =>
                setFormData({ ...formData, comment: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Стоимость</label>
              <input
                type="number"
                className="input"
                placeholder="0"
                min="0"
                value={formData.cost}
                onChange={(e) =>
                  setFormData({ ...formData, cost: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Мастер</label>
              <select
                className="input"
                value={formData.master_id}
                onChange={(e) =>
                  setFormData({ ...formData, master_id: e.target.value })
                }
              >
                <option value="">Не указан</option>
                {masters.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.house_id}
              className="btn-primary"
            >
              {submitting ? 'Сохранение...' : 'Добавить'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
