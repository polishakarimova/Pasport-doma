export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-brand-600">Паспорт дома</h1>
          <p className="mt-2 text-sm text-gray-500">
            Управление документами и информацией о вашем доме
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
