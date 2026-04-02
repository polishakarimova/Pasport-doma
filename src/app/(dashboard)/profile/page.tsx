'use client'

import { useState, useEffect } from 'react'
import { createClient, isDemo } from '@/lib/supabase/client'
import { DEMO_HOUSES, DEMO_SYSTEMS, DEMO_MAINTENANCE, DEMO_EXPENSES } from '@/lib/demo-data'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  User,
  Home as HomeIcon,
  Wrench,
  TrendingUp,
  Settings,
  Calendar,
  Bell,
  Star,
  Edit,
  Save,
  X,
  Camera,
} from 'lucide-react'

export default function ProfilePage() {
  const supabase = isDemo() ? null : createClient()
  
  const [user, setUser] = useState({
    name: 'Полина Каримова',
    email: 'polina@example.com',
    phone: '+7 (999) 123-45-67',
    city: 'Калининград',
    joinDate: '2024-01-15T10:00:00Z',
    avatar: null,
  })
  
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState(user)
  const [stats, setStats] = useState({
    houses: 0,
    systems: 0,
    maintenance: 0,
    totalExpenses: 0,
    lastActivity: null as string | null,
  })

  useEffect(() => {
    loadProfileData()
  }, [])

  async function loadProfileData() {
    if (isDemo()) {
      const houses = DEMO_HOUSES
      const systems = DEMO_SYSTEMS
      const maintenance = DEMO_MAINTENANCE
      const expenses = DEMO_EXPENSES
      
      setStats({
        houses: houses.length,
        systems: systems.length,
        maintenance: maintenance.length,
        totalExpenses: expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0),
        lastActivity: maintenance[0]?.date || null,
      })
      return
    }

    const { data: { user: authUser } } = await supabase!.auth.getUser()
    if (!authUser) return

    const { data: houses } = await supabase!.from('houses').select('*').eq('user_id', authUser.id)
    const { data: systems } = await supabase!.from('systems').select('*')
    const { data: maintenance } = await supabase!.from('maintenance_log').select('*').order('date', { ascending: false }).limit(1)
    const { data: expenses } = await supabase!.from('expenses').select('amount')

    setStats({
      houses: houses?.length || 0,
      systems: systems?.length || 0,
      maintenance: maintenance?.length || 0,
      totalExpenses: expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0,
      lastActivity: maintenance?.[0]?.date || null,
    })

    setUser({
      name: authUser.user_metadata?.full_name || 'Пользователь',
      email: authUser.email || '',
      phone: authUser.user_metadata?.phone || '',
      city: authUser.user_metadata?.city || '',
      joinDate: authUser.created_at,
      avatar: authUser.user_metadata?.avatar_url || null,
    })
    setEditData({
      name: authUser.user_metadata?.full_name || 'Пользователь',
      email: authUser.email || '',
      phone: authUser.user_metadata?.phone || '',
      city: authUser.user_metadata?.city || '',
      joinDate: authUser.created_at,
      avatar: authUser.user_metadata?.avatar_url || null,
    })
  }

  const handleSave = async () => {
    if (isDemo()) {
      setUser(editData)
      setIsEditing(false)
      return
    }

    const { error } = await supabase!.auth.updateUser({
      data: {
        full_name: editData.name,
        phone: editData.phone,
        city: editData.city,
      }
    })

    if (!error) {
      setUser(editData)
      setIsEditing(false)
    }
  }

  const achievementsList = [
    { 
      title: 'Первый дом добавлен', 
      description: 'Добавили свой первый дом в систему',
      icon: HomeIcon,
      achieved: stats.houses > 0,
      date: user.joinDate
    },
    { 
      title: 'Системы под контролем', 
      description: 'Добавили все основные системы дома',
      icon: Settings,
      achieved: stats.systems >= 5,
      date: user.joinDate
    },
    { 
      title: 'Регулярное обслуживание', 
      description: 'Провели первые работы по обслуживанию',
      icon: Wrench,
      achieved: stats.maintenance > 0,
      date: stats.lastActivity
    },
    { 
      title: 'Финансовый контроль', 
      description: 'Ведёте учёт расходов на дом',
      icon: TrendingUp,
      achieved: stats.totalExpenses > 0,
      date: user.joinDate
    },
  ]

  const recentActivity = [
    { type: 'maintenance', text: 'Обслуживание газового котла', date: '2026-03-15T10:00:00Z' },
    { type: 'expense', text: 'Покупка фильтров для воды', date: '2026-03-10T10:00:00Z' },
    { type: 'system', text: 'Добавлена система вентиляции', date: '2026-03-05T10:00:00Z' },
    { type: 'reminder', text: 'Создано напоминание о чистке дымохода', date: '2026-03-01T10:00:00Z' },
  ]

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-white" />
              )}
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center border">
              <Camera className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                  <input
                    type="text"
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Город</label>
                  <input
                    type="text"
                    value={editData.city}
                    onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Сохранить
                  </button>
                  <button
                    onClick={() => { setEditData(user); setIsEditing(false); }}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-1 text-gray-600">
                  <p>{user.email}</p>
                  {user.phone && <p>{user.phone}</p>}
                  {user.city && <p>{user.city}</p>}
                  <p className="text-sm">В системе с {formatDate(user.joinDate)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <HomeIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.houses}</div>
              <div className="text-sm text-gray-600">Домов</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.systems}</div>
              <div className="text-sm text-gray-600">Систем</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Wrench className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.maintenance}</div>
              <div className="text-sm text-gray-600">Работ</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalExpenses)}</div>
              <div className="text-sm text-gray-600">Расходы</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Achievements */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Достижения
          </h2>
          <div className="space-y-3">
            {achievementsList.map((achievement, index) => (
              <div key={index} className={`flex items-center gap-3 p-3 rounded-lg ${achievement.achieved ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${achievement.achieved ? 'bg-green-100' : 'bg-gray-200'}`}>
                  <achievement.icon className={`w-4 h-4 ${achievement.achieved ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1">
                  <div className={`font-medium ${achievement.achieved ? 'text-green-900' : 'text-gray-500'}`}>
                    {achievement.title}
                  </div>
                  <div className={`text-sm ${achievement.achieved ? 'text-green-700' : 'text-gray-400'}`}>
                    {achievement.description}
                  </div>
                  {achievement.achieved && achievement.date && (
                    <div className="text-xs text-green-600 mt-1">
                      Получено {formatDate(achievement.date)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Последняя активность
          </h2>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="text-gray-900 font-medium">{activity.text}</div>
                  <div className="text-sm text-gray-500">{formatDate(activity.date)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}