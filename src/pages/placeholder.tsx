import type { LucideIcon } from 'lucide-react'

export function PlaceholderPage({ title, icon: Icon, description }: {
  title: string
  icon: LucideIcon
  description?: string
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">{title}</h1>
        {description && <p className="text-sm text-gray-400 mt-0.5">{description}</p>}
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 mb-4">
          <Icon className="h-6 w-6 text-gray-400" />
        </div>
        <p className="text-sm font-semibold text-gray-500">Módulo en construcción</p>
        <p className="text-xs text-gray-400 mt-1">Esta sección estará disponible próximamente</p>
      </div>
    </div>
  )
}
