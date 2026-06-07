import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Eye, BookOpen, AlertCircle, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { api } from '@/lib/api'

interface Post {
  id: number
  title: string
  slug: string
  category: string
  isPublished: boolean
  publishedAt: string | null
  viewCount: number
  readTimeMinutes: number
  authorName: string
  createdAt: string
}

interface PostsResponse {
  posts: Post[]
  total: number
  page: number
  limit: number
}

interface PostForm {
  title: string
  slug: string
  excerpt: string
  content: string
  imageUrl: string
  category: string
  tags: string
  readTimeMinutes: string
  isPublished: boolean
}

const emptyPostForm = (): PostForm => ({
  title: '', slug: '', excerpt: '', content: '',
  imageUrl: '', category: '', tags: '', readTimeMinutes: '5', isPublished: false,
})

function toSlug(str: string) {
  return str.toLowerCase()
    .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e')
    .replace(/[íìï]/g, 'i').replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u')
    .replace(/ñ/g, 'n').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: '2-digit' })
}

export function BlogAdminPage() {
  const [posts,   setPosts]   = useState<Post[]>([])
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(1)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const [sheetOpen,   setSheetOpen]   = useState(false)
  const [editPost,    setEditPost]    = useState<Post | null>(null)
  const [form,        setForm]        = useState<PostForm>(emptyPostForm())
  const [saving,      setSaving]      = useState(false)
  const [confirmDel,  setConfirmDel]  = useState<number | null>(null)

  const limit = 20

  const fetchPosts = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    api.get<PostsResponse>(`/blog/admin/posts?${params}`)
      .then((r) => { setPosts(r.posts); setTotal(r.total) })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  function openCreate() {
    setEditPost(null)
    setForm(emptyPostForm())
    setSheetOpen(true)
  }

  function openEdit(post: Post) {
    setEditPost(post)
    setForm({
      title:           post.title,
      slug:            post.slug,
      excerpt:         '',
      content:         '',
      imageUrl:        '',
      category:        post.category,
      tags:            '',
      readTimeMinutes: String(post.readTimeMinutes),
      isPublished:     post.isPublished,
    })
    setSheetOpen(true)
  }

  function updateForm(key: keyof PostForm, val: string | boolean) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  async function save() {
    setSaving(true)
    try {
      const body = {
        title:           form.title,
        slug:            form.slug,
        excerpt:         form.excerpt || undefined,
        content:         form.content || undefined,
        imageUrl:        form.imageUrl || undefined,
        category:        form.category || undefined,
        tags:            form.tags ? form.tags.split(',').map((t) => t.trim()) : [],
        readTimeMinutes: Number(form.readTimeMinutes) || 5,
        isPublished:     form.isPublished,
      }
      if (editPost) {
        await api.put<Post>(`/blog/admin/posts/${editPost.id}`, body)
      } else {
        await api.post<Post>('/blog/admin/posts', body)
      }
      setSheetOpen(false)
      fetchPosts()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  async function deletePost(id: number) {
    try {
      await api.del(`/blog/admin/posts/${id}`)
      setPosts((prev) => prev.filter((p) => p.id !== id))
      setTotal((t) => t - 1)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error')
    } finally {
      setConfirmDel(null)
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Blog</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gestión de artículos del blog · {total} publicaciones</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg bg-agrobot-600 px-4 py-2 text-sm font-semibold text-white hover:bg-agrobot-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Nuevo artículo
        </button>
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
                <th className="px-4 py-3 font-semibold text-gray-400">Título</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Categoría</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Estado</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Vistas</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Autor</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Fecha</th>
                <th className="px-4 py-3 font-semibold text-gray-400 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-5 w-full" /></td>
                      ))}
                    </tr>
                  ))
                : posts.length === 0
                ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <BookOpen className="h-8 w-8 text-gray-200" />
                          <p className="text-sm font-semibold">Sin artículos</p>
                          <p className="text-xs">Crea el primer artículo del blog</p>
                        </div>
                      </td>
                    </tr>
                  )
                : posts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800 max-w-xs truncate">{post.title}</p>
                        <p className="text-[10px] text-gray-400">{post.readTimeMinutes} min lectura</p>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{post.category || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          post.isPublished ? 'bg-agrobot-50 text-agrobot-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {post.isPublished ? 'Publicado' : 'Borrador'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-gray-500">
                          <Eye className="h-3 w-3 text-gray-300" />
                          {(post.viewCount ?? 0).toLocaleString('es-VE')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{post.authorName}</td>
                      <td className="px-4 py-3 text-gray-400">{fmtDate(post.publishedAt ?? post.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(post)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDel(post.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-[12px] text-gray-400">Página {page} de {totalPages}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 text-[12px]">‹</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 text-[12px]">›</button>
            </div>
          </div>
        )}
      </div>

      {/* Sheet form */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
          <SheetHeader className="border-b border-gray-100 p-5">
            <SheetTitle className="font-display text-lg font-bold text-gray-900">
              {editPost ? 'Editar artículo' : 'Nuevo artículo'}
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4 p-5">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Título *</label>
              <input
                value={form.title}
                onChange={(e) => {
                  updateForm('title', e.target.value)
                  if (!editPost) updateForm('slug', toSlug(e.target.value))
                }}
                className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-agrobot-300 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Slug *</label>
                <input
                  value={form.slug}
                  onChange={(e) => updateForm('slug', e.target.value)}
                  className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-agrobot-300 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Categoría</label>
                <input
                  value={form.category}
                  onChange={(e) => updateForm('category', e.target.value)}
                  className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-agrobot-300 focus:outline-none"
                  placeholder="Tecnología, Noticias…"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Extracto</label>
              <textarea
                value={form.excerpt}
                onChange={(e) => updateForm('excerpt', e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-agrobot-300 focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Contenido</label>
              <textarea
                value={form.content}
                onChange={(e) => updateForm('content', e.target.value)}
                rows={8}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-agrobot-300 focus:outline-none resize-y"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Tags (separados por coma)</label>
                <input
                  value={form.tags}
                  onChange={(e) => updateForm('tags', e.target.value)}
                  className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-agrobot-300 focus:outline-none"
                  placeholder="agro, noticias, campo"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Tiempo lectura (min)</label>
                <input
                  type="number"
                  value={form.readTimeMinutes}
                  onChange={(e) => updateForm('readTimeMinutes', e.target.value)}
                  className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-agrobot-300 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">URL de imagen</label>
              <input
                value={form.imageUrl}
                onChange={(e) => updateForm('imageUrl', e.target.value)}
                className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-agrobot-300 focus:outline-none"
                placeholder="https://…"
              />
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => updateForm('isPublished', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 accent-agrobot-600"
              />
              <span className="text-sm font-semibold text-gray-700">Publicar inmediatamente</span>
            </label>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setSheetOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving || !form.title || !form.slug}
                className="flex items-center gap-2 rounded-lg bg-agrobot-600 px-4 py-2 text-sm font-semibold text-white hover:bg-agrobot-700 disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editPost ? 'Guardar cambios' : 'Publicar'}
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Confirm delete */}
      {confirmDel !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-gray-900 mb-2">¿Eliminar artículo?</h3>
            <p className="text-sm text-gray-500 mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDel(null)} className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100">Cancelar</button>
              <button onClick={() => deletePost(confirmDel)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
