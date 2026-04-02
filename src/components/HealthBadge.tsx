import { Shield, AlertTriangle, AlertCircle } from 'lucide-react'
import type { HealthStatus } from '@/types/database'
import { HEALTH_STATUS_LABELS } from '@/types/database'
import { cn } from '@/lib/utils'

const config: Record<HealthStatus, { icon: typeof Shield; bg: string; text: string; iconColor: string }> = {
  ok: { icon: Shield, bg: 'bg-green-50', text: 'text-green-700', iconColor: 'text-green-500' },
  attention: { icon: AlertTriangle, bg: 'bg-yellow-50', text: 'text-yellow-700', iconColor: 'text-yellow-500' },
  risk: { icon: AlertCircle, bg: 'bg-red-50', text: 'text-red-700', iconColor: 'text-red-500' },
}

export default function HealthBadge({ status, size = 'md' }: { status: HealthStatus; size?: 'sm' | 'md' | 'lg' }) {
  const { icon: Icon, bg, text, iconColor } = config[status]

  return (
    <div className={cn('inline-flex items-center gap-2 rounded-lg px-3 py-2', bg)}>
      <Icon className={cn('flex-shrink-0', iconColor, size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4')} />
      <span className={cn('font-medium', text, size === 'lg' ? 'text-base' : size === 'md' ? 'text-sm' : 'text-xs')}>
        {HEALTH_STATUS_LABELS[status]}
      </span>
    </div>
  )
}
