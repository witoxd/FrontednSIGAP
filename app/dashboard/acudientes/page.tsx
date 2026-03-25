"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { toast } from "sonner"
import { Plus, Search, Pencil, Trash2, X, Loader2, View } from "lucide-react"
import { swrFetcher } from "@/lib/api/fetcher"
import { acudientesApi } from "@/lib/api/services/acudientes"
import { DataTable, type Column } from "@/components/shared/data-table"
import type { PaginatedApiResponse, AcudienteWithPersona } from "@/lib/types"

const PAGE_SIZE = 20

// ── Helpers ───────────────────────────────────────────────────────────────────

function nombreCompleto(a: AcudienteWithPersona) {
  return [a.persona.nombres, a.persona.apellido_paterno, a.persona.apellido_materno]
    .filter(Boolean)
    .join(" ")
}

/**
 * Mapea la respuesta de searchIndex al shape AcudienteWithPersona.
 * El endpoint /acudientes/searchIndex devuelve { persona: {...}, acudiente: {...} }.
 */
function mapSearchResult(raw: any): AcudienteWithPersona {
  return {
    persona:  raw.persona  ?? raw,
    acudiente: raw.acudiente ?? raw,
  }
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function AcudientesPage() {
  const router = useRouter()
  const [page, setPage]                 = useState(0)
  const [search, setSearch]             = useState("")
  const [buscando, setBuscando]         = useState(false)
  const [searchResults, setSearchResults] =
    useState<AcudienteWithPersona[] | null>(null)

  // ── Carga paginada normal ─────────────────────────────────────────────────
  const { data, isLoading, mutate } = useSWR<PaginatedApiResponse<AcudienteWithPersona>>(
    `/acudientes/getAll?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`,
    swrFetcher
  )

  // ── Búsqueda con debounce 500 ms ──────────────────────────────────────────
  useEffect(() => {
    const id = setTimeout(async () => {
      if (search.trim().length < 3) {
        setSearchResults(null)
        return
      }

      setBuscando(true)
      try {
        // acudientesApi.searchIndex usa GET /acudientes/searchIndex/:query
        const res = await acudientesApi.searchIndex(search.trim())
        if (res.success && res.data) {
          const lista = Array.isArray(res.data) ? res.data : res.data ? [res.data] : []
          setSearchResults(lista.map(mapSearchResult))
        }
      } catch {
        toast.error("Error al buscar acudientes")
      } finally {
        setBuscando(false)
      }
    }, 500)

    return () => clearTimeout(id)
  }, [search])

  // ── Columnas ──────────────────────────────────────────────────────────────
  const columns: Column<AcudienteWithPersona>[] = [
    {
      key: "nombre",
      header: "Nombre completo",
      render: (a) => nombreCompleto(a),
    },
    {
      key: "numero_documento",
      header: "Documento",
      render: (a) => a.persona.numero_documento ?? "—",
    },
    {
      key: "tipo_documento",
      header: "Tipo doc.",
      render: (a) => a.persona.tipo_documento?.tipo_documento ?? "—",
    },
    {
      key: "parentesco",
      header: "Parentesco",
      render: (a) => (a.acudiente as any).parentesco ?? "—",
    },
  ]

  // ── Eliminar ──────────────────────────────────────────────────────────────
  async function handleDelete(a: AcudienteWithPersona) {
    if (!confirm(`¿Eliminar a ${nombreCompleto(a)}?`)) return
    try {
      await acudientesApi.delete(a.acudiente.acudiente_id)
      toast.success("Acudiente eliminado")
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
          <h1 className="text-2xl font-bold text-foreground">Acudientes</h1>
          <p className="text-sm text-muted-foreground">
            Gestión de acudientes registrados
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/acudientes/nuevo")}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo acudiente
        </button>
      </div>

      {/* Buscador */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar en todos los acudientes (min. 3 caracteres)..."
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
              ? `No se encontraron acudientes que coincidan con "${search}"`
              : "No hay acudientes registrados"
          }
          actions={(a) => (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => router.push(`/dashboard/acudientes/${a.acudiente.acudiente_id}/editar`)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => router.push(`/dashboard/acudientes/detalles/${a.acudiente.acudiente_id}`)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Ver detalles"
              >
                <View className="w-4 h-4" />
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