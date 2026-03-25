"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { toast } from "sonner"
import { Plus, Search, Pencil, Trash2, X, Loader2 } from "lucide-react"
import { swrFetcher } from "@/lib/api/fetcher"
import { profesoresApi } from "@/lib/api/services/profesores"
import { DataTable, type Column } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import type { PaginatedApiResponse, ProfesorWitchPersonaDocumento } from "@/lib/types"

const PAGE_SIZE = 20

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Mapea la respuesta de searchIndex al shape ProfesorWitchPersonaDocumento.
 * searchIndex devuelve { persona: {...}, profesor: {...} } — mismo shape que getAll.
 */
function mapSearchResult(raw: any): ProfesorWitchPersonaDocumento {
  return {
    persona:  raw.persona  ?? raw,
    profesor: raw.profesor ?? raw,
  }
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function ProfesoresPage() {
  const router = useRouter()
  const [page, setPage]                 = useState(0)
  const [search, setSearch]             = useState("")
  const [buscando, setBuscando]         = useState(false)
  const [searchResults, setSearchResults] =
    useState<ProfesorWitchPersonaDocumento[] | null>(null)

  // ── Carga paginada normal ─────────────────────────────────────────────────
  const { data, isLoading, mutate } = useSWR<PaginatedApiResponse<ProfesorWitchPersonaDocumento>>(
    `/profesores/getAll?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`,
    swrFetcher
  )

  // ── Búsqueda con debounce 500 ms (igual que estudiantes/page.tsx) ─────────
  /**
   * Analogía: es como el buscador de un catálogo de biblioteca —
   * no vas al estante después de cada letra que escribes,
   * sino cuando terminas de escribir la palabra.
   */
  useEffect(() => {
    const id = setTimeout(async () => {
      if (search.trim().length < 3) {
        setSearchResults(null)
        return
      }

      setBuscando(true)
      try {
        const res = await profesoresApi.searchIndex(search.trim())
        if (res.success && res.data) {
          const lista = Array.isArray(res.data) ? res.data : res.data ? [res.data] : []
          setSearchResults(lista.map(mapSearchResult))
        }
      } catch {
        toast.error("Error al buscar profesores")
      } finally {
        setBuscando(false)
      }
    }, 500)

    return () => clearTimeout(id)
  }, [search])

  // ── Columnas ──────────────────────────────────────────────────────────────
  const columns: Column<ProfesorWitchPersonaDocumento>[] = [
    {
      key: "profesor_id",
      header: "ID",
      render: (p) => p.profesor.profesor_id,
    },
    {
      key: "nombres",
      header: "Nombre completo",
      render: (p) =>
        `${p.persona.nombres ?? ""} ${p.persona.apellido_paterno ?? ""} ${p.persona.apellido_materno ?? ""}`.trim() ||
        `Profesor #${p.profesor.profesor_id}`,
    },
    {
      key: "numero_documento",
      header: "Documento",
      render: (p) => p.persona.numero_documento ?? "—",
    },
    {
      key: "fecha_contratacion",
      header: "Contratación",
      render: (p) =>
        p.profesor.fecha_contratacion
          ? new Date(p.profesor.fecha_contratacion).toLocaleDateString("es-CO")
          : "—",
    },
    {
      key: "estado",
      header: "Estado",
      render: (p) => <StatusBadge status={p.profesor.estado} />,
    },
  ]

  // ── Eliminar ──────────────────────────────────────────────────────────────
  async function handleDelete(id: number) {
    if (!confirm("¿Seguro de eliminar este profesor?")) return
    try {
      await profesoresApi.delete(id)
      toast.success("Profesor eliminado")
      mutate()
      if (searchResults !== null) clearSearch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar")
    }
  }

  function clearSearch() {
    setSearch("")
    setSearchResults(null)
    setPage(0)
  }

  // ── Datos a mostrar ───────────────────────────────────────────────────────
  const displayData  = searchResults !== null ? searchResults : data?.data ?? []
  const isSearchMode = searchResults !== null
  const totalPages   = data?.pagination
    ? Math.ceil(data.pagination.total / PAGE_SIZE)
    : 0

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">

      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profesores</h1>
          <p className="text-sm text-muted-foreground">
            Gestión de profesores registrados
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/profesores/nuevo")}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo profesor
        </button>
      </div>

      {/* Buscador */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar en todos los profesores (min. 3 caracteres)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full rounded-lg border border-input bg-card pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {search && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Estado: buscando en backend */}
      {buscando && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Buscando en toda la base de datos...</span>
        </div>
      )}

      {/* Resultado de búsqueda */}
      {isSearchMode && !buscando && (
        <div className="flex items-center justify-between rounded-lg bg-accent/50 px-4 py-2 text-sm">
          <span className="text-accent-foreground">
            Se encontraron <strong>{displayData.length}</strong> resultado(s) para "{search}"
          </span>
          <button
            onClick={clearSearch}
            className="text-accent-foreground hover:text-foreground font-medium transition-colors"
          >
            Ver todos
          </button>
        </div>
      )}

      {/* Tabla */}
      <div className="rounded-xl border border-border bg-card">
        <DataTable
          columns={columns}
          data={displayData}
          isLoading={isLoading && !isSearchMode}
          emptyMessage={
            isSearchMode
              ? `No se encontraron profesores que coincidan con "${search}"`
              : "No hay profesores registrados"
          }
          actions={(p) => (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => router.push(`/dashboard/profesores/${p.profesor.profesor_id}/editar`)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Editar profesor"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(p.profesor.profesor_id!)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                aria-label="Eliminar profesor"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        />

        {/* Paginación — solo en modo normal */}
        {!isSearchMode && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-3">
            <p className="text-sm text-muted-foreground">
              Página {page + 1} de {totalPages} ({data?.pagination.total ?? 0} registros)
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