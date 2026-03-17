'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient, isDemo } from '@/lib/supabase/client'
import { DEMO_SYSTEMS, DEMO_HOUSES, DEMO_MAINTENANCE, DEMO_MASTERS, DEMO_EXPENSES } from '@/lib/demo-data'
import type {
  System,
  SystemCategory,
  SystemStatus,
  MaintenanceLog,
  MaintenanceType,
  Master,
  Expense,
  Document as Doc,
} from '@/types/database'
import {
  SYSTEM_CATEGORY_LABELS,
  SYSTEM_STATUS_LABELS,
  MAINTENANCE_TYPE_LABELS,
  DOCUMENT_TYPE_LABELS,
} from '@/types/database'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import Modal from '@/components/Modal'
import StatusBadge from '@/components/StatusBadge'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Plus,
  Wrench,
  FileText,
  DollarSign,
  User,
  Calendar,
  Info,
} from 'lucide-react'

interface SystemWithHouse extends System {
  houses: { name: string } | null
}

interface MaintenanceLogWithMaster extends MaintenanceLog {
  masters: { name: string } | null
}

export default function SystemDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = isDemo() ? null : createClient()

  const [system, setSystem] = useState<SystemWithHouse | null>(null)
  const [logs, setLogs] = useState<MaintenanceLogWithMaster[]>([])
  const [documents, setDocuments] = useState<Doc[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [masters, setMasters] = useState<Master[]>([])
  const [loading, setLoading] = useState(true)

  // Modal state
  const [editOpen, setEditOpen] = useState(false)
  const [addLogOpen, setAddLogOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Edit form state
  const [editForm, setEditForm] = useState({
    category: '' as SystemCategory,
    name: '',
    model: '',
    installed_at: '',
    last_maintenance_at: '',
    maintenance_interval_months: '',
    status: '' as SystemStatus,
    notes: '',
  })

  // Add log form state
  const [logForm, setLogForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'maintenance' as MaintenanceType,
    comment: '',
    cost: '',
    master_id: '',
  })

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    setLoading(true)

    if (isDemo()) {
      const demoSystem = DEMO_SYSTEMS.find(s => s.id === id)
      if (demoSystem) {
        const house = DEMO_HOUSES.find(h => h.id === demoSystem.house_id)
        setSystem({ ...demoSystem, houses: house ? { name: house.name } : null } as SystemWithHouse)
        setEditForm({
          category: demoSystem.category,
          name: demoSystem.name,
          model: demoSystem.model || '',
          installed_at: demoSystem.installed_at || '',
          last_maintenance_at: demoSystem.last_maintenance_at || '',
          maintenance_interval_months: demoSystem.maintenance_interval_months?.toString() || '',
          status: demoSystem.status,
          notes: demoSystem.notes || '',
        })
        const demoLogs = DEMO_MAINTENANCE.filter(m => m.system_id === id).map(m => ({
          ...m,
          masters: DEMO_MASTERS.find(ma => ma.id === m.master_id) ? { name: DEMO_MASTERS.find(ma => ma.id === m.master_id)!.name } : null,
        })) as MaintenanceLogWithMaster[]
        setLogs(demoLogs)
        setExpenses(DEMO_EXPENSES.filter(e => e.system_id === id))
        setMasters(DEMO_MASTERS)
      }
      setDocuments([])
      setLoading(false)
      return
    }

    const {
      data: { user },
    } = await supabase!.auth.getUser()
    if (!user) return

    const [systemRes, logsRes, documentsRes, expensesRes, mastersRes] = await Promise.all([
      supabase!.from('systems').select('*, houses(name)').eq('id', id).single(),
      supabase!
        .from('maintenance_logs')
        .select('*, masters(name)')
        .eq('system_id', id)
        .order('date', { ascending: false }),
      supabase!.from('documents').select('*').eq('system_id', id),
      supabase!.from('expenses').select('*').eq('system_id', id),
      supabase!.from('masters').select('*').eq('user_id', user.id),
    ])

    if (systemRes.data) {
      const s = systemRes.data as SystemWithHouse
      setSystem(s)
      setEditForm({
        category: s.category,
        name: s.name,
        model: s.model || '',
        installed_at: s.installed_at ? s.installed_at.split('T')[0] : '',
        last_maintenance_at: s.last_maintenance_at ? s.last_maintenance_at.split('T')[0] : '',
        maintenance_interval_months: s.maintenance_interval_months?.toString() || '',
        status: s.status,
        notes: s.notes || '',
      })
    }

    setLogs((logsRes.data as MaintenanceLogWithMaster[]) || [])
    setDocuments((documentsRes.data as Doc[]) || [])
    setExpenses(expensesRes.data || [])
    setMasters(mastersRes.data || [])
    setLoading(false)
  }

  async function handleEditSystem(e: React.FormEvent) {
    e.preventDefault()
    if (isDemo()) { setEditOpen(false); return }
    if (!system) return
    setSaving(true)

    const intervalMonths = editForm.maintenance_interval_months
      ? parseInt(editForm.maintenance_interval_months)
      : null

    let nextMaintenance: string | null = null
    if (editForm.last_maintenance_at && intervalMonths) {
      const d = new Date(editForm.last_maintenance_at)
      d.setMonth(d.getMonth() + intervalMonths)
      nextMaintenance = d.toISOString()
    }

    const { error } = await supabase!
      .from('systems')
      .update({
        category: editForm.category,
        name: editForm.name,
        model: editForm.model || null,
        installed_at: editForm.installed_at || null,
        last_maintenance_at: editForm.last_maintenance_at || null,
        maintenance_interval_months: intervalMonths,
        next_maintenance_at: nextMaintenance,
        status: editForm.status,
        notes: editForm.notes || null,
      })
      .eq('id', system.id)

    setSaving(false)
    if (!error) {
      setEditOpen(false)
      loadData()
    }
  }

  async function handleDeleteSystem() {
    if (isDemo()) return
    if (!system) return
    setSaving(true)

    const { error } = await supabase!.from('systems').delete().eq('id', system.id)

    setSaving(false)
    if (!error) {
      router.push(`/houses/${system.house_id}`)
    }
  }

  async function handleAddLog(e: React.FormEvent) {
    e.preventDefault()
    if (isDemo()) { setAddLogOpen(false); return }
    if (!system) return
    setSaving(true)

    const cost = logForm.cost ? parseFloat(logForm.cost) : null

    // Create maintenance log
    const { data: newLog, error: logError } = await supabase!
      .from('maintenance_logs')
      .insert({
        house_id: system.house_id,
        system_id: system.id,
        date: logForm.date,
        type: logForm.type,
        comment: logForm.comment || null,
        cost,
        master_id: logForm.master_id || null,
      })
      .select()
      .single()

    if (logError) {
      setSaving(false)
      return
    }

    // Update last_maintenance_at if needed
    const currentLast = system.last_maintenance_at
    if (!currentLast || logForm.date >= currentLast.split('T')[0]) {
      const intervalMonths = system.maintenance_interval_months
      let nextMaintenance: string | null = null
      if (intervalMonths) {
        const d = new Date(logForm.date)
        d.setMonth(d.getMonth() + intervalMonths)
        nextMaintenance = d.toISOString()
      }

      await supabase!
        .from('systems')
        .update({
          last_maintenance_at: logForm.date,
          next_maintenance_at: nextMaintenance,
        })
        .eq('id', system.id)
    }

    // Create expense record if cost is present
    if (cost && newLog) {
      await supabase!.from('expenses').insert({
        house_id: system.house_id,
        system_id: system.id,
        maintenance_log_id: newLog.id,
        date: logForm.date,
        amount: cost,
        category: logForm.type,
        comment: logForm.comment || null,
      })
    }

    setSaving(false)
    setAddLogOpen(false)
    setLogForm({
      date: new Date().toISOString().split('T')[0],
      type: 'maintenance',
      comment: '',
      cost: '',
      master_id: '',
    })
    loadData()
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    )
  }

  if (!system) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Система не найдена</p>
        <button onClick={() => router.push('/houses')} className="btn-primary mt-4">
          Вернуться к списку домов
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push(`/houses/${system.house_id}`)}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          {system.houses?.name || 'Назад к дому'}
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{system.name}</h1>
              <span className="inline-flex items-center rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                {SYSTEM_CATEGORY_LABELS[system.category]}
              </span>
              <StatusBadge status={system.status} />
            </div>
            {system.model && (
              <p className="text-gray-500">{system.model}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setEditOpen(true)}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              Редактировать
            </button>
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              className="btn-danger inline-flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Удалить
            </button>
          </div>
        </div>
      </div>

      {/* Info block */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Info className="w-5 h-5 text-gray-400" />
            Информация
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-5 py-4">
          <div>
            <div className="text-sm text-gray-500">Модель</div>
            <div className="font-medium text-gray-900">{system.model || '—'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Дата установки</div>
            <div className="font-medium text-gray-900">{formatDate(system.installed_at)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Последнее обслуживание</div>
            <div className="font-medium text-gray-900">{formatDate(system.last_maintenance_at)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Следующее обслуживание</div>
            <div className="font-medium text-gray-900">{formatDate(system.next_maintenance_at)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Интервал обслуживания</div>
            <div className="font-medium text-gray-900">
              {system.maintenance_interval_months
                ? `${system.maintenance_interval_months} мес.`
                : '—'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Статус</div>
            <div className="font-medium">
              <StatusBadge status={system.status} />
            </div>
          </div>
          {system.notes && (
            <div className="sm:col-span-2">
              <div className="text-sm text-gray-500">Заметки</div>
              <div className="font-medium text-gray-900 whitespace-pre-wrap">{system.notes}</div>
            </div>
          )}
        </div>
      </div>

      {/* История работ */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-gray-400" />
            История работ
          </h2>
          <button
            onClick={() => setAddLogOpen(true)}
            className="btn-primary inline-flex items-center gap-1 text-sm"
          >
            <Plus className="w-4 h-4" />
            Добавить
          </button>
        </div>
        {logs.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">
            Нет записей о работах.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Дата</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Тип</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Комментарий</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500">Стоимость</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Мастер</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-900 whitespace-nowrap">
                      {formatDate(log.date)}
                    </td>
                    <td className="px-5 py-3 text-gray-900">
                      {MAINTENANCE_TYPE_LABELS[log.type]}
                    </td>
                    <td className="px-5 py-3 text-gray-600 max-w-xs truncate">
                      {log.comment || '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-900 text-right whitespace-nowrap">
                      {log.cost != null ? formatCurrency(log.cost) : '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {log.masters?.name || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Документы */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-400" />
            Документы
          </h2>
          <span className="text-sm text-gray-400">{documents.length}</span>
        </div>
        {documents.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">
            Нет документов для этой системы.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <div className="font-medium text-gray-900">{doc.name}</div>
                  <div className="text-sm text-gray-500">
                    {DOCUMENT_TYPE_LABELS[doc.type]}
                    {' · '}
                    {formatDate(doc.created_at)}
                  </div>
                </div>
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-sm"
                >
                  Открыть
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Расходы */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gray-400" />
            Расходы
          </h2>
          <span className="text-sm font-semibold text-gray-700">
            Итого: {formatCurrency(totalExpenses)}
          </span>
        </div>
        {expenses.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">
            Нет расходов для этой системы.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {expenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <div className="font-medium text-gray-900">
                    {expense.comment || expense.category || 'Расход'}
                  </div>
                  <div className="text-sm text-gray-500">{formatDate(expense.date)}</div>
                </div>
                <div className="text-sm font-medium text-gray-900 flex-shrink-0">
                  {formatCurrency(expense.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Мастера (linked via logs) */}
      {(() => {
        const linkedMasterIds = new Set(
          logs.filter((l) => l.master_id).map((l) => l.master_id)
        )
        const linkedMasters = masters.filter((m) => linkedMasterIds.has(m.id))
        return (
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-gray-400" />
                Мастера
              </h2>
              <span className="text-sm text-gray-400">{linkedMasters.length}</span>
            </div>
            {linkedMasters.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">
                Нет связанных мастеров.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {linkedMasters.map((master) => (
                  <div key={master.id} className="px-5 py-3">
                    <div className="font-medium text-gray-900">{master.name}</div>
                    <div className="text-sm text-gray-500">
                      {master.specialization && <span>{master.specialization}</span>}
                      {master.phone && (
                        <span>
                          {master.specialization ? ' · ' : ''}
                          {master.phone}
                        </span>
                      )}
                    </div>
                    {master.notes && (
                      <div className="text-sm text-gray-400 mt-1">{master.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })()}

      {/* Edit System Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Редактировать систему">
        <form onSubmit={handleEditSystem} className="space-y-4">
          <div>
            <label className="label">Категория</label>
            <select
              className="input"
              value={editForm.category}
              onChange={(e) =>
                setEditForm({ ...editForm, category: e.target.value as SystemCategory })
              }
              required
            >
              {(Object.keys(SYSTEM_CATEGORY_LABELS) as SystemCategory[]).map((cat) => (
                <option key={cat} value={cat}>
                  {SYSTEM_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Название</label>
            <input
              type="text"
              className="input"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">Модель</label>
            <input
              type="text"
              className="input"
              value={editForm.model}
              onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Дата установки</label>
              <input
                type="date"
                className="input"
                value={editForm.installed_at}
                onChange={(e) => setEditForm({ ...editForm, installed_at: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Последнее обслуживание</label>
              <input
                type="date"
                className="input"
                value={editForm.last_maintenance_at}
                onChange={(e) =>
                  setEditForm({ ...editForm, last_maintenance_at: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Интервал (мес.)</label>
              <input
                type="number"
                className="input"
                min="1"
                value={editForm.maintenance_interval_months}
                onChange={(e) =>
                  setEditForm({ ...editForm, maintenance_interval_months: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Статус</label>
              <select
                className="input"
                value={editForm.status}
                onChange={(e) =>
                  setEditForm({ ...editForm, status: e.target.value as SystemStatus })
                }
                required
              >
                {(Object.keys(SYSTEM_STATUS_LABELS) as SystemStatus[]).map((st) => (
                  <option key={st} value={st}>
                    {SYSTEM_STATUS_LABELS[st]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Заметки</label>
            <textarea
              className="input"
              rows={3}
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="btn-secondary"
            >
              Отмена
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Maintenance Log Modal */}
      <Modal
        open={addLogOpen}
        onClose={() => setAddLogOpen(false)}
        title="Добавить запись о работе"
      >
        <form onSubmit={handleAddLog} className="space-y-4">
          <div>
            <label className="label">Дата</label>
            <input
              type="date"
              className="input"
              value={logForm.date}
              onChange={(e) => setLogForm({ ...logForm, date: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">Тип работы</label>
            <select
              className="input"
              value={logForm.type}
              onChange={(e) =>
                setLogForm({ ...logForm, type: e.target.value as MaintenanceType })
              }
              required
            >
              {(Object.keys(MAINTENANCE_TYPE_LABELS) as MaintenanceType[]).map((t) => (
                <option key={t} value={t}>
                  {MAINTENANCE_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Комментарий</label>
            <textarea
              className="input"
              rows={3}
              value={logForm.comment}
              onChange={(e) => setLogForm({ ...logForm, comment: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Стоимость (руб.)</label>
            <input
              type="number"
              className="input"
              min="0"
              step="1"
              value={logForm.cost}
              onChange={(e) => setLogForm({ ...logForm, cost: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Мастер</label>
            <select
              className="input"
              value={logForm.master_id}
              onChange={(e) => setLogForm({ ...logForm, master_id: e.target.value })}
            >
              <option value="">— Не указан —</option>
              {masters.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                  {m.specialization ? ` (${m.specialization})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setAddLogOpen(false)}
              className="btn-secondary"
            >
              Отмена
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Сохранение...' : 'Добавить'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Удалить систему"
      >
        <p className="text-gray-600 mb-6">
          Вы уверены, что хотите удалить систему &laquo;{system.name}&raquo;? Это действие нельзя
          отменить. Все связанные записи о работах также будут удалены.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setDeleteConfirmOpen(false)}
            className="btn-secondary"
          >
            Отмена
          </button>
          <button
            onClick={handleDeleteSystem}
            className="btn-danger"
            disabled={saving}
          >
            {saving ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
