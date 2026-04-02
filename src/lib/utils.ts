import { format, formatDistanceToNow, isPast, isToday, isBefore, addDays, addMonths } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { HealthStatus, System } from '@/types/database'

export function formatDate(date: string | null): string {
  if (!date) return '—'
  return format(new Date(date), 'd MMM yyyy', { locale: ru })
}

export function formatDateShort(date: string | null): string {
  if (!date) return '—'
  return format(new Date(date), 'd MMM', { locale: ru })
}

export function formatRelative(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ru })
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function calculateNextMaintenance(
  lastMaintenance: string | null,
  intervalMonths: number | null
): string | null {
  if (!lastMaintenance || !intervalMonths) return null
  return addMonths(new Date(lastMaintenance), intervalMonths).toISOString()
}

export function calculateHealthStatus(systems: System[]): HealthStatus {
  if (systems.length === 0) return 'ok'

  const now = new Date()
  const in30Days = addDays(now, 30)

  const hasOverdue = systems.some((s) => {
    if (!s.next_maintenance_at) return false
    return isPast(new Date(s.next_maintenance_at))
  })

  if (hasOverdue) return 'risk'

  const hasUpcoming = systems.some((s) => {
    if (!s.next_maintenance_at) return false
    const next = new Date(s.next_maintenance_at)
    return isBefore(next, in30Days) && !isPast(next)
  })

  if (hasUpcoming) return 'attention'

  return 'ok'
}

export function getReminderCategory(dueDate: string): 'overdue' | 'today' | 'soon' | 'this_month' | 'later' {
  const due = new Date(dueDate)
  const now = new Date()

  if (isPast(due) && !isToday(due)) return 'overdue'
  if (isToday(due)) return 'today'
  if (isBefore(due, addDays(now, 7))) return 'soon'
  if (isBefore(due, addDays(now, 30))) return 'this_month'
  return 'later'
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
