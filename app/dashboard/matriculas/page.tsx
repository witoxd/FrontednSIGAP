"use client"

import { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react"
import { swrFetcher } from "@/lib/api/fetcher"
import { matriculasApi } from "@/lib/api/services/matriculas"
import { DataTable, type Column } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { Modal } from "@/components/shared/modal"
import type {
  PaginatedApiResponse,
  MatriculaConRelaciones,
  EstudianteConPersona,
  ProfesorConPersona,
  Curso,
  Jornada,
} from "@/lib/types"

export default function MatriculasPage() {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingData, setEditingData] = useState<MatriculaConRelaciones | null>(null)
  const limit = 20

  const { data, isLoading, mutate } = useSWR<PaginatedApiResponse<MatriculaConRelaciones>>(
    `/matriculas/getAll?limit=${limit}&offset=${page * limit}`,
    swrFetcher
  )

  const columns: Column<MatriculaConRelaciones>[] = [
    { key: "matricula_id", header: "ID" },
    {
      key: "estudiante_nombre",
      header: "Estudiante",
      render: (m) => m.estudiante_nombre || `${m.estudiante_id}`,
    },
    {
      key: "curso_nombre",
      header: "Curso",
      render: (m) => m.curso_nombre || `Curso #${m.curso_id}`,
    },
    {
      key: "profesor_nombre",
      header: "Profesor",
      render: (m) => m.profesor_nombre || `Prof. #${m.profesor_id}`,
    },
    {
      key: "estado",
      header: "Estado",
      render: (m) => <StatusBadge status={m.estado} />,
    },
    {
      key: "fecha_matricula",
      header: "Fecha",
      render: (m) =>
        m.fecha_matricula
          ? new Date(m.fecha_matricula).toLocaleDateString("es-CO")
          : "—",
    },
  ]

  const filtered =
    data?.data?.filter((m) => {
      if (!search) return true
      const full = `${m.estudiante_nombre ?? ""} ${m.curso_nombre ?? ""} ${m.profesor_nombre ?? ""}`.toLowerCase()
      return full.includes(search.toLowerCase())
    }) ?? []

  async function handleCreate(formData: {
    estudiante_id: number
    profesor_id: number
    curso_id: number
    jornada_id: number
    estado?: string
    anio_egreso?: number
  }) {
    try {
      await matriculasApi.create({ matricula: formData })
      toast.success("Matricula creada exitosamente")
      setModalOpen(false)
      mutate()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al crear matricula")
    }
  }

  async function handleUpdate(formData: {
    estudiante_id: number
    profesor_id: number
    curso_id: number
    jornada_id: number
    estado?: string
    anio_egreso?: number
  }) {
    if (!editingId) return
    try {
      await matriculasApi.update(editingId, { matricula: formData })
      toast.success("Matricula actualizada exitosamente")
      setModalOpen(false)
      setEditingId(null)
      setEditingData(null)
      mutate()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar")
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Esta seguro de eliminar esta matricula?")) return
    try {
      await matriculasApi.delete(id)
      toast.success("Matricula eliminada")
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
          <h1 className="text-2xl font-bold text-foreground">Matriculas</h1>
          <p className="text-sm text-muted-foreground">Gestion de matriculas academicas</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setEditingData(null); setModalOpen(true) }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva matricula
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por estudiante, curso..."
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
          emptyMessage="No hay matriculas registradas"
          actions={(m) => (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => { setEditingId(m.matricula_id); setEditingData(m); setModalOpen(true) }}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Editar matricula"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(m.matricula_id)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                aria-label="Eliminar matricula"
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
        title={editingId ? "Editar matricula" : "Nueva matricula"}
      >
        <MatriculaForm
          initialData={editingData}
          onSubmit={editingId ? handleUpdate : handleCreate}
          onCancel={() => { setModalOpen(false); setEditingId(null); setEditingData(null) }}
          submitLabel={editingId ? "Actualizar" : "Crear matricula"}
        />
      </Modal>
    </div>
  )
}

function MatriculaForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Guardar",
}: {
  initialData?: MatriculaConRelaciones | null
  onSubmit: (data: {
    estudiante_id: number
    profesor_id: number
    curso_id: number
    jornada_id: number
    estado?: string
    anio_egreso?: number
  }) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [estudianteId, setEstudianteId] = useState(initialData?.estudiante_id ?? 0)
  const [profesorId, setProfesorId] = useState(initialData?.profesor_id ?? 0)
  const [cursoId, setCursoId] = useState(initialData?.curso_id ?? 0)
  const [jornadaId, setJornadaId] = useState(initialData?.jornada_id ?? 0)
  const [estado, setEstado] = useState(initialData?.estado ?? "activa")
  const [anioEgreso, setAnioEgreso] = useState(initialData?.anio_egreso ?? new Date().getFullYear())

  const { data: estudiantes } = useSWR<PaginatedApiResponse<EstudianteConPersona>>(
    "/estudiantes/getAll?limit=200&offset=0",
    swrFetcher
  )
  const { data: profesores } = useSWR<PaginatedApiResponse<ProfesorConPersona>>(
    "/profesores/getAll?limit=200&offset=0",
    swrFetcher
  )
  const { data: cursos } = useSWR<PaginatedApiResponse<Curso>>(
    "/cursos/getAll?limit=200&offset=0",
    swrFetcher
  )
  const { data: jornadas } = useSWR<PaginatedApiResponse<Jornada>>(
    "/jornadas/getAll?limit=50&offset=0",
    swrFetcher
  )

  const inputClass =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({
        estudiante_id: estudianteId,
        profesor_id: profesorId,
        curso_id: cursoId,
        jornada_id: jornadaId,
        estado,
        anio_egreso: anioEgreso,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Estudiante *</label>
          <select required value={estudianteId} onChange={(e) => setEstudianteId(Number(e.target.value))} className={inputClass}>
            <option value={0} disabled>Seleccionar...</option>
            {estudiantes?.data?.map((e) => (
              <option key={e.estudiante_id} value={e.estudiante_id}>
                {e.nombres ?? ""} {e.apellido_paterno ?? ""} (#{e.estudiante_id})
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Profesor *</label>
          <select required value={profesorId} onChange={(e) => setProfesorId(Number(e.target.value))} className={inputClass}>
            <option value={0} disabled>Seleccionar...</option>
            {profesores?.data?.map((p) => (
              <option key={p.profesor_id} value={p.profesor_id}>
                {p.nombres ?? ""} {p.apellido_paterno ?? ""} (#{p.profesor_id})
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Curso *</label>
          <select required value={cursoId} onChange={(e) => setCursoId(Number(e.target.value))} className={inputClass}>
            <option value={0} disabled>Seleccionar...</option>
            {cursos?.data?.map((c) => (
              <option key={c.curso_id} value={c.curso_id}>
                {c.nombre} - {c.grado}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Jornada *</label>
          <select required value={jornadaId} onChange={(e) => setJornadaId(Number(e.target.value))} className={inputClass}>
            <option value={0} disabled>Seleccionar...</option>
            {jornadas?.data?.map((j) => (
              <option key={j.jornada_id} value={j.jornada_id}>
                {j.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Estado</label>
          <select value={estado} onChange={(e) => setEstado(e.target.value)} className={inputClass}>
            <option value="activa">Activa</option>
            <option value="finalizada">Finalizada</option>
            <option value="retirada">Retirada</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Ano de egreso</label>
          <input
            type="number"
            value={anioEgreso}
            onChange={(e) => setAnioEgreso(Number(e.target.value))}
            min={2000}
            max={2100}
            className={inputClass}
          />
        </div>
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
