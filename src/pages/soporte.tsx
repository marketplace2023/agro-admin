import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'

interface Ticket {
  id: number
  subject: string
  userId: number
  status: TicketStatus
  priority: TicketPriority
  createdAt: string
  assignedToUserId?: number | null
}

interface TicketsResponse {
  tickets: Ticket[]
  total: number
  page: number
  limit: number
}

type TicketStatus   = 'open' | 'in_progress' | 'resolved' | 'closed'
type TicketPriority = 'low' | 'normal' | 'high' | 'urgent'

const STATUS_TABS: { key: TicketStatus | 'all'; label: string }[] = [
  { key: 'open',        label: 'Abiertos' },
  { key: 'in_progress', label: 'En Curso' },
  { key: 'resolved',    label: 'Resueltos' },
  { key: 'closed',      label: 'Cerrados' },
]

const PRIORITY_OPTIONS: { value: TicketPriority | 'all'; label: string }[] = [
  { value: 'all',    label: 'Todas las prioridades' },
  { value: 'urgent', label: 'Urgente' },
  { value: 'high',   label: 'Alta' },
  { value: 'normal', label: 'Normal' },
  { value: 'low',    label: 'Baja' },
]

const PRIORITY_BADGE: Record<TicketPriority, string> = {
  urgent: 'bg-red-50 text-red-600',
  high:   'bg-orange-50 text-orange-600',
  normal: 'bg-blue-50 text-blue-600',
  low:    'bg-gray-100 text-gray-500',
}
const PRIORITY_LABEL: Record<TicketPriority, string> = {
  urgent: 'Urgente', high: 'Alta', normal: 'Normal', low: 'Baja',
}

const STATUS_BADGE: Record<TicketStatus, string> = {
  open:        'bg-blue-50 text-blue-600',
  in_progress: 'bg-amber-50 text-amber-700',
  resolved:    'bg-agrobot-50 text-agrobot-700',
  closed:      'bg-gray-100 text-gray-500',
}
const STATUS_LABEL: Record<TicketStatus, string> = {
  open: 'Abierto', in_progress: 'En curso', resolved: 'Resuelto', closed: 'Cerrado',
}

const STATUS_TRANSITIONS: Record<TicketStatus, { value: TicketStatus; label: string }[]> = {
  open:        [{ value: 'in_progress', label: 'Tomar ticket' }, { value: 'closed', label: 'Cerrar' }],
  in_progress: [{ value: 'resolved',   label: 'Marcar resuelto' }, { value: 'closed', label: 'Cerrar' }],
  resolved:    [{ value: 'closed',     label: 'Cerrar' }],
  closed:      [],
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: '2-digit' })
}

export function SoportePage() {
  const [tickets,   setTickets]   = useState<Ticket[]>([])
  const [total,     setTotal]     = useState(0)
  const [page,      setPage]      = useState(1)
  const [tab,       setTab]       = useState<TicketStatus>('open')
  const [priority,  setPriority]  = useState<TicketPriority | 'all'>('all')
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [acting,    setActing]    = useState<number | null>(null)

  const limit = 20

  const fetchTickets = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ status: tab, page: String(page), limit: String(limit) })
    if (priority !== 'all') params.set('priority', priority)
    api.get<TicketsResponse>(`/admin/support/tickets?${params}`)
      .then((r) => { setTickets(r.tickets); setTotal(r.total) })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [tab, priority, page])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  async function changeStatus(id: number, newStatus: TicketStatus) {
    setActing(id)
    try {
      await api.patch(`/admin/support/tickets/${id}`, { status: newStatus })
      setTickets((prev) => prev.map((t) => t.id === id ? { ...t, status: newStatus } : t))
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
        <h1 className="font-display text-2xl font-bold text-gray-900">Soporte</h1>
        <p className="text-sm text-gray-400 mt-0.5">Tickets de soporte y asistencia · {total} tickets</p>
      </div>

      {/* Tabs + Priority filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key as TicketStatus); setPage(1) }}
              className={`rounded-md px-3 py-1 text-[12px] font-semibold transition-colors ${
                tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <select
          value={priority}
          onChange={(e) => { setPriority(e.target.value as TicketPriority | 'all'); setPage(1) }}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-[13px] text-gray-700 focus:border-agrobot-300 focus:outline-none"
        >
          {PRIORITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
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
                <th className="px-4 py-3 font-semibold text-gray-400 w-14">#</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Asunto</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Usuario ID</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Prioridad</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Estado</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Fecha</th>
                <th className="px-4 py-3 font-semibold text-gray-400 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-5 w-full" /></td>
                      ))}
                    </tr>
                  ))
                : tickets.length === 0
                ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <MessageSquare className="h-8 w-8 text-gray-200" />
                          <p className="text-sm font-semibold">Sin tickets en esta categoría</p>
                        </div>
                      </td>
                    </tr>
                  )
                : tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-gray-400 font-mono text-[11px]">#{ticket.id}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800 max-w-xs truncate">{ticket.subject}</p>
                        {ticket.assignedToUserId && (
                          <p className="text-[10px] text-gray-400">Asignado a #{ticket.assignedToUserId}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">#{ticket.userId}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${PRIORITY_BADGE[ticket.priority]}`}>
                          {PRIORITY_LABEL[ticket.priority]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[ticket.status]}`}>
                          {STATUS_LABEL[ticket.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{fmtDate(ticket.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {STATUS_TRANSITIONS[ticket.status].map((tr) => (
                            <button
                              key={tr.value}
                              onClick={() => changeStatus(ticket.id, tr.value)}
                              disabled={acting === ticket.id}
                              className="rounded-lg px-2.5 py-1 text-[11px] font-semibold bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors whitespace-nowrap"
                            >
                              {tr.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-[12px] text-gray-400">
              Mostrando {(page - 1) * limit + 1}–{Math.min(page * limit, total)} de {total}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="px-3 text-[12px] font-semibold text-gray-700">{page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
