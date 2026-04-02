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
} from 'lucide-react'

export default function HouseDetailClient() {
  const params = useParams()
  const router = useRouter()
  const houseId = params.id as string
  const supabase = isDemo() ? null : createClient()

  const [house, setHouse] = useState<House | null>(null)
  const [systems, setSystems] = useState<System[]>([])
  const [maintenance, setMaintenance] = useState<MaintenanceLog[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHouseData()
  }, [houseId])

  async function loadHouseData() {
    setLoading(true)
    
    if (isDemo()) {
      const demoHouse = DEMO_HOUSES.find(h => h.id === houseId)
      setHouse(demoHouse || null)
      setSystems(DEMO_SYSTEMS.filter(s => s.house_id === houseId))
      setMaintenance(DEMO_MAINTENANCE.filter(m => m.house_id === houseId))
      setReminders(DEMO_REMINDERS.filter(r => r.house_id === houseId))
      setExpenses(DEMO_EXPENSES.filter(e => e.house_id === houseId))
      setLoading(false)
      return
    }

    const { data: houseData } = await supabase!
      .from('houses')
      .select('*')
      .eq('id', houseId)
      .single()

    const { data: systemsData } = await supabase!
      .from('systems')
      .select('*')
      .eq('house_id', houseId)
      .order('category')

    const { data: maintenanceData } = await supabase!
      .from('maintenance_log')
      .select('*')
      .eq('house_id', houseId)
      .order('date', { ascending: false })
      .limit(10)

    const { data: remindersData } = await supabase!
      .from('reminders')
      .select('*')
      .eq('house_id', houseId)
      .eq('completed', false)
      .order('due_date')

    const { data: expensesData } = await supabase!
      .from('expenses')
      .select('*')
      .eq('house_id', houseId)
      .order('date', { ascending: false })
      .limit(10)

    setHouse(houseData)
    setSystems(systemsData || [])
    setMaintenance(maintenanceData || [])
    setReminders(remindersData || [])
    setExpenses(expensesData || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!house) {
    return (
      <div className="text-center py-12">
        <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Дом не найден</h3>
        <button
          onClick={() => router.push('/houses')}
          className="text-blue-600 hover:text-blue-700"
        >
          Вернуться к списку домов
        </button>
      </div>
    )
  }

  const healthStatus = calculateHealthStatus(systems)
  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
  const urgentReminders = reminders.filter(r => 
    new Date(r.due_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  )

  return (
    <div className="space-y-6">
      {/* House Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{house.name}</h1>
            {house.address && (
              <p className="text-gray-600 mt-1">{house.address}, {house.city}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              {house.area && <span>Площадь: {house.area} м²</span>}
              {house.year_built && <span>Год постройки: {house.year_built}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <HealthBadge status={healthStatus} />
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{systems.length}</div>
              <div className="text-sm text-gray-600">Систем</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Wrench className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{maintenance.length}</div>
              <div className="text-sm text-gray-600">Работ</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{urgentReminders.length}</div>
              <div className="text-sm text-gray-600">Напоминаний</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</div>
              <div className="text-sm text-gray-600">Расходы</div>
            </div>
          </div>
        </div>
      </div>

      {/* Systems Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Системы дома</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {systems.map(system => (
            <div key={system.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">{system.name}</h3>
                  <p className="text-sm text-gray-600">{SYSTEM_CATEGORY_LABELS[system.category]}</p>
                </div>
                <StatusBadge status={system.status} />
              </div>
              {system.model && (
                <p className="text-sm text-gray-500 mb-2">{system.model}</p>
              )}
              {system.next_maintenance_at && (
                <div className="text-xs text-gray-500">
                  Следующее ТО: {formatDate(system.next_maintenance_at)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Maintenance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Последние работы</h3>
          <div className="space-y-3">
            {maintenance.slice(0, 5).map(log => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <div className="font-medium text-gray-900">{MAINTENANCE_TYPE_LABELS[log.type]}</div>
                  <div className="text-sm text-gray-600">{formatDate(log.date)}</div>
                </div>
                {log.cost && (
                  <div className="text-sm font-medium text-gray-900">{formatCurrency(log.cost)}</div>
                )}
              </div>
            ))}
            {maintenance.length === 0 && (
              <p className="text-gray-500 text-center py-4">Нет записей о работах</p>
            )}
          </div>
        </div>

        {/* Urgent Reminders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ближайшие напоминания</h3>
          <div className="space-y-3">
            {urgentReminders.slice(0, 5).map(reminder => (
              <div key={reminder.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <div className="font-medium text-gray-900">{reminder.title}</div>
                  <div className="text-sm text-gray-600">{formatDate(reminder.due_date)}</div>
                </div>
              </div>
            ))}
            {urgentReminders.length === 0 && (
              <p className="text-gray-500 text-center py-4">Нет срочных напоминаний</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}