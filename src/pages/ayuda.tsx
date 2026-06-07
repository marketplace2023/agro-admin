import { useState, useEffect, useRef } from 'react'
import {
  Plus, Pencil, Trash2, HelpCircle, AlertCircle, Loader2, X, Upload, ImageIcon,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { api, getToken } from '@/lib/api'

interface HelpCategory {
  id: number
  name: string
  slug: string
  description?: string
  imageUrl?: string
  icon?: string
  sortOrder?: number
}

interface HelpArticle {
  id: number
  categoryId: number
  title: string
  slug: string
  excerpt?: string
  type: string
  isFeatured: boolean
  isPublished: boolean
  createdAt: string
}

type ArticleType = 'faq' | 'guide' | 'tutorial' | 'policy' | 'announcement'

const ARTICLE_TYPES: ArticleType[] = ['faq', 'guide', 'tutorial', 'policy', 'announcement']
const ARTICLE_TYPE_LABELS: Record<ArticleType, string> = {
  faq: 'FAQ', guide: 'Guía', tutorial: 'Tutorial', policy: 'Política', announcement: 'Anuncio',
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

function toSlug(str: string) {
  return str.toLowerCase()
    .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e')
    .replace(/[íìï]/g, 'i').replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u')
    .replace(/ñ/g, 'n').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export function AyudaAdminPage() {
  const [categories,   setCategories]   = useState<HelpCategory[]>([])
  const [articles,     setArticles]     = useState<HelpArticle[]>([])
  const [selCategory,  setSelCategory]  = useState<number | null>(null)
  const [loadingCats,  setLoadingCats]  = useState(true)
  const [loadingArts,  setLoadingArts]  = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [saving,       setSaving]       = useState(false)
  const [uploading,    setUploading]    = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Category modal
  const [catModal, setCatModal] = useState<{
    mode: 'create' | 'edit'
    id?: number
    name: string; slug: string; description: string; icon: string; imageUrl: string; sortOrder: string
  } | null>(null)

  // Article modal
  const [artModal, setArtModal] = useState<{
    mode: 'create' | 'edit'
    id?: number
    categoryId: string; title: string; slug: string; excerpt: string; content: string
    type: ArticleType; isFeatured: boolean; isPublished: boolean; sortOrder: string
  } | null>(null)

  const [confirmDel, setConfirmDel] = useState<{ type: 'cat' | 'art'; id: number } | null>(null)

  useEffect(() => {
    api.get<HelpCategory[]>('/help/categories')
      .then(setCategories)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoadingCats(false))
  }, [])

  useEffect(() => {
    if (selCategory === null) { setArticles([]); return }
    setLoadingArts(true)
    api.get<HelpArticle[]>(`/help/articles?categoryId=${selCategory}`)
      .then(setArticles)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoadingArts(false))
  }, [selCategory])

  // Category CRUD
  async function saveCat() {
    if (!catModal) return
    setSaving(true)
    try {
      const body = {
        name: catModal.name, slug: catModal.slug,
        description: catModal.description || undefined,
        icon: catModal.icon || undefined,
        imageUrl: catModal.imageUrl || undefined,
        sortOrder: Number(catModal.sortOrder) || 0,
      }
      if (catModal.mode === 'create') {
        const created = await api.post<{ id: number }>('/help/admin/categories', body)
        setCategories((prev) => [...prev, { id: created.id, ...body }])
      } else if (catModal.id) {
        const id = catModal.id
        await api.put(`/help/admin/categories/${id}`, body)
        setCategories((prev) => prev.map((c) => c.id === id ? { ...c, ...body } : c))
      }
      setCatModal(null)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  async function deleteCat(id: number) {
    try {
      await api.del(`/help/admin/categories/${id}`)
      setCategories((prev) => prev.filter((c) => c.id !== id))
      if (selCategory === id) setSelCategory(null)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error')
    } finally {
      setConfirmDel(null)
    }
  }

  // Article CRUD
  async function saveArt() {
    if (!artModal) return
    setSaving(true)
    try {
      const body = {
        categoryId:  Number(artModal.categoryId),
        title:       artModal.title,
        slug:        artModal.slug,
        excerpt:     artModal.excerpt || undefined,
        content:     artModal.content || undefined,
        type:        artModal.type,
        isFeatured:  artModal.isFeatured,
        isPublished: artModal.isPublished,
        sortOrder:   Number(artModal.sortOrder) || 0,
      }
      if (artModal.mode === 'create') {
        const created = await api.post<HelpArticle>('/help/admin/articles', body)
        setArticles((prev) => [...prev, created])
      } else if (artModal.id) {
        const updated = await api.put<HelpArticle>(`/help/admin/articles/${artModal.id}`, body)
        setArticles((prev) => prev.map((a) => a.id === artModal.id ? updated : a))
      }
      setArtModal(null)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  async function deleteArt(id: number) {
    try {
      await api.del(`/help/admin/articles/${id}`)
      setArticles((prev) => prev.filter((a) => a.id !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error')
    } finally {
      setConfirmDel(null)
    }
  }

  function openCreateArt() {
    setArtModal({
      mode: 'create',
      categoryId: selCategory ? String(selCategory) : '',
      title: '', slug: '', excerpt: '', content: '',
      type: 'guide', isFeatured: false, isPublished: false, sortOrder: '0',
    })
  }

  function openEditArt(art: HelpArticle) {
    setArtModal({
      mode: 'edit', id: art.id,
      categoryId: String(art.categoryId),
      title: art.title, slug: art.slug,
      excerpt: art.excerpt ?? '', content: '',
      type: art.type as ArticleType, isFeatured: art.isFeatured, isPublished: art.isPublished, sortOrder: '0',
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Centro de Ayuda</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gestión de categorías y artículos de ayuda</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Categories column */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Categorías</h2>
            <button
              onClick={() => setCatModal({ mode: 'create', name: '', slug: '', description: '', icon: '', imageUrl: '', sortOrder: '0' })}
              className="flex items-center gap-1 rounded-lg bg-agrobot-50 px-2.5 py-1.5 text-[11px] font-semibold text-agrobot-700 hover:bg-agrobot-100 transition-colors"
            >
              <Plus className="h-3 w-3" /> Nueva
            </button>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
            {loadingCats
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-4 py-3"><Skeleton className="h-5 w-full" /></div>
                ))
              : categories.length === 0
              ? (
                  <div className="px-4 py-10 text-center text-sm text-gray-400">Sin categorías</div>
                )
              : categories.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => setSelCategory(cat.id)}
                    className={`flex items-center gap-2.5 px-4 py-3 cursor-pointer transition-colors ${
                      selCategory === cat.id ? 'bg-agrobot-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} className="h-8 w-8 shrink-0 rounded-lg object-cover border border-gray-100" />
                    ) : (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-agrobot-50 border border-agrobot-100">
                        <span className="text-xs font-bold text-agrobot-600">{cat.name.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-semibold truncate ${selCategory === cat.id ? 'text-agrobot-700' : 'text-gray-800'}`}>
                        {cat.name}
                      </p>
                      <p className="text-[10px] text-gray-400">/{cat.slug}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setCatModal({ mode: 'edit', id: cat.id, name: cat.name, slug: cat.slug, description: cat.description ?? '', icon: cat.icon ?? '', imageUrl: cat.imageUrl ?? '', sortOrder: String(cat.sortOrder ?? 0) })
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDel({ type: 'cat', id: cat.id }) }}
                        className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>

        {/* Articles column */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">
              {selCategory
                ? `Artículos — ${categories.find((c) => c.id === selCategory)?.name ?? ''}`
                : 'Artículos'
              }
            </h2>
            {selCategory && (
              <button
                onClick={openCreateArt}
                className="flex items-center gap-1 rounded-lg bg-agrobot-50 px-2.5 py-1.5 text-[11px] font-semibold text-agrobot-700 hover:bg-agrobot-100 transition-colors"
              >
                <Plus className="h-3 w-3" /> Nuevo artículo
              </button>
            )}
          </div>

          {!selCategory ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-16">
              <HelpCircle className="h-8 w-8 text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">Selecciona una categoría para ver sus artículos</p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <table className="w-full text-left text-[12px]">
                <thead className="border-b border-gray-100 bg-gray-50/50">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-gray-400">Título</th>
                    <th className="px-4 py-3 font-semibold text-gray-400">Tipo</th>
                    <th className="px-4 py-3 font-semibold text-gray-400">Estado</th>
                    <th className="px-4 py-3 font-semibold text-gray-400 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingArts
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i}>{Array.from({ length: 4 }).map((__, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-5 w-full" /></td>)}</tr>
                      ))
                    : articles.length === 0
                    ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-400">Sin artículos en esta categoría</td>
                        </tr>
                      )
                    : articles.map((art) => (
                        <tr key={art.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-800 max-w-xs truncate">{art.title}</p>
                            {art.isFeatured && (
                              <span className="text-[9px] font-bold text-amber-600 uppercase">Destacado</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                              {ARTICLE_TYPE_LABELS[art.type as ArticleType] ?? art.type}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${art.isPublished ? 'bg-agrobot-50 text-agrobot-700' : 'bg-gray-100 text-gray-500'}`}>
                              {art.isPublished ? 'Publicado' : 'Borrador'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => openEditArt(art)} className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700"><Pencil className="h-3 w-3" /></button>
                              <button onClick={() => setConfirmDel({ type: 'art', id: art.id })} className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Category modal */}
      {catModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-bold text-gray-900">
                {catModal.mode === 'create' ? 'Nueva categoría' : 'Editar categoría'}
              </h3>
              <button onClick={() => setCatModal(null)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Nombre *</label>
                  <input value={catModal.name} onChange={(e) => { const n = e.target.value; setCatModal((m) => m ? { ...m, name: n, slug: toSlug(n) } : m) }} className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-agrobot-300 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Slug *</label>
                  <input value={catModal.slug} onChange={(e) => setCatModal((m) => m ? { ...m, slug: e.target.value } : m)} className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-agrobot-300 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Descripción</label>
                  <input value={catModal.description} onChange={(e) => setCatModal((m) => m ? { ...m, description: e.target.value } : m)} className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-agrobot-300 focus:outline-none" />
                </div>
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
                      setCatModal((m) => m ? { ...m, imageUrl: url } : m)
                    } catch (err) {
                      alert(err instanceof Error ? err.message : 'Error al subir imagen')
                    } finally {
                      setUploading(false)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }
                  }}
                />
                <div className="flex items-start gap-3">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden">
                    {catModal.imageUrl ? (
                      <img src={catModal.imageUrl} alt="preview" className="h-full w-full object-cover" />
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
                    {catModal.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setCatModal((m) => m ? { ...m, imageUrl: '' } : m)}
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
              <button onClick={() => setCatModal(null)} className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100">Cancelar</button>
              <button onClick={saveCat} disabled={saving || uploading || !catModal.name || !catModal.slug} className="flex items-center gap-2 rounded-lg bg-agrobot-600 px-4 py-2 text-sm font-semibold text-white hover:bg-agrobot-700 disabled:opacity-60">
                {(saving || uploading) && <Loader2 className="h-4 w-4 animate-spin" />}
                {catModal.mode === 'create' ? 'Crear' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Article modal */}
      {artModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 overflow-y-auto py-8">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-bold text-gray-900">
                {artModal.mode === 'create' ? 'Nuevo artículo' : 'Editar artículo'}
              </h3>
              <button onClick={() => setArtModal(null)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Categoría *</label>
                <select value={artModal.categoryId} onChange={(e) => setArtModal((m) => m ? { ...m, categoryId: e.target.value } : m)} className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-agrobot-300 focus:outline-none">
                  <option value="">Seleccionar…</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Título *</label>
                  <input value={artModal.title} onChange={(e) => { const t = e.target.value; setArtModal((m) => m ? { ...m, title: t, slug: artModal.mode === 'create' ? toSlug(t) : m.slug } : m) }} className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-agrobot-300 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Slug *</label>
                  <input value={artModal.slug} onChange={(e) => setArtModal((m) => m ? { ...m, slug: e.target.value } : m)} className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-agrobot-300 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Extracto</label>
                <textarea value={artModal.excerpt} onChange={(e) => setArtModal((m) => m ? { ...m, excerpt: e.target.value } : m)} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-agrobot-300 focus:outline-none resize-none" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Contenido</label>
                <textarea value={artModal.content} onChange={(e) => setArtModal((m) => m ? { ...m, content: e.target.value } : m)} rows={5} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-agrobot-300 focus:outline-none resize-y" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Tipo</label>
                  <select value={artModal.type} onChange={(e) => setArtModal((m) => m ? { ...m, type: e.target.value as ArticleType } : m)} className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-agrobot-300 focus:outline-none">
                    {ARTICLE_TYPES.map((t) => <option key={t} value={t}>{ARTICLE_TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Orden</label>
                  <input type="number" value={artModal.sortOrder} onChange={(e) => setArtModal((m) => m ? { ...m, sortOrder: e.target.value } : m)} className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-agrobot-300 focus:outline-none" />
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={artModal.isFeatured} onChange={(e) => setArtModal((m) => m ? { ...m, isFeatured: e.target.checked } : m)} className="h-4 w-4 rounded border-gray-300 accent-agrobot-600" />
                  <span className="text-sm font-semibold text-gray-700">Destacado</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={artModal.isPublished} onChange={(e) => setArtModal((m) => m ? { ...m, isPublished: e.target.checked } : m)} className="h-4 w-4 rounded border-gray-300 accent-agrobot-600" />
                  <span className="text-sm font-semibold text-gray-700">Publicado</span>
                </label>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setArtModal(null)} className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100">Cancelar</button>
              <button onClick={saveArt} disabled={saving || !artModal.title || !artModal.slug || !artModal.categoryId} className="flex items-center gap-2 rounded-lg bg-agrobot-600 px-4 py-2 text-sm font-semibold text-white hover:bg-agrobot-700 disabled:opacity-60">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {artModal.mode === 'create' ? 'Crear' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-gray-900 mb-2">¿Eliminar?</h3>
            <p className="text-sm text-gray-500 mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDel(null)} className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100">Cancelar</button>
              <button
                onClick={() => confirmDel.type === 'cat' ? deleteCat(confirmDel.id) : deleteArt(confirmDel.id)}
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
