import { DEMO_HOUSES } from '@/lib/demo-data'
import HouseDetail from './HouseDetail'

export function generateStaticParams() {
  return DEMO_HOUSES.map((h) => ({ id: h.id }))
}

export default function HouseDetailPage() {
  return <HouseDetail />
}
