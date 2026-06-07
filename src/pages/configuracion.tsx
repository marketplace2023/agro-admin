import { useState, useEffect } from 'react'
import { Settings, AlertCircle, Loader2, X, Globe, Lock } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'

interface AppSetting {
  id?: number
  key: string
  value: string
  description?: string
  isPublic: boolean
}

interface EditModal {
  key: string
  value: string
  description: string
  isPublic: boolean
}

function groupKey(key: string): string {
  const dot = key.indexOf('.')
  return dot !== -1 ? key.slice(0, dot) : 'general'
}

const GROUP_LABELS: Record<string, string> = {
  site:    'Sitio',
  mail:    'Correo',
  payment: 'Pagos',
  auth:    'Autenticación',
  general: 'General',
}

export function ConfiguracionPage() {
  const [settings, setSettings] = useState<AppSetting[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [saving,   setSaving]   = useState(false)
  const [modal,    setModal]    = useState<EditModal | null>(null)

  useEffect(() => {
    api.get<AppSetting[]>('/admin/settings')
      .then(setSettings)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    if (!modal) return
    setSaving(true)
    try {
      await api.put(`/admin/settings/${modal.key}`, {
        value:       modal.value,
        description: modal.description || undefined,
        isPublic:    modal.isPublic,
      })
      setSettings((prev) =>
        prev.map((s) => s.key === modal.key ? { ...s, value: modal.value, description: modal.description, isPublic: modal.isPublic } : s),
      )
      setModal(null)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  // Group settings
  const groups: Record<string, AppSetting[]> = {}
  settings.forEach((s) => {
    const g = groupKey(s.key)
    if (!groups[g]) groups[g] = []
    groups[g].push(s)
  })

  const isLong = (v: string) => v.length > 60

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-400 mt-0.5">Parámetros generales del sistema</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : settings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-16">
          <Settings className="h-8 w-8 text-gray-200 mb-2" />
          <p className="text-sm font-semibold text-gray-500">Sin configuraciones</p>
          <p className="text-xs text-gray-400 mt-1">No hay parámetros configurados en el sistema</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="bg-gray-50/70 border-b border-gray-100 px-5 py-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                  {GROUP_LABELS[group] ?? group}
                </p>
              </div>
              <table className="w-full text-left text-[12px]">
                <thead className="border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-2.5 font-semibold text-gray-400">Clave</th>
                    <th className="px-5 py-2.5 font-semibold text-gray-400">Valor</th>
                    <th className="px-5 py-2.5 font-semibold text-gray-400">Descripción</th>
                    <th className="px-5 py-2.5 font-semibold text-gray-400">Visibilidad</th>
                    <th className="px-5 py-2.5 font-semibold text-gray-400 text-right">Editar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((s) => (
                    <tr key={s.key} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 font-mono text-[11px] text-gray-600">{s.key}</td>
                      <td className="px-5 py-3 max-w-xs">
                        <p className={`text-gray-800 ${isLong(s.value) ? 'truncate font-normal text-[11px] text-gray-500 italic' : 'font-semibold'}`}>
                          {s.value || <span className="text-gray-300 italic">vacío</span>}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-gray-400 max-w-xs truncate">
                        {s.description ?? '—'}
                      </td>
                      <td className="px-5 py-3">
                        {s.isPublic ? (
                          <span className="flex items-center gap-1 rounded-full bg-agrobot-50 px-2 py-0.5 text-[10px] font-semibold text-agrobot-700 w-fit">
                            <Globe className="h-2.5 w-2.5" /> Público
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500 w-fit">
                            <Lock className="h-2.5 w-2.5" /> Privado
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => setModal({
                            key:         s.key,
                            value:       s.value,
                            description: s.description ?? '',
                            isPublic:    s.isPublic,
                          })}
                          className="rounded-lg bg-gray-50 px-3 py-1.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-display text-lg font-bold text-gray-900">Editar configuración</h3>
                <p className="font-mono text-[11px] text-gray-400">{modal.key}</p>
              </div>
              <button onClick={() => setModal(null)}>
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Valor
                </label>
                {isLong(modal.value) ? (
                  <textarea
                    value={modal.value}
                    onChange={(e) => setModal((m) => m ? { ...m, value: e.target.value } : m)}
                    rows={4}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-agrobot-300 focus:outline-none resize-y"
                  />
                ) : (
                  <input
                    value={modal.value}
                    onChange={(e) => setModal((m) => m ? { ...m, value: e.target.value } : m)}
                    className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-agrobot-300 focus:outline-none"
                  />
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Descripción
                </label>
                <input
                  value={modal.description}
                  onChange={(e) => setModal((m) => m ? { ...m, description: e.target.value } : m)}
                  className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-agrobot-300 focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={modal.isPublic}
                  onChange={(e) => setModal((m) => m ? { ...m, isPublic: e.target.checked } : m)}
                  className="h-4 w-4 rounded border-gray-300 accent-agrobot-600"
                />
                <span className="text-sm font-semibold text-gray-700">Visible públicamente</span>
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setModal(null)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-agrobot-600 px-4 py-2 text-sm font-semibold text-white hover:bg-agrobot-700 disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
