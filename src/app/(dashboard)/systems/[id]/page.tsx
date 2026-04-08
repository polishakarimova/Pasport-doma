import { DEMO_SYSTEMS } from '@/lib/demo-data'
import SystemDetail from './SystemDetail'

export function generateStaticParams() {
  return DEMO_SYSTEMS.map((s) => ({ id: s.id }))
}

export default function SystemDetailPage() {
  return <SystemDetail />
}
