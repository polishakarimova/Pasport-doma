'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Home, 
  Calendar, 
  Wrench, 
  DollarSign, 
  Users, 
  Bell, 
  CheckCircle,
  ArrowRight,
  Star
} from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()

  const features = [
    {
      icon: Home,
      title: "Управление недвижимостью",
      description: "Ведите учёт домов, таунхаусов, коттеджей и дач в одном приложении"
    },
    {
      icon: Calendar,
      title: "Автоматические напоминания", 
      description: "Никогда не забудьте о сезонном обслуживании и регулярном ТО"
    },
    {
      icon: Wrench,
      title: "Журнал обслуживания",
      description: "Полная история всех ремонтов и технического обслуживания"
    },
    {
      icon: DollarSign,
      title: "Учёт расходов",
      description: "Контролируйте бюджет на содержание и планируйте крупные траты"
    },
    {
      icon: Users,
      title: "База мастеров",
      description: "Храните контакты проверенных специалистов и их специализации"
    },
    {
      icon: Bell,
      title: "Умные уведомления",
      description: "Персонализированные напоминания с учётом климата и сезонности"
    }
  ]

  const systems = [
    "Отопление", "Водоснабжение", "Канализация", "Электрика", 
    "Вентиляция", "Двор и участок", "Кровля и фасад", "Безопасность"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-green-600/10" />
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              <span className="text-blue-600">Паспорт дома</span> —<br />
              умное управление недвижимостью
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Автоматизируйте обслуживание частных домов, таунхаусов и коттеджей. 
              Планируйте ремонты, ведите учёт расходов и никогда не забывайте о важных задачах.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button
                onClick={() => router.push('/houses')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white font-semibold text-lg rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Попробовать демо
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <button className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 border-2 border-blue-600 text-blue-600 font-semibold text-lg rounded-xl hover:bg-blue-50 transition-all duration-200">
                <Star className="w-5 h-5" />
                Узнать больше
              </button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">8 систем</div>
                <div className="text-gray-600">под контролем</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">24/7</div>
                <div className="text-gray-600">мониторинг</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">100%</div>
                <div className="text-gray-600">контроль</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Всё для управления частным домом
          </h2>
          <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Комплексное решение для владельцев частных домов, таунхаусов и коттеджей
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group p-6 rounded-xl bg-gray-50 hover:bg-white hover:shadow-lg transition-all duration-300">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors duration-200 mb-4">
                  <feature.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Systems Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Отслеживайте все системы дома
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            От газового котла до системы безопасности — под полным контролем
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {systems.map((system, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-white rounded-lg border">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700">{system}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Готовы взять дом под контроль?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Начните с демо-версии и убедитесь, как просто управлять частным домом с "Паспорт дома"
          </p>
          
          <button
            onClick={() => router.push('/houses')}
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-blue-600 font-semibold text-lg rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Начать сейчас
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}