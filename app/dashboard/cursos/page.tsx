"use client"

import { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react"
import { swrFetcher } from "@/lib/api/fetcher"
import { cursosApi } from "@/lib/api/services/cursos"
import { DataTable, type Column } from "@/components/shared/data-table"
import { Modal } from "@/components/shared/modal"
import type { PaginatedApiResponse, Curso } from "@/lib/types"

export default function CursosPage() {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingData, setEditingData] = useState<Curso | null>(null)
  const limit = 20

  const { data, isLoading, mutate } = useSWR<PaginatedApiResponse<Curso>>(
    `/cursos/getAll?limit=${limit}&offset=${page * limit}`,
    swrFetcher
  )

  const columns: Column<Curso>[] = [
    { key: "curso_id", header: "ID" },
    { key: "nombre", header: "Nombre", render: (c) => c.nombre ?? "—" },
    { key: "grado", header: "Grado" },
    {
      key: "descripcion",
      header: "Descripcion",
      render: (c) => c.descripcion ?? "Sin descripcion",
    },
  ]

  const filtered =
    data?.data?.filter((c) => {
      if (!search) return true
      return `${c.nombre} ${c.grado}`.toLowerCase().includes(search.toLowerCase())
    }) ?? []

  async function handleCreate(formData: { nombre: string; grado: string; descripcion?: string }) {
    try {
      await cursosApi.create({ curso: formData })
      toast.success("Curso creado exitosamente")
      setModalOpen(false)
      mutate()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al crear curso")
    }
  }

  async function handleUpdate(formData: { nombre: string; grado: string; descripcion?: string }) {
    if (!editingId) return
    try {
      await cursosApi.update(editingId, { curso: formData })
      toast.success("Curso actualizado exitosamente")
      setModalOpen(false)
      setEditingId(null)
      setEditingData(null)
      mutate()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar")
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Esta seguro de eliminar este curso?")) return
    try {
      await cursosApi.delete(id)
      toast.success("Curso eliminado")
      mutate()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar")
    }
  }

  const totalPages = data?.pagination ? Math.ceil(data.pagination.total / limit) : 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cursos</h1>
          <p className="text-sm text-muted-foreground">Gestion de cursos disponibles</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setEditingData(null); setModalOpen(true) }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo curso
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nombre o grado..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="rounded-xl border border-border bg-card">
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          emptyMessage="No hay cursos registrados"
          actions={(c) => (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => { setEditingId(c.curso_id); setEditingData(c); setModalOpen(true) }}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Editar curso"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(c.curso_id)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                aria-label="Eliminar curso"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        />
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-3">
            <p className="text-sm text-muted-foreground">Pagina {page + 1} de {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="h-8 rounded-lg border border-border px-3 text-sm text-foreground hover:bg-muted disabled:opacity-50 transition-colors">Anterior</button>
              <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="h-8 rounded-lg border border-border px-3 text-sm text-foreground hover:bg-muted disabled:opacity-50 transition-colors">Siguiente</button>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingId(null); setEditingData(null) }}
        title={editingId ? "Editar curso" : "Nuevo curso"}
      >
        <CursoForm
          initialData={editingData}
          onSubmit={editingId ? handleUpdate : handleCreate}
          onCancel={() => { setModalOpen(false); setEditingId(null); setEditingData(null) }}
          submitLabel={editingId ? "Actualizar" : "Crear curso"}
        />
      </Modal>
    </div>
  )
}

function CursoForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Guardar",
}: {
  initialData?: Curso | null
  onSubmit: (data: { nombre: string; grado: string; descripcion?: string }) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [nombre, setNombre] = useState(initialData?.nombre ?? "")
  const [grado, setGrado] = useState(initialData?.grado ?? "")
  const [descripcion, setDescripcion] = useState(initialData?.descripcion ?? "")

  const inputClass =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({ nombre, grado, descripcion: descripcion || undefined })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Nombre del curso *</label>
        <input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Matematicas Avanzadas" className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Grado *</label>
        <input required value={grado} onChange={(e) => setGrado(e.target.value)} placeholder="Ej: 10mo" className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Descripcion</label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Descripcion del curso (opcional)"
          rows={3}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button type="button" onClick={onCancel} className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className="flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : submitLabel}
        </button>
      </div>
    </form>
  )
}
