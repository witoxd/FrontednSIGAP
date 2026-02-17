"use client"

import { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import { swrFetcher } from "@/lib/api/fetcher"
import { estudiantesApi } from "@/lib/api/services/estudiantes"
import { DataTable, type Column } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { Modal } from "@/components/shared/modal"
import { EstudianteForm } from "@/components/estudiantes/estudiante-form"
import type { PaginatedApiResponse, EstudianteConPersona } from "@/lib/types"

export default function EstudiantesPage() {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingData, setEditingData] = useState<EstudianteConPersona | null>(null)
  const limit = 20

  const { data, isLoading, mutate } = useSWR<PaginatedApiResponse<EstudianteConPersona>>(
    `/estudiantes/getAll?limit=${limit}&offset=${page * limit}`,
    swrFetcher
  )

  const columns: Column<EstudianteConPersona>[] = [
    { key: "estudiante_id", header: "ID" },
    {
      key: "nombres",
      header: "Nombre completo",
      render: (est) => {
        const name = est.nombres ?? ""
        const ap = est.apellido_paterno ?? ""
        const am = est.apellido_materno ?? ""
        return `${name} ${ap} ${am}`.trim() || `Estudiante #${est.estudiante_id}`
      },
    },
    {
      key: "numero_documento",
      header: "Documento",
      render: (est) => est.numero_documento ?? "—",
    },
    {
      key: "estado",
      header: "Estado",
      render: (est) => <StatusBadge status={est.estado} />,
    },
    {
      key: "fecha_ingreso",
      header: "Fecha ingreso",
      render: (est) =>
        est.fecha_ingreso
          ? new Date(est.fecha_ingreso).toLocaleDateString("es-CO")
          : "—",
    },
  ]

  const filtered = data?.data?.filter((est) => {
    if (!search) return true
    const full = `${est.nombres ?? ""} ${est.apellido_paterno ?? ""} ${est.numero_documento ?? ""}`.toLowerCase()
    return full.includes(search.toLowerCase())
  }) ?? []

  async function handleCreate(formData: {
    persona: { nombres: string; [key: string]: unknown }
    estudiante: { estado?: string }
  }) {
    try {
      await estudiantesApi.create(formData as Parameters<typeof estudiantesApi.create>[0])
      toast.success("Estudiante creado exitosamente")
      setModalOpen(false)
      mutate()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al crear estudiante")
    }
  }

  async function handleUpdate(formData: {
    persona: { nombres: string; [key: string]: unknown }
    estudiante: { estado?: string }
  }) {
    if (!editingId) return
    try {
      await estudiantesApi.update(editingId, formData as Parameters<typeof estudiantesApi.update>[1])
      toast.success("Estudiante actualizado exitosamente")
      setModalOpen(false)
      setEditingId(null)
      setEditingData(null)
      mutate()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar")
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Esta seguro de eliminar este estudiante?")) return
    try {
      await estudiantesApi.delete(id)
      toast.success("Estudiante eliminado")
      mutate()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar")
    }
  }

  function openEdit(est: EstudianteConPersona) {
    setEditingId(est.estudiante_id)
    setEditingData(est)
    setModalOpen(true)
  }

  function openCreate() {
    setEditingId(null)
    setEditingData(null)
    setModalOpen(true)
  }

  const totalPages = data?.pagination ? Math.ceil(data.pagination.total / limit) : 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Estudiantes</h1>
          <p className="text-sm text-muted-foreground">
            Gestion de estudiantes registrados
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo estudiante
        </button>
      </div>

      {/* Search */}
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

      {/* Table */}
      <div className="rounded-xl border border-border bg-card">
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          emptyMessage="No hay estudiantes registrados"
          actions={(est) => (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => openEdit(est)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Editar estudiante"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(est.estudiante_id)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                aria-label="Eliminar estudiante"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-3">
            <p className="text-sm text-muted-foreground">
              Pagina {page + 1} de {totalPages} ({data?.pagination.total ?? 0}{" "}
              registros)
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

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingId(null)
          setEditingData(null)
        }}
        title={editingId ? "Editar estudiante" : "Nuevo estudiante"}
      >
        <EstudianteForm
          initialData={
            editingData
              ? {
                  persona: {
                    nombres: editingData.nombres,
                    apellido_paterno: editingData.apellido_paterno,
                    apellido_materno: editingData.apellido_materno,
                    tipo_documento_id: editingData.tipo_documento_id,
                    numero_documento: editingData.numero_documento,
                    fecha_nacimiento: editingData.fecha_nacimiento,
                    genero: editingData.genero as "Masculino" | "Femenino" | "Otro",
                  },
                  estudiante: { estado: editingData.estado },
                }
              : undefined
          }
          onSubmit={editingId ? handleUpdate : handleCreate}
          onCancel={() => {
            setModalOpen(false)
            setEditingId(null)
            setEditingData(null)
          }}
          submitLabel={editingId ? "Actualizar" : "Crear estudiante"}
        />
      </Modal>
    </div>
  )
}
