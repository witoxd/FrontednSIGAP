"use client"

import {
  ArrowLeft, Upload, Loader2, AlertCircle,
  User, BookOpen, Clock, CheckCircle2, Tag,
} from "lucide-react"
import useSWR from "swr"
import { swrFetcher } from "@/lib/api/fetcher"
import { MatriculaArchivoSlots, type SlotState } from "@/components/matriculas/MatriculaArchivoSlots"
import type {
  EstudianteWithPersonaDocumento,
  PaginatedApiResponse,
  Curso,
  Jornada,
} from "@/lib/types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function nombreCompleto(est: EstudianteWithPersonaDocumento) {
  return [
    est.persona.nombres,
    est.persona.apellido_paterno,
    est.persona.apellido_materno,
  ].filter(Boolean).join(" ")
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface PasoDocumentosProps {
  slots:       SlotState[]
  onSlotsChange:(slots: SlotState[]) => void
  loadingSlots: boolean
  guardando:    boolean
  progress:     number
  resumen: {
    estudiante:    EstudianteWithPersonaDocumento
    cursoId:       number
    jornadaId:     number
    procesoNombre?: string
  }
  onSubmit:    () => void
  onAnterior:  () => void
}

// ── Componente ────────────────────────────────────────────────────────────────

export function PasoDocumentos({
  slots,
  onSlotsChange,
  loadingSlots,
  guardando,
  progress,
  resumen,
  onSubmit,
  onAnterior,
}: PasoDocumentosProps) {
  // Cargar nombres de curso y jornada para el resumen
  const { data: cursosData }   = useSWR<PaginatedApiResponse<Curso>>(
    "/cursos/getAll?limit=200&offset=0",
    swrFetcher
  )
  const { data: jornadasData } = useSWR<PaginatedApiResponse<Jornada>>(
    "/jornadas/getAll?limit=50&offset=0",
    swrFetcher
  )

  const curso   = cursosData?.data?.find((c) => c.curso_id   === resumen.cursoId)
  const jornada = jornadasData?.data?.find((j) => j.jornada_id === resumen.jornadaId)

  const obligCubiertos = slots.filter((s) => s.tipo.requerido_en && s.file && !s.error).length
  const totalOblig     = slots.filter((s) => s.tipo.requerido_en).length
  const todosObligCubiertos = totalOblig === 0 || obligCubiertos === totalOblig
  const hayArchivos    = slots.some((s) => s.file)
  const hayErrores     = slots.some((s) => s.error)

  const puedeEnviar = !guardando && !loadingSlots && hayArchivos && !hayErrores && todosObligCubiertos

  return (
    <div className="flex flex-col gap-6 max-w-2xl">

      {/* Resumen de la matrícula */}
      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Resumen de la matrícula
        </p>
        <div className={`grid gap-3 ${resumen.procesoNombre ? "grid-cols-1 sm:grid-cols-4" : "grid-cols-1 sm:grid-cols-3"}`}>

          {resumen.procesoNombre && (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <Tag className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Proceso</p>
                <p className="text-sm font-medium text-foreground truncate">
                  {resumen.procesoNombre}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Estudiante</p>
              <p className="text-sm font-medium text-foreground truncate">
                {nombreCompleto(resumen.estudiante)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent">
              <BookOpen className="h-4 w-4 text-accent-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Curso</p>
              <p className="text-sm font-medium text-foreground truncate">
                {curso ? `${curso.nombre} — ${curso.grado}` : `#${resumen.cursoId}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent">
              <Clock className="h-4 w-4 text-accent-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Jornada</p>
              <p className="text-sm font-medium text-foreground truncate">
                {jornada?.nombre ?? `#${resumen.jornadaId}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Slots de documentos */}
      {loadingSlots ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando tipos de documento requeridos...
        </div>
      ) : slots.length === 0 ? (
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            No hay tipos de documento configurados para matrículas.
            Contacta al administrador del sistema.
          </p>
        </div>
      ) : (
        <MatriculaArchivoSlots
          slots={slots}
          onChange={onSlotsChange}
          disabled={guardando}
        />
      )}

      {/* Barra de progreso de upload */}
      {guardando && progress > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Enviando matrícula y documentos...</span>
            <span className="tabular-nums">{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Indicador de completitud */}
      {!loadingSlots && slots.length > 0 && !guardando && (
        <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
          puedeEnviar
            ? "bg-success/10 border border-success/20 text-success"
            : "bg-muted/50 border border-border text-muted-foreground"
        }`}>
          {puedeEnviar
            ? <CheckCircle2 className="h-4 w-4 shrink-0" />
            : <AlertCircle  className="h-4 w-4 shrink-0" />
          }
          {puedeEnviar
            ? "Todo listo. Puedes registrar la matrícula."
            : totalOblig > 0
              ? `Faltan ${totalOblig - obligCubiertos} documento${totalOblig - obligCubiertos !== 1 ? "s" : ""} obligatorio${totalOblig - obligCubiertos !== 1 ? "s" : ""}`
              : "Adjunta al menos un documento para continuar"
          }
        </div>
      )}

      {/* Navegación */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onAnterior}
          disabled={guardando}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Anterior
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={!puedeEnviar}
          className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {guardando ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Procesando matrícula...</>
          ) : (
            <><Upload className="h-4 w-4" /> Registrar matrícula</>
          )}
        </button>
      </div>
    </div>
  )
}
