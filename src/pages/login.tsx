import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAdminAuth } from '@/contexts/auth-context'
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'

export function LoginPage() {
  const { login }  = useAdminAuth()
  const navigate   = useNavigate()

  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [loading,      setLoading]      = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credenciales inválidas')
    } finally {
      setLoading(false)
    }
  }

  const inputBase =
    'w-full rounded-xl border border-gray-200 bg-white py-3.5 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-agrobot-500 focus:ring-2 focus:ring-agrobot-500/20'
  const labelBase = 'block text-[11px] font-semibold tracking-widest text-gray-500 uppercase mb-1.5'

  return (
    <div className="flex min-h-screen">

      {/* ── Left panel ────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-10 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(5,46,22,0.65) 60%, rgba(4,46,39,0.88) 100%), url('/banner.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="z-10">
          <img src="/logoagro.svg" alt="TierraMarket" className="h-12 w-auto brightness-0 invert" />
        </div>

        <div className="z-10">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white/70">
            Panel Administrador
          </p>
          <h2 className="font-display text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
            Gestiona el<br />marketplace agrícola.
          </h2>
          <p className="text-white/70 text-base leading-relaxed max-w-sm">
            Acceso exclusivo para administradores. Modera publicaciones, gestiona usuarios y configura la plataforma.
          </p>
        </div>
      </div>

      {/* ── Right panel ───────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white overflow-y-auto">
        <div className="w-full max-w-sm">

          {/* Logo */}
          <div className="flex justify-center items-center mb-8 lg:mb-6">
            <img src="/logoagro.svg" alt="TierraMarket" className="h-12 w-auto" />
          </div>

          <div className="mb-7">
            <h1 className="font-display text-[1.6rem] font-bold text-gray-900 leading-snug mb-1.5">
              Bienvenido de vuelta
            </h1>
            <p className="text-sm text-gray-500">
              Inicia sesión para acceder al panel de administración.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label className={labelBase} htmlFor="email">Correo electrónico</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@tierramarket.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`${inputBase} pl-11`}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className={labelBase} htmlFor="password">Contraseña</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="········"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`${inputBase} pl-11 pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 accent-agrobot-600"
                />
                <span className="text-sm text-gray-600">Recordarme</span>
              </label>
              <button type="button" className="text-xs font-semibold text-agrobot-700 hover:underline">
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-agrobot-800 px-6 py-4 text-sm font-semibold text-white transition-colors hover:bg-agrobot-900 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Iniciando sesión…' : (<>Ingresar <LogIn className="h-4 w-4" /></>)}
            </button>
          </form>

          <p className="mt-10 text-center text-[11px] text-gray-400">
            TierraMarket Admin · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
