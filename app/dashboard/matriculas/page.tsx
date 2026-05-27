"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import {
  Plus, Search, Loader2, Lock, CheckCircle2,
  CalendarClock, Tag, Users, BookOpen,
  TrendingUp, AlertCircle, X, UserSearch,
  ClipboardList,
} from "lucide-react"
import { swrFetcher }            from "@/lib/api/fetcher"
import { periodoMatriculaApi, type PeriodoMatricula } from "@/lib/api/services/periodoMatricula"
import { procesosInscripcionApi, type ProcesoInscripcion } from "@/lib/api/services/procesosInscripcion"
import { estudiantesApi }        from "@/lib/api/services/estudiantes"
import { SeccionMatriculas }     from "@/components/matriculas/SeccionMatriculas"
import type { PaginatedApiResponse, MatriculaConRelaciones, EstudianteWithPersonaDocumento } from "@/lib/types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFecha(iso?: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, color, sublabel,
}: {
  label:     string
  value:     number | string
  icon:      React.ElementType
  color:     "default" | "success" | "warning" | "destructive"
  sublabel?: string
}) {
  const colors = {
    default:     { bg: "bg-muted/40",          icon: "text-muted-foreground",  val: "text-foreground"    },
    success:     { bg: "bg-success/8",          icon: "text-success",           val: "text-success"       },
    warning:     { bg: "bg-warning/8",          icon: "text-warning",           val: "text-warning"       },
    destructive: { bg: "bg-destructive/8",      icon: "text-destructive",       val: "text-destructive"   },
  }
  const c = colors[color]

  return (
    <div className={`rounded-xl border border-border p-4 flex items-start gap-3 ${c.bg}`}>
      <div className={`mt-0.5 shrink-0 ${c.icon}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className={`text-2xl font-bold leading-none ${c.val}`}>{value}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-tight">{label}</p>
        {sublabel && (
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sublabel}</p>
        )}
      </div>
    </div>
  )
}

// ── Banner de período ─────────────────────────────────────────────────────────

function PeriodoBanner({
  periodo, proceso, abierto, loading,
}: {
  periodo:  PeriodoMatricula | null
  proceso:  ProcesoInscripcion | null
  abierto:  boolean
  loading:  boolean
}) {
  if (loading) return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin shrink-0" />
      <span>Verificando período...</span>
    </div>
  )

  if (!abierto || !periodo) return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
      <Lock className="h-4 w-4 shrink-0" />
      <span>Proceso de matrícula cerrado</span>
    </div>
  )

  const refFin = proceso?.fecha_fin_inscripcion ?? periodo.fecha_fin
  const diasRestantes = Math.ceil(
    (new Date(refFin).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-2 text-sm">
      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-medium text-success">
          {periodo.descripcion ?? `Matrícula ${periodo.anio}`}
        </span>
        {proceso && (
          <span className="flex items-center gap-1 text-xs text-primary/80">
            <Tag className="h-3 w-3" />
            {proceso.nombre}
          </span>
        )}
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

// ── Buscador de estudiante ────────────────────────────────────────────────────

function BuscadorEstudiante({
  onSelect,
}: {
  onSelect: (e: EstudianteWithPersonaDocumento) => void
}) {
  const [query,       setQuery]       = useState("")
  const [resultados,  setResultados]  = useState<EstudianteWithPersonaDocumento[]>([])
  const [buscando,    setBuscando]    = useState(false)
  const [abierto,     setAbierto]     = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setAbierto(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function handleChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value.trim().length < 2) {
      setResultados([])
      setAbierto(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setBuscando(true)
      try {
        const res = await estudiantesApi.searchIndex(value.trim())
        setResultados(res.data ?? [])
        setAbierto(true)
      } catch {
        setResultados([])
      } finally {
        setBuscando(false)
      }
    }, 300)
  }

  function seleccionar(est: EstudianteWithPersonaDocumento) {
    onSelect(est)
    setQuery(`${est.persona.nombres ?? ""} ${est.persona.apellido_paterno ?? ""}`.trim())
    setAbierto(false)
    setResultados([])
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Nombre o número de documento..."
          className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {buscando && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {query && !buscando && (
          <button
            onClick={() => { setQuery(""); setResultados([]); setAbierto(false) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown resultados */}
      {abierto && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card shadow-xl overflow-hidden">
          {resultados.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              Sin resultados para "{query}"
            </p>
          ) : (
            <ul className="max-h-64 overflow-y-auto divide-y divide-border">
              {resultados.map((est) => {
                const nombre = `${est.persona.nombres ?? ""} ${est.persona.apellido_paterno ?? ""} ${est.persona.apellido_materno ?? ""}`.trim()
                const doc    = est.persona?.numero_documento ?? ""
                return (
                  <li key={est.estudiante.estudiante_id}>
                    <button
                      onClick={() => seleccionar(est)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted transition-colors"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{nombre}</p>
                        <p className="text-xs text-muted-foreground">{doc}</p>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function MatriculasPage() {
  const router = useRouter()

  const [periodo,        setPeriodo]        = useState<PeriodoMatricula | null>(null)
  const [proceso,        setProceso]        = useState<ProcesoInscripcion | null>(null)
  const [periodoAbierto, setPeriodoAbierto] = useState(false)
  const [procesoAbierto, setProcesoAbierto] = useState(false)
  const [loadingPeriodo, setLoadingPeriodo] = useState(true)

  const [estudianteSeleccionado, setEstudianteSeleccionado] =
    useState<EstudianteWithPersonaDocumento | null>(null)

  useEffect(() => {
    Promise.all([
      periodoMatriculaApi.getActivo(),
      procesosInscripcionApi.getVigente(),
    ])
      .then(([periodoRes, procesoRes]) => {
        setPeriodo(periodoRes.data ?? null)
        setPeriodoAbierto(periodoRes.abierto)
        setProceso(procesoRes.data ?? null)
        setProcesoAbierto(procesoRes.abierto)
      })
      .catch(() => { setPeriodoAbierto(false); setProcesoAbierto(false) })
      .finally(() => setLoadingPeriodo(false))
  }, [])

  // Estadísticas — cargamos la primera página grande para tener números reales
  const { data: statsData } = useSWR<PaginatedApiResponse<MatriculaConRelaciones>>(
    `/matriculas/getAll?limit=1000&offset=0`,
    swrFetcher
  )

  const matriculas = statsData?.data ?? []
  const total      = statsData?.pagination?.total ?? matriculas.length

  const porEstado = matriculas.reduce<Record<string, number>>((acc, m) => {
    const e = m.estado_actual ?? "inactiva"
    acc[e] = (acc[e] ?? 0) + 1
    return acc
  }, {})

  const nombreEstudiante = estudianteSeleccionado
    ? `${estudianteSeleccionado.persona.nombres ?? ""} ${estudianteSeleccionado.persona.apellido_paterno ?? ""}`.trim()
    : null

  const procesoActivo = periodoAbierto && procesoAbierto

  return (
    <div className="flex flex-col gap-6">

      {/* ── Encabezado ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Matrículas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Resumen del período activo y consulta por estudiante
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <PeriodoBanner
            periodo={periodo}
            proceso={proceso}
            abierto={procesoActivo}
            loading={loadingPeriodo}
          />
          {!loadingPeriodo && (
            procesoActivo ? (
              <button
                onClick={() => router.push("/dashboard/matriculas/nuevo")}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                Nueva matrícula
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground shrink-0">
                <Lock className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Proceso cerrado</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* ── Layout de dos columnas ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">

        {/* ════ PANEL DERECHO — Buscar estudiante ════ */}
        {/* (en móvil va primero con order) */}
        <div className="order-first lg:order-last flex flex-col gap-4">

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <UserSearch className="h-5 w-5 text-primary shrink-0" />
              <h2 className="text-sm font-semibold text-foreground">
                Consultar matrículas de un estudiante
              </h2>
            </div>

            <BuscadorEstudiante onSelect={setEstudianteSeleccionado} />

            <div className="mt-4">
              {!estudianteSeleccionado ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-10 text-center">
                  <ClipboardList className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground/60 max-w-[200px]">
                    Busca un estudiante para ver su historial de matrículas
                  </p>
                </div>
              ) : (
                <div>
                  {/* Header del estudiante seleccionado */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {nombreEstudiante?.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-sm font-medium text-foreground">{nombreEstudiante}</p>
                    </div>
                    <button
                      onClick={() => setEstudianteSeleccionado(null)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <SeccionMatriculas estudianteId={estudianteSeleccionado.estudiante.estudiante_id!} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ════ PANEL IZQUIERDO — Estadísticas del período ════ */}
        <div className="flex flex-col gap-4">

          {/* Período activo info */}
          {periodo && (
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-3">
                Período activo
              </p>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-bold text-foreground">{periodo.anio}</span>
                {periodo.descripcion && (
                  <span className="text-sm text-muted-foreground">{periodo.descripcion}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatFecha(periodo.fecha_inicio)} — {formatFecha(periodo.fecha_fin)}
              </p>
            </div>
          )}

          {/* Tarjetas de estadísticas */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Total matrículas"
              value={!statsData ? "—" : total}
              icon={BookOpen}
              color="default"
            />
            <StatCard
              label="Activas"
              value={!statsData ? "—" : (porEstado["activa"] ?? 0)}
              icon={TrendingUp}
              color="success"
              sublabel={total > 0 ? `${Math.round(((porEstado["activa"] ?? 0) / total) * 100)}% del total` : undefined}
            />
            <StatCard
              label="Retiradas"
              value={!statsData ? "—" : (porEstado["retirada"] ?? 0)}
              icon={AlertCircle}
              color="destructive"
            />
            <StatCard
              label="Finalizadas"
              value={!statsData ? "—" : (porEstado["finalizada"] ?? 0)}
              icon={Users}
              color="warning"
            />
          </div>

          {/* Desglose por estado si hay más */}
          {statsData && porEstado["inactiva"] != null && porEstado["inactiva"] > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-3">
                Otros estados
              </p>
              <div className="flex flex-col gap-2">
                {Object.entries(porEstado)
                  .filter(([k]) => !["activa","retirada","finalizada"].includes(k))
                  .map(([estado, count]) => (
                    <div key={estado} className="flex items-center justify-between text-sm">
                      <span className="capitalize text-muted-foreground">{estado}</span>
                      <span className="font-medium text-foreground tabular-nums">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Nota si no hay datos */}
          {!statsData && (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground">Cargando estadísticas...</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
