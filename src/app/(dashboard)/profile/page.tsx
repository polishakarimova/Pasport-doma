'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, isDemo } from '@/lib/supabase/client'
import { useTheme } from '@/components/ThemeProvider'
import {
  User,
  Mail,
  Phone,
  Pencil,
  LogOut,
  Sun,
  Moon,
  ChevronRight,
  Shield,
  Bell,
  FileText,
  Lock,
  Users,
  Trash2,
  Home,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface HouseMember {
  id: string
  house_id: string
  email: string
  role: 'viewer' | 'editor'
}

interface HouseInfo {
  id: string
  name: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const supabase = isDemo() ? null : createClient()

  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
  })

  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
  })

  // Stats
  const [stats, setStats] = useState({ houses: 0, systems: 0, reminders: 0 })

  // Password section
  const [showPassword, setShowPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [updatingPassword, setUpdatingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Access section
  const [showAccess, setShowAccess] = useState(false)
  const [houses, setHouses] = useState<HouseInfo[]>([])
  const [selectedHouseId, setSelectedHouseId] = useState<string | null>(null)
  const [members, setMembers] = useState<HouseMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor'>('viewer')
  const [inviting, setInviting] = useState(false)
  const [inviteMessage, setInviteMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    if (selectedHouseId && !isDemo()) {
      loadMembers(selectedHouseId)
    } else {
      setMembers([])
    }
  }, [selectedHouseId])

  async function loadProfile() {
    setLoading(true)

    if (isDemo()) {
      setProfile({
        name: 'Пользователь',
        email: 'demo@example.com',
        phone: '+7 (999) 123-45-67',
      })
      setEditForm({ name: 'Пользователь', phone: '+7 (999) 123-45-67' })
      setStats({ houses: 2, systems: 5, reminders: 3 })
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase!.auth.getUser()
    if (!user) return

    const meta = user.user_metadata || {}
    setProfile({
      name: meta.name || meta.full_name || '',
      email: user.email || '',
      phone: meta.phone || '',
    })
    setEditForm({
      name: meta.name || meta.full_name || '',
      phone: meta.phone || '',
    })

    const [housesRes, systemsRes, remindersRes, housesListRes] = await Promise.all([
      supabase!.from('houses').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase!.from('systems').select('id', { count: 'exact', head: true }),
      supabase!.from('reminders').select('id', { count: 'exact', head: true }).eq('completed', false),
      supabase!.from('houses').select('id, name').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])

    setStats({
      houses: housesRes.count || 0,
      systems: systemsRes.count || 0,
      reminders: remindersRes.count || 0,
    })

    const loadedHouses = housesListRes.data || []
    setHouses(loadedHouses)
    if (loadedHouses.length > 0) {
      setSelectedHouseId(loadedHouses[0].id)
    }

    setLoading(false)
  }

  async function loadMembers(houseId: string) {
    setLoadingMembers(true)
    const { data } = await supabase!.from('house_members').select('*').eq('house_id', houseId)
    setMembers(data || [])
    setLoadingMembers(false)
  }

  async function handleSave() {
    setSaving(true)

    if (!isDemo() && supabase) {
      await supabase.auth.updateUser({
        data: { name: editForm.name, phone: editForm.phone },
      })
    }

    setProfile((prev) => ({ ...prev, name: editForm.name, phone: editForm.phone }))
    setEditing(false)
    setSaving(false)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (isDemo()) {
      setPasswordMessage({ type: 'success', text: 'В демо-режиме пароль не меняется' })
      return
    }
    setUpdatingPassword(true)
    setPasswordMessage(null)

    const { error } = await supabase!.auth.updateUser({ password: newPassword })

    if (error) {
      setPasswordMessage({ type: 'error', text: error.message })
    } else {
      setPasswordMessage({ type: 'success', text: 'Пароль успешно изменён' })
      setNewPassword('')
    }
    setUpdatingPassword(false)
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedHouseId || isDemo()) return
    setInviting(true)
    setInviteMessage(null)

    const { error } = await supabase!.from('house_members').insert({
      house_id: selectedHouseId,
      email: inviteEmail,
      role: inviteRole,
    })

    if (error) {
      setInviteMessage({ type: 'error', text: error.message })
    } else {
      setInviteMessage({ type: 'success', text: 'Пользователь приглашён' })
      setInviteEmail('')
      setInviteRole('viewer')
      loadMembers(selectedHouseId)
    }
    setInviting(false)
  }

  async function handleRemoveMember(memberId: string) {
    if (!selectedHouseId || isDemo()) return
    const { error } = await supabase!.from('house_members').delete().eq('id', memberId)
    if (!error) loadMembers(selectedHouseId)
  }

  const handleLogout = async () => {
    if (isDemo()) {
      router.push('/login')
      return
    }
    await supabase!.auth.signOut()
    router.push('/login')
  }

  const initials = profile.name
    ? profile.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : profile.email
    ? profile.email[0].toUpperCase()
    : '?'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Avatar + Name */}
      <div className="card p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-brand-700">{initials}</span>
        </div>

        {editing ? (
          <div className="space-y-4 max-w-sm mx-auto text-left">
            <div>
              <label className="label">Имя</label>
              <input
                type="text"
                className="input"
                placeholder="Ваше имя"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Телефон</label>
              <input
                type="tel"
                className="input"
                placeholder="+7 (999) 123-45-67"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => {
                  setEditing(false)
                  setEditForm({ name: profile.name, phone: profile.phone })
                }}
                className="btn-secondary"
              >
                Отмена
              </button>
              <button onClick={handleSave} className="btn-primary" disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-gray-900">
              {profile.name || 'Пользователь'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{profile.email}</p>
            {profile.phone && (
              <p className="text-sm text-gray-500 mt-0.5">{profile.phone}</p>
            )}
            <button
              onClick={() => setEditing(true)}
              className="btn-secondary inline-flex items-center gap-2 mt-4 text-sm"
            >
              <Pencil className="w-4 h-4" />
              Редактировать профиль
            </button>
          </>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/houses" className="card p-4 text-center hover:shadow-md transition-shadow">
          <div className="text-2xl font-bold text-gray-900">{stats.houses}</div>
          <div className="text-xs text-gray-500 mt-1">Домов</div>
        </Link>
        <Link href="/maintenance" className="card p-4 text-center hover:shadow-md transition-shadow">
          <div className="text-2xl font-bold text-gray-900">{stats.systems}</div>
          <div className="text-xs text-gray-500 mt-1">Систем</div>
        </Link>
        <Link href="/reminders" className="card p-4 text-center hover:shadow-md transition-shadow">
          <div className="text-2xl font-bold text-gray-900">{stats.reminders}</div>
          <div className="text-xs text-gray-500 mt-1">Задач</div>
        </Link>
      </div>

      {/* Menu items */}
      <div className="card divide-y divide-gray-100">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-between w-full px-5 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-brand-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-500" />
            )}
            <span className="text-sm font-medium text-gray-900">
              {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {theme === 'dark' ? 'Тёмная' : 'Светлая'}
          </span>
        </button>

        {/* Notifications */}
        <Link
          href="/reminders"
          className="flex items-center justify-between w-full px-5 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-900">Напоминания</span>
          </div>
          <div className="flex items-center gap-2">
            {stats.reminders > 0 && (
              <span className="bg-brand-100 text-brand-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {stats.reminders}
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </div>
        </Link>

        {/* Documents */}
        <Link
          href="/documents"
          className="flex items-center justify-between w-full px-5 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-900">Документы</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </Link>

        {/* Password */}
        <button
          onClick={() => setShowPassword(!showPassword)}
          className="flex items-center justify-between w-full px-5 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-900">Сменить пароль</span>
          </div>
          <ChevronRight className={cn('w-4 h-4 text-gray-300 transition-transform', showPassword && 'rotate-90')} />
        </button>

        {/* Access */}
        <button
          onClick={() => setShowAccess(!showAccess)}
          className="flex items-center justify-between w-full px-5 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-900">Совместный доступ</span>
          </div>
          <ChevronRight className={cn('w-4 h-4 text-gray-300 transition-transform', showAccess && 'rotate-90')} />
        </button>
      </div>

      {/* Password form (collapsible) */}
      {showPassword && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Смена пароля</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="label">Новый пароль</label>
              <input
                type="password"
                className="input"
                placeholder="Минимум 6 символов"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            {passwordMessage && (
              <p className={cn('text-sm', passwordMessage.type === 'success' ? 'text-green-600' : 'text-red-600')}>
                {passwordMessage.text}
              </p>
            )}
            <button type="submit" disabled={updatingPassword || !newPassword} className="btn-primary text-sm">
              {updatingPassword ? 'Сохранение...' : 'Изменить пароль'}
            </button>
          </form>
        </div>
      )}

      {/* Access management (collapsible) */}
      {showAccess && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Управление доступом</h3>

          {houses.length === 0 && isDemo() ? (
            <p className="text-sm text-gray-500">
              В демо-режиме управление доступом недоступно
            </p>
          ) : houses.length === 0 ? (
            <p className="text-sm text-gray-500">
              У вас пока нет домов. Добавьте дом, чтобы управлять доступом.
            </p>
          ) : (
            <>
              <div className="mb-4">
                <label className="label">Выберите дом</label>
                <select
                  className="input"
                  value={selectedHouseId || ''}
                  onChange={(e) => setSelectedHouseId(e.target.value)}
                >
                  {houses.map((house) => (
                    <option key={house.id} value={house.id}>{house.name}</option>
                  ))}
                </select>
              </div>

              {/* Members list */}
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Участники</h4>
                {loadingMembers ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-600" />
                  </div>
                ) : members.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">Нет приглашённых участников</p>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{member.email}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              {member.role === 'editor' ? 'Редактор' : 'Просмотр'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Invite form */}
              <form onSubmit={handleInvite} className="space-y-3 border-t border-gray-100 pt-4">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Пригласить</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="email"
                    className="input"
                    placeholder="email@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                  <select
                    className="input"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'viewer' | 'editor')}
                  >
                    <option value="viewer">Просмотр</option>
                    <option value="editor">Редактор</option>
                  </select>
                </div>
                {inviteMessage && (
                  <p className={cn('text-sm', inviteMessage.type === 'success' ? 'text-green-600' : 'text-red-600')}>
                    {inviteMessage.text}
                  </p>
                )}
                <button type="submit" disabled={inviting || !inviteEmail} className="btn-primary text-sm inline-flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {inviting ? 'Отправка...' : 'Пригласить'}
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full card px-5 py-4 flex items-center gap-3 text-red-500 hover:bg-red-50 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        <span className="text-sm font-medium">Выйти из аккаунта</span>
      </button>

      {/* App info */}
      <div className="text-center text-xs text-gray-400 pb-4">
        Паспорт дома · Версия 1.0
      </div>
    </div>
  )
}
