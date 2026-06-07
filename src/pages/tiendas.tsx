import { useState, useEffect } from 'react'
import { Store, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'

interface StoreItem {
  id: number
  name: string
  slug?: string
  description?: string
  department?: string
  isVerified: boolean
  createdAt: string
  userId?: number
  ownerName?: string
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: '2-digit' })
}

export function TiendasPage() {
  const [stores,    setStores]    = useState<StoreItem[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [verifying, setVerifying] = useState<number | null>(null)
  const [filter,    setFilter]    = useState<'all' | 'verified' | 'unverified'>('all')

  useEffect(() => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    if (filter === 'verified')   params.set('verified', 'true')
    if (filter === 'unverified') params.set('verified', 'false')
    api.get<StoreItem[] | { stores: StoreItem[] }>(`/stores${params.toString() ? '?' + params : ''}`)
      .then((res) => {
        setStores(Array.isArray(res) ? res : res.stores ?? [])
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [filter])

  async function verifyStore(id: number) {
    setVerifying(id)
    try {
      await api.patch(`/stores/${id}/verify`, { isVerified: true })
      setStores((prev) => prev.map((s) => s.id === id ? { ...s, isVerified: true } : s))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al verificar tienda')
    } finally {
      setVerifying(null)
    }
  }

  const displayed = stores.filter((s) => {
    if (filter === 'verified')   return s.isVerified
    if (filter === 'unverified') return !s.isVerified
    return true
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Tiendas</h1>
        <p className="text-sm text-gray-400 mt-0.5">Verificación y gestión de tiendas del marketplace</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 w-fit rounded-lg border border-gray-200 bg-gray-50 p-1">
        {([
          { key: 'all',        label: 'Todas' },
          { key: 'unverified', label: 'Sin verificar' },
          { key: 'verified',   label: 'Verificadas' },
        ] as { key: typeof filter; label: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`rounded-md px-3 py-1 text-[12px] font-semibold transition-colors ${
              filter === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="border-b border-gray-100 bg-gray-50/50">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-400">Tienda</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Propietario</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Departamento</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Verificación</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Registrada</th>
                <th className="px-4 py-3 font-semibold text-gray-400 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-5 w-full" /></td>
                      ))}
                    </tr>
                  ))
                : displayed.length === 0
                ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-16 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <Store className="h-8 w-8 text-gray-200" />
                          <p className="text-sm font-semibold">Sin tiendas</p>
                        </div>
                      </td>
                    </tr>
                  )
                : displayed.map((store) => (
                    <tr key={store.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-agrobot-100 text-[10px] font-bold text-agrobot-700">
                            {store.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{store.name}</p>
                            {store.slug && <p className="text-[10px] text-gray-400">/{store.slug}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {store.ownerName ?? (store.userId ? `#${store.userId}` : '—')}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{store.department ?? '—'}</td>
                      <td className="px-4 py-3">
                        {store.isVerified ? (
                          <span className="flex items-center gap-1 rounded-full bg-agrobot-50 px-2 py-0.5 text-[10px] font-semibold text-agrobot-700 w-fit">
                            <CheckCircle2 className="h-3 w-3" /> Verificada
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            Sin verificar
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400">{fmtDate(store.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          {!store.isVerified && (
                            <button
                              onClick={() => verifyStore(store.id)}
                              disabled={verifying === store.id}
                              className="flex items-center gap-1.5 rounded-lg bg-agrobot-50 px-3 py-1.5 text-xs font-semibold text-agrobot-700 hover:bg-agrobot-100 disabled:opacity-50 transition-colors"
                            >
                              {verifying === store.id
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : <CheckCircle2 className="h-3 w-3" />
                              }
                              Verificar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
