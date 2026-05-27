"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Loader2, ClipboardList, ChevronDown, ChevronUp, Clock, AlertCircle, ExternalLink } from "lucide-react"
import { matriculasApi } from "@/lib/api/services/matriculas"
import type { MatriculaDeEstudiante, MatriculaHistorialItem } from "@/lib/types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFecha(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

function formatFechaHora(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

const ESTADO_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  activa:     { bg: "bg-success/10",     text: "text-success",             dot: "bg-success",             label: "Activa"     },
  finalizada: { bg: "bg-accent",         text: "text-accent-foreground",   dot: "bg-accent-foreground",   label: "Finalizada" },
  retirada:   { bg: "bg-destructive/10", text: "text-destructive",         dot: "bg-destructive",         label: "Retirada"   },
  inactiva:   { bg: "bg-muted",          text: "text-muted-foreground",    dot: "bg-muted-foreground",    label: "Inactiva"   },
}

function EstadoBadge({ estado }: { estado: string }) {
  const s = ESTADO_STYLES[estado] ?? ESTADO_STYLES.inactiva
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

// ── Sub-componente: fila de historial ─────────────────────────────────────────

function FilaHistorial({ item, esPrimero }: { item: MatriculaHistorialItem; esPrimero: boolean }) {
  const cambios: string[] = []

  if (item.curso_anterior_nombre !== item.curso_nuevo_nombre && item.curso_nuevo_nombre) {
    cambios.push(`Curso: ${item.curso_anterior_nombre ?? "—"} → ${item.curso_nuevo_nombre}`)
  }
  if (item.jornada_anterior_nombre !== item.jornada_nuevo_nombre && item.jornada_nuevo_nombre) {
    cambios.push(`Jornada: ${item.jornada_anterior_nombre ?? "—"} → ${item.jornada_nuevo_nombre}`)
  }
  if (item.estado_anterior !== item.estado_nuevo) {
    cambios.push(`Estado: ${item.estado_anterior} → ${item.estado_nuevo}`)
  }

  if (cambios.length === 0) return null

  return (
    <div className="flex gap-3 text-xs">
      {/* Línea de tiempo */}
      <div className="flex flex-col items-center shrink-0 pt-0.5">
        <div className={`h-2 w-2 rounded-full shrink-0 ${esPrimero ? "bg-primary" : "bg-border"}`} />
        <div className="w-px flex-1 bg-border mt-1" />
      </div>

      <div className="pb-3 min-w-0">
        <p className="text-muted-foreground mb-0.5">{formatFechaHora(item.modificado_en)}</p>
        <ul className="flex flex-col gap-0.5">
          {cambios.map((c, i) => (
            <li key={i} className="text-foreground">{c}</li>
          ))}
        </ul>
        {item.motivo_cambio && (
          <p className="text-muted-foreground mt-1 italic">"{item.motivo_cambio}"</p>
        )}
        {item.modificado_por_nombre && (
          <p className="text-muted-foreground/60 mt-0.5">por {item.modificado_por_nombre}</p>
        )}
      </div>
    </div>
  )
}

// ── Sub-componente: card de matrícula ─────────────────────────────────────────

function MatriculaCard({ matricula }: { matricula: MatriculaDeEstudiante }) {
  const [expandida, setExpandida] = useState(false)

  const tieneHistorial = matricula.historial.length > 0
  const esActiva       = matricula.estado_actual === "activa"
  const esRetirada     = matricula.estado_actual === "retirada"

  return (
    <div className={`rounded-xl border bg-background transition-colors ${
      esActiva ? "border-success/30" : "border-border"
    }`}>

      {/* ── Cabecera de la card ── */}
      <div className="flex items-start gap-4 px-4 py-3.5">

        {/* Ícono de estado */}
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg mt-0.5 ${
          esActiva   ? "bg-success/10 text-success"             :
          esRetirada ? "bg-destructive/10 text-destructive"     :
                       "bg-muted text-muted-foreground"
        }`}>
          <ClipboardList className="h-5 w-5" />
        </div>

        {/* Info principal */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">
              {matricula.curso_nombre}
              {matricula.curso_grupo && (
                <span className="ml-1"> {matricula.curso_grupo}</span>
              )}
            </p>
            <EstadoBadge estado={matricula.estado_actual} />
          </div>

          {/* Metadatos secundarios */}
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
            <span>Jornada: {matricula.jornada_nombre}</span>
            <span>Año {matricula.anio}</span>
            {matricula.periodo_descripcion && (
              <span>{matricula.periodo_descripcion}</span>
            )}
            <span>Matriculado: {formatFecha(matricula.fecha_matricula)}</span>
          </div>

          {/* Retiro */}
          {esRetirada && (
            <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-destructive/5 border border-destructive/15 px-2.5 py-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="text-destructive font-medium">Retirado el {formatFecha(matricula.fecha_retiro)}</span>
                {matricula.motivo_retiro && (
                  <span className="text-muted-foreground"> — {matricula.motivo_retiro}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="shrink-0 flex items-center gap-1.5">
          <Link
            href={`/dashboard/matriculas/${matricula.matricula_id}`}
            className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Ver detalles de la matrícula"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          {tieneHistorial && (
            <button
              onClick={() => setExpandida((v) => !v)}
              className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title={expandida ? "Ocultar historial" : "Ver historial de cambios"}
            >
              <Clock className="h-3.5 w-3.5" />
              {matricula.historial.length}
              {expandida ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}
        </div>
      </div>

      {/* ── Historial expandible ── */}
      {expandida && tieneHistorial && (
        <div className="border-t border-border px-4 pt-3 pb-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
            Historial de cambios
          </p>
          <div>
            {matricula.historial.map((h, i) => (
              <FilaHistorial key={h.historial_id} item={h} esPrimero={i === 0} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface SeccionMatriculasProps {
  estudianteId: number
}

// ── Componente principal ──────────────────────────────────────────────────────

export function SeccionMatriculas({ estudianteId }: SeccionMatriculasProps) {
  const [matriculas, setMatriculas] = useState<MatriculaDeEstudiante[]>([])
  const [cargando,   setCargando]   = useState(true)
  const [error,      setError]      = useState<string | null>(null)

  useEffect(() => {
    matriculasApi
      .getByEstudiante(estudianteId)
      .then((res) => {
        const lista = Array.isArray(res.data) ? res.data : []
        setMatriculas(lista)
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar matrículas"))
      .finally(() => setCargando(false))
  }, [estudianteId])

  if (cargando) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando matrículas…
      </div>
    )
  }

  if (error) {
    return <p className="py-4 text-sm text-destructive">{error}</p>
  }

  if (matriculas.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-8 text-center">
        <ClipboardList className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Este estudiante no tiene matrículas registradas.</p>
      </div>
    )
  }

  const activas   = matriculas.filter((m) => m.estado_actual === "activa")
  const anteriores = matriculas.filter((m) => m.estado_actual !== "activa")

  return (
    <div className="flex flex-col gap-3">

      {/* Matrículas activas primero — sin sub-título si solo hay un grupo */}
      {activas.length > 0 && (
        <div className="flex flex-col gap-2">
          {anteriores.length > 0 && (
            <p className="text-[10px] font-semibold uppercase tracking-widest text-success/70">
              Activa
            </p>
          )}
          {activas.map((m) => (
            <MatriculaCard key={m.matricula_id} matricula={m} />
          ))}
        </div>
      )}

      {/* Historial de años anteriores */}
      {anteriores.length > 0 && (
        <div className="flex flex-col gap-2">
          {activas.length > 0 && (
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Historial
            </p>
          )}
          {anteriores.map((m) => (
            <MatriculaCard key={m.matricula_id} matricula={m} />
          ))}
        </div>
      )}
    </div>
  )
}
