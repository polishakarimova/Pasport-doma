'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient, isDemo } from '@/lib/supabase/client'
import type { House, System, Document, DocumentType } from '@/types/database'
import { DOCUMENT_TYPE_LABELS } from '@/types/database'
import { formatDate, cn } from '@/lib/utils'
import Modal from '@/components/Modal'
import EmptyState from '@/components/EmptyState'
import { FileText, Plus, Download, Trash2, Upload, File, Filter } from 'lucide-react'

const DOCUMENT_TYPE_COLORS: Record<DocumentType, string> = {
  receipt: 'bg-green-100 text-green-700',
  warranty: 'bg-blue-100 text-blue-700',
  manual: 'bg-purple-100 text-purple-700',
  photo: 'bg-yellow-100 text-yellow-700',
  act: 'bg-orange-100 text-orange-700',
  contract: 'bg-indigo-100 text-indigo-700',
  other: 'bg-gray-100 text-gray-700',
}

interface DocumentWithRelations extends Document {
  systems: { name: string } | null
  houses: { name: string } | null
}

function formatFileSize(bytes: number | null): string {
  if (bytes == null || bytes === 0) return '—'
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
}

export default function DocumentsPage() {
  const supabase = isDemo() ? null : createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [houses, setHouses] = useState<House[]>([])
  const [systems, setSystems] = useState<System[]>([])
  const [documents, setDocuments] = useState<DocumentWithRelations[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterHouse, setFilterHouse] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterSystem, setFilterSystem] = useState<string>('')

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    house_id: '',
    system_id: '',
    name: '',
    type: 'other' as DocumentType,
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
      setHouses([])
      setSystems([])
      setDocuments([])
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
      setDocuments([])
      setLoading(false)
      return
    }

    const [documentsRes, systemsRes] = await Promise.all([
      supabase!
        .from('documents')
        .select('*, systems(name), houses(name)')
        .in('house_id', houseIds)
        .order('created_at', { ascending: false }),
      supabase!.from('systems').select('*').in('house_id', houseIds),
    ])

    setHouses(housesList)
    setDocuments((documentsRes.data as DocumentWithRelations[]) || [])
    setSystems(systemsRes.data || [])
    setLoading(false)
  }

  // Filtered systems for form dropdown
  const filteredFormSystems = formData.house_id
    ? systems.filter((s) => s.house_id === formData.house_id)
    : []

  // Filtered systems for filter dropdown
  const filteredFilterSystems = filterHouse
    ? systems.filter((s) => s.house_id === filterHouse)
    : systems

  // Apply filters
  const filteredDocuments = documents.filter((doc) => {
    if (filterHouse && doc.house_id !== filterHouse) return false
    if (filterType && doc.type !== filterType) return false
    if (filterSystem && doc.system_id !== filterSystem) return false
    return true
  })

  function openModal() {
    setFormData({ house_id: '', system_id: '', name: '', type: 'other' })
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isDemo()) { setModalOpen(false); return }
    if (!selectedFile) return

    setSubmitting(true)

    const {
      data: { user },
    } = await supabase!.auth.getUser()
    if (!user) {
      setSubmitting(false)
      return
    }

    const fileName = `${user.id}/${Date.now()}_${selectedFile.name}`

    const { error: uploadError } = await supabase!.storage
      .from('documents')
      .upload(fileName, selectedFile)

    if (uploadError) {
      alert('Ошибка загрузки файла: ' + uploadError.message)
      setSubmitting(false)
      return
    }

    const { error } = await supabase!.from('documents').insert({
      house_id: formData.house_id,
      system_id: formData.system_id || null,
      name: formData.name || selectedFile.name,
      type: formData.type,
      file_url: fileName,
      file_size: selectedFile.size,
    })

    if (!error) {
      setModalOpen(false)
      setFormData({ house_id: '', system_id: '', name: '', type: 'other' })
      setSelectedFile(null)
      loadData()
    } else {
      alert('Ошибка сохранения документа: ' + error.message)
    }

    setSubmitting(false)
  }

  async function handleDownload(doc: DocumentWithRelations) {
    if (isDemo()) return
    const { data } = await supabase!.storage
      .from('documents')
      .createSignedUrl(doc.file_url, 3600)

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
    }
  }

  async function handleDelete(doc: DocumentWithRelations) {
    if (isDemo()) return
    if (!confirm('Удалить документ? Это действие нельзя отменить.')) return

    const { error: storageError } = await supabase!.storage
      .from('documents')
      .remove([doc.file_url])

    if (storageError) {
      alert('Ошибка удаления файла: ' + storageError.message)
      return
    }

    const { error } = await supabase!
      .from('documents')
      .delete()
      .eq('id', doc.id)

    if (!error) {
      loadData()
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Документы</h1>
        <button
          onClick={openModal}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Загрузить документ
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Filter className="w-4 h-4 text-gray-400" />

        <select
          className="input w-auto"
          value={filterHouse}
          onChange={(e) => {
            setFilterHouse(e.target.value)
            setFilterSystem('')
          }}
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
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">Все типы</option>
          {(Object.entries(DOCUMENT_TYPE_LABELS) as [DocumentType, string][]).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            )
          )}
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
      </div>

      {/* Documents grid */}
      {filteredDocuments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Нет документов"
          description="Загрузите документы, связанные с вашим домом: чеки, гарантии, договоры и другие файлы."
          action={
            <button
              onClick={openModal}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Загрузить документ
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <div key={doc.id} className="card p-4 flex flex-col">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <File className="w-5 h-5 text-gray-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {doc.name}
                  </h3>
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1',
                      DOCUMENT_TYPE_COLORS[doc.type]
                    )}
                  >
                    {DOCUMENT_TYPE_LABELS[doc.type]}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-sm text-gray-500 mb-3 flex-1">
                <div className="flex items-center justify-between">
                  <span>Размер</span>
                  <span className="text-gray-700">{formatFileSize(doc.file_size)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Загружен</span>
                  <span className="text-gray-700">{formatDate(doc.created_at)}</span>
                </div>
                {doc.houses && (
                  <div className="flex items-center justify-between">
                    <span>Дом</span>
                    <span className="text-gray-700 truncate ml-2">{doc.houses.name}</span>
                  </div>
                )}
                {doc.systems && (
                  <div className="flex items-center justify-between">
                    <span>Система</span>
                    <span className="text-gray-700 truncate ml-2">{doc.systems.name}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleDownload(doc)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Скачать
                </button>
                <button
                  onClick={() => handleDelete(doc)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Загрузить документ"
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
            <label className="label">Название</label>
            <input
              type="text"
              className="input"
              placeholder="Название документа"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="label">Тип документа *</label>
            <select
              className="input"
              required
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as DocumentType })
              }
            >
              {(Object.entries(DOCUMENT_TYPE_LABELS) as [DocumentType, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="label">Файл *</label>
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
                selectedFile
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setSelectedFile(file)
                  if (file && !formData.name) {
                    setFormData((prev) => ({ ...prev, name: file.name }))
                  }
                }}
              />
              {selectedFile ? (
                <div className="flex flex-col items-center gap-1">
                  <File className="w-8 h-8 text-blue-500" />
                  <span className="text-sm font-medium text-gray-900">
                    {selectedFile.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatFileSize(selectedFile.size)}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Нажмите для выбора файла
                  </span>
                </div>
              )}
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
              disabled={submitting || !formData.house_id || !selectedFile}
              className="btn-primary"
            >
              {submitting ? 'Загрузка...' : 'Загрузить'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
