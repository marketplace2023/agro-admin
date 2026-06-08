import { useState, useEffect, useCallback } from 'react'
import { Package, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'

interface QueueItem {
  id: number
  listingId: number
  listingTitle: string
  listingUserId: number
  priority: 'high' | 'normal'
  status: string
  createdAt: string
}

interface Listing {
  id: number
  title: string
  type: string
  status: string
  createdAt: string
  sellerId?: number
}

interface ListingsResponse {
  listings: Listing[]
  total: number
  page: number
  limit: number
}

type TabKey = 'queue' | 'all'
type AllStatusFilter = 'all' | 'published' | 'pending_review' | 'rejected' | 'draft'

const ALL_STATUS_OPTIONS: { value: AllStatusFilter; label: string }[] = [
  { value: 'all',            label: 'Todos' },
  { value: 'published',      label: 'Publicados' },
  { value: 'pending_review', label: 'En revisión' },
  { value: 'rejected',       label: 'Rechazados' },
  { value: 'draft',          label: 'Borrador' },
]

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: '2-digit' })
}

function statusBadge(s: string) {
  const map: Record<string, string> = {
    published:      'bg-agrobot-50 text-agrobot-700',
    pending_review: 'bg-amber-50 text-amber-700',
    rejected:       'bg-red-50 text-red-600',
    draft:          'bg-gray-100 text-gray-500',
  }
  const labels: Record<string, string> = {
    published:      'Publicado',
    pending_review: 'En revisión',
    rejected:       'Rechazado',
    draft:          'Borrador',
  }
  return { cls: map[s] ?? 'bg-gray-100 text-gray-500', label: labels[s] ?? s }
}

export function PublicacionesPage() {
  const [tab,          setTab]          = useState<TabKey>('queue')
  const [queue,        setQueue]        = useState<QueueItem[]>([])
  const [listings,     setListings]     = useState<Listing[]>([])
  const [total,        setTotal]        = useState(0)
  const [page,         setPage]         = useState(1)
  const [allStatus,    setAllStatus]    = useState<AllStatusFilter>('all')
  const [loadingQ,     setLoadingQ]     = useState(true)
  const [loadingAll,   setLoadingAll]   = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [acting,       setActing]       = useState<number | null>(null)
  const [rejectId,     setRejectId]     = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const limit = 20

  // Fetch moderation queue
  useEffect(() => {
    setLoadingQ(true)
    api.get<QueueItem[]>('/listings/admin/queue')
      .then(setQueue)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoadingQ(false))
  }, [])

  // Fetch all listings
  const fetchAll = useCallback(() => {
    setLoadingAll(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (allStatus !== 'all') params.set('status', allStatus)
    api.get<ListingsResponse>(`/admin/listings?${params}`)
      .then((r) => { setListings(r.listings); setTotal(r.total) })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoadingAll(false))
  }, [page, allStatus])

  useEffect(() => {
    if (tab === 'all') fetchAll()
  }, [tab, fetchAll])

  async function approve(listingId: number) {
    setActing(listingId)
    try {
      await api.patch(`/listings/manage/listings/${listingId}/status`, { status: 'published' })
      setQueue((q) => q.filter((item) => item.listingId !== listingId))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error')
    } finally {
      setActing(null)
    }
  }

  async function reject() {
    if (!rejectId) return
    setActing(rejectId)
    try {
      await api.patch(`/listings/manage/listings/${rejectId}/status`, {
        status: 'rejected',
        reason: rejectReason,
      })
      setQueue((q) => q.filter((item) => item.listingId !== rejectId))
      setRejectId(null)
      setRejectReason('')
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error')
    } finally {
      setActing(null)
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Publicaciones</h1>
        <p className="text-sm text-gray-400 mt-0.5">Revisión y moderación de publicaciones del marketplace</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 w-fit rounded-lg border border-gray-200 bg-gray-50 p-1">
        {([
          { key: 'queue', label: `Cola de moderación${queue.length ? ` (${queue.length})` : ''}` },
          { key: 'all',   label: 'Todas las publicaciones' },
        ] as { key: TabKey; label: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md px-4 py-1.5 text-[12px] font-semibold transition-colors ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
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

      {/* Queue tab */}
      {tab === 'queue' && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="border-b border-gray-100 bg-gray-50/50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-400">Prioridad</th>
                  <th className="px-4 py-3 font-semibold text-gray-400">Título</th>
                  <th className="px-4 py-3 font-semibold text-gray-400">Vendedor ID</th>
                  <th className="px-4 py-3 font-semibold text-gray-400">Fecha</th>
                  <th className="px-4 py-3 font-semibold text-gray-400 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingQ
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-5 w-48" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-5 w-12" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-7 w-36 ml-auto" /></td>
                      </tr>
                    ))
                  : queue.length === 0
                  ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-16 text-center">
                          <div className="flex flex-col items-center gap-2 text-gray-400">
                            <CheckCircle className="h-8 w-8 text-agrobot-300" />
                            <p className="text-sm font-semibold">Cola vacía — todo al día</p>
                          </div>
                        </td>
                      </tr>
                    )
                  : queue.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            item.priority === 'high' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {item.priority === 'high' ? 'Alta' : 'Normal'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Package className="h-3.5 w-3.5 shrink-0 text-gray-300" />
                            <p className="font-semibold text-gray-800 max-w-xs truncate">{item.listingTitle}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500">#{item.listingUserId}</td>
                        <td className="px-4 py-3 text-gray-400">{fmtDate(item.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => approve(item.listingId)}
                              disabled={acting === item.listingId}
                              className="flex items-center gap-1.5 rounded-lg bg-agrobot-50 px-3 py-1.5 text-xs font-semibold text-agrobot-700 hover:bg-agrobot-100 disabled:opacity-50 transition-colors"
                            >
                              <CheckCircle className="h-3 w-3" /> Aprobar
                            </button>
                            <button
                              onClick={() => { setRejectId(item.listingId); setRejectReason('') }}
                              disabled={acting === item.listingId}
                              className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
                            >
                              <XCircle className="h-3 w-3" /> Rechazar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All listings tab */}
      {tab === 'all' && (
        <>
          <div className="flex items-center gap-3">
            <select
              value={allStatus}
              onChange={(e) => { setAllStatus(e.target.value as AllStatusFilter); setPage(1) }}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-[13px] text-gray-700 focus:border-agrobot-300 focus:outline-none"
            >
              {ALL_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead className="border-b border-gray-100 bg-gray-50/50">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-gray-400">Título</th>
                    <th className="px-4 py-3 font-semibold text-gray-400">Tipo</th>
                    <th className="px-4 py-3 font-semibold text-gray-400">Estado</th>
                    <th className="px-4 py-3 font-semibold text-gray-400">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingAll
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <tr key={i}>
                          {Array.from({ length: 4 }).map((__, j) => (
                            <td key={j} className="px-4 py-3"><Skeleton className="h-5 w-full" /></td>
                          ))}
                        </tr>
                      ))
                    : listings.length === 0
                    ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-12 text-center text-sm text-gray-400">
                            No se encontraron publicaciones
                          </td>
                        </tr>
                      )
                    : listings.map((l) => {
                        const badge = statusBadge(l.status)
                        return (
                          <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 font-semibold text-gray-800 max-w-xs truncate">{l.title}</td>
                            <td className="px-4 py-3 text-gray-500">{l.type}</td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
                                {badge.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-400">{fmtDate(l.createdAt)}</td>
                          </tr>
                        )
                      })
                  }
                </tbody>
              </table>
            </div>

            {!loadingAll && totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                <p className="text-[12px] text-gray-400">
                  Página {page} de {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="px-3 text-[12px] font-semibold text-gray-700">{page} / {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Reject Modal */}
      {rejectId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-gray-900 mb-1">Rechazar publicación</h3>
            <p className="text-sm text-gray-400 mb-4">Ingresa el motivo del rechazo (opcional)</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Ej: El contenido no cumple con las políticas del marketplace…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-agrobot-300 focus:outline-none focus:ring-1 focus:ring-agrobot-300 resize-none"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setRejectId(null)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={reject}
                disabled={acting !== null}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                <XCircle className="h-4 w-4" /> Rechazar publicación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
