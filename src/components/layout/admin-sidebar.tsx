import { NavLink, useLocation } from 'react-router'
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarFooter,
} from '@/components/ui/sidebar'
import {
  LayoutDashboard, Users, ShieldCheck, Tag, Package, Store,
  FileText, BookOpen, HelpCircle, MessageSquare, BarChart2,
  Settings, LogOut, Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAdminAuth } from '@/contexts/auth-context'

const NAV_GROUPS = [
  {
    label: 'General',
    items: [
      { title: 'Dashboard',      url: '/dashboard',     icon: LayoutDashboard },
      { title: 'Analítica',      url: '/analitica',     icon: BarChart2 },
      { title: 'Notificaciones', url: '/notificaciones',icon: Bell },
    ],
  },
  {
    label: 'Usuarios',
    items: [
      { title: 'Usuarios',         url: '/usuarios', icon: Users },
      { title: 'Roles y Permisos', url: '/roles',    icon: ShieldCheck },
    ],
  },
  {
    label: 'Marketplace',
    items: [
      { title: 'Categorías',    url: '/categorias',    icon: Tag },
      { title: 'Publicaciones', url: '/publicaciones', icon: Package },
      { title: 'Tiendas',       url: '/tiendas',       icon: Store },
      { title: 'Cotizaciones',  url: '/cotizaciones',  icon: FileText },
    ],
  },
  {
    label: 'Contenido',
    items: [
      { title: 'Blog',    url: '/blog',    icon: BookOpen },
      { title: 'Ayuda',   url: '/ayuda',   icon: HelpCircle },
      { title: 'Soporte', url: '/soporte', icon: MessageSquare },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { title: 'Configuración', url: '/configuracion', icon: Settings },
    ],
  },
]

export function AdminSidebar() {
  const { pathname } = useLocation()
  const { user, logout } = useAdminAuth()

  function isActive(url: string) {
    return pathname === url || pathname.startsWith(url + '/')
  }

  const initials = user?.name
    ? user.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
    : 'AD'

  return (
    <Sidebar>
      {/* Logo */}
      <SidebarHeader className="px-4 py-5">
        <NavLink to="/" className="flex flex-col items-center gap-2 select-none">
          <img src="/logoagro.svg" alt="TierraMarket" className="h-14 w-auto" />
          <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/30">
            Panel Administrador
          </p>
        </NavLink>
      </SidebarHeader>

      <div className="mx-3 h-px bg-white/[0.07]" />

      {/* Nav */}
      <SidebarContent className="px-2 py-3">
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label} className="gap-0 p-0 mb-3">
            <SidebarGroupLabel className="mb-1 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-white/20">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-px">
                {group.items.map((item) => {
                  const active = isActive(item.url)
                  return (
                    <SidebarMenuItem key={item.title}>
                      <NavLink
                        to={item.url}
                        className={cn(
                          'relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium',
                          'transition-all duration-150 outline-none focus-visible:ring-1 focus-visible:ring-white/30',
                          active
                            ? 'bg-white/12 text-white'
                            : 'text-white/50 hover:bg-white/7 hover:text-white/80',
                        )}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 h-5 w-0.75 -translate-y-1/2 rounded-r-full bg-emerald-400" />
                        )}
                        <item.icon
                          className={cn(
                            'h-3.75 w-3.75 shrink-0 transition-colors duration-150',
                            active ? 'text-emerald-400' : 'text-white/35',
                          )}
                        />
                        <span className={cn(active && 'font-semibold')}>{item.title}</span>
                      </NavLink>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="px-3 pb-4 pt-0">
        <div className="mb-3 h-px bg-white/[0.07]" />
        <div className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors hover:bg-white/6">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/25 ring-1 ring-emerald-400/20">
            <span className="text-[10px] font-bold text-emerald-300">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold leading-none text-white/80 mb-0.5">
              {user?.name ?? 'Administrador'}
            </p>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-white/25">
              Admin
            </p>
          </div>
          <button
            onClick={logout}
            className="shrink-0 rounded-md p-1 text-white/20 transition-colors hover:bg-white/10 hover:text-white/60"
            title="Cerrar sesión"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
