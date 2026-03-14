import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Паспорт дома',
  description: 'Цифровой сервис для владельцев частных домов — все системы, обслуживание и расходы в одном месте',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className="font-sans">{children}</body>
    </html>
  )
}
