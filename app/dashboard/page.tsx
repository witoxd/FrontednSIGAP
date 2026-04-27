"use client"

import { useState, useEffect } from "react"
import { useRouter }   from "next/navigation"
import useSWR          from "swr"
import {
  Users, GraduationCap, BookOpen, ClipboardList,
  UserPlus, BookPlus, Search, CalendarClock,
  Lock, CheckCircle2, ArrowRight, Loader2,
} from "lucide-react"

import { useAuth }               from "@/lib/auth/auth-context"
import { swrFetcher }            from "@/lib/api/fetcher"
import { periodoMatriculaApi, type PeriodoMatricula } from "@/lib/api/services/periodoMatricula"
import type {
  PaginatedApiResponse,
  EstudianteWithPersonaDocumento,
  ProfesorWitchPersonaDocumento,
  Curso,
  MatriculaConRelaciones,
} from "@/lib/types"
import { procesosInscripcionApi, type ProcesoInscripcion } from "@/lib/api/services/procesosInscripcion"

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Saludo que cambia según la hora local del navegador.
 * Análogía: como el portero de un hotel que siempre te llama por tu nombre
 * y sabe si es de mañana, tarde o noche.
 */
function useSaludo(nombre: string): { saludo: string; descripcion: string } {
  const hora = new Date().getHours()

  if (hora >= 5 && hora < 12) {
    return {
      saludo:      `Buenos días, ${nombre}`,
      descripcion: "Que tengas un excelente inicio de jornada.",
    }
  }
  if (hora >= 12 && hora < 18) {
    return {
      saludo:      `Buenas tardes, ${nombre}`,
      descripcion: "Espero que tu día esté yendo muy bien.",
    }
  }
  return {
    saludo:      `Buenas noches, ${nombre}`,
    descripcion: "Gracias por tu dedicación al final del día.",
  }
}

function formatFechaLarga(): string {
  return new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    day:     "numeric",
    month:   "long",
    year:    "numeric",
  })
}



function calcularDiasRestantes(fechaFin: string): number {
  return Math.ceil(
    (new Date(fechaFin).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const router     = useRouter()
  const { user }   = useAuth()

  // Extraer el primer nombre del email o del username
  const primerNombre = (() => {
    const fuente = user?.email ?? ""
    // Tomar lo que está antes del @ y capitalizar
    const parte  = fuente.split("@")[0].split(".")[0]
    return parte.charAt(0).toUpperCase() + parte.slice(1)
  })()

  const { saludo, descripcion } = useSaludo(primerNombre)

  // ── Stats ──────────────────────────────────────────────────────────────────
  const { data: estData,  isLoading: loadEst  } =
    useSWR<PaginatedApiResponse<EstudianteWithPersonaDocumento>>(
      "/estudiantes/getAll?limit=1&offset=0", swrFetcher
    )
  const { data: profData, isLoading: loadProf } =
    useSWR<PaginatedApiResponse<ProfesorWitchPersonaDocumento>>(
      "/profesores/getAll?limit=1&offset=0", swrFetcher
    )
  const { data: cursData, isLoading: loadCurs } =
    useSWR<PaginatedApiResponse<Curso>>(
      "/cursos/getAll?limit=1&offset=0", swrFetcher
    )
  const { data: matData,  isLoading: loadMat  } =
    useSWR<PaginatedApiResponse<MatriculaConRelaciones>>(
      "/matriculas/getAll?limit=1&offset=0", swrFetcher
    )

  // ── Período de matrícula ───────────────────────────────────────────────────
  const [periodo,        setPeriodo]        = useState<ProcesoInscripcion | null>(null)
  const [periodoAbierto, setPeriodoAbierto] = useState(false)
  const [loadingPeriodo, setLoadingPeriodo] = useState(true)

  useEffect(() => {
    procesosInscripcionApi.getVigente()
      .then((res) => { setPeriodo(res.data ?? null); setPeriodoAbierto(res.abierto) })
      .catch(() => {})
      .finally(() => setLoadingPeriodo(false))
  }, [])

  const statsLoading = loadEst || loadProf || loadCurs || loadMat

  const stats = [
    {
      label:  "Estudiantes",
      value:  estData?.pagination.total  ?? 0,
      icon:   GraduationCap,
      href:   "/dashboard/estudiantes/nuevo",
      color:  "text-primary bg-primary/10",
    },
    {
      label:  "Profesores",
      value:  profData?.pagination.total ?? 0,
      icon:   Users,
      href:   "/dashboard/profesores/nuevo",
      color:  "text-success bg-success/10",
    },
    {
      label:  "Cursos",
      value:  cursData?.pagination.total ?? 0,
      icon:   BookOpen,
      href:   "/dashboard/cursos/nuevo",
      color:  "text-warning bg-warning/10",
    },
    {
      label:  "Matrículas",
      value:  matData?.pagination.total  ?? 0,
      icon:   ClipboardList,
      href:   "/dashboard/matriculas/nuevo",
      color:  "text-accent-foreground bg-accent",
    },
  ]

  const acciones = [
    {
      label:       "Nuevo estudiante",
      descripcion: "Registrar un estudiante en el sistema",
      icon:        UserPlus,
      href:        "/dashboard/estudiantes/nuevo",
      color:       "border-primary/20 hover:border-primary/50 hover:bg-primary/5",
      iconColor:   "text-primary bg-primary/10",
    },
    {
      label:       "Nueva matrícula",
      descripcion: periodoAbierto
        ? "El proceso de matrícula está abierto"
        : "El proceso de matrícula está cerrado",
      icon:        ClipboardList,
      href:        periodoAbierto ? "/dashboard/matriculas/nuevo" : "/dashboard/matriculas",
      color:       periodoAbierto
        ? "border-success/20 hover:border-success/50 hover:bg-success/5"
        : "border-border opacity-60 cursor-not-allowed",
      iconColor:   periodoAbierto ? "text-success bg-success/10" : "text-muted-foreground bg-muted",
      disabled:    !periodoAbierto,
    },
    {
      label:       "Nuevo curso",
      descripcion: "Crear un nuevo curso académico",
      icon:        BookPlus,
      href:        "/dashboard/cursos",
      color:       "border-warning/20 hover:border-warning/50 hover:bg-warning/5",
      iconColor:   "text-warning bg-warning/10",
    },
    {
      label:       "Buscar estudiante",
      descripcion: "Consultar el perfil de un estudiante",
      icon:        Search,
      href:        "/dashboard/estudiantes",
      color:       "border-border hover:border-border/80 hover:bg-muted/30",
      iconColor:   "text-muted-foreground bg-muted",
    },
  ]

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-8 max-w-5xl">

      {/* ══════════════════════════════════════════════════
          BLOQUE 1 — BIENVENIDA CONTEXTUAL
          El más prominente. Ocupa todo el ancho.
      ══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card px-8 py-10">

        {/* Patrón decorativo de fondo — círculos concéntricos sutiles */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 h-64 w-64 opacity-[0.03] dark:opacity-[0.06]"
          style={{
            background: "radial-gradient(circle at 80% 20%, var(--primary) 0%, transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full border border-primary/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-8 top-8 h-24 w-24 rounded-full border border-primary/10"
        />

        {/* Fecha */}
        <p className="text-sm text-muted-foreground mb-3 capitalize">
          {formatFechaLarga()}
        </p>

        {/* Saludo principal */}
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight">
          {saludo}
        </h1>

        {/* Descripción contextual */}
        <p className="mt-2 text-base text-muted-foreground max-w-md">
          {descripcion}
        </p>

        {/* Línea separadora con el nombre del sistema */}
        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 max-w-[80px] bg-border" />
          <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground/60">
            SIGAP · Sistema de informacion y gestion Almirante Padilla
          </span>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          BLOQUE 2 — BANNER DE PERÍODO (condicional)
          Solo aparece si hay período activo O si cerró
          recientemente (para informar, no para ocultar).
      ══════════════════════════════════════════════════ */}
      {!loadingPeriodo && (
        <section>
          {periodoAbierto && periodo ? (
            <PeriodoBanner periodo={periodo} onIrAMatriculas={() => router.push("/dashboard/matriculas/nuevo")} />
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-5 py-3">
              <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground">
                El proceso de matrícula está cerrado actualmente.
              </p>
            </div>
          )}
        </section>
      )}

      {/* ══════════════════════════════════════════════════
          BLOQUE 3 — ESTADÍSTICAS
          Compactas, no el foco principal.
      ══════════════════════════════════════════════════ */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Resumen del sistema
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <button
                key={stat.label}
                onClick={() => router.push(stat.href)}
                className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-4 text-left hover:border-border/60 hover:bg-muted/30 transition-all"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground tabular-nums leading-none">
                    {statsLoading ? (
                      <span className="inline-block h-6 w-10 animate-pulse rounded bg-muted" />
                    ) : (
                      stat.value.toLocaleString("es-CO")
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          BLOQUE 4 — ACCIONES RÁPIDAS
          El propósito real del dashboard: guiar al admin.
      ══════════════════════════════════════════════════ */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Acciones rápidas
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {acciones.map((accion) => {
            const Icon = accion.icon
            return (
              <button
                key={accion.label}
                disabled={accion.disabled}
                onClick={() => !accion.disabled && router.push(accion.href)}
                className={`group flex items-center gap-4 rounded-xl border bg-card px-5 py-4 text-left transition-all ${accion.color}`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accion.iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{accion.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {accion.descripcion}
                  </p>
                </div>
                {!accion.disabled && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0 transition-transform" />
                )}
              </button>
            )
          })}
        </div>
      </section>

    </div>
  )
}

// ── Banner de período activo ──────────────────────────────────────────────────

function PeriodoBanner({
  periodo,
  onIrAMatriculas,
}: {
  periodo:          ProcesoInscripcion
  onIrAMatriculas:  () => void
}) {
  const diasRestantes = calcularDiasRestantes(periodo.fecha_fin_inscripcion as unknown as string)
  const urgente       = diasRestantes <= 5

  return (
    <div className={`flex items-center gap-4 rounded-xl border px-5 py-4 ${
      urgente
        ? "border-warning/30 bg-warning/5"
        : "border-success/30 bg-success/5"
    }`}>
      {/* Ícono */}
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
        urgente ? "bg-warning/15 text-warning" : "bg-success/15 text-success"
      }`}>
        {urgente
          ? <CalendarClock className="h-5 w-5" />
          : <CheckCircle2  className="h-5 w-5" />
        }
      </div>

      {/* Texto */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${urgente ? "text-warning-foreground" : "text-success"}`}>
          {urgente
            ? `El proceso de matrícula cierra en ${diasRestantes} día${diasRestantes !== 1 ? "s" : ""}`
            : `Proceso de matrícula activo — ${periodo.periodo_descripcion ?? `Año ${periodo.anio}`}`
          }
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Cierra el {formatFechaCorta(periodo.fecha_fin_inscripcion as unknown as string)}
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={onIrAMatriculas}
        className={`flex items-center gap-1.5 shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
          urgente
            ? "bg-warning text-warning-foreground hover:bg-warning/90"
            : "bg-success text-success-foreground hover:bg-success/90"
        }`}
      >
        Matricular
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ── Helper de fecha corta (local al archivo) ──────────────────────────────────
function formatFechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit", month: "long", year: "numeric",
  })
}