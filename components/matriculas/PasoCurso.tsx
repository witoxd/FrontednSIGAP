"use client"

import { ArrowRight, ArrowLeft, BookOpen, Clock } from "lucide-react"
import useSWR from "swr"
import { swrFetcher } from "@/lib/api/fetcher"
import type { PaginatedApiResponse, Curso, Jornada } from "@/lib/types"

// ── Props ─────────────────────────────────────────────────────────────────────

interface PasoCursoProps {
  cursoId:    number | null
  jornadaId:  number | null
  onChange:   (cursoId: number, jornadaId: number) => void
  onSiguiente:() => void
  onAnterior: () => void
}

// ── Componente ────────────────────────────────────────────────────────────────

export function PasoCurso({
  cursoId,
  jornadaId,
  onChange,
  onSiguiente,
  onAnterior,
}: PasoCursoProps) {
  const { data: cursosData }   = useSWR<PaginatedApiResponse<Curso>>(
    "/cursos/getAll?limit=200&offset=0",
    swrFetcher
  )
  const { data: jornadasData } = useSWR<PaginatedApiResponse<Jornada>>(
    "/jornadas/getAll?limit=50&offset=0",
    swrFetcher
  )

  const cursos   = cursosData?.data   ?? []
  const jornadas = jornadasData?.data ?? []

  const cursoSeleccionado   = cursos.find((c) => c.curso_id === cursoId)
  const jornadaSeleccionada = jornadas.find((j) => j.jornada_id === jornadaId)

  const puedeAvanzar = cursoId !== null && jornadaId !== null

  const inputCls =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"

  return (
    <div className="flex flex-col gap-6 max-w-2xl">

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* Curso */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Curso <span className="text-destructive">*</span>
          </label>
          <select
            value={cursoId ?? ""}
            onChange={(e) =>
              onChange(Number(e.target.value), jornadaId ?? 0)
            }
            className={inputCls}
          >
            <option value="">Seleccionar curso...</option>
            {cursos.map((c) => (
              <option key={c.curso_id} value={c.curso_id}>
                {c.nombre} — {c.grado}
              </option>
            ))}
          </select>
          {cursoSeleccionado?.descripcion && (
            <p className="text-xs text-muted-foreground px-1">
              {cursoSeleccionado.descripcion}
            </p>
          )}
        </div>

        {/* Jornada */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Jornada <span className="text-destructive">*</span>
          </label>
          <select
            value={jornadaId ?? ""}
            onChange={(e) =>
              onChange(cursoId ?? 0, Number(e.target.value))
            }
            className={inputCls}
          >
            <option value="">Seleccionar jornada...</option>
            {jornadas.map((j) => (
              <option key={j.jornada_id} value={j.jornada_id}>
                {j.nombre}
              </option>
            ))}
          </select>
          {jornadaSeleccionada && (jornadaSeleccionada.hora_inicio || jornadaSeleccionada.hora_fin) && (
            <p className="text-xs text-muted-foreground px-1">
              {jornadaSeleccionada.hora_inicio} – {jornadaSeleccionada.hora_fin}
            </p>
          )}
        </div>
      </div>

      {/* Resumen de selección */}
      {puedeAvanzar && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Resumen de asignación
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent">
                <BookOpen className="h-4 w-4 text-accent-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Curso</p>
                <p className="text-sm font-medium text-foreground">
                  {cursoSeleccionado?.nombre} — {cursoSeleccionado?.grado}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent">
                <Clock className="h-4 w-4 text-accent-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Jornada</p>
                <p className="text-sm font-medium text-foreground">
                  {jornadaSeleccionada?.nombre}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navegación */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onAnterior}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Anterior
        </button>

        <button
          type="button"
          disabled={!puedeAvanzar}
          onClick={onSiguiente}
          className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          Continuar a documentos
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
