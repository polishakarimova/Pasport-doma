import { cn } from '@/lib/utils'
import type { SystemStatus } from '@/types/database'
import { SYSTEM_STATUS_LABELS } from '@/types/database'

const colors: Record<SystemStatus, string> = {
  ok: 'bg-green-100 text-green-700',
  attention: 'bg-yellow-100 text-yellow-700',
  risk: 'bg-red-100 text-red-700',
  off: 'bg-gray-100 text-gray-500',
}

export default function StatusBadge({ status }: { status: SystemStatus }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', colors[status])}>
      {SYSTEM_STATUS_LABELS[status]}
    </span>
  )
}
