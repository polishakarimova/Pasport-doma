'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient, isDemo } from '@/lib/supabase/client'
import { Mail, CheckCircle } from 'lucide-react'

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов')
      return
    }

    if (isDemo()) {
      router.push('/houses')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/houses`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setEmailSent(true)
    setLoading(false)
  }

  const handleGoogleSignup = async () => {
    if (isDemo()) {
      router.push('/houses')
      return
    }
    setGoogleLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/houses`,
      },
    })

    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  // Email confirmation screen
  if (emailSent) {
    return (
      <div className="card p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Проверьте почту
        </h2>
        <p className="text-sm text-gray-500 mb-2">
          Мы отправили письмо с подтверждением на
        </p>
        <p className="text-sm font-medium text-gray-900 mb-6">
          {email}
        </p>
        <div className="flex items-center gap-2 justify-center text-xs text-gray-400 mb-6">
          <Mail className="w-4 h-4" />
          <span>Перейдите по ссылке в письме, чтобы активировать аккаунт</span>
        </div>
        <div className="space-y-2 text-sm">
          <p className="text-gray-500">
            Не получили письмо?{' '}
            <button
              onClick={() => setEmailSent(false)}
              className="text-brand-600 hover:text-brand-700"
            >
              Попробовать снова
            </button>
          </p>
          <p className="text-gray-500">
            Уже подтвердили?{' '}
            <Link href="/login" className="text-brand-600 hover:text-brand-700">
              Войти
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold text-center mb-6">Создание аккаунта</h2>

      {/* Google */}
      <button
        onClick={handleGoogleSignup}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-2xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <GoogleIcon />
        {googleLoading ? 'Перенаправление...' : 'Продолжить с Google'}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 uppercase">или по email</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Email form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">Электронная почта</label>
          <input
            id="email"
            type="email"
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="label">Пароль</label>
          <input
            id="password"
            type="password"
            className="input"
            placeholder="Минимум 6 символов"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="label">Подтвердите пароль</label>
          <input
            id="confirmPassword"
            type="password"
            className="input"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-gray-400">
        После регистрации на вашу почту придёт письмо для подтверждения
      </p>

      <div className="mt-3 text-center text-sm text-gray-500">
        Уже есть аккаунт?{' '}
        <Link href="/login" className="text-brand-600 hover:text-brand-700">
          Войти
        </Link>
      </div>
    </div>
  )
}
