'use client'

import { useEffect, useState } from 'react'
import { createClient, isDemo } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Settings, Users, Mail, Trash2, Shield } from 'lucide-react'

interface House {
  id: string
  name: string
}

interface HouseMember {
  id: string
  house_id: string
  email: string
  role: 'viewer' | 'editor'
}

export default function SettingsPage() {
  const supabase = isDemo() ? null : createClient()

  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Password
  const [newPassword, setNewPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [updatingPassword, setUpdatingPassword] = useState(false)

  // Houses & members
  const [houses, setHouses] = useState<House[]>([])
  const [selectedHouseId, setSelectedHouseId] = useState<string | null>(null)
  const [members, setMembers] = useState<HouseMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor'>('viewer')
  const [inviting, setInviting] = useState(false)
  const [inviteMessage, setInviteMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedHouseId) {
      loadMembers(selectedHouseId)
    } else {
      setMembers([])
    }
  }, [selectedHouseId])

  async function loadInitialData() {
    setLoading(true)

    if (isDemo()) {
      setUserEmail('demo@example.com')
      setHouses([])
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase!.auth.getUser()
    if (!user) return

    setUserEmail(user.email ?? null)

    const { data: housesData } = await supabase!
      .from('houses')
      .select('id, name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const loadedHouses = housesData || []
    setHouses(loadedHouses)

    if (loadedHouses.length > 0) {
      setSelectedHouseId(loadedHouses[0].id)
    }

    setLoading(false)
  }

  async function loadMembers(houseId: string) {
    setLoadingMembers(true)
    const { data } = await supabase!
      .from('house_members')
      .select('*')
      .eq('house_id', houseId)

    setMembers(data || [])
    setLoadingMembers(false)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
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
    if (!selectedHouseId) return

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
    if (!selectedHouseId) return

    const { error } = await supabase!
      .from('house_members')
      .delete()
      .eq('id', memberId)

    if (!error) {
      loadMembers(selectedHouseId)
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
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-gray-600" />
        <h1 className="text-2xl font-bold text-gray-900">Настройки</h1>
      </div>

      <div className="space-y-6">
        {/* Профиль */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Профиль</h2>

          <div className="mb-4">
            <label className="label">Email</label>
            <input
              type="email"
              className="input bg-gray-50"
              value={userEmail || ''}
              disabled
              readOnly
            />
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="label">Новый пароль</label>
              <input
                type="password"
                className="input"
                placeholder="Введите новый пароль"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            {passwordMessage && (
              <p
                className={cn(
                  'text-sm',
                  passwordMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
                )}
              >
                {passwordMessage.text}
              </p>
            )}

            <button
              type="submit"
              disabled={updatingPassword || !newPassword}
              className="btn-primary"
            >
              {updatingPassword ? 'Сохранение...' : 'Изменить пароль'}
            </button>
          </form>
        </div>

        {/* Совместный доступ */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Совместный доступ</h2>
          </div>

          {houses.length === 0 ? (
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
                    <option key={house.id} value={house.id}>
                      {house.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Список участников */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Участники</h3>

                {loadingMembers ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-600" />
                  </div>
                ) : members.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">
                    Нет приглашённых участников
                  </p>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
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
                          className="btn-danger inline-flex items-center gap-1 text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Удалить
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Форма приглашения */}
              <form onSubmit={handleInvite} className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700">Пригласить участника</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Email</label>
                    <input
                      type="email"
                      className="input"
                      placeholder="email@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Роль</label>
                    <select
                      className="input"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as 'viewer' | 'editor')}
                    >
                      <option value="viewer">Просмотр</option>
                      <option value="editor">Редактор</option>
                    </select>
                  </div>
                </div>

                {inviteMessage && (
                  <p
                    className={cn(
                      'text-sm',
                      inviteMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {inviteMessage.text}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={inviting || !inviteEmail}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  {inviting ? 'Отправка...' : 'Пригласить'}
                </button>
              </form>
            </>
          )}
        </div>

        {/* О приложении */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">О приложении</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <span className="font-medium text-gray-900">Паспорт дома</span> — приложение для учёта
              систем, обслуживания и расходов вашего дома.
            </p>
            <p>Версия: 1.0</p>
          </div>
        </div>
      </div>
    </div>
  )
}
