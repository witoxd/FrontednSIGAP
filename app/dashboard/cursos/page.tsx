"use client"

import { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react"
import { swrFetcher } from "@/lib/api/fetcher"
import { cursosApi } from "@/lib/api/services/cursos"
import { jornadasApi } from "@/lib/api/services/jornadas"
import { DataTable, type Column } from "@/components/shared/data-table"
import { Modal } from "@/components/shared/modal"
import type { PaginatedApiResponse, Curso, Jornada, NivelEducativo } from "@/lib/types"

const NIVELES: NivelEducativo[] = ["Preescolar", "Primaria", "Secundaria", "Media"]

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

  const { data: jornadasData } = useSWR<PaginatedApiResponse<Jornada>>(
    "/jornadas/getAll?limit=100&offset=0",
    swrFetcher
  )
  const jornadas = jornadasData?.data ?? []

  const columns: Column<Curso>[] = [
    { key: "grado", header: "Grado" },
    { key: "nivel", header: "Nivel" },
    { key: "grupo", header: "Grupo" },
    {
      key: "jornada_nombre",
      header: "Jornada",
      render: (c) => c.jornada_nombre ?? "—",
    },
    {
      key: "capacidad_maxima",
      header: "Capacidad",
      render: (c) => `${c.capacidad_maxima} estudiantes`,
    },
    {
      key: "activo",
      header: "Estado",
      render: (c) => (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          c.activo
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : "bg-muted text-muted-foreground"
        }`}>
          {c.activo ? "Activo" : "Inactivo"}
        </span>
      ),
    },
  ]

  const filtered =
    data?.data?.filter((c) => {
      if (!search) return true
      return `${c.grado} ${c.nivel} ${c.grupo} ${c.jornada_nombre ?? ""}`.toLowerCase().includes(search.toLowerCase())
    }) ?? []

  type CursoFormData = { grado: string; nivel: NivelEducativo; grupo: string; jornada_id: number; capacidad_maxima?: number }

  async function handleCreate(formData: CursoFormData) {
    try {
      await cursosApi.create({ curso: formData })
      toast.success("Curso creado exitosamente")
      setModalOpen(false)
      mutate()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al crear curso")
    }
  }

  async function handleUpdate(formData: CursoFormData) {
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
    if (!confirm("¿Está seguro de desactivar este curso?")) return
    try {
      await cursosApi.delete(id)
      toast.success("Curso desactivado")
      mutate()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al desactivar")
    }
  }

  const totalPages = data?.pagination ? Math.ceil(data.pagination.total / limit) : 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cursos</h1>
          <p className="text-sm text-muted-foreground">Gestión de cursos académicos</p>
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
          placeholder="Buscar por grado, nivel o grupo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="rounded-xl border border-border bg-card">
        <DataTable
          columns={columns as unknown as Column<Record<string, unknown>>[]}
          data={filtered as unknown as Record<string, unknown>[]}
          isLoading={isLoading}
          emptyMessage="No hay cursos registrados"
          actions={(row) => {
            const c = row as unknown as Curso
            return (
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
                  aria-label="Desactivar curso"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          }}
        />
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-3">
            <p className="text-sm text-muted-foreground">Página {page + 1} de {totalPages}</p>
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
          jornadas={jornadas}
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
  jornadas,
  onSubmit,
  onCancel,
  submitLabel = "Guardar",
}: {
  initialData?: Curso | null
  jornadas: Jornada[]
  onSubmit: (data: { grado: string; nivel: NivelEducativo; grupo: string; jornada_id: number; capacidad_maxima?: number }) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [grado, setGrado] = useState(initialData?.grado ?? "")
  const [nivel, setNivel] = useState<NivelEducativo>(initialData?.nivel ?? "Primaria")
  const [grupo, setGrupo] = useState(initialData?.grupo ?? "")
  const [jornadaId, setJornadaId] = useState<number>(initialData?.jornada_id ?? 0)
  const [capacidad, setCapacidad] = useState<string>(String(initialData?.capacidad_maxima ?? 40))

  const inputClass =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!jornadaId) { return }
    setIsSubmitting(true)
    try {
      await onSubmit({
        grado,
        nivel,
        grupo,
        jornada_id: jornadaId,
        capacidad_maxima: Number(capacidad) || 40,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Grado *</label>
          <input
            required
            value={grado}
            onChange={(e) => setGrado(e.target.value)}
            placeholder="Ej: 6, 10, Transición"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Grupo *</label>
          <input
            required
            value={grupo}
            onChange={(e) => setGrupo(e.target.value)}
            placeholder="Ej: A, B, C"
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Nivel educativo *</label>
        <select
          required
          value={nivel}
          onChange={(e) => setNivel(e.target.value as NivelEducativo)}
          className={inputClass}
        >
          {NIVELES.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Jornada *</label>
        <select
          required
          value={jornadaId}
          onChange={(e) => setJornadaId(Number(e.target.value))}
          className={inputClass}
        >
          <option value={0} disabled>Seleccione una jornada</option>
          {jornadas.map((j) => (
            <option key={j.jornada_id} value={j.jornada_id}>{j.nombre}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Capacidad máxima</label>
        <input
          type="number"
          min={1}
          value={capacidad}
          onChange={(e) => setCapacidad(e.target.value)}
          placeholder="40"
          className={inputClass}
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
