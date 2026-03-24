'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Bell,
  Users,
  Receipt,
  FileText,
  Settings,
  LogOut,
  ClipboardList,
  Sun,
  Moon,
} from 'lucide-react'
import { createClient, isDemo } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/ThemeProvider'

const navigation = [
  { name: 'Мои дома', shortName: 'Дом', href: '/houses', icon: Home },
  { name: 'Журнал работ', shortName: 'Журнал', href: '/maintenance', icon: ClipboardList },
  { name: 'Напоминания', shortName: 'Напом.', href: '/reminders', icon: Bell },
  { name: 'Мастера', shortName: 'Мастера', href: '/masters', icon: Users },
  { name: 'Расходы', shortName: 'Расходы', href: '/expenses', icon: Receipt },
  { name: 'Документы', shortName: 'Докум.', href: '/documents', icon: FileText },
  { name: 'Настройки', shortName: 'Настр.', href: '/settings', icon: Settings },
]

// Bottom tab bar items: Дом / Журнал / Мастера / Расходы / Настройки
const bottomTabs = [
  navigation[0], // Дом
  navigation[1], // Журнал
  navigation[3], // Мастера
  navigation[4], // Расходы
  navigation[6], // Настройки
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()

  const handleLogout = async () => {
    if (isDemo()) {
      router.push('/login')
      return
    }
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Mobile top header — minimal */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between bg-[#FDFAF5] dark:bg-[#1A1612] px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
            <Home className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-semibold text-gray-900">Паспорт дома</span>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-brand-500" />
          ) : (
            <Moon className="w-5 h-5 text-gray-500" />
          )}
        </button>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:flex-col lg:border-r lg:border-gray-200 lg:bg-white">
        {/* Logo + theme toggle */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">Паспорт дома</span>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4.5 h-4.5 text-brand-500" />
            ) : (
              <Moon className="w-4.5 h-4.5 text-gray-400" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            Выйти
          </button>
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200">
        <nav className="flex items-stretch justify-around h-16 safe-bottom">
          {bottomTabs.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 gap-0.5 text-[10px] font-medium transition-colors',
                  isActive
                    ? 'text-brand-600'
                    : 'text-gray-400'
                )}
              >
                <item.icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
                <span>{item.shortName}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
