import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import {
  Users, Package, MessageSquare, TrendingUp,
  ArrowUpRight, Clock, CheckCircle, XCircle, AlertCircle,
  Eye, Store, BookOpen, ShieldCheck, ShieldAlert, FileSearch,
  Radar,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'

interface DashboardStats {
  users:         { total: number; newLast30Days: number }
  listings:      { total: number; published: number; recentLast30Days: number }
  moderation:    { pendingQueue: number }
  leads:         { total: number; converted: number; conversionRate: number }
  support:       { openTickets: number }
  verifications: { pending: number }
  reports:       { pending: number }
  radar:         { activeAlerts: number }
}

type ReviewStatus = 'pending' | 'approved' | 'rejected'
type TicketStatus = 'open' | 'in_progress' | 'closed'

const REVIEW_COLORS: Record<ReviewStatus, string> = {
  pending:  'bg-amber-50 text-amber-700',
  approved: 'bg-agrobot-50 text-agrobot-700',
  rejected: 'bg-red-50 text-red-600',
}
const REVIEW_LABELS: Record<ReviewStatus, string> = {
  pending: 'Pendiente', approved: 'Aprobado', rejected: 'Rechazado',
}
const TICKET_COLORS: Record<TicketStatus, string> = {
  open:        'bg-blue-50 text-blue-600',
  in_progress: 'bg-amber-50 text-amber-700',
  closed:      'bg-gray-100 text-gray-500',
}
const TICKET_LABELS: Record<TicketStatus, string> = {
  open: 'Abierto', in_progress: 'En curso', closed: 'Cerrado',
}

const PENDING_LISTINGS_MOCK: {
  id: number; title: string; seller: string; category: string; department: string; createdAt: string; status: ReviewStatus
}[] = [
  { id: 1, title: 'Maíz blanco extra primera — 500 kg', seller: 'Agro San Cristóbal', category: 'Granos', department: 'Táchira', createdAt: '2026-06-06', status: 'pending' },
  { id: 2, title: 'Semillas de girasol certificadas', seller: 'Semillas del Sur', category: 'Semillas', department: 'Bolívar', createdAt: '2026-06-05', status: 'pending' },
  { id: 3, title: 'Tractor John Deere 5090E 2022', seller: 'MaquiAgro Llanos', category: 'Maquinaria', department: 'Apure', createdAt: '2026-06-05', status: 'pending' },
  { id: 4, title: 'Fertilizante orgánico líquido 20 L', seller: 'BioAgro Venezuela', category: 'Insumos', department: 'Miranda', createdAt: '2026-06-04', status: 'pending' },
  { id: 5, title: 'Caña de azúcar fresca por tonelada', seller: 'Finca Las Palmeras', category: 'Caña', department: 'Carabobo', createdAt: '2026-06-04', status: 'pending' },
]

const RECENT_TICKETS_MOCK: {
  id: number; subject: string; user: string; createdAt: string; status: TicketStatus
}[] = [
  { id: 101, subject: 'No puedo subir imágenes a mi publicación', user: 'carlos.rojas@mail.com', createdAt: '2026-06-06', status: 'open' },
  { id: 102, subject: 'Error al procesar el pago del plan Pro', user: 'ana.garcia@mail.com', createdAt: '2026-06-06', status: 'in_progress' },
  { id: 103, subject: 'Cotización no llega al vendedor', user: 'pedro.lima@mail.com', createdAt: '2026-06-05', status: 'open' },
  { id: 104, subject: 'Solicitud de verificación de tienda', user: 'marta.diaz@mail.com', createdAt: '2026-06-05', status: 'in_progress' },
]

const RECENT_USERS_MOCK = [
  { id: 1, initials: 'CR', name: 'Carlos Rojas',  email: 'carlos.rojas@mail.com', role: 'seller', active: true,  createdAt: '2026-06-06', listings: 12 },
  { id: 2, initials: 'AG', name: 'Ana García',    email: 'ana.garcia@mail.com',   role: 'buyer',  active: true,  createdAt: '2026-06-05', listings: 0  },
  { id: 3, initials: 'PL', name: 'Pedro Lima',    email: 'pedro.lima@mail.com',   role: 'seller', active: true,  createdAt: '2026-06-05', listings: 7  },
  { id: 4, initials: 'MD', name: 'Marta Díaz',    email: 'marta.diaz@mail.com',   role: 'seller', active: false, createdAt: '2026-06-04', listings: 3  },
  { id: 5, initials: 'JT', name: 'José Torres',   email: 'jose.torres@mail.com',  role: 'buyer',  active: true,  createdAt: '2026-06-04', listings: 0  },
]

const QUICK_ACTIONS = [
  { label: 'Usuarios', to: '/usuarios', icon: Users,      color: 'bg-blue-50 text-blue-600' },
  { label: 'Tiendas',  to: '/tiendas',  icon: Store,      color: 'bg-agrobot-50 text-agrobot-700' },
  { label: 'Blog',     to: '/blog',     icon: BookOpen,   color: 'bg-purple-50 text-purple-600' },
  { label: 'Roles',    to: '/roles',    icon: ShieldCheck,color: 'bg-gray-100 text-gray-600' },
]

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })
}

export function AdminDashboard() {
  const [stats,   setStats]   = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    api.get<DashboardStats>('/admin/dashboard')
      .then(setStats)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const kpis = stats ? [
    { title: 'Usuarios registrados', value: stats.users.total,              icon: Users,        trend: `+${stats.users.newLast30Days} este mes`,         positive: true  },
    { title: 'Publicaciones activas',value: stats.listings.published,       icon: Package,      trend: `+${stats.listings.recentLast30Days} este mes`,    positive: true  },
    { title: 'Tickets abiertos',     value: stats.support.openTickets,      icon: MessageSquare,trend: `${stats.moderation.pendingQueue} en moderación`,  positive: false },
    { title: 'Cotizaciones totales', value: stats.leads.total,              icon: TrendingUp,   trend: `${(stats.leads.conversionRate * 100).toFixed(1)}% conversión`, positive: true },
  ] : []

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Resumen general del sistema · {fmtDate(new Date().toISOString())}
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
                <Skeleton className="h-4 w-32 mb-4" />
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))
          : kpis.map((s) => (
              <StatCard key={s.title} {...s} loading={false} />
            ))
        }
      </div>

      {/* Extra stats row */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <MiniStatCard icon={<ShieldAlert className="h-4 w-4 text-amber-600" />} label="Verificaciones pendientes" value={stats.verifications.pending} bg="bg-amber-50" />
          <MiniStatCard icon={<FileSearch className="h-4 w-4 text-red-500" />}   label="Reportes pendientes"        value={stats.reports.pending}       bg="bg-red-50" />
          <MiniStatCard icon={<Radar className="h-4 w-4 text-blue-600" />}        label="Alertas radar activas"      value={stats.radar.activeAlerts}    bg="bg-blue-50" />
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {QUICK_ACTIONS.map((a) => (
          <Link
            key={a.label}
            to={a.to}
            className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-3 text-[13px] font-semibold text-gray-700 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${a.color}`}>
              <a.icon className="h-3.75 w-3.75" />
            </span>
            {a.label}
          </Link>
        ))}
      </div>

      {/* Pending listings + recent tickets */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Pending listings — 2/3 */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900">Publicaciones en revisión</h2>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                {stats?.moderation.pendingQueue ?? PENDING_LISTINGS_MOCK.length}
              </span>
            </div>
            <Link to="/publicaciones" className="flex items-center gap-0.5 text-xs font-semibold text-agrobot-600 hover:underline">
              Ver todas <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-gray-100">
            {PENDING_LISTINGS_MOCK.map((l) => (
              <div key={l.id} className="flex items-center gap-3 py-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50">
                  <Package className="h-4 w-4 text-gray-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-gray-800">{l.title}</p>
                  <p className="text-[11px] text-gray-400">
                    {l.seller} · {l.category} · {l.department}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${REVIEW_COLORS[l.status]}`}>
                    {REVIEW_LABELS[l.status]}
                  </span>
                  <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                    <Clock className="h-2.5 w-2.5" />
                    {fmtDate(l.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent tickets — 1/3 */}
        <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900">Soporte reciente</h2>
            <Link to="/soporte" className="flex items-center gap-0.5 text-xs font-semibold text-agrobot-600 hover:underline">
              Ver todos <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-gray-100">
            {RECENT_TICKETS_MOCK.map((t) => (
              <div key={t.id} className="py-2.5">
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <p className="text-[12px] font-semibold text-gray-800 leading-snug line-clamp-2">
                    {t.subject}
                  </p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${TICKET_COLORS[t.status]}`}>
                    {TICKET_LABELS[t.status]}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400">{t.user} · {fmtDate(t.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity row */}
      <div className="grid gap-4 md:grid-cols-3">
        <ActivityCard
          icon={<CheckCircle className="h-4 w-4 text-agrobot-600" />}
          label="Aprobadas hoy"
          value="23 publicaciones"
          sub="+5 respecto a ayer"
          bg="bg-agrobot-50"
        />
        <ActivityCard
          icon={<XCircle className="h-4 w-4 text-red-500" />}
          label="Rechazadas hoy"
          value="4 publicaciones"
          sub="Contenido inapropiado"
          bg="bg-red-50"
        />
        <ActivityCard
          icon={<AlertCircle className="h-4 w-4 text-amber-500" />}
          label="Reportes pendientes"
          value={stats ? `${stats.reports.pending} reportes` : '— reportes'}
          sub={stats?.reports.pending ? 'Requieren revisión' : 'Sin reportes'}
          bg="bg-amber-50"
        />
      </div>

      {/* Recent users */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-900">Usuarios recientes</h2>
          <Link to="/usuarios" className="flex items-center gap-0.5 text-xs font-semibold text-agrobot-600 hover:underline">
            Ver todos <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-2 font-semibold text-gray-400 pr-4">Usuario</th>
                <th className="pb-2 font-semibold text-gray-400 pr-4">Rol</th>
                <th className="pb-2 font-semibold text-gray-400 pr-4">Estado</th>
                <th className="pb-2 font-semibold text-gray-400 pr-4">Registrado</th>
                <th className="pb-2 font-semibold text-gray-400">Publicaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {RECENT_USERS_MOCK.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-agrobot-100 text-[9px] font-bold text-agrobot-700">
                        {u.initials}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{u.name}</p>
                        <p className="text-[10px] text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className={`flex items-center gap-1 text-[10px] font-semibold ${u.active ? 'text-agrobot-600' : 'text-gray-400'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${u.active ? 'bg-agrobot-500' : 'bg-gray-300'}`} />
                      {u.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-gray-400">{fmtDate(u.createdAt)}</td>
                  <td className="py-2.5">
                    <span className="flex items-center gap-0.5 text-gray-500">
                      <Eye className="h-3 w-3 text-gray-300" />
                      {u.listings}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title, value, icon: Icon, trend, positive, loading,
}: {
  title: string; value: number; icon: React.ElementType
  trend: string; positive: boolean; loading: boolean
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <Icon className="h-4 w-4 text-gray-300" />
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-16" />
      ) : (
        <p className="mt-2 text-3xl font-bold text-gray-900">{value.toLocaleString('es-VE')}</p>
      )}
      <p className={`mt-1 text-xs font-medium ${positive ? 'text-agrobot-600' : 'text-red-500'}`}>
        {trend}
      </p>
    </div>
  )
}

function MiniStatCard({
  icon, label, value, bg,
}: {
  icon: React.ReactNode; label: string; value: number; bg: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${bg}`}>
        {icon}
      </div>
      <div>
        <p className="text-[11px] text-gray-400">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

function ActivityCard({
  icon, label, value, sub, bg,
}: {
  icon: React.ReactNode; label: string; value: string; sub: string; bg: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${bg}`}>
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <p className="text-sm font-bold text-gray-900">{value}</p>
        <p className="text-[10px] text-gray-400">{sub}</p>
      </div>
    </div>
  )
}
