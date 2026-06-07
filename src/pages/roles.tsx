import { useState, useEffect } from 'react'
import { ShieldCheck, AlertCircle, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'

interface Role {
  id: number
  name: string
  description?: string
  permissions?: Permission[]
}

interface Permission {
  id: number
  name: string
  resource: string
  action: string
  description?: string
}

export function RolesPage() {
  const [roles,       setRoles]       = useState<Role[]>([])
  const [allPerms,    setAllPerms]    = useState<Permission[]>([])
  const [selRole,     setSelRole]     = useState<Role | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [loadingRole, setLoadingRole] = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [toggling,    setToggling]    = useState<number | null>(null)

  // Fetch all roles and permissions
  useEffect(() => {
    Promise.all([
      api.get<Role[]>('/roles'),
      api.get<Permission[]>('/roles/permissions/all'),
    ])
      .then(([r, p]) => { setRoles(r); setAllPerms(p) })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function selectRole(role: Role) {
    setLoadingRole(true)
    try {
      const detail = await api.get<Role>(`/roles/${role.id}`)
      setSelRole(detail)
    } catch (e) {
      setSelRole({ ...role, permissions: [] })
    } finally {
      setLoadingRole(false)
    }
  }

  async function togglePermission(permId: number) {
    if (!selRole) return
    const has = selRole.permissions?.some((p) => p.id === permId) ?? false
    setToggling(permId)
    try {
      if (has) {
        await api.del(`/roles/${selRole.id}/permissions/${permId}`)
        setSelRole((r) => r ? { ...r, permissions: (r.permissions ?? []).filter((p) => p.id !== permId) } : r)
      } else {
        await api.post(`/roles/${selRole.id}/permissions`, { permissionId: permId })
        const perm = allPerms.find((p) => p.id === permId)
        if (perm) {
          setSelRole((r) => r ? { ...r, permissions: [...(r.permissions ?? []), perm] } : r)
        }
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error')
    } finally {
      setToggling(null)
    }
  }

  // Group permissions by resource
  const permsByResource: Record<string, Permission[]> = {}
  allPerms.forEach((p) => {
    const key = p.resource ?? 'general'
    if (!permsByResource[key]) permsByResource[key] = []
    permsByResource[key].push(p)
  })

  const rolePermsSet = new Set(selRole?.permissions?.map((p) => p.id) ?? [])

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Roles y Permisos</h1>
        <p className="text-sm text-gray-400 mt-0.5">Control de acceso por rol del sistema</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Roles list */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <h2 className="text-sm font-bold text-gray-900">Roles del sistema</h2>

          {loading
            ? <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="px-4 py-3"><Skeleton className="h-5 w-full" /></div>
                ))}
              </div>
            : (
              <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => selectRole(role)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      selRole?.id === role.id ? 'bg-agrobot-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                      <ShieldCheck className={`h-3.5 w-3.5 ${selRole?.id === role.id ? 'text-agrobot-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-semibold truncate ${selRole?.id === role.id ? 'text-agrobot-700' : 'text-gray-800'}`}>
                        {role.name}
                      </p>
                      {role.description && (
                        <p className="text-[10px] text-gray-400 truncate">{role.description}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )
          }
        </div>

        {/* Permissions panel */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <h2 className="text-sm font-bold text-gray-900">
            {selRole ? `Permisos — ${selRole.name}` : 'Permisos'}
          </h2>

          {!selRole ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-16">
              <ShieldCheck className="h-8 w-8 text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">Selecciona un rol para gestionar sus permisos</p>
            </div>
          ) : loadingRole ? (
            <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              {Object.entries(permsByResource).map(([resource, perms]) => (
                <div key={resource} className="border-b border-gray-100 last:border-b-0">
                  <div className="bg-gray-50/70 px-4 py-2 border-b border-gray-100">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{resource}</p>
                  </div>
                  <div className="px-4 py-2 divide-y divide-gray-50">
                    {perms.map((perm) => {
                      const checked = rolePermsSet.has(perm.id)
                      return (
                        <label
                          key={perm.id}
                          className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-gray-50/50 -mx-4 px-4 transition-colors"
                        >
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePermission(perm.id)}
                              disabled={toggling === perm.id}
                              className="h-4 w-4 rounded border-gray-300 accent-agrobot-600"
                            />
                            {toggling === perm.id && (
                              <Loader2 className="absolute inset-0 h-4 w-4 animate-spin text-agrobot-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold text-gray-800">{perm.name}</p>
                            {perm.description && (
                              <p className="text-[10px] text-gray-400">{perm.description}</p>
                            )}
                          </div>
                          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-bold text-gray-500 uppercase">
                            {perm.action}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}

              {allPerms.length === 0 && (
                <div className="px-4 py-10 text-center text-sm text-gray-400">
                  No hay permisos configurados
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
