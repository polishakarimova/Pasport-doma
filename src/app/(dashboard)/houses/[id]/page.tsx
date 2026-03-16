'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient, isDemo } from '@/lib/supabase/client'
import { DEMO_HOUSES, DEMO_SYSTEMS, DEMO_MAINTENANCE, DEMO_REMINDERS, DEMO_EXPENSES } from '@/lib/demo-data'
import type { House, System, MaintenanceLog, Reminder, Expense } from '@/types/database'
import { SYSTEM_CATEGORY_LABELS, MAINTENANCE_TYPE_LABELS } from '@/types/database'
import { formatDate, formatCurrency, calculateHealthStatus } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'
import HealthBadge from '@/components/HealthBadge'
import {
  Home,
  Pencil,
  Wrench,
  FileText,
  Users,
  Settings,
  Bell,
  TrendingUp,
  Calendar,
  ChevronRight,
  Plus,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'

interface MaintenanceLogWithSystem extends MaintenanceLog {
  systems: { name: string } | null
}

interface ReminderWithSystem extends Reminder {
  systems: { name: string } | null
}

export default function HouseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = isDemo() ? null : createClient()

  const [house, setHouse] = useState<House | null>(null)
  const [systems, setSystems] = useState<System[]>([])
  const [logs, setLogs] = useState<MaintenanceLogWithSystem[]>([])
  const [reminders, setReminders] = useState<ReminderWithSystem[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    setLoading(true)

    if (isDemo()) {
      const demoHouse = DEMO_HOUSES.find(h => h.id === id) || null
      setHouse(demoHouse)
      const demoSystems = DEMO_SYSTEMS.filter(s => s.house_id === id)
      setSystems(demoSystems)
      const demoLogs = DEMO_MAINTENANCE.filter(m => m.house_id === id).map(m => ({
        ...m,
        systems: DEMO_SYSTEMS.find(s => s.id === m.system_id) ? { name: DEMO_SYSTEMS.find(s => s.id === m.system_id)!.name } : null,
      }))
      setLogs(demoLogs)
      const demoReminders = DEMO_REMINDERS.filter(r => r.house_id === id).map(r => ({
        ...r,
        systems: DEMO_SYSTEMS.find(s => s.id === r.system_id) ? { name: DEMO_SYSTEMS.find(s => s.id === r.system_id)!.name } : null,
      }))
      setReminders(demoReminders)
      setExpenses(DEMO_EXPENSES.filter(e => e.house_id === id))
      setLoading(false)
      return
    }

    const [houseRes, systemsRes, logsRes, remindersRes, expensesRes] = await Promise.all([
      supabase!.from('houses').select('*').eq('id', id).single(),
      supabase!.from('systems').select('*').eq('house_id', id),
      supabase!
        .from('maintenance_logs')
        .select('*, systems(name)')
        .eq('house_id', id)
        .order('date', { ascending: false })
        .limit(5),
      supabase!
        .from('reminders')
        .select('*, systems(name)')
        .eq('house_id', id)
        .eq('completed', false)
        .order('due_date')
        .limit(5),
      supabase!.from('expenses').select('*').eq('house_id', id),
    ])

    setHouse(houseRes.data)
    setSystems(systemsRes.data || [])
    setLogs((logsRes.data as MaintenanceLogWithSystem[]) || [])
    setReminders((remindersRes.data as ReminderWithSystem[]) || [])
    setExpenses(expensesRes.data || [])
    setLoading(false)
  }

  function getMonthExpenses(): number {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    return expenses
      .filter((e) => {
        const d = new Date(e.date)
        return d.getFullYear() === year && d.getMonth() === month
      })
      .reduce((sum, e) => sum + e.amount, 0)
  }

  function getYearExpenses(): number {
    const year = new Date().getFullYear()
    return expenses
      .filter((e) => new Date(e.date).getFullYear() === year)
      .reduce((sum, e) => sum + e.amount, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!house) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Дом не найден</p>
        <button onClick={() => router.push('/houses')} className="btn-primary mt-4">
          Вернуться к списку
        </button>
      </div>
    )
  }

  const healthStatus = calculateHealthStatus(systems)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/houses')}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Мои дома
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{house.name}</h1>
              <HealthBadge status={healthStatus} size="sm" />
            </div>
            {(house.address || house.city) && (
              <p className="text-gray-500">
                {[house.address, house.city].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
          <button className="btn-secondary inline-flex items-center gap-2">
            <Pencil className="w-4 h-4" />
            Редактировать
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link
          href={`/houses/${id}/systems/new`}
          className="card p-4 text-center hover:shadow-md transition-shadow"
        >
          <Settings className="w-5 h-5 text-blue-600 mx-auto mb-2" />
          <span className="text-sm font-medium text-gray-700">Добавить систему</span>
        </Link>
        <Link
          href={`/houses/${id}/maintenance/new`}
          className="card p-4 text-center hover:shadow-md transition-shadow"
        >
          <Wrench className="w-5 h-5 text-green-600 mx-auto mb-2" />
          <span className="text-sm font-medium text-gray-700">Добавить работу</span>
        </Link>
        <Link
          href={`/houses/${id}/documents/new`}
          className="card p-4 text-center hover:shadow-md transition-shadow"
        >
          <FileText className="w-5 h-5 text-purple-600 mx-auto mb-2" />
          <span className="text-sm font-medium text-gray-700">Добавить документ</span>
        </Link>
        <Link
          href={`/houses/${id}/masters/new`}
          className="card p-4 text-center hover:shadow-md transition-shadow"
        >
          <Users className="w-5 h-5 text-orange-600 mx-auto mb-2" />
          <span className="text-sm font-medium text-gray-700">Добавить мастера</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="text-sm text-gray-500 mb-1">Системы</div>
          <div className="text-2xl font-bold text-gray-900">{systems.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500 mb-1">Напоминания</div>
          <div className="text-2xl font-bold text-gray-900">{reminders.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500 mb-1">Расходы за месяц</div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(getMonthExpenses())}</div>
        </div>
      </div>

      {/* Системы дома */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Системы дома</h2>
          <span className="text-sm text-gray-400">{systems.length}</span>
        </div>
        {systems.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">
            Нет систем. Добавьте первую систему дома.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {systems.map((system) => (
              <Link
                key={system.id}
                href={`/systems/${system.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-medium text-gray-900">{system.name}</div>
                  <div className="text-sm text-gray-500">
                    {SYSTEM_CATEGORY_LABELS[system.category]}
                    {system.next_maintenance_at && (
                      <span className="ml-2">
                        · Обслуживание: {formatDate(system.next_maintenance_at)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusBadge status={system.status} />
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Последние работы */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Последние работы</h2>
        </div>
        {logs.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">
            Нет записей о работах.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <div className="font-medium text-gray-900">
                    {MAINTENANCE_TYPE_LABELS[log.type]}
                  </div>
                  <div className="text-sm text-gray-500">
                    {log.systems?.name && <span>{log.systems.name} · </span>}
                    {formatDate(log.date)}
                  </div>
                </div>
                {log.cost != null && (
                  <div className="text-sm font-medium text-gray-700 flex-shrink-0">
                    {formatCurrency(log.cost)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ближайшие задачи */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Ближайшие задачи</h2>
        </div>
        {reminders.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">
            Нет предстоящих задач.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <div className="font-medium text-gray-900">{reminder.title}</div>
                  <div className="text-sm text-gray-500">
                    {reminder.systems?.name && <span>{reminder.systems.name} · </span>}
                    {formatDate(reminder.due_date)}
                  </div>
                </div>
                <Calendar className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Расходы */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Расходы</h2>
        </div>
        <div className="grid grid-cols-2 divide-x divide-gray-100">
          <div className="px-5 py-4 text-center">
            <div className="text-sm text-gray-500 mb-1">За месяц</div>
            <div className="text-xl font-bold text-gray-900">{formatCurrency(getMonthExpenses())}</div>
          </div>
          <div className="px-5 py-4 text-center">
            <div className="text-sm text-gray-500 mb-1">За год</div>
            <div className="text-xl font-bold text-gray-900">{formatCurrency(getYearExpenses())}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
