export type HouseType = 'house' | 'cottage' | 'townhouse' | 'dacha' | 'other'

export type SystemCategory =
  | 'heating'
  | 'water'
  | 'sewage'
  | 'electrical'
  | 'ventilation'
  | 'yard'
  | 'roof_facade'
  | 'security'

export type SystemStatus = 'ok' | 'attention' | 'risk' | 'off'

export type MaintenanceType = 'maintenance' | 'repair' | 'installation' | 'inspection' | 'replacement'

export type DocumentType = 'receipt' | 'warranty' | 'manual' | 'photo' | 'act' | 'contract' | 'other'

export type MemberRole = 'owner' | 'editor' | 'viewer'

export type HealthStatus = 'ok' | 'attention' | 'risk'

export interface House {
  id: string
  user_id: string
  name: string
  address: string | null
  city: string | null
  house_type: HouseType
  area: number | null
  year_built: number | null
  created_at: string
  updated_at: string
}

export interface HouseMember {
  id: string
  house_id: string
  user_id: string
  email: string
  role: MemberRole
  invited_at: string
  accepted: boolean
}

export interface System {
  id: string
  house_id: string
  category: SystemCategory
  name: string
  model: string | null
  installed_at: string | null
  last_maintenance_at: string | null
  maintenance_interval_months: number | null
  next_maintenance_at: string | null
  status: SystemStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface MaintenanceLog {
  id: string
  house_id: string
  system_id: string | null
  master_id: string | null
  date: string
  type: MaintenanceType
  comment: string | null
  cost: number | null
  created_at: string
}

export interface Reminder {
  id: string
  house_id: string
  system_id: string | null
  title: string
  description: string | null
  due_date: string
  is_auto: boolean
  completed: boolean
  created_at: string
}

export interface Master {
  id: string
  user_id: string
  name: string
  phone: string | null
  specialization: string | null
  notes: string | null
  created_at: string
}

export interface Expense {
  id: string
  house_id: string
  system_id: string | null
  maintenance_log_id: string | null
  date: string
  amount: number
  category: string | null
  comment: string | null
  created_at: string
}

export interface Document {
  id: string
  house_id: string
  system_id: string | null
  maintenance_log_id: string | null
  name: string
  type: DocumentType
  file_url: string
  file_size: number | null
  created_at: string
}

// Helper maps for display
export const SYSTEM_CATEGORY_LABELS: Record<SystemCategory, string> = {
  heating: 'Отопление',
  water: 'Вода',
  sewage: 'Канализация',
  electrical: 'Электрика',
  ventilation: 'Вентиляция / Кондиционирование',
  yard: 'Участок',
  roof_facade: 'Крыша / Фасад',
  security: 'Безопасность',
}

export const SYSTEM_STATUS_LABELS: Record<SystemStatus, string> = {
  ok: 'В порядке',
  attention: 'Нужно внимание',
  risk: 'Есть риски',
  off: 'Отключена',
}

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  maintenance: 'Обслуживание',
  repair: 'Ремонт',
  installation: 'Установка',
  inspection: 'Осмотр',
  replacement: 'Замена',
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  receipt: 'Чек',
  warranty: 'Гарантия',
  manual: 'Инструкция',
  photo: 'Фото',
  act: 'Акт',
  contract: 'Договор',
  other: 'Другое',
}

export const HOUSE_TYPE_LABELS: Record<HouseType, string> = {
  house: 'Дом',
  cottage: 'Коттедж',
  townhouse: 'Таунхаус',
  dacha: 'Дача',
  other: 'Другое',
}

export const HEALTH_STATUS_LABELS: Record<HealthStatus, string> = {
  ok: 'В порядке',
  attention: 'Нужно внимание',
  risk: 'Есть риски',
}
