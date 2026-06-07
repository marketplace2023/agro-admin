import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AdminAuthProvider, useAdminAuth } from '@/contexts/auth-context'
import { AdminLayout } from '@/components/layout/admin-layout'
import { LoginPage } from '@/pages/login'
import { AdminDashboard } from '@/pages/dashboard'
import { UsuariosPage } from '@/pages/usuarios'
import { RolesPage } from '@/pages/roles'
import { CategoriasPage } from '@/pages/categorias'
import { PublicacionesPage } from '@/pages/publicaciones'
import { TiendasPage } from '@/pages/tiendas'
import { CotizacionesPage } from '@/pages/cotizaciones'
import { BlogAdminPage } from '@/pages/blog'
import { AyudaAdminPage } from '@/pages/ayuda'
import { SoportePage } from '@/pages/soporte'
import { AnaliticaPage } from '@/pages/analitica'
import { ConfiguracionPage } from '@/pages/configuracion'
import { PlaceholderPage } from '@/pages/placeholder'
import { Bell } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAdminAuth()
  if (isLoading) return (
    <div className="flex h-screen items-center justify-center">
      <Skeleton className="h-8 w-32" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AuthGuard><AdminLayout /></AuthGuard>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"      element={<AdminDashboard />} />
        <Route path="analitica"      element={<AnaliticaPage />} />
        <Route path="notificaciones" element={<PlaceholderPage title="Notificaciones" icon={Bell} />} />
        <Route path="usuarios"       element={<UsuariosPage />} />
        <Route path="roles"          element={<RolesPage />} />
        <Route path="categorias"     element={<CategoriasPage />} />
        <Route path="publicaciones"  element={<PublicacionesPage />} />
        <Route path="tiendas"        element={<TiendasPage />} />
        <Route path="cotizaciones"   element={<CotizacionesPage />} />
        <Route path="blog"           element={<BlogAdminPage />} />
        <Route path="ayuda"          element={<AyudaAdminPage />} />
        <Route path="soporte"        element={<SoportePage />} />
        <Route path="configuracion"  element={<ConfiguracionPage />} />
        <Route path="*"              element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <AppRoutes />
      </AdminAuthProvider>
    </BrowserRouter>
  )
}
