import { Outlet } from 'react-router'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { AdminSidebar } from './admin-sidebar'
import { Search, Bell } from 'lucide-react'

export function AdminLayout() {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-gray-100 bg-white/95 backdrop-blur-sm px-4">
          <SidebarTrigger className="-ml-1 text-gray-400 hover:text-gray-600" />
          <Separator orientation="vertical" className="h-4 bg-gray-200" />
          <div className="flex flex-1 items-center gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-300" />
              <input
                type="text"
                placeholder="Buscar en el sistema..."
                className="h-8 w-full rounded-lg border border-gray-100 bg-gray-50 pl-8 pr-3 text-sm text-gray-700 placeholder:text-gray-300 focus:border-agrobot-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-agrobot-300 transition-colors"
              />
            </div>
          </div>
          <button className="relative shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-500" />
          </button>
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-xs font-medium text-gray-400 hover:text-agrobot-600 transition-colors"
          >
            ← Marketplace
          </a>
        </header>
        <div className="flex flex-1 flex-col p-6">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
