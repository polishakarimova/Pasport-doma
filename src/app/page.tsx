'use client'

import Link from 'next/link'
import { useTheme } from '@/components/ThemeProvider'
import {
  Home,
  ClipboardList,
  Bell,
  Receipt,
  Users,
  Shield,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react'

const features = [
  {
    icon: Home,
    title: 'Паспорт дома',
    description: 'Храните все данные о доме в одном месте: системы, документы, контакты мастеров',
  },
  {
    icon: ClipboardList,
    title: 'Журнал работ',
    description: 'Фиксируйте все работы по обслуживанию с датами, стоимостью и исполнителями',
  },
  {
    icon: Bell,
    title: 'Напоминания',
    description: 'Не пропускайте плановое обслуживание — система напомнит о предстоящих задачах',
  },
  {
    icon: Receipt,
    title: 'Учёт расходов',
    description: 'Контролируйте бюджет на содержание дома с аналитикой по месяцам и категориям',
  },
  {
    icon: Users,
    title: 'Мастера',
    description: 'Ведите базу проверенных мастеров с контактами и специализацией',
  },
  {
    icon: Shield,
    title: 'Безопасность',
    description: 'Ваши данные защищены. Делитесь доступом к дому с членами семьи',
  },
]

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-[#FDFAF5]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-[#FDFAF5]/80 backdrop-blur-lg border-b border-gray-200/50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-semibold text-gray-900">Паспорт дома</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-brand-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-400" />
              )}
            </button>
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Войти
            </Link>
            <Link
              href="/signup"
              className="btn-primary text-sm px-4 py-2"
            >
              Начать
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-28 pb-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Home className="w-4 h-4" />
            Умный помощник для вашего дома
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
            Всё о вашем доме
            <br />
            <span className="text-brand-600">в одном приложении</span>
          </h1>

          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
            Паспорт дома — это цифровой помощник для владельцев домов и квартир.
            Учёт систем, журнал работ, расходы, напоминания и контакты мастеров — всё в&nbsp;одном месте.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="btn-primary text-base px-8 py-3 inline-flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              Зарегистрироваться бесплатно
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="btn-secondary text-base px-8 py-3 w-full sm:w-auto text-center"
            >
              У меня есть аккаунт
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
            Что умеет Паспорт дома?
          </h2>
          <p className="text-gray-500 text-center mb-12 max-w-lg mx-auto">
            Всё необходимое для грамотного содержания дома
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="card p-6 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-brand-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            Как начать?
          </h2>

          <div className="space-y-8">
            {[
              { step: '1', title: 'Зарегистрируйтесь', desc: 'Создайте аккаунт по email или через Google — это бесплатно' },
              { step: '2', title: 'Добавьте свой дом', desc: 'Укажите адрес, площадь, год постройки и другие параметры' },
              { step: '3', title: 'Ведите учёт', desc: 'Добавляйте системы, записывайте работы, контролируйте расходы' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-5">
                <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">{item.step}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Готовы навести порядок?
          </h2>
          <p className="text-gray-500 mb-8">
            Начните вести паспорт своего дома прямо сейчас — это бесплатно
          </p>
          <Link
            href="/signup"
            className="btn-primary text-base px-8 py-3 inline-flex items-center gap-2"
          >
            Создать аккаунт
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-brand-600 flex items-center justify-center">
              <Home className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-600">Паспорт дома</span>
          </div>
          <p className="text-xs text-gray-400">2024–2026. Все данные надёжно защищены.</p>
        </div>
      </footer>
    </div>
  )
}
