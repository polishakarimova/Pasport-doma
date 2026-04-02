'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
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

  const fadeInUp = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.6 }
  }

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-green-600/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        />
        
        <motion.div 
          className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center">
            <motion.h1 
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.span 
                className="text-blue-600"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                Паспорт дома
              </motion.span> —<br />
              умное управление недвижимостью
            </motion.h1>
            
            <motion.p 
              className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Автоматизируйте обслуживание частных домов, таунхаусов и коттеджей. 
              Планируйте ремонты, ведите учёт расходов и никогда не забывайте о важных задачах.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <motion.button
                onClick={() => router.push('/houses')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white font-semibold text-lg rounded-xl shadow-lg"
                whileHover={{ 
                  scale: 1.05, 
                  backgroundColor: '#1d4ed8',
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                Попробовать демо
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </motion.button>
              
              <motion.button 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 border-2 border-blue-600 text-blue-600 font-semibold text-lg rounded-xl"
                whileHover={{ 
                  scale: 1.02,
                  backgroundColor: 'rgb(239 246 255)',
                  borderColor: '#1d4ed8'
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Star className="w-5 h-5" />
                </motion.div>
                Узнать больше
              </motion.button>
            </motion.div>
            
            {/* Stats */}
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <motion.div 
                className="text-center"
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div 
                  className="text-3xl font-bold text-blue-600 mb-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: "spring", stiffness: 100 }}
                >
                  8 систем
                </motion.div>
                <div className="text-gray-600">под контролем</div>
              </motion.div>
              <motion.div 
                className="text-center"
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div 
                  className="text-3xl font-bold text-green-600 mb-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.0, type: "spring", stiffness: 100 }}
                >
                  24/7
                </motion.div>
                <div className="text-gray-600">мониторинг</div>
              </motion.div>
              <motion.div 
                className="text-center"
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div 
                  className="text-3xl font-bold text-purple-600 mb-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.2, type: "spring", stiffness: 100 }}
                >
                  100%
                </motion.div>
                <div className="text-gray-600">контроль</div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Features Section */}
      <motion.div 
        className="py-16 bg-white"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 
            className="text-3xl font-bold text-center text-gray-900 mb-4"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Всё для управления частным домом
          </motion.h2>
          <motion.p 
            className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto"
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Комплексное решение для владельцев частных домов, таунхаусов и коттеджей
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div 
                key={index} 
                className="text-center group p-6 rounded-xl bg-gray-50"
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1
                }}
                whileHover={{ 
                  y: -8,
                  backgroundColor: 'rgb(255 255 255)',
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                  transition: { type: "spring", stiffness: 300 }
                }}
              >
                <motion.div 
                  className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-xl mb-4"
                  whileHover={{ 
                    backgroundColor: 'rgb(191 219 254)',
                    scale: 1.1,
                    rotate: [0, -10, 10, 0]
                  }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <feature.icon className="w-8 h-8 text-blue-600" />
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Systems Overview */}
      <motion.div 
        className="py-16 bg-gray-50"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 
            className="text-3xl font-bold text-gray-900 mb-4"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            8 ключевых систем дома
          </motion.h2>
          <motion.p 
            className="text-lg text-gray-600 mb-12"
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Полный контроль всех критически важных систем вашего дома
          </motion.p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {systems.map((system, index) => (
              <motion.div
                key={index}
                className="p-4 bg-white rounded-lg shadow-sm border-2 border-transparent"
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.4, 
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{
                  borderColor: 'rgb(59 130 246)',
                  backgroundColor: 'rgb(239 246 255)',
                  y: -2,
                  transition: { type: "spring", stiffness: 400 }
                }}
              >
                <span className="text-sm font-medium text-gray-700">{system}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div 
        className="py-16 bg-blue-600"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 
            className="text-3xl font-bold text-white mb-4"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Готовы начать?
          </motion.h2>
          <motion.p 
            className="text-xl text-blue-100 mb-8"
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Попробуйте демо-версию и убедитесь, насколько просто управлять домом может быть
          </motion.p>

          <motion.button
            onClick={() => router.push('/houses')}
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-blue-600 font-semibold text-lg rounded-xl shadow-lg"
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{ 
              scale: 1.05,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              y: -2
            }}
            whileTap={{ scale: 0.95 }}
          >
            <CheckCircle className="w-5 h-5" />
            Начать использовать
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}