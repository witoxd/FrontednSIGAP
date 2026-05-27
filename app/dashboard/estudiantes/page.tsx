"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { toast } from "sonner"
import { Plus, Search, X, Loader2, Eye, Pencil } from "lucide-react"
import { swrFetcher } from "@/lib/api/fetcher"
import { estudiantesApi } from "@/lib/api/services/estudiantes"
import type { PaginatedApiResponse, EstudianteWithPersonaDocumento } from "@/lib/types"

const DEBOUNCE_MS = 400
const MIN_CHARS   = 2

type FiltroEstado = "todos" | "activo" | "inactivo" | "egresado" | "suspendido"

const FILTROS: { valor: FiltroEstado; label: string }[] = [
  { valor: "todos",      label: "Todos"      },
  { valor: "activo",     label: "Activo"     },
  { valor: "inactivo",   label: "Inactivo"   },
  { valor: "egresado",   label: "Egresado"   },
  { valor: "suspendido", label: "Suspendido" },
]

// Clases Tailwind por estado — funcionan en light y dark
function estadoClasses(estado: string): { dot: string; badge: string; text: string; avatarBg: string; bar: string } {
  switch (estado) {
    case "activo":
      return {
        dot:      "bg-blue-500",
        badge:    "bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400",
        text:     "text-blue-600 dark:text-blue-400",
        avatarBg: "bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400",
        bar:      "bg-blue-500",
      }
    case "egresado":
      return {
        dot:      "bg-amber-500",
        badge:    "bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400",
        text:     "text-amber-600 dark:text-amber-400",
        avatarBg: "bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400",
        bar:      "bg-amber-500",
      }
    case "suspendido":
      return {
        dot:      "bg-orange-400",
        badge:    "bg-orange-400/10 border border-orange-400/20 text-orange-600 dark:text-orange-400",
        text:     "text-orange-600 dark:text-orange-400",
        avatarBg: "bg-orange-400/10 border border-orange-400/20 text-orange-600 dark:text-orange-400",
        bar:      "bg-orange-400",
      }
    default: // inactivo
      return {
        dot:      "bg-muted-foreground/50",
        badge:    "bg-muted border border-border text-muted-foreground",
        text:     "text-muted-foreground",
        avatarBg: "bg-muted border border-border text-muted-foreground",
        bar:      "bg-muted-foreground/30",
      }
  }
}

function estadoLabel(estado: string): string {
  return { activo: "Activo", inactivo: "Inactivo", egresado: "Egresado", suspendido: "Suspendido" }[estado] ?? estado
}

export default function EstudiantesPage() {
  const router = useRouter()
  const [page, setPage]               = useState(0)
  const [search, setSearch]           = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<EstudianteWithPersonaDocumento[] | null>(null)
  const [filtro, setFiltro]           = useState<FiltroEstado>("todos")
  const [hovRow, setHovRow]           = useState<number | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const limit = 20

  const { data, isLoading } = useSWR<PaginatedApiResponse<EstudianteWithPersonaDocumento>>(
    `/estudiantes/getAll?limit=${limit}&offset=${page * limit}`,
    swrFetcher
  )

  const buscar = useCallback(async (texto: string) => {
    const q = texto.trim()
    if (q.length < MIN_CHARS) { setSearchResults(null); return }
    setIsSearching(true)
    try {
      const res = await estudiantesApi.searchIndex(q)
      const lista = Array.isArray(res.data) ? res.data : res.data ? [res.data] : []
      setSearchResults(lista)
    } catch {
      toast.error("Error al buscar estudiantes")
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  function handleSearchChange(valor: string) {
    setSearch(valor)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (valor.trim().length < MIN_CHARS) { setSearchResults(null); return }
    debounceRef.current = setTimeout(() => buscar(valor), DEBOUNCE_MS)
  }

  function clearSearch() {
    setSearch("")
    setSearchResults(null)
    setPage(0)
  }

  useEffect(
    () => () => { if (debounceRef.current) clearTimeout(debounceRef.current) },
    []
  )

  const isSearchMode = searchResults !== null
  const base = isSearchMode ? searchResults : data?.data ?? []

  const displayData = filtro === "todos"
    ? base
    : base.filter((est) => {
        const estado = (est.estudiante as any).estado_efectivo ?? est.estudiante.estado
        return estado === filtro
      })

  const totalPages = data?.pagination ? Math.ceil(data.pagination.total / limit) : 0

  return (
    <div className="flex flex-col gap-0">
      <div className="rounded-xl border border-border bg-card overflow-hidden">

        {/* ── Header ── */}
        <div className="flex flex-col gap-4 px-6 py-5 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground">Estudiantes</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Gestión de estudiantes registrados</p>
            </div>
            <button
              onClick={() => router.push("/dashboard/estudiantes/nuevo")}
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Nuevo estudiante
            </button>
          </div>

          {/* Buscador + chips */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative w-72">
              {isSearching
                ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground animate-spin" />
                : <Search  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              }
              <input
                type="text"
                placeholder="Buscar por nombre o documento…"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {search && (
                <button onClick={clearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="w-px h-5 bg-border shrink-0" />

            {/* Chips de filtro */}
            <div className="flex gap-1.5 flex-wrap">
              {FILTROS.map((f) => (
                <button
                  key={f.valor}
                  onClick={() => setFiltro(f.valor)}
                  className={`h-7 px-3 rounded-full text-[11px] font-medium transition-colors ${
                    filtro === f.valor
                      ? "bg-primary/15 border border-primary/30 text-primary"
                      : "border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Banner búsqueda ── */}
        {isSearchMode && !isSearching && (
          <div className="flex items-center justify-between px-6 py-2 bg-accent/40 border-b border-border text-xs">
            <span className="text-muted-foreground">
              <strong className="text-foreground">{displayData.length}</strong> resultado(s) para &quot;{search}&quot;
            </span>
            <button onClick={clearSearch} className="text-primary font-semibold hover:underline">
              Ver todos
            </button>
          </div>
        )}

        {/* ── Cabecera columnas ── */}
        <div className="grid bg-muted/40 border-b border-border px-6 py-2 gap-0"
          style={{ gridTemplateColumns: "4px 44px 1fr 150px 110px 96px 72px" }}
        >
          {["", "#", "NOMBRE COMPLETO", "DOCUMENTO", "ESTADO", "INGRESO", ""].map((h, i) => (
            <span key={i} className="text-[9px] font-bold tracking-widest text-muted-foreground/50 uppercase"
              style={{ textAlign: i === 1 ? "center" : undefined }}
            >
              {h}
            </span>
          ))}
        </div>

        {/* ── Contenido ── */}
        {(isLoading && !isSearchMode) ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : displayData.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <p className="text-sm text-muted-foreground">
              {isSearchMode
                ? `Sin resultados para "${search}"`
                : filtro !== "todos"
                ? "No hay estudiantes con ese estado"
                : "No hay estudiantes registrados"}
            </p>
            {filtro !== "todos" && (
              <button onClick={() => setFiltro("todos")} className="text-xs text-primary hover:underline">
                Quitar filtro
              </button>
            )}
          </div>
        ) : (
          displayData.map((est, i) => {
            const estadoRaw = (est.estudiante as any).estado_efectivo ?? est.estudiante.estado
            const cls       = estadoClasses(estadoRaw)
            const lbl       = estadoLabel(estadoRaw)
            const isHov     = hovRow === est.estudiante.estudiante_id
            const inicial   = (est.persona.apellido_paterno ?? est.persona.nombres ?? "?").charAt(0).toUpperCase()
            const fechaIngreso = est.estudiante.fecha_ingreso
              ? new Date(est.estudiante.fecha_ingreso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })
              : "—"

            return (
              <div
                key={est.estudiante.estudiante_id}
                onMouseEnter={() => setHovRow(est.estudiante.estudiante_id ?? null)}
                onMouseLeave={() => setHovRow(null)}
                className={`grid items-center px-6 border-b border-border/60 transition-colors cursor-pointer ${
                  isHov ? "bg-muted/60" : i % 2 === 0 ? "bg-transparent" : "bg-muted/20"
                }`}
                style={{ gridTemplateColumns: "4px 44px 1fr 150px 110px 96px 72px", height: 46 }}
              >
                {/* Barra lateral de color */}
                <div className={`w-1 h-7 rounded-sm transition-opacity ${cls.bar} ${isHov ? "opacity-100" : "opacity-40"}`} />

                {/* Número */}
                <span className="text-[10px] text-muted-foreground/40 font-mono text-center">
                  {String(page * limit + i + 1).padStart(2, "0")}
                </span>

                {/* Avatar + nombre */}
                <div className="flex items-center gap-2.5 pl-2 min-w-0">
                  <div className={`w-7 h-7 rounded-md shrink-0 flex items-center justify-center text-xs font-bold ${cls.avatarBg}`}>
                    {inicial}
                  </div>
                  <span className="text-sm text-muted-foreground truncate transition-colors" style={{ color: isHov ? "var(--foreground)" : undefined }}>
                    <strong className="font-semibold text-foreground">{est.persona.apellido_paterno ?? ""}</strong>
                    {est.persona.apellido_materno ? ` ${est.persona.apellido_materno}` : ""}
                    {", "}
                    {est.persona.nombres ?? ""}
                  </span>
                </div>

                {/* Documento */}
                <span className="text-[11px] text-muted-foreground font-mono tracking-wide">
                  {est.persona.tipo_documento?.nombre_documento ?? "CC"} {est.persona.numero_documento ?? "—"}
                </span>

                {/* Estado */}
                <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold w-fit ${cls.badge}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${cls.dot}`} />
                  {lbl}
                </div>

                {/* Ingreso */}
                <span className="text-[11px] text-muted-foreground/60">{fechaIngreso}</span>

                {/* Acciones */}
                <div className={`flex gap-1.5 justify-end transition-opacity ${isHov ? "opacity-100" : "opacity-0"}`}>
                  <button
                    onClick={() => router.push(`/dashboard/estudiantes/${est.estudiante.estudiante_id}/detalles`)}
                    className="w-7 h-7 rounded-md flex items-center justify-center bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors"
                    aria-label="Ver perfil"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => router.push(`/dashboard/estudiantes/${est.estudiante.estudiante_id}/editar`)}
                    className="w-7 h-7 rounded-md flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
                    aria-label="Editar"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )
          })
        )}

        {/* ── Paginación ── */}
        {!isSearchMode && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Página {page + 1} de {totalPages} · {data?.pagination.total ?? 0} registros
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="h-7 px-3 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="h-7 px-3 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
