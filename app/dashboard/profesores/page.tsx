"use client"

import { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react"
import { swrFetcher } from "@/lib/api/fetcher"
import { profesoresApi } from "@/lib/api/services/profesores"
import { DataTable, type Column } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { Modal } from "@/components/shared/modal"
import type { PaginatedApiResponse, ProfesorConPersona, TipoDocumento, CreatePersonaInput } from "@/lib/types"

export default function ProfesoresPage() {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingData, setEditingData] = useState<ProfesorConPersona | null>(null)
  const limit = 20

  const { data, isLoading, mutate } = useSWR<PaginatedApiResponse<ProfesorConPersona>>(
    `/profesores/getAll?limit=${limit}&offset=${page * limit}`,
    swrFetcher
  )

  const columns: Column<ProfesorConPersona>[] = [
    { key: "profesor_id", header: "ID" },
    {
      key: "nombres",
      header: "Nombre completo",
      render: (p) =>
        `${p.nombres ?? ""} ${p.apellido_paterno ?? ""} ${p.apellido_materno ?? ""}`.trim() ||
        `Profesor #${p.profesor_id}`,
    },
    {
      key: "numero_documento",
      header: "Documento",
      render: (p) => p.numero_documento ?? "—",
    },
    {
      key: "estado",
      header: "Estado",
      render: (p) => <StatusBadge status={p.estado} />,
    },
    {
      key: "fecha_contratacion",
      header: "Contratacion",
      render: (p) =>
        p.fecha_contratacion
          ? new Date(p.fecha_contratacion).toLocaleDateString("es-CO")
          : "—",
    },
  ]

  const filtered = data?.data?.filter((p) => {
    if (!search) return true
    const full = `${p.nombres ?? ""} ${p.apellido_paterno ?? ""} ${p.numero_documento ?? ""}`.toLowerCase()
    return full.includes(search.toLowerCase())
  }) ?? []

  async function handleCreate(formData: {
    persona: CreatePersonaInput
    profesor: { estado?: string }
  }) {
    try {
      await profesoresApi.create(formData as Parameters<typeof profesoresApi.create>[0])
      toast.success("Profesor creado exitosamente")
      setModalOpen(false)
      mutate()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al crear profesor")
    }
  }

  async function handleUpdate(formData: {
    persona: CreatePersonaInput
    profesor: { estado?: string }
  }) {
    if (!editingId) return
    try {
      await profesoresApi.update(editingId, formData as Parameters<typeof profesoresApi.update>[1])
      toast.success("Profesor actualizado exitosamente")
      setModalOpen(false)
      setEditingId(null)
      setEditingData(null)
      mutate()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar")
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Esta seguro de eliminar este profesor?")) return
    try {
      await profesoresApi.delete(id)
      toast.success("Profesor eliminado")
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
          <h1 className="text-2xl font-bold text-foreground">Profesores</h1>
          <p className="text-sm text-muted-foreground">
            Gestion de profesores registrados
          </p>
        </div>
        <button
          onClick={() => { setEditingId(null); setEditingData(null); setModalOpen(true) }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo profesor
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nombre o documento..."
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
          emptyMessage="No hay profesores registrados"
          actions={(p) => (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => { setEditingId(p.profesor_id); setEditingData(p); setModalOpen(true) }}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Editar profesor"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(p.profesor_id)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                aria-label="Eliminar profesor"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        />
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-3">
            <p className="text-sm text-muted-foreground">
              Pagina {page + 1} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="h-8 rounded-lg border border-border px-3 text-sm text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="h-8 rounded-lg border border-border px-3 text-sm text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingId(null); setEditingData(null) }}
        title={editingId ? "Editar profesor" : "Nuevo profesor"}
      >
        <ProfesorForm
          initialData={editingData}
          onSubmit={editingId ? handleUpdate : handleCreate}
          onCancel={() => { setModalOpen(false); setEditingId(null); setEditingData(null) }}
          submitLabel={editingId ? "Actualizar" : "Crear profesor"}
        />
      </Modal>
    </div>
  )
}

function ProfesorForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Guardar",
}: {
  initialData?: ProfesorConPersona | null
  onSubmit: (data: { persona: CreatePersonaInput; profesor: { estado?: string } }) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [nombres, setNombres] = useState(initialData?.nombres ?? "")
  const [apellidoPaterno, setApellidoPaterno] = useState(initialData?.apellido_paterno ?? "")
  const [apellidoMaterno, setApellidoMaterno] = useState(initialData?.apellido_materno ?? "")
  const [tipoDocumentoId, setTipoDocumentoId] = useState(initialData?.persona?.tipo_documento_id ?? 0)
  const [numeroDocumento, setNumeroDocumento] = useState(initialData?.numero_documento ?? "")
  const [fechaNacimiento, setFechaNacimiento] = useState(initialData?.persona?.fecha_nacimiento ?? "")
  const [genero, setGenero] = useState<"Masculino" | "Femenino" | "Otro">(
    (initialData?.persona?.genero as "Masculino" | "Femenino" | "Otro") ?? "Masculino"
  )
  const [estado, setEstado] = useState(initialData?.estado ?? "activo")

  const { data: tiposDoc } = useSWR<PaginatedApiResponse<TipoDocumento>>(
    "/tipos-documento/getAll?limit=50&offset=0",
    swrFetcher
  )

  const inputClass =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({
        persona: {
          nombres,
          apellido_paterno: apellidoPaterno || undefined,
          apellido_materno: apellidoMaterno || undefined,
          tipo_documento_id: tipoDocumentoId,
          numero_documento: numeroDocumento,
          fecha_nacimiento: fechaNacimiento,
          genero,
        },
        profesor: { estado },
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Nombres *</label>
          <input required value={nombres} onChange={(e) => setNombres(e.target.value)} placeholder="Nombres completos" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Apellido paterno</label>
          <input value={apellidoPaterno} onChange={(e) => setApellidoPaterno(e.target.value)} placeholder="Apellido paterno" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Apellido materno</label>
          <input value={apellidoMaterno} onChange={(e) => setApellidoMaterno(e.target.value)} placeholder="Apellido materno" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Tipo de documento *</label>
          <select required value={tipoDocumentoId} onChange={(e) => setTipoDocumentoId(Number(e.target.value))} className={inputClass}>
            <option value={0} disabled>Seleccionar...</option>
            {tiposDoc?.data?.map((td) => (
              <option key={td.tipo_documento_id} value={td.tipo_documento_id}>{td.nombre_documento}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Numero de documento *</label>
          <input required value={numeroDocumento} onChange={(e) => setNumeroDocumento(e.target.value)} placeholder="Numero de documento" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Fecha de nacimiento *</label>
          <input required type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Genero *</label>
          <select required value={genero} onChange={(e) => setGenero(e.target.value as "Masculino" | "Femenino" | "Otro")} className={inputClass}>
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Estado</label>
          <select value={estado} onChange={(e) => setEstado(e.target.value)} className={inputClass}>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
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
