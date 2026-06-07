import { useState, useEffect, useRef } from 'react'
import {
  ChevronDown, ChevronRight, Plus, Pencil, Trash2,
  Tag, AlertCircle, Loader2, X, Upload, ImageIcon,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { api, getToken } from '@/lib/api'

interface Subcategory {
  id: number
  name: string
  slug: string
  description?: string
  icon?: string
  sortOrder?: number
}

interface Category {
  id: number
  name: string
  slug: string
  description?: string
  icon?: string
  imageUrl?: string
  sortOrder?: number
  subcategories: Subcategory[]
}

interface CategoryForm {
  name: string
  slug: string
  description: string
  icon: string
  imageUrl: string
  sortOrder: string
}

const emptyForm = (): CategoryForm => ({
  name: '', slug: '', description: '', icon: '', imageUrl: '', sortOrder: '0',
})

function toSlug(str: string) {
  return str.toLowerCase().replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e')
    .replace(/[íìï]/g, 'i').replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u')
    .replace(/ñ/g, 'n').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

async function uploadImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const token = getToken()
  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload fallido' }))
    throw new Error(err.error ?? 'Upload fallido')
  }
  const data = await res.json() as { url: string }
  return data.url
}

export function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [expanded,   setExpanded]   = useState<Set<number>>(new Set())
  const [saving,     setSaving]     = useState(false)
  const [uploading,  setUploading]  = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Modal state
  const [modal, setModal] = useState<{
    mode: 'create-cat' | 'edit-cat' | 'create-sub'
    categoryId?: number
    form: CategoryForm
    subForm: { name: string; slug: string; description: string; icon: string; sortOrder: string }
  } | null>(null)

  const [confirmDelete, setConfirmDelete] = useState<{ type: 'category' | 'sub'; id: number; catId?: number } | null>(null)

  useEffect(() => {
    api.get<Category[]>('/categories')
      .then(setCategories)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function toggleExpand(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function saveCategory() {
    if (!modal) return
    setSaving(true)
    try {
      const body = {
        name:        modal.form.name,
        slug:        modal.form.slug,
        description: modal.form.description || undefined,
        icon:        modal.form.icon || undefined,
        imageUrl:    modal.form.imageUrl || undefined,
        sortOrder:   Number(modal.form.sortOrder) || 0,
      }
      if (modal.mode === 'create-cat') {
        const created = await api.post<{ id: number }>('/categories/admin/categories', body)
        setCategories((prev) => [...prev, { id: created.id, ...body, subcategories: [] }])
      } else if (modal.mode === 'edit-cat' && modal.categoryId) {
        const id = modal.categoryId
        await api.put(`/categories/admin/categories/${id}`, body)
        setCategories((prev) => prev.map((c) => c.id === id ? { ...c, ...body } : c))
      }
      setModal(null)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  async function saveSubcategory() {
    if (!modal || !modal.categoryId) return
    setSaving(true)
    try {
      const body = {
        name:        modal.subForm.name,
        slug:        modal.subForm.slug,
        description: modal.subForm.description || undefined,
        icon:        modal.subForm.icon || undefined,
        sortOrder:   Number(modal.subForm.sortOrder) || 0,
      }
      const created = await api.post<Subcategory>(
        `/categories/admin/categories/${modal.categoryId}/subcategories`,
        body,
      )
      setCategories((prev) =>
        prev.map((c) =>
          c.id === modal.categoryId
            ? { ...c, subcategories: [...c.subcategories, created] }
            : c,
        ),
      )
      setModal(null)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  async function deleteCategory(id: number) {
    try {
      await api.del(`/categories/admin/categories/${id}`)
      setCategories((prev) => prev.filter((c) => c.id !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error')
    } finally {
      setConfirmDelete(null)
    }
  }

  function openCreateCat() {
    setModal({ mode: 'create-cat', form: emptyForm(), subForm: { name: '', slug: '', description: '', icon: '', sortOrder: '0' } })
  }

  function openEditCat(cat: Category) {
    setModal({
      mode: 'edit-cat',
      categoryId: cat.id,
      form: {
        name:        cat.name,
        slug:        cat.slug,
        description: cat.description ?? '',
        icon:        cat.icon ?? '',
        imageUrl:    cat.imageUrl ?? '',
        sortOrder:   String(cat.sortOrder ?? 0),
      },
      subForm: { name: '', slug: '', description: '', icon: '', sortOrder: '0' },
    })
  }

  function openCreateSub(catId: number) {
    setModal({
      mode: 'create-sub',
      categoryId: catId,
      form: emptyForm(),
      subForm: { name: '', slug: '', description: '', icon: '', sortOrder: '0' },
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Categorías</h1>
          <p className="text-sm text-gray-400 mt-0.5">Árbol de categorías del marketplace</p>
        </div>
        <button
          onClick={openCreateCat}
          className="flex items-center gap-1.5 rounded-lg bg-agrobot-600 px-4 py-2 text-sm font-semibold text-white hover:bg-agrobot-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Nueva categoría
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Category list */}
      <div className="flex flex-col gap-3">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))
          : categories.length === 0
          ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-16">
                <Tag className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm font-semibold text-gray-500">Sin categorías</p>
                <p className="text-xs text-gray-400 mt-1">Crea la primera categoría del marketplace</p>
              </div>
            )
          : categories.map((cat) => (
              <div key={cat.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                {/* Category header */}
                <div className="flex items-center gap-3 px-5 py-4">
                  <button
                    onClick={() => toggleExpand(cat.id)}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 transition-colors"
                  >
                    {expanded.has(cat.id)
                      ? <ChevronDown className="h-4 w-4" />
                      : <ChevronRight className="h-4 w-4" />
                    }
                  </button>

                  {/* Category thumbnail */}
                  {cat.imageUrl ? (
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="h-10 w-10 shrink-0 rounded-lg object-cover border border-gray-100"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-agrobot-50 border border-agrobot-100">
                      <span className="text-sm font-bold text-agrobot-600">
                        {cat.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{cat.name}</p>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                        {cat.subcategories.length} subcats
                      </span>
                      {cat.sortOrder !== undefined && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                          orden {cat.sortOrder}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400">/{cat.slug}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openCreateSub(cat.id)}
                      className="flex items-center gap-1 rounded-lg bg-agrobot-50 px-2.5 py-1.5 text-[11px] font-semibold text-agrobot-700 hover:bg-agrobot-100 transition-colors"
                    >
                      <Plus className="h-3 w-3" /> Subcategoría
                    </button>
                    <button
                      onClick={() => openEditCat(cat)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete({ type: 'category', id: cat.id })}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subcategories */}
                {expanded.has(cat.id) && cat.subcategories.length > 0 && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {cat.subcategories.map((sub) => (
                      <div key={sub.id} className="flex items-center gap-3 px-5 py-3 bg-gray-50/50">
                        <div className="ml-8 w-1 h-4 border-l border-gray-200" />
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100">
                          <span className="text-[11px] font-bold text-gray-500">
                            {sub.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-gray-700">{sub.name}</p>
                          <p className="text-[11px] text-gray-400">/{sub.slug}</p>
                        </div>
                        {sub.sortOrder !== undefined && (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                            orden {sub.sortOrder}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {expanded.has(cat.id) && cat.subcategories.length === 0 && (
                  <div className="border-t border-gray-100 px-5 py-3 bg-gray-50/50 text-[12px] text-gray-400 text-center">
                    Sin subcategorías
                  </div>
                )}
              </div>
            ))
        }
      </div>

      {/* Category Modal */}
      {modal && (modal.mode === 'create-cat' || modal.mode === 'edit-cat') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-bold text-gray-900">
                {modal.mode === 'create-cat' ? 'Nueva categoría' : 'Editar categoría'}
              </h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Nombre *</label>
                  <input
                    value={modal.form.name}
                    onChange={(e) => {
                      const name = e.target.value
                      setModal((m) => m ? { ...m, form: { ...m.form, name, slug: toSlug(name) } } : m)
                    }}
                    className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-agrobot-300 focus:outline-none"
                    placeholder="Ej: Granos y Cereales"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Slug *</label>
                  <input
                    value={modal.form.slug}
                    onChange={(e) => setModal((m) => m ? { ...m, form: { ...m.form, slug: e.target.value } } : m)}
                    className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-agrobot-300 focus:outline-none"
                    placeholder="granos-y-cereales"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Ícono (emoji opcional)</label>
                  <input
                    value={modal.form.icon}
                    onChange={(e) => setModal((m) => m ? { ...m, form: { ...m.form, icon: e.target.value } } : m)}
                    className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-agrobot-300 focus:outline-none"
                    placeholder="🌾"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Orden</label>
                  <input
                    type="number"
                    value={modal.form.sortOrder}
                    onChange={(e) => setModal((m) => m ? { ...m, form: { ...m.form, sortOrder: e.target.value } } : m)}
                    className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-agrobot-300 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Descripción</label>
                <textarea
                  value={modal.form.description}
                  onChange={(e) => setModal((m) => m ? { ...m, form: { ...m.form, description: e.target.value } } : m)}
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-agrobot-300 focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Imagen de categoría</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setUploading(true)
                    try {
                      const url = await uploadImage(file)
                      setModal((m) => m ? { ...m, form: { ...m.form, imageUrl: url } } : m)
                    } catch (err) {
                      alert(err instanceof Error ? err.message : 'Error al subir imagen')
                    } finally {
                      setUploading(false)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }
                  }}
                />
                <div className="flex items-start gap-3">
                  {/* Preview */}
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden">
                    {modal.form.imageUrl ? (
                      <img src={modal.form.imageUrl} alt="preview" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-7 w-7 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
                    >
                      {uploading
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Subiendo…</>
                        : <><Upload className="h-4 w-4" /> Subir imagen</>
                      }
                    </button>
                    {modal.form.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setModal((m) => m ? { ...m, form: { ...m.form, imageUrl: '' } } : m)}
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" /> Quitar imagen
                      </button>
                    )}
                    <p className="text-[10px] text-gray-400">JPG, PNG, WebP o GIF. Máx 5 MB.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setModal(null)} className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100">
                Cancelar
              </button>
              <button
                onClick={saveCategory}
                disabled={saving || uploading || !modal.form.name || !modal.form.slug}
                className="flex items-center gap-2 rounded-lg bg-agrobot-600 px-4 py-2 text-sm font-semibold text-white hover:bg-agrobot-700 disabled:opacity-60"
              >
                {(saving || uploading) && <Loader2 className="h-4 w-4 animate-spin" />}
                {modal.mode === 'create-cat' ? 'Crear' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subcategory Modal */}
      {modal && modal.mode === 'create-sub' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-bold text-gray-900">Nueva subcategoría</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Nombre *</label>
                  <input
                    value={modal.subForm.name}
                    onChange={(e) => {
                      const name = e.target.value
                      setModal((m) => m ? { ...m, subForm: { ...m.subForm, name, slug: toSlug(name) } } : m)
                    }}
                    className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-agrobot-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Slug *</label>
                  <input
                    value={modal.subForm.slug}
                    onChange={(e) => setModal((m) => m ? { ...m, subForm: { ...m.subForm, slug: e.target.value } } : m)}
                    className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-agrobot-300 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Ícono</label>
                  <input
                    value={modal.subForm.icon}
                    onChange={(e) => setModal((m) => m ? { ...m, subForm: { ...m.subForm, icon: e.target.value } } : m)}
                    className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-agrobot-300 focus:outline-none"
                    placeholder="🌱"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Orden</label>
                  <input
                    type="number"
                    value={modal.subForm.sortOrder}
                    onChange={(e) => setModal((m) => m ? { ...m, subForm: { ...m.subForm, sortOrder: e.target.value } } : m)}
                    className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-agrobot-300 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Descripción</label>
                <input
                  value={modal.subForm.description}
                  onChange={(e) => setModal((m) => m ? { ...m, subForm: { ...m.subForm, description: e.target.value } } : m)}
                  className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-agrobot-300 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setModal(null)} className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100">
                Cancelar
              </button>
              <button
                onClick={saveSubcategory}
                disabled={saving || !modal.subForm.name || !modal.subForm.slug}
                className="flex items-center gap-2 rounded-lg bg-agrobot-600 px-4 py-2 text-sm font-semibold text-white hover:bg-agrobot-700 disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-gray-900 mb-2">¿Eliminar categoría?</h3>
            <p className="text-sm text-gray-500 mb-5">Esta acción no se puede deshacer. Se eliminarán también sus subcategorías.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100">
                Cancelar
              </button>
              <button
                onClick={() => deleteCategory(confirmDelete.id)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
