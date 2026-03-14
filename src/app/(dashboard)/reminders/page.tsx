'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Reminder } from '@/types/database'
import { formatDate, getReminderCategory, cn } from '@/lib/utils'
import Modal from '@/components/Modal'
import EmptyState from '@/components/EmptyState'
import { Bell, Plus, Check, Clock, AlertTriangle } from 'lucide-react'

interface House {
  id: string
  name: string
}

interface System {
  id: string
  house_id: string
  name: string
}

interface ReminderWithRelations extends Reminder {
  systems: { name: string } | null
  houses: { name: string } | null
}

const CATEGORY_CONFIG = {
  overdue: {
    label: 'Просрочено',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700',
    icon: AlertTriangle,
    iconColor: 'text-red-500',
  },
  today: {
    label: 'Сегодня',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-700',
    icon: Clock,
    iconColor: 'text-yellow-500',
  },
  soon: {
    label: 'Скоро',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    icon: Clock,
    iconColor: 'text-blue-500',
  },
  this_month: {
    label: 'В этом месяце',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-700',
    icon: Clock,
    iconColor: 'text-gray-500',
  },
  later: {
    label: 'Позже',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-500',
    icon: Clock,
    iconColor: 'text-gray-400',
  },
} as const

type Category = keyof typeof CATEGORY_CONFIG

export default function RemindersPage() {
  const supabase = createClient()

  const [houses, setHouses] = useState<House[]>([])
  const [systems, setSystems] = useState<System[]>([])
  const [reminders, setReminders] = useState<ReminderWithRelations[]>([])
  const [loading, setLoading] = useState(true)

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    house_id: '',
    system_id: '',
    title: '',
    description: '',
    due_date: new Date().toISOString().slice(0, 10),
  })

  useEffect(() => {
    loadData()
  }, [])

  // Reset form system when form house changes
  useEffect(() => {
    setFormData((prev) => ({ ...prev, system_id: '' }))
  }, [formData.house_id])

  async function loadData() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data: housesData } = await supabase
      .from('houses')
      .select('*')
      .eq('user_id', user.id)

    const housesList = housesData || []
    setHouses(housesList)

    if (housesList.length === 0) {
      setReminders([])
      setSystems([])
      setLoading(false)
      return
    }

    const houseIds = housesList.map((h) => h.id)

    const [remindersRes, systemsRes] = await Promise.all([
      supabase
        .from('reminders')
        .select('*, systems(name), houses(name)')
        .in('house_id', houseIds)
        .eq('completed', false)
        .order('due_date'),
      supabase.from('systems').select('*').in('house_id', houseIds),
    ])

    setReminders((remindersRes.data as ReminderWithRelations[]) || [])
    setSystems(systemsRes.data || [])
    setLoading(false)
  }

  // Group reminders by category
  const grouped = reminders.reduce(
    (acc, reminder) => {
      const category = getReminderCategory(reminder.due_date)
      if (!acc[category]) acc[category] = []
      acc[category].push(reminder)
      return acc
    },
    {} as Record<Category, ReminderWithRelations[]>
  )

  const categoryOrder: Category[] = ['overdue', 'today', 'soon', 'this_month', 'later']

  // Filtered systems for form dropdown
  const filteredFormSystems = formData.house_id
    ? systems.filter((s) => s.house_id === formData.house_id)
    : []

  async function handleComplete(reminderId: string) {
    const { error } = await supabase
      .from('reminders')
      .update({ completed: true })
      .eq('id', reminderId)

    if (!error) {
      setReminders((prev) => prev.filter((r) => r.id !== reminderId))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const { error } = await supabase.from('reminders').insert({
      house_id: formData.house_id,
      system_id: formData.system_id || null,
      title: formData.title,
      description: formData.description || null,
      due_date: formData.due_date,
      is_auto: false,
      completed: false,
    })

    if (!error) {
      setModalOpen(false)
      setFormData({
        house_id: '',
        system_id: '',
        title: '',
        description: '',
        due_date: new Date().toISOString().slice(0, 10),
      })
      loadData()
    }

    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Напоминания</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Добавить напоминание
        </button>
      </div>

      {reminders.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Нет напоминаний"
          description="Напоминания о предстоящем обслуживании и задачах появятся здесь."
          action={
            <button
              onClick={() => setModalOpen(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Добавить напоминание
            </button>
          }
        />
      ) : (
        <div className="space-y-6">
          {categoryOrder.map((category) => {
            const items = grouped[category]
            if (!items || items.length === 0) return null

            const config = CATEGORY_CONFIG[category]
            const IconComponent = config.icon

            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <IconComponent className={cn('w-4 h-4', config.iconColor)} />
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    {config.label}
                  </h2>
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      config.badge
                    )}
                  >
                    {items.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {items.map((reminder) => (
                    <div
                      key={reminder.id}
                      className={cn(
                        'card p-4 border',
                        config.border,
                        config.bg
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleComplete(reminder.id)}
                          className={cn(
                            'mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                            'border-gray-300 hover:border-green-500 hover:bg-green-50'
                          )}
                          title="Отметить выполненным"
                        >
                          <Check className="w-3 h-3 text-transparent hover:text-green-500" />
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {reminder.title}
                            </span>
                            {reminder.is_auto && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                Авто
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                            <span>{formatDate(reminder.due_date)}</span>
                            {reminder.systems && (
                              <span className="font-medium text-gray-600">
                                {reminder.systems.name}
                              </span>
                            )}
                            {reminder.houses && (
                              <span>{reminder.houses.name}</span>
                            )}
                          </div>

                          {reminder.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              {reminder.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add reminder modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Добавить напоминание"
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

          <div>
            <label className="label">Название *</label>
            <input
              type="text"
              required
              className="input"
              placeholder="Например: Проверить фильтры"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div>
            <label className="label">Описание</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Дополнительная информация..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div>
            <label className="label">Дата выполнения *</label>
            <input
              type="date"
              required
              className="input"
              value={formData.due_date}
              onChange={(e) =>
                setFormData({ ...formData, due_date: e.target.value })
              }
            />
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
              disabled={submitting || !formData.house_id || !formData.title}
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
