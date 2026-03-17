'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Wrench,
  Bell,
  Users,
  Receipt,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ClipboardList,
  MoreHorizontal,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { createClient, isDemo } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Мои дома', href: '/houses', icon: Home },
  { name: 'Журнал работ', href: '/maintenance', icon: ClipboardList },
  { name: 'Напоминания', href: '/reminders', icon: Bell },
  { name: 'Мастера', href: '/masters', icon: Users },
  { name: 'Расходы', href: '/expenses', icon: Receipt },
  { name: 'Документы', href: '/documents', icon: FileText },
  { name: 'Настройки', href: '/settings', icon: Settings },
]

// Bottom tab bar: first 4 items + "More" button
const bottomTabs = navigation.slice(0, 4)
const moreMenuItems = navigation.slice(4)

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    if (isDemo()) {
      router.push('/login')
      return
    }
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Close "more" menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    if (moreOpen) {
      document.addEventListener('mousedown', handleClick)
    }
    return () => document.removeEventListener('mousedown', handleClick)
  }, [moreOpen])

  // Close "more" menu on route change
  useEffect(() => {
    setMoreOpen(false)
  }, [pathname])

  const isMoreActive = moreMenuItems.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  )

  const navContent = (
    <>
      <div className="flex items-center gap-2 px-4 py-5 border-b border-gray-200">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
          <Home className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-semibold text-gray-900">Паспорт дома</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
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

      <div className="px-3 py-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          Выйти
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar — unchanged */}
      <div className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:flex-col lg:border-r lg:border-gray-200 lg:bg-white">
        {navContent}
      </div>

      {/* Mobile bottom tab bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200">
        {/* "More" popup menu */}
        {moreOpen && (
          <div ref={moreRef} className="absolute bottom-full right-0 mb-1 mr-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2">
            {moreMenuItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {item.name}
                </Link>
              )
            })}
            <div className="border-t border-gray-100 mt-1 pt-1">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors w-full"
              >
                <LogOut className="w-5 h-5" />
                Выйти
              </button>
            </div>
          </div>
        )}

        {/* Tab buttons */}
        <nav className="flex items-stretch justify-around h-16 safe-bottom">
          {bottomTabs.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 gap-0.5 text-[10px] font-medium transition-colors',
                  isActive
                    ? 'text-brand-600'
                    : 'text-gray-400'
                )}
              >
                <item.icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
                <span>{item.name.length > 8 ? item.name.slice(0, 7) + '.' : item.name}</span>
              </Link>
            )
          })}

          {/* "More" button */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={cn(
              'flex flex-col items-center justify-center flex-1 gap-0.5 text-[10px] font-medium transition-colors',
              isMoreActive || moreOpen
                ? 'text-brand-600'
                : 'text-gray-400'
            )}
          >
            <MoreHorizontal className={cn('w-5 h-5', (isMoreActive || moreOpen) && 'stroke-[2.5]')} />
            <span>Ещё</span>
          </button>
        </nav>
      </div>
    </>
  )
}
