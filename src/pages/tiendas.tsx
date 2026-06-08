import { useState, useEffect } from 'react'
import {
  Store, AlertCircle, CheckCircle2, Loader2, Clock,
  XCircle, ShieldCheck, Eye,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'

type StoreStatus = 'active' | 'pending' | 'inactive' | 'suspended'

interface StoreItem {
  id: number
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
  roleType: string | null
  status: StoreStatus
  department: string | null
  municipality: string | null
  isVerified: boolean
  userId: number
  createdAt: string
}

const STATUS_LABEL: Record<StoreStatus, string> = {
  active:    'Activa',
  pending:   'En revisión',
  inactive:  'Inactiva',
  suspended: 'Suspendida',
}

const STATUS_STYLE: Record<StoreStatus, string> = {
  active:    'bg-agrobot-50 text-agrobot-700',
  pending:   'bg-amber-50 text-amber-700',
  inactive:  'bg-gray-100 text-gray-500',
  suspended: 'bg-red-50 text-red-600',
}

const ROLE_LABEL: Record<string, string> = {
  seller:             'Vendedor',
  producer:           'Productor',
  farm_owner:         'Finca',
  input_supplier:     'Insumos',
  machinery_supplier: 'Maquinaria',
  agronomist:         'Agrónomo',
  transporter:        'Transportista',
  cooperative:        'Cooperativa',
  laboratory:         'Laboratorio',
  certifier:          'Certificador',
  quality_inspector:  'Inspector',
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: '2-digit' })
}

type FilterKey = 'all' | StoreStatus

export function TiendasPage() {
  const [stores,   setStores]   = useState<StoreItem[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [working,  setWorking]  = useState<number | null>(null)
  const [filter,   setFilter]   = useState<FilterKey>('all')

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.get<StoreItem[]>('/stores/admin/all')
      .then(setStores)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function setStatus(id: number, status: StoreStatus, isVerified?: boolean) {
    setWorking(id)
    try {
      await api.patch(`/stores/admin/${id}/status`, { status, ...(isVerified !== undefined ? { isVerified } : {}) })
      setStores(prev => prev.map(s => s.id === id ? { ...s, status, ...(isVerified !== undefined ? { isVerified } : {}) } : s))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al actualizar la tienda')
    } finally {
      setWorking(null)
    }
  }

  const displayed = filter === 'all' ? stores : stores.filter(s => s.status === filter)

  const counts = {
    all:       stores.length,
    pending:   stores.filter(s => s.status === 'pending').length,
    active:    stores.filter(s => s.status === 'active').length,
    inactive:  stores.filter(s => s.status === 'inactive').length,
    suspended: stores.filter(s => s.status === 'suspended').length,
  }

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all',       label: 'Todas' },
    { key: 'pending',   label: 'En revisión' },
    { key: 'active',    label: 'Activas' },
    { key: 'inactive',  label: 'Inactivas' },
    { key: 'suspended', label: 'Suspendidas' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Tiendas</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Gestión y aprobación de perfiles de vendedores · {stores.length} registros
        </p>
      </div>

      {/* Pending alert */}
      {counts.pending > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Clock className="h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-sm font-semibold text-amber-800">
            {counts.pending} tienda{counts.pending > 1 ? 's' : ''} esperando aprobación
          </p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 w-fit rounded-lg border border-gray-200 bg-gray-50 p-1">
        {FILTERS.filter(f => counts[f.key] > 0 || f.key === 'all').map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-[12px] font-semibold transition-colors ${
              filter === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            <span className={`rounded-full px-1.5 text-[10px] font-bold ${filter === t.key ? 'bg-gray-100' : 'bg-transparent'}`}>
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="border-b border-gray-100 bg-gray-50/60">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-400">Tienda</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Tipo</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Ubicación</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Estado</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Verificación</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Registrada</th>
                <th className="px-4 py-3 font-semibold text-gray-400 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-5 w-full" /></td>
                      ))}
                    </tr>
                  ))
                : displayed.length === 0
                ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <Store className="h-8 w-8 text-gray-200" />
                          <p className="text-sm font-semibold">Sin tiendas</p>
                        </div>
                      </td>
                    </tr>
                  )
                : displayed.map((store) => (
                    <tr key={store.id} className={`hover:bg-gray-50/50 transition-colors ${store.status === 'pending' ? 'bg-amber-50/30' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {store.logoUrl ? (
                            <img src={store.logoUrl} alt="" className="h-7 w-7 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-agrobot-100 text-[10px] font-bold text-agrobot-700">
                              {store.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-800">{store.name}</p>
                            <p className="text-[10px] text-gray-400">/{store.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {store.roleType ? ROLE_LABEL[store.roleType] ?? store.roleType : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {[store.municipality, store.department].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[store.status]}`}>
                          {STATUS_LABEL[store.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {store.isVerified ? (
                          <span className="flex items-center gap-1 rounded-full bg-agrobot-50 px-2 py-0.5 text-[10px] font-semibold text-agrobot-700 w-fit">
                            <CheckCircle2 className="h-3 w-3" />Verificada
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                            Sin verificar
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400">{fmtDate(store.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {working === store.id
                            ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                            : (
                              <>
                                {store.status === 'pending' && (
                                  <button
                                    onClick={() => setStatus(store.id, 'active')}
                                    className="flex items-center gap-1.5 rounded-lg bg-agrobot-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-agrobot-700 transition-colors"
                                  >
                                    <CheckCircle2 className="h-3 w-3" />Aprobar
                                  </button>
                                )}
                                {store.status === 'active' && !store.isVerified && (
                                  <button
                                    onClick={() => setStatus(store.id, 'active', true)}
                                    className="flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-1.5 text-[11px] font-semibold text-sky-700 hover:bg-sky-100 transition-colors"
                                  >
                                    <ShieldCheck className="h-3 w-3" />Verificar
                                  </button>
                                )}
                                {store.status === 'active' && (
                                  <button
                                    onClick={() => setStatus(store.id, 'inactive')}
                                    className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 text-[11px] font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
                                  >
                                    <XCircle className="h-3 w-3" />Pausar
                                  </button>
                                )}
                                {store.status === 'inactive' && (
                                  <button
                                    onClick={() => setStatus(store.id, 'active')}
                                    className="flex items-center gap-1.5 rounded-lg bg-agrobot-50 px-3 py-1.5 text-[11px] font-semibold text-agrobot-700 hover:bg-agrobot-100 transition-colors"
                                  >
                                    <CheckCircle2 className="h-3 w-3" />Activar
                                  </button>
                                )}
                                <a
                                  href={`/tiendas/${store.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1.5 text-[11px] font-medium text-gray-500 hover:bg-gray-100 transition-colors"
                                >
                                  <Eye className="h-3 w-3" />Ver
                                </a>
                              </>
                            )
                          }
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
