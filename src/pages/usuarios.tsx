import { useState, useEffect, useCallback } from 'react'
import { Search, UserCheck, UserX, Eye, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'

interface User {
  id: number
  name: string
  email: string
  status: string
  emailVerifiedAt: string | null
  createdAt: string
}

interface UsersResponse {
  users: User[]
  total: number
  page: number
  limit: number
}

type StatusFilter = 'all' | 'active' | 'banned'

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all',    label: 'Todos' },
  { key: 'active', label: 'Activos' },
  { key: 'banned', label: 'Baneados' },
]

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0] ?? '').join('').toUpperCase()
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: '2-digit' })
}

export function UsuariosPage() {
  const [users,   setUsers]   = useState<User[]>([])
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(1)
  const [search,  setSearch]  = useState('')
  const [status,  setStatus]  = useState<StatusFilter>('all')
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [acting,  setActing]  = useState<number | null>(null)

  const limit = 20

  const fetchUsers = useCallback(() => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search) params.set('search', search)
    if (status !== 'all') params.set('status', status)
    api.get<UsersResponse>(`/admin/users?${params}`)
      .then((r) => { setUsers(r.users); setTotal(r.total) })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [page, search, status])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function toggleStatus(user: User) {
    const newStatus = user.status === 'active' ? 'banned' : 'active'
    setActing(user.id)
    try {
      await api.patch(`/admin/users/${user.id}/status`, { status: newStatus })
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, status: newStatus } : u))
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
        <h1 className="font-display text-2xl font-bold text-gray-900">Usuarios</h1>
        <p className="text-sm text-gray-400 mt-0.5">Gestión de cuentas y perfiles · {total.toLocaleString('es-VE')} registros</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-300" />
          <input
            type="text"
            placeholder="Buscar por nombre o email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-[13px] text-gray-700 placeholder:text-gray-300 focus:border-agrobot-300 focus:outline-none focus:ring-1 focus:ring-agrobot-300"
          />
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setStatus(t.key); setPage(1) }}
              className={`rounded-md px-3 py-1 text-[12px] font-semibold transition-colors ${
                status === t.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
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
                <th className="px-4 py-3 font-semibold text-gray-400">Usuario</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Estado</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Verificado</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Registrado</th>
                <th className="px-4 py-3 font-semibold text-gray-400 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3"><Skeleton className="h-8 w-48" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-7 w-28 ml-auto" /></td>
                    </tr>
                  ))
                : users.length === 0
                ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-16 text-center text-sm text-gray-400">
                        No se encontraron usuarios
                      </td>
                    </tr>
                  )
                : users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Avatar + name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-agrobot-100 text-[9px] font-bold text-agrobot-700">
                            {initials(u.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{u.name}</p>
                            <p className="text-[10px] text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Status badge */}
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          u.status === 'active'
                            ? 'bg-agrobot-50 text-agrobot-700'
                            : u.status === 'banned'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {u.status === 'active' ? 'Activo' : u.status === 'banned' ? 'Baneado' : u.status}
                        </span>
                      </td>

                      {/* Verified */}
                      <td className="px-4 py-3">
                        {u.emailVerifiedAt ? (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                            Verificado
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-400">
                            Sin verificar
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-gray-400">
                        {fmtDate(u.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleStatus(u)}
                            disabled={acting === u.id}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                              u.status === 'active'
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-agrobot-50 text-agrobot-700 hover:bg-agrobot-100'
                            }`}
                          >
                            {u.status === 'active'
                              ? <><UserX className="h-3 w-3" /> Banear</>
                              : <><UserCheck className="h-3 w-3" /> Activar</>
                            }
                          </button>
                          <button className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
                            <Eye className="h-3 w-3" /> Ver
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-[12px] text-gray-400">
              Mostrando {(page - 1) * limit + 1}–{Math.min(page * limit, total)} de {total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="px-3 text-[12px] font-semibold text-gray-700">
                {page} / {totalPages}
              </span>
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
    </div>
  )
}
