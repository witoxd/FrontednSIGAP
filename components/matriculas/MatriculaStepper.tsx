"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { periodoMatriculaApi, type PeriodoMatricula } from "@/lib/api/services/periodoMatricula"
import { procesosInscripcionApi, type ProcesoInscripcion } from "@/lib/api/services/procesosInscripcion"
import { matriculasApi }  from "@/lib/api/services/matriculas"
import {
  slotsToApiInput,
  validateSlots,
  useMatriculaSlots,
  type SlotState,
} from "@/components/matriculas/MatriculaArchivoSlots"
import type { EstudianteWithPersonaDocumento } from "@/lib/types"

import { PasoPeriodo }     from "./PasoPeriodo"
import { PasoEstudiante }  from "./PasoEstudiante"
import { PasoCurso }       from "./PasoCurso"
import { PasoDocumentos }  from "./PasoDocumentos"

// ── Tipos ─────────────────────────────────────────────────────────────────────

type PasoNum = 0 | 1 | 2 | 3

const PASOS: { label: string; descripcion: string }[] = [
  { label: "Período",     descripcion: "Verificación del período activo"    },
  { label: "Estudiante",  descripcion: "Búsqueda y selección del estudiante" },
  { label: "Curso",       descripcion: "Asignación de curso y jornada"       },
  { label: "Documentos",  descripcion: "Carga de documentos requeridos"      },
]

// Estado compartido entre pasos — análogo al "expediente" en construcción
export interface MatriculaState {
  periodo:     PeriodoMatricula | null
  proceso:     ProcesoInscripcion | null
  estudiante:  EstudianteWithPersonaDocumento | null
  cursoId:     number | null
  jornadaId:   number | null
  slots:       SlotState[]
}

// ── Componente ────────────────────────────────────────────────────────────────

export function MatriculaStepper() {
  const router = useRouter()
  const [paso, setPaso]           = useState<PasoNum>(0)
  const [guardando, setGuardando] = useState(false)
  const [progress, setProgress]   = useState(0)

  const [state, setState] = useState<MatriculaState>({
    periodo:    null,
    proceso:    null,
    estudiante: null,
    cursoId:    null,
    jornadaId:  null,
    slots:      [],
  })

  // Pre-carga de slots de archivos — ocurre en paralelo con el paso 1
  const { initialSlots, isLoading: loadingSlots } = useMatriculaSlots()

  useEffect(() => {
    if (initialSlots.length > 0 && state.slots.length === 0) {
      setState((prev) => ({ ...prev, slots: initialSlots }))
    }
  }, [initialSlots])

  // ── Navegación ─────────────────────────────────────────────────────────────

  function avanzar() {
    setPaso((p) => Math.min(3, p + 1) as PasoNum)
  }

  function retroceder() {
    setPaso((p) => Math.max(0, p - 1) as PasoNum)
  }

  // ── Submit final ───────────────────────────────────────────────────────────

  async function handleSubmit() {
    // Verificar período y proceso en tiempo real — pueden haber cerrado
    // mientras el admin completaba el formulario
    const [checkPeriodo, checkProceso] = await Promise.all([
      periodoMatriculaApi.getActivo().catch(() => null),
      procesosInscripcionApi.getVigente().catch(() => null),
    ])
    if (!checkPeriodo?.abierto) {
      toast.error("El período de matrícula cerró. No se puede continuar.")
      return
    }
    if (!checkProceso?.abierto) {
      toast.error("El proceso de inscripción cerró. No se puede continuar.")
      return
    }

    const slotError = validateSlots(state.slots)
    if (slotError) { toast.error(slotError); return }

    const { archivos, metadata } = slotsToApiInput(state.slots)

    setGuardando(true)
    try {
      await matriculasApi.processMatricula(
        {
          matricula: {
            estudiante_id: state.estudiante!.estudiante.estudiante_id!,
            curso_id:      state.cursoId!,
            jornada_id:    state.jornadaId!,
          },
          archivos,
          metadata,
        },
        setProgress
      )

      toast.success("Matrícula registrada correctamente")
      router.push("/dashboard/matriculas")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al procesar la matrícula")
    } finally {
      setGuardando(false)
      setProgress(0)
    }
  }

  // ── Completitud de cada paso (para el stepper visual) ─────────────────────
  const pasoCompletado: Record<PasoNum, boolean> = {
    0: state.periodo !== null,
    1: state.estudiante !== null,
    2: state.cursoId !== null && state.jornadaId !== null,
    3: state.slots.some((s) => s.file) && !state.slots.some((s) => s.error),
  }

  return (
    <div className="space-y-8">

      {/* ── Barra de pasos ── */}
      <nav aria-label="Pasos del proceso de matrícula">
        <ol className="flex items-center">
          {PASOS.map((p, idx) => {
            const activo    = paso === idx
            const completado = pasoCompletado[idx as PasoNum]
            const accesible  = idx === 0 || pasoCompletado[(idx - 1) as PasoNum]

            return (
              <li key={idx} className="flex items-center flex-1 last:flex-none">
                <button
                  type="button"
                  disabled={!accesible}
                  onClick={() => accesible && setPaso(idx as PasoNum)}
                  className={`
                    flex items-center gap-2.5 text-sm font-medium transition-colors
                    disabled:cursor-not-allowed
                    ${activo    ? "text-primary"                                 : ""}
                    ${completado && !activo ? "text-success"                     : ""}
                    ${!activo && !completado && accesible ? "text-muted-foreground hover:text-foreground" : ""}
                    ${!accesible ? "text-muted-foreground/40"                    : ""}
                  `}
                >
                  {/* Círculo numerado */}
                  <span className={`
                    flex h-8 w-8 shrink-0 items-center justify-center rounded-full
                    text-xs font-bold border-2 transition-all
                    ${activo     ? "border-primary bg-primary text-primary-foreground"          : ""}
                    ${completado && !activo ? "border-success bg-success text-success-foreground" : ""}
                    ${!activo && !completado && accesible  ? "border-muted-foreground/50 text-muted-foreground" : ""}
                    ${!accesible ? "border-muted-foreground/20 text-muted-foreground/30"          : ""}
                  `}>
                    {completado && !activo
                      ? <Check className="h-4 w-4" />
                      : idx + 1
                    }
                  </span>

                  <span className="hidden sm:flex flex-col items-start leading-tight">
                    <span>{p.label}</span>
                    {activo && (
                      <span className="text-xs font-normal text-muted-foreground">
                        {p.descripcion}
                      </span>
                    )}
                  </span>
                </button>

                {/* Línea separadora */}
                {idx < PASOS.length - 1 && (
                  <div className={`
                    h-px flex-1 mx-4 transition-colors
                    ${pasoCompletado[idx as PasoNum] ? "bg-success/50" : "bg-border"}
                  `} />
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      {/* ── Contenido del paso activo ── */}
      <div className="min-h-[400px]">

        {paso === 0 && (
          <PasoPeriodo
            periodo={state.periodo}
            onConfirmar={(periodo, proceso) => {
              setState((prev) => ({ ...prev, periodo, proceso }))
              avanzar()
            }}
          />
        )}

        {paso === 1 && (
          <PasoEstudiante
            seleccionado={state.estudiante}
            periodoId={state.periodo!.periodo_id}
            onSeleccionar={(est) => {
              setState((prev) => ({ ...prev, estudiante: est }))
              avanzar()
            }}
            onAnterior={retroceder}
          />
        )}

        {paso === 2 && (
          <PasoCurso
            cursoId={state.cursoId}
            jornadaId={state.jornadaId}
            onChange={(cursoId, jornadaId) =>
              setState((prev) => ({ ...prev, cursoId, jornadaId }))
            }
            onSiguiente={avanzar}
            onAnterior={retroceder}
          />
        )}

        {paso === 3 && (
          <PasoDocumentos
            slots={state.slots}
            onSlotsChange={(slots) => setState((prev) => ({ ...prev, slots }))}
            loadingSlots={loadingSlots}
            guardando={guardando}
            progress={progress}
            resumen={{
              estudiante:   state.estudiante!,
              cursoId:      state.cursoId!,
              jornadaId:    state.jornadaId!,
              procesoNombre: state.proceso?.nombre,
            }}
            onSubmit={handleSubmit}
            onAnterior={retroceder}
          />
        )}
      </div>
    </div>
  )
}
