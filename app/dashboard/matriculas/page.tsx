"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import {
  Plus, Search, Loader2, ClipboardList,
  Lock, CheckCircle2, CalendarClock,
} from "lucide-react"
import { swrFetcher }            from "@/lib/api/fetcher"
import { periodoMatriculaApi, type PeriodoMatricula } from "@/lib/api/services/periodoMatricula"
import { DataTable, type Column } from "@/components/shared/data-table"
import { StatusBadge }           from "@/components/shared/status-badge"
import type { PaginatedApiResponse, MatriculaConRelaciones } from "@/lib/types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFecha(iso?: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function MatriculasPage() {
  const router = useRouter()
  const [page,   setPage]   = useState(0)
  const [search, setSearch] = useState("")

  // ── Período activo ─────────────────────────────────────────────────────────
  const [periodo,        setPeriodo]        = useState<PeriodoMatricula | null>(null)
  const [periodoAbierto, setPeriodoAbierto] = useState(false)
  const [loadingPeriodo, setLoadingPeriodo] = useState(true)

  useEffect(() => {
    periodoMatriculaApi.getActivo()
      .then((res) => {
        setPeriodo(res.data ?? null)
        setPeriodoAbierto(res.abierto)
      })
      .catch(() => setPeriodoAbierto(false))
      .finally(() => setLoadingPeriodo(false))
  }, [])

  const limit = 20
  const { data, isLoading } = useSWR<PaginatedApiResponse<MatriculaConRelaciones>>(
    `/matriculas/getAll?limit=${limit}&offset=${page * limit}`,
    swrFetcher
  )

  const filtered = (data?.data ?? []).filter((m) => {
    if (!search) return true
    return `${m.estudiante_nombre ?? ""} ${m.curso_nombre ?? ""}`.toLowerCase()
      .includes(search.toLowerCase())
  })

  const totalPages = data?.pagination
    ? Math.ceil(data.pagination.total / limit)
    : 0

  const columns: Column<MatriculaConRelaciones>[] = [
    {
      key: "estudiante_nombre",
      header: "Estudiante",
      render: (m) => (
        <span className="font-medium text-foreground">
          {m.estudiante_nombre || `Est. #${m.estudiante_id}`}
        </span>
      ),
    },
    {
      key: "curso_nombre",
      header: "Curso",
      render: (m) => m.curso_nombre || `Curso #${m.curso_id}`,
    },
    {
      key: "jornada_nombre",
      header: "Jornada",
      render: (m) => (m as any).jornada_nombre || "—",
    },
    {
      key: "estado",
      header: "Estado",
      render: (m) => <StatusBadge status={m.estado_actual} />,
    },
    {
      key: "fecha_matricula",
      header: "Fecha",
      render: (m) => formatFecha(m.fecha_matricula as unknown as string),
    },
  ]

  return (
    <div className="flex flex-col gap-6">

      {/* ── Encabezado ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Matrículas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestión de matrículas académicas
          </p>
        </div>

        <PeriodoBanner
          periodo={periodo}
          abierto={periodoAbierto}
          loading={loadingPeriodo}
        />
      </div>

      {/* ── Barra de herramientas ── */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por estudiante o curso..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* El botón solo aparece si el período está activo */}
        {!loadingPeriodo && (
          periodoAbierto ? (
            <button
              onClick={() => router.push("/dashboard/matriculas/nuevo")}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              Nueva matrícula
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground shrink-0">
              <Lock className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Proceso cerrado</span>
            </div>
          )
        )}
      </div>

      {/* ── Tabla ── */}
      <div className="rounded-xl border border-border bg-card">
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          emptyMessage="No hay matrículas registradas"
          actions={(m) => (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => router.push(`/dashboard/matriculas/${m.matricula_id}`)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Ver detalle"
              >
                <ClipboardList className="w-4 h-4" />
              </button>
            </div>
          )}
        />

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-3">
            <p className="text-sm text-muted-foreground">
              Página {page + 1} de {totalPages} ({data?.pagination.total ?? 0} registros)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="h-8 rounded-lg border border-border px-3 text-sm hover:bg-muted disabled:opacity-50 transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="h-8 rounded-lg border border-border px-3 text-sm hover:bg-muted disabled:opacity-50 transition-colors"
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

// ── Banner de período ─────────────────────────────────────────────────────────

function PeriodoBanner({
  periodo,
  abierto,
  loading,
}: {
  periodo:  PeriodoMatricula | null
  abierto:  boolean
  loading:  boolean
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        <span>Verificando período...</span>
      </div>
    )
  }

  if (!abierto || !periodo) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
        <Lock className="h-4 w-4 shrink-0" />
        <span>Proceso de matrícula cerrado</span>
      </div>
    )
  }

  const diasRestantes = Math.ceil(
    (new Date(periodo.fecha_fin).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-2 text-sm">
      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-medium text-success">
          {periodo.descripcion ?? `Matrícula ${periodo.anio}`}
        </span>
        <span className="text-muted-foreground text-xs flex items-center gap-1">
          <CalendarClock className="h-3.5 w-3.5" />
          {diasRestantes > 0
            ? `${diasRestantes} día${diasRestantes !== 1 ? "s" : ""} restante${diasRestantes !== 1 ? "s" : ""}`
            : "Cierra hoy"
          }
        </span>
      </div>
    </div>
  )
}