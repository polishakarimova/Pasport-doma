// Static params for build
export function generateStaticParams() {
  return [
    { id: 'demo-1' },
    { id: 'demo-2' },
  ]
}

import HouseDetailClient from './client'

export default function HouseDetailPage() {
  return <HouseDetailClient />
}