'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="card text-center">
        <h2 className="text-xl font-semibold mb-4">Проверьте почту</h2>
        <p className="text-sm text-gray-600 mb-6">
          Мы отправили ссылку для сброса пароля на{' '}
          <span className="font-medium text-gray-900">{email}</span>
        </p>
        <Link href="/login" className="btn-primary inline-block">
          Вернуться ко входу
        </Link>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-center mb-2">Сброс пароля</h2>
      <p className="text-sm text-gray-500 text-center mb-6">
        Введите вашу почту, и мы отправим ссылку для сброса пароля
      </p>

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

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Отправка...' : 'Отправить ссылку'}
        </button>
      </form>

      <div className="mt-4 text-center text-sm">
        <Link href="/login" className="text-brand-600 hover:text-brand-700">
          Вернуться ко входу
        </Link>
      </div>
    </div>
  );
}
