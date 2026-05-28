"use client"

import { useRouter } from "next/navigation"
import { GraduationCap, Star, Clock, ArrowRight, BookOpen } from "lucide-react"

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface DirectorPeriodo {
  director_id:      number
  profesor_id:      number
  nombres:          string
  apellido_paterno: string
  apellido_materno?: string | null
}

export interface AsignacionPeriodo {
  asignacion_id:    number
  materia:          string
  horas_semanales?: number | null
  profesor_id:      number
  nombres:          string
  apellido_paterno: string
  apellido_materno?: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function nombreCompleto(d: { nombres: string; apellido_paterno: string; apellido_materno?: string | null }) {
  return [d.nombres, d.apellido_paterno, d.apellido_materno].filter(Boolean).join(" ")
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface SeccionDocentesProps {
  director:     DirectorPeriodo | null
  asignaciones: AsignacionPeriodo[]
  cargando:     boolean
}

// ── Componente ────────────────────────────────────────────────────────────────

export function SeccionDocentes({ director, asignaciones, cargando }: SeccionDocentesProps) {
  const router = useRouter()

  // Agrupar asignaciones por profesor
  const porProfesor = asignaciones.reduce<
    Record<number, {
      profesor_id:      number
      nombres:          string
      apellido_paterno: string
      apellido_materno?: string | null
      materias: { materia: string; horas: number | null }[]
    }>
  >((acc, a) => {
    if (!acc[a.profesor_id]) {
      acc[a.profesor_id] = {
        profesor_id:      a.profesor_id,
        nombres:          a.nombres,
        apellido_paterno: a.apellido_paterno,
        apellido_materno: a.apellido_materno,
        materias:         [],
      }
    }
    acc[a.profesor_id].materias.push({ materia: a.materia, horas: a.horas_semanales ?? null })
    return acc
  }, {})

  const profesores = Object.values(porProfesor)

  if (cargando) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        Cargando docentes…
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Director de grupo */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Director de grupo
        </p>
        {director ? (
          <div className="group flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Star className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{nombreCompleto(director)}</p>
            </div>
            <button
              onClick={() => router.push(`/dashboard/profesores/${director.profesor_id}/detalles`)}
              className="shrink-0 flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary hover:border-primary/40 transition-all"
            >
              Perfil <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-border px-4 py-3">
            <Star className="h-4 w-4 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Sin director asignado para este período</p>
          </div>
        )}
      </div>

      {/* Docentes */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Docentes asignados ({profesores.length})
        </p>
        {profesores.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-border px-4 py-3">
            <GraduationCap className="h-4 w-4 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Sin docentes asignados para este período</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {profesores.map((prof) => (
              <div
                key={prof.profesor_id}
                className="group flex items-start gap-3 rounded-lg border border-border bg-background px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground mt-0.5">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{nombreCompleto(prof)}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {prof.materias.map((m, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        <BookOpen className="h-2.5 w-2.5" />
                        {m.materia}
                        {m.horas != null && (
                          <span className="flex items-center gap-0.5 text-muted-foreground/60">
                            <Clock className="h-2.5 w-2.5" />
                            {m.horas}h
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/dashboard/profesores/${prof.profesor_id}/detalles`)}
                  className="shrink-0 flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary hover:border-primary/40 transition-all mt-0.5"
                >
                  Perfil <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
