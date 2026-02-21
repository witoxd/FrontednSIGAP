"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import { swrFetcher } from "@/lib/api/fetcher"
import { profesoresApi } from "@/lib/api/services/profesores"
import { DataTable, type Column } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import type { PaginatedApiResponse, ProfesorConPersona } from "@/lib/types"

export default function ProfesoresPage() {
  const router = useRouter()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState("")
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

  function handleCreate() {
    router.push("/dashboard/profesores/nuevo")
  }

  function handleEdit(p: ProfesorConPersona) {
    router.push(`/dashboard/profesores/${p.profesor_id}/editar`)
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
          onClick={handleCreate}
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
                onClick={() => handleEdit(p)}
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
    </div>
  )
}
