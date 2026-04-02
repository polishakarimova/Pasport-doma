'use client'

import { useEffect, useState } from 'react'
import { createClient, isDemo } from '@/lib/supabase/client'
import type { House, System, Expense, SystemCategory } from '@/types/database'
import { SYSTEM_CATEGORY_LABELS } from '@/types/database'
import { DEMO_HOUSES, DEMO_SYSTEMS, DEMO_EXPENSES } from '@/lib/demo-data'
import { formatDate, formatCurrency } from '@/lib/utils'
import Modal from '@/components/Modal'
import EmptyState from '@/components/EmptyState'
import { Receipt, Plus, Filter, TrendingUp } from 'lucide-react'

type PeriodFilter = 'month' | '3months' | 'year' | 'all'

const PERIOD_LABELS: Record<PeriodFilter, string> = {
  month: 'Этот месяц',
  '3months': '3 месяца',
  year: 'Год',
  all: 'Все время',
}

interface ExpenseWithRelations extends Expense {
  systems: { name: string; category: SystemCategory } | null
  houses: { name: string } | null
}

export default function ExpensesPage() {
  const supabase = isDemo() ? null : createClient()

  const [houses, setHouses] = useState<House[]>([])
  const [systems, setSystems] = useState<System[]>([])
  const [expenses, setExpenses] = useState<ExpenseWithRelations[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterHouse, setFilterHouse] = useState<string>('')
  const [filterPeriod, setFilterPeriod] = useState<PeriodFilter>('all')

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    house_id: '',
    system_id: '',
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    category: '',
    comment: '',
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

    if (isDemo()) {
      setHouses(DEMO_HOUSES)
      setSystems(DEMO_SYSTEMS)
      const demoExpenses = DEMO_EXPENSES.map(e => ({
        ...e,
        systems: DEMO_SYSTEMS.find(s => s.id === e.system_id) ? { name: DEMO_SYSTEMS.find(s => s.id === e.system_id)!.name, category: DEMO_SYSTEMS.find(s => s.id === e.system_id)!.category } : null,
        houses: DEMO_HOUSES.find(h => h.id === e.house_id) ? { name: DEMO_HOUSES.find(h => h.id === e.house_id)!.name } : null,
      })) as ExpenseWithRelations[]
      setExpenses(demoExpenses)
      setLoading(false)
      return
    }

    const {
      data: { user },
    } = await supabase!.auth.getUser()
    if (!user) return

    const { data: housesData } = await supabase!
      .from('houses')
      .select('*')
      .eq('user_id', user.id)

    const housesList = housesData || []
    const houseIds = housesList.map((h) => h.id)

    if (houseIds.length === 0) {
      setHouses([])
      setSystems([])
      setExpenses([])
      setLoading(false)
      return
    }

    const [expensesRes, systemsRes] = await Promise.all([
      supabase!
        .from('expenses')
        .select('*, systems(name, category), houses(name)')
        .in('house_id', houseIds)
        .order('date', { ascending: false }),
      supabase!.from('systems').select('*').in('house_id', houseIds),
    ])

    setHouses(housesList)
    setExpenses((expensesRes.data as ExpenseWithRelations[]) || [])
    setSystems(systemsRes.data || [])
    setLoading(false)
  }

  // Filtered systems for form dropdown
  const filteredFormSystems = formData.house_id
    ? systems.filter((s) => s.house_id === formData.house_id)
    : []

  // Apply filters
  const filteredExpenses = expenses.filter((exp) => {
    if (filterHouse && exp.house_id !== filterHouse) return false

    if (filterPeriod !== 'all') {
      const expDate = new Date(exp.date)
      const now = new Date()
      let start: Date

      if (filterPeriod === 'month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1)
      } else if (filterPeriod === '3months') {
        start = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      } else {
        start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      }

      if (expDate < start) return false
    }

    return true
  })

  // Summary calculations
  const now = new Date()
  const thisMonthTotal = expenses.reduce((sum, exp) => {
    const d = new Date(exp.date)
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
      return sum + exp.amount
    }
    return sum
  }, 0)

  const thisYearTotal = expenses.reduce((sum, exp) => {
    const d = new Date(exp.date)
    if (d.getFullYear() === now.getFullYear()) {
      return sum + exp.amount
    }
    return sum
  }, 0)

  const allTimeTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0)

  // Breakdown by system category
  const bySystemCategory: Record<string, number> = {}
  expenses.forEach((exp) => {
    const category = exp.systems?.category || 'other'
    bySystemCategory[category] = (bySystemCategory[category] || 0) + exp.amount
  })

  const sortedCategories = Object.entries(bySystemCategory).sort(
    ([, a], [, b]) => b - a
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isDemo()) { setModalOpen(false); return }
    setSubmitting(true)

    const { error } = await supabase!.from('expenses').insert({
      house_id: formData.house_id,
      system_id: formData.system_id || null,
      date: formData.date,
      amount: Number(formData.amount),
      category: formData.category || null,
      comment: formData.comment || null,
    })

    if (!error) {
      setModalOpen(false)
      setFormData({
        house_id: '',
        system_id: '',
        date: new Date().toISOString().slice(0, 10),
        amount: '',
        category: '',
        comment: '',
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
        <h1 className="text-2xl font-bold text-gray-900">Расходы</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Добавить расход
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-sm text-gray-500 mb-1">Этот месяц</div>
          <div className="text-xl font-bold text-gray-900">
            {formatCurrency(thisMonthTotal)}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500 mb-1">Этот год</div>
          <div className="text-xl font-bold text-gray-900">
            {formatCurrency(thisYearTotal)}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500 mb-1">За все время</div>
          <div className="text-xl font-bold text-gray-900">
            {formatCurrency(allTimeTotal)}
          </div>
        </div>
      </div>

      {/* Breakdown by system category */}
      {sortedCategories.length > 0 && (
        <div className="card p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">
              Расходы по системам
            </h2>
          </div>
          <div className="space-y-2">
            {sortedCategories.map(([category, amount]) => {
              const percentage =
                allTimeTotal > 0 ? (amount / allTimeTotal) * 100 : 0
              const label =
                category in SYSTEM_CATEGORY_LABELS
                  ? SYSTEM_CATEGORY_LABELS[category as SystemCategory]
                  : 'Без системы'
              return (
                <div key={category}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

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

      {/* Expenses list */}
      {filteredExpenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Нет расходов"
          description="Здесь будут отображаться все расходы по вашим домам."
          action={
            <button
              onClick={() => setModalOpen(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Добавить расход
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredExpenses.map((exp) => (
            <div key={exp.id} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm text-gray-500">
                      {formatDate(exp.date)}
                    </span>
                    {exp.category && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {exp.category}
                      </span>
                    )}
                    {exp.systems && (
                      <span className="text-sm font-medium text-gray-700">
                        {exp.systems.name}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                    {exp.houses && <span>{exp.houses.name}</span>}
                    {exp.systems?.category && (
                      <span>
                        {SYSTEM_CATEGORY_LABELS[exp.systems.category]}
                      </span>
                    )}
                  </div>

                  {exp.comment && (
                    <p className="text-sm text-gray-600 mt-1">{exp.comment}</p>
                  )}
                </div>

                <div className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                  {formatCurrency(exp.amount)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add expense modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Добавить расход"
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
              <label className="label">Сумма *</label>
              <input
                type="number"
                required
                className="input"
                placeholder="0"
                min="0"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="label">Категория</label>
            <input
              type="text"
              className="input"
              placeholder="Например: материалы, услуги..."
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            />
          </div>

          <div>
            <label className="label">Комментарий</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Описание расхода..."
              value={formData.comment}
              onChange={(e) =>
                setFormData({ ...formData, comment: e.target.value })
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
              disabled={submitting || !formData.house_id || !formData.amount}
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
