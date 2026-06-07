import { useState, useEffect } from 'react'
import { FileText, TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'

interface Quote {
  id: number
  listingId?: number
  listingTitle?: string
  buyerId?: number
  buyerName?: string
  sellerId?: number
  sellerName?: string
  status: string
  amount?: number
  currency?: string
  createdAt: string
}

interface QuotesResponse {
  quotes?: Quote[]
  data?: Quote[]
  total?: number
}

interface DashboardStats {
  leads: { total: number; converted: number; conversionRate: number }
}

const STATUS_BADGE: Record<string, string> = {
  pending:   'bg-amber-50 text-amber-700',
  accepted:  'bg-agrobot-50 text-agrobot-700',
  rejected:  'bg-red-50 text-red-600',
  expired:   'bg-gray-100 text-gray-500',
  cancelled: 'bg-gray-100 text-gray-500',
}
const STATUS_LABEL: Record<string, string> = {
  pending:   'Pendiente',
  accepted:  'Aceptada',
  rejected:  'Rechazada',
  expired:   'Expirada',
  cancelled: 'Cancelada',
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: '2-digit' })
}

export function CotizacionesPage() {
  const [quotes,    setQuotes]    = useState<Quote[]>([])
  const [stats,     setStats]     = useState<DashboardStats | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [noEndpoint, setNoEndpoint] = useState(false)

  useEffect(() => {
    Promise.allSettled([
      api.get<QuotesResponse | Quote[]>('/quotes'),
      api.get<DashboardStats>('/admin/dashboard'),
    ]).then(([quotesRes, statsRes]) => {
      if (quotesRes.status === 'fulfilled') {
        const data = quotesRes.value
        if (Array.isArray(data)) {
          setQuotes(data)
        } else if (data && typeof data === 'object') {
          setQuotes((data as QuotesResponse).quotes ?? (data as QuotesResponse).data ?? [])
        }
      } else {
        setNoEndpoint(true)
      }

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value)
      }
    }).catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Cotizaciones</h1>
        <p className="text-sm text-gray-400 mt-0.5">Seguimiento de cotizaciones del marketplace</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Stats row from dashboard */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
              <Skeleton className="h-4 w-32 mb-3" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={<FileText className="h-5 w-5 text-blue-600" />}
            bg="bg-blue-50"
            label="Total cotizaciones"
            value={stats.leads.total}
          />
          <StatCard
            icon={<CheckCircle className="h-5 w-5 text-agrobot-600" />}
            bg="bg-agrobot-50"
            label="Convertidas"
            value={stats.leads.converted}
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-purple-600" />}
            bg="bg-purple-50"
            label="Tasa de conversión"
            value={`${(stats.leads.conversionRate * 100).toFixed(1)}%`}
          />
        </div>
      ) : null}

      {/* Quotes table or placeholder */}
      {noEndpoint ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
            <FileText className="h-6 w-6 text-gray-400" />
          </div>
          <p className="font-semibold text-gray-600">Módulo de cotizaciones</p>
          <p className="text-sm text-gray-400 text-center max-w-sm">
            El endpoint de administración de cotizaciones no está disponible. Las métricas globales se muestran arriba desde el dashboard.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="border-b border-gray-100 bg-gray-50/50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-400">#</th>
                  <th className="px-4 py-3 font-semibold text-gray-400">Publicación</th>
                  <th className="px-4 py-3 font-semibold text-gray-400">Comprador</th>
                  <th className="px-4 py-3 font-semibold text-gray-400">Estado</th>
                  <th className="px-4 py-3 font-semibold text-gray-400">Monto</th>
                  <th className="px-4 py-3 font-semibold text-gray-400">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>{Array.from({ length: 6 }).map((__, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-5 w-full" /></td>)}</tr>
                    ))
                  : quotes.length === 0
                  ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-16 text-center">
                          <div className="flex flex-col items-center gap-2 text-gray-400">
                            <Clock className="h-8 w-8 text-gray-200" />
                            <p className="text-sm font-semibold">Sin cotizaciones registradas</p>
                          </div>
                        </td>
                      </tr>
                    )
                  : quotes.map((q) => {
                      const badge = STATUS_BADGE[q.status] ?? 'bg-gray-100 text-gray-500'
                      const label = STATUS_LABEL[q.status] ?? q.status
                      return (
                        <tr key={q.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 font-mono text-[11px] text-gray-400">#{q.id}</td>
                          <td className="px-4 py-3 font-semibold text-gray-800 max-w-xs truncate">
                            {q.listingTitle ?? `Publicación #${q.listingId ?? '—'}`}
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {q.buyerName ?? (q.buyerId ? `#${q.buyerId}` : '—')}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge}`}>
                              {label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {q.amount != null
                              ? `${q.currency ?? 'USD'} ${q.amount.toLocaleString('es-VE')}`
                              : '—'
                            }
                          </td>
                          <td className="px-4 py-3 text-gray-400">{fmtDate(q.createdAt)}</td>
                        </tr>
                      )
                    })
                }
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon, bg, label, value,
}: {
  icon: React.ReactNode; bg: string; label: string; value: number | string
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg} mb-3`}>
        {icon}
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">
        {typeof value === 'number' ? value.toLocaleString('es-VE') : value}
      </p>
      <p className="text-[12px] text-gray-500">{label}</p>
    </div>
  )
}
