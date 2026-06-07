import { useState, useEffect } from 'react'
import {
  Users, Package, MessageSquare, TrendingUp, ShieldAlert,
  FileSearch, Radar, BarChart2, AlertCircle,
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

interface StatBlock {
  label: string
  value: number | string
  sub?: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  highlight?: boolean
}

export function AnaliticaPage() {
  const [stats,   setStats]   = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    api.get<DashboardStats>('/admin/dashboard')
      .then(setStats)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const blocks: StatBlock[] = stats ? [
    {
      label: 'Usuarios totales',
      value: stats.users.total,
      sub: `+${stats.users.newLast30Days} nuevos este mes`,
      icon: Users,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Publicaciones activas',
      value: stats.listings.published,
      sub: `${stats.listings.total} totales · +${stats.listings.recentLast30Days} recientes`,
      icon: Package,
      iconBg: 'bg-agrobot-50',
      iconColor: 'text-agrobot-600',
    },
    {
      label: 'Tickets de soporte abiertos',
      value: stats.support.openTickets,
      sub: 'Requieren atención',
      icon: MessageSquare,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      highlight: stats.support.openTickets > 10,
    },
    {
      label: 'Cotizaciones totales',
      value: stats.leads.total,
      sub: `${stats.leads.converted} convertidas`,
      icon: TrendingUp,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      label: 'Cola de moderación',
      value: stats.moderation.pendingQueue,
      sub: 'Publicaciones en revisión',
      icon: BarChart2,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-600',
      highlight: stats.moderation.pendingQueue > 5,
    },
    {
      label: 'Verificaciones pendientes',
      value: stats.verifications.pending,
      sub: 'Tiendas y vendedores',
      icon: ShieldAlert,
      iconBg: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
    },
    {
      label: 'Reportes pendientes',
      value: stats.reports.pending,
      sub: 'Contenido reportado',
      icon: FileSearch,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-600',
      highlight: stats.reports.pending > 0,
    },
    {
      label: 'Alertas radar activas',
      value: stats.radar.activeAlerts,
      sub: 'Alertas del sistema activas',
      icon: Radar,
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      highlight: stats.radar.activeAlerts > 0,
    },
  ] : []

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Analítica</h1>
        <p className="text-sm text-gray-400 mt-0.5">Métricas y estadísticas generales del marketplace</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Big stat grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-6">
                <Skeleton className="h-10 w-10 rounded-lg mb-4" />
                <Skeleton className="h-10 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))
          : blocks.map((b) => (
              <div
                key={b.label}
                className={`rounded-xl border bg-white p-6 ${
                  b.highlight ? 'border-red-200 bg-red-50/30' : 'border-gray-200'
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${b.iconBg} mb-4`}>
                  <b.icon className={`h-5 w-5 ${b.iconColor}`} />
                </div>
                <p className="text-4xl font-bold text-gray-900 mb-1">
                  {typeof b.value === 'number' ? b.value.toLocaleString('es-VE') : b.value}
                </p>
                <p className="text-[13px] font-semibold text-gray-600 mb-0.5">{b.label}</p>
                {b.sub && <p className="text-[11px] text-gray-400">{b.sub}</p>}
              </div>
            ))
        }
      </div>

      {/* Conversion funnel */}
      {stats && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-6">Embudo de conversión</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <FunnelStep label="Cotizaciones totales" value={stats.leads.total} pct={100} color="bg-blue-500" />
            <FunnelStep label="Convertidas" value={stats.leads.converted} pct={stats.leads.conversionRate * 100} color="bg-agrobot-500" />
            <FunnelStep label="Tasa de conversión" value={`${(stats.leads.conversionRate * 100).toFixed(1)}%`} pct={stats.leads.conversionRate * 100} color="bg-purple-500" />
          </div>
        </div>
      )}

      {/* Health overview */}
      {stats && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Estado del sistema</h2>
          <div className="flex flex-col divide-y divide-gray-100">
            <HealthRow label="Cola de moderación" value={stats.moderation.pendingQueue} threshold={10} unit="publicaciones pendientes" />
            <HealthRow label="Tickets sin atender" value={stats.support.openTickets} threshold={20} unit="tickets abiertos" />
            <HealthRow label="Verificaciones" value={stats.verifications.pending} threshold={5} unit="verificaciones pendientes" />
            <HealthRow label="Reportes" value={stats.reports.pending} threshold={3} unit="reportes sin resolver" />
            <HealthRow label="Alertas radar" value={stats.radar.activeAlerts} threshold={1} unit="alertas activas" />
          </div>
        </div>
      )}
    </div>
  )
}

function FunnelStep({
  label, value, pct, color,
}: {
  label: string; value: number | string; pct: number; color: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[12px] font-semibold text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">
        {typeof value === 'number' ? value.toLocaleString('es-VE') : value}
      </p>
      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
    </div>
  )
}

function HealthRow({
  label, value, threshold, unit,
}: {
  label: string; value: number; threshold: number; unit: string
}) {
  const isWarning = value >= threshold
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-2.5">
        <span className={`h-2 w-2 rounded-full ${isWarning ? 'bg-red-400' : 'bg-agrobot-400'}`} />
        <p className="text-[13px] font-semibold text-gray-800">{label}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-[13px] font-bold ${isWarning ? 'text-red-600' : 'text-agrobot-600'}`}>
          {value}
        </span>
        <span className="text-[11px] text-gray-400">{unit}</span>
        {isWarning && (
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
            Atención
          </span>
        )}
      </div>
    </div>
  )
}
