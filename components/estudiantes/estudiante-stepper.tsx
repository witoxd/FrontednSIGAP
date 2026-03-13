"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Check } from "lucide-react"
import { toast } from "sonner"

import { estudiantesApi } from "@/lib/api/services/estudiantes"
import { expedienteApi } from "@/lib/api/services/expediente"

import { PersonaForm, type PersonaFormData } from "@/components/forms/persona-form"
import {
  FichaEstudianteForm,
  type FichaFormData,
  fichaFormVacio,
  fichaFromApi,
  fichaToDTO,
} from "@/components/forms/ficha/ficheroEstudiante/FichaEstudianteForm"
import {
  ViviendaEstudianteForm,
  type ViviendaFormData,
  viviendaFormVacio,
  viviendaFromApi,
  viviendaToDTO,
} from "@/components/forms/ficha/vidiendaEstudiante/ViviendaEstudianteForm"
import {
  ColegioAnteriorForm,
  type ColegiosFormData,
  colegiosFormVacio,
  colegiosFromApi,
  colegiosToDTO,
} from "@/components/forms/ficha/colegiosAnteriores/ColegioAnteriorForm"

import type { CreateEstudianteInput, EstudianteWithPersonaDocumento } from "@/lib/types"

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Paso = 0 | 1 | 2 | 3

const PASOS = [
  { label: "Datos personales" },
  { label: "Ficha"            },
  { label: "Vivienda"         },
  { label: "Colegios"         },
]

interface EstudianteStepperProps {
  modo: "crear" | "editar"
  estudianteId?: number          // requerido en modo editar
}

// ── Componente ────────────────────────────────────────────────────────────────

export function EstudianteStepper({ modo, estudianteId }: EstudianteStepperProps) {
  const router = useRouter()

  // ── Estado de navegación ───────────────────────────────────────────────────
  const [pasoActivo, setPasoActivo] = useState<Paso>(0)

  /**
   * En modo crear: el estudianteId llega null hasta que el paso 1 hace submit.
   * En modo editar: llega desde las props desde el inicio.
   * Analogía: es como el número de expediente — en crear, lo recibimos
   * después de registrarnos; en editar, ya lo traemos en la URL.
   */
  const [idInterno, setIdInterno] = useState<number | null>(estudianteId ?? null)
  const expedienteDesbloqueado = idInterno !== null

  // ── Estado de carga global ─────────────────────────────────────────────────
  const [cargandoInicial, setCargandoInicial] = useState(modo === "editar")
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Datos de cada sección ──────────────────────────────────────────────────
  const [personaData, setPersonaData] = useState<PersonaFormData>({
    nombres:           "",
    apellido_paterno:  "",
    apellido_materno:  "",
    tipo_documento_id: 0,
    numero_documento:  "",
    fecha_nacimiento:  "",
    genero:            "Masculino",
    grupo_sanguineo:   "",
    grupo_etnico:      "",
    credo_religioso:   "",
    lugar_nacimiento:  "",
    serial_registro_civil: "",
    expedida_en:      "",
  })
  const [estado, setEstado] = useState<
    "activo" | "inactivo" | "graduado" | "suspendido" | "expulsado"
  >("activo")
  const [fechaIngreso, setFechaIngreso]   = useState("")
  const [fichaData, setFichaData]         = useState<FichaFormData>(fichaFormVacio())
  const [viviendaData, setViviendaData]   = useState<ViviendaFormData>(viviendaFormVacio())
  const [colegiosData, setColegiosData]   = useState<ColegiosFormData>(colegiosFormVacio())

  // ── Carga inicial (solo modo editar) ───────────────────────────────────────
  useEffect(() => {
    if (modo !== "editar" || !estudianteId) return

    async function cargar() {
      try {
        // 2 requests en paralelo: datos del estudiante + expediente completo
        const [estudianteRes, expedienteRes] = await Promise.all([
          estudiantesApi.getById(estudianteId!),
          expedienteApi.get(estudianteId!),
        ])

        const est = estudianteRes.data as unknown as EstudianteWithPersonaDocumento

        // Poblar paso 1
        setPersonaData({
          nombres:           est.persona.nombres           ?? "",
          apellido_paterno:  est.persona.apellido_paterno  ?? "",
          apellido_materno:  est.persona.apellido_materno  ?? "",
          tipo_documento_id: est.persona.tipo_documento.tipo_documento_id,
          numero_documento:  est.persona.numero_documento  ?? "",
          fecha_nacimiento:  est.persona.fecha_nacimiento?.split("T")[0] ?? "",
          genero:            (est.persona.genero as "Masculino" | "Femenino" | "Otro") ?? "Masculino",
          grupo_sanguineo:   est.persona.grupo_sanguineo   ?? "",
          grupo_etnico:      est.persona.grupo_etnico      ?? "",
          credo_religioso:   est.persona.credo_religioso   ?? "",
          lugar_nacimiento:  est.persona.lugar_nacimiento  ?? "",
          serial_registro_civil: est.persona.serial_registro_civil ?? "",
          expedida_en:      est.persona.expedida_en      ?? "",
        })
        setEstado(est.estudiante.estado ?? "activo")
        setFechaIngreso(est.estudiante.fecha_ingreso?.split("T")[0] ?? "")

        // Poblar pasos 2-4 desde el expediente
        const exp = expedienteRes.data!
        if (exp.ficha)    setFichaData(fichaFromApi(exp.ficha))
        if (exp.vivienda) setViviendaData(viviendaFromApi(exp.vivienda))
        if (exp.colegios?.length) setColegiosData(colegiosFromApi(exp.colegios))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar los datos")
      } finally {
        setCargandoInicial(false)
      }
    }

    cargar()
  }, [modo, estudianteId])

  // ── Handlers de guardado ───────────────────────────────────────────────────

  /**
   * Paso 1 — Crear o actualizar los datos personales del estudiante.
   * En modo crear: hace POST y desbloquea el resto de pasos con el nuevo id.
   * En modo editar: hace PUT y avanza al siguiente paso.
   */
  async function handleGuardarPaso1(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setGuardando(true)
    setError(null)

    try {
      const input: CreateEstudianteInput = {
        persona:    { ...personaData },
        estudiante: { estado, fecha_ingreso: fechaIngreso },
      }

      if (modo === "crear") {
        const res = await estudiantesApi.create(input)
        const nuevoId = (res.data as any)?.estudiante?.persona_id
          ?? (res.data as any)?.persona_id
        if (!nuevoId) throw new Error("El servidor no devolvió el ID del estudiante")
        setIdInterno(nuevoId)
        toast.success("Estudiante creado. Ahora puedes completar el expediente.")
      } else {
        await estudiantesApi.update(idInterno!, input)
        toast.success("Datos personales actualizados")
      }

      setPasoActivo(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setGuardando(false)
    }
  }

  /**
   * Pasos 2-4 — Guarda el expediente completo en 1 sola transacción.
   * Solo manda la sección que corresponde al paso activo —
   * el backend ignora las secciones que no vienen.
   */
  async function handleGuardarExpediente(siguientePaso?: Paso) {
    if (!idInterno) return
    setGuardando(true)
    setError(null)

    try {
      const dto =
        pasoActivo === 1 ? { ficha:    fichaToDTO(fichaData) }
        : pasoActivo === 2 ? { vivienda: viviendaToDTO(viviendaData) }
        :                    { colegios: colegiosToDTO(colegiosData) }

      await expedienteApi.upsert(idInterno, dto)
      toast.success("Guardado correctamente")

      if (siguientePaso !== undefined) {
        setPasoActivo(siguientePaso)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setGuardando(false)
    }
  }

  async function handleFinalizar() {
    await handleGuardarExpediente()
    router.push("/dashboard/estudiantes")
    router.refresh()
  }

  // ── Clases ────────────────────────────────────────────────────────────────
  const inputClass =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"

  // ── Render: carga inicial ─────────────────────────────────────────────────
  if (cargandoInicial) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ── Render principal ──────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* ── Barra de pasos ── */}
      <nav aria-label="Pasos del formulario">
        <ol className="flex items-center gap-0">
          {PASOS.map((paso, idx) => {
            const activo    = pasoActivo === idx
            const completado = idx === 0
              ? expedienteDesbloqueado
              : expedienteDesbloqueado && pasoActivo > idx
            const bloqueado = idx > 0 && !expedienteDesbloqueado

            return (
              <li key={idx} className="flex items-center flex-1 last:flex-none">
                <button
                  type="button"
                  disabled={bloqueado}
                  onClick={() => !bloqueado && setPasoActivo(idx as Paso)}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors disabled:cursor-not-allowed
                    ${activo    ? "text-primary"              : ""}
                    ${completado && !activo ? "text-success"  : ""}
                    ${bloqueado ? "text-muted-foreground/40"  : ""}
                    ${!activo && !completado && !bloqueado ? "text-muted-foreground hover:text-foreground" : ""}
                  `}
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold border-2 transition-colors
                    ${activo    ? "border-primary bg-primary text-primary-foreground"          : ""}
                    ${completado && !activo ? "border-success bg-success text-success-foreground" : ""}
                    ${bloqueado ? "border-muted-foreground/30 text-muted-foreground/40"          : ""}
                    ${!activo && !completado && !bloqueado ? "border-muted-foreground text-muted-foreground" : ""}
                  `}>
                    {completado && !activo ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                  </span>
                  <span className="hidden sm:inline">{paso.label}</span>
                </button>

                {/* Separador — no se muestra después del último paso */}
                {idx < PASOS.length - 1 && (
                  <div className={`h-px flex-1 mx-3 transition-colors
                    ${completado ? "bg-success" : "bg-border"}
                  `} />
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      {/* ── Error global ── */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PASO 1 — Datos personales y académicos
      ══════════════════════════════════════════════════════════════════════ */}
      {pasoActivo === 0 && (
        <form onSubmit={handleGuardarPaso1} className="space-y-6">

          <div className="bg-card border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold">Información Personal</h2>
            <PersonaForm
              data={personaData}
              onChange={setPersonaData}
              disabled={guardando}
            />
          </div>

          <div className="bg-card border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold">Información Académica</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Estado <span className="text-destructive">*</span>
                </label>
                <select
                  required
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as typeof estado)}
                  disabled={guardando}
                  className={inputClass}
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="graduado">Graduado</option>
                  <option value="suspendido">Suspendido</option>
                  <option value="expulsado">Expulsado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Fecha de Ingreso
                </label>
                <input
                  type="date"
                  value={fechaIngreso}
                  onChange={(e) => setFechaIngreso(e.target.value)}
                  disabled={guardando}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={guardando}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {guardando
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
                : "Guardar y continuar →"
              }
            </button>
          </div>
        </form>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PASO 2 — Ficha del estudiante
      ══════════════════════════════════════════════════════════════════════ */}
      {pasoActivo === 1 && (
        <div className="space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Ficha del Estudiante</h2>
            <FichaEstudianteForm
              data={fichaData}
              onChange={setFichaData}
              disabled={guardando}
            />
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setPasoActivo(0)}
              disabled={guardando}
              className="px-4 py-2 border border-border rounded-md text-sm hover:bg-muted transition-colors disabled:opacity-50"
            >
              ← Anterior
            </button>
            <button
              type="button"
              onClick={() => handleGuardarExpediente(2)}
              disabled={guardando}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {guardando
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
                : "Guardar y continuar →"
              }
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PASO 3 — Vivienda
      ══════════════════════════════════════════════════════════════════════ */}
      {pasoActivo === 2 && (
        <div className="space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Datos de Vivienda</h2>
            <ViviendaEstudianteForm
              data={viviendaData}
              onChange={setViviendaData}
              disabled={guardando}
            />
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setPasoActivo(1)}
              disabled={guardando}
              className="px-4 py-2 border border-border rounded-md text-sm hover:bg-muted transition-colors disabled:opacity-50"
            >
              ← Anterior
            </button>
            <button
              type="button"
              onClick={() => handleGuardarExpediente(3)}
              disabled={guardando}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {guardando
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
                : "Guardar y continuar →"
              }
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PASO 4 — Colegios anteriores
      ══════════════════════════════════════════════════════════════════════ */}
      {pasoActivo === 3 && (
        <div className="space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Colegios Anteriores</h2>
            <ColegioAnteriorForm
              data={colegiosData}
              onChange={setColegiosData}
              disabled={guardando}
            />
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setPasoActivo(2)}
              disabled={guardando}
              className="px-4 py-2 border border-border rounded-md text-sm hover:bg-muted transition-colors disabled:opacity-50"
            >
              ← Anterior
            </button>
            <button
              type="button"
              onClick={handleFinalizar}
              disabled={guardando}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {guardando
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
                : "Guardar y finalizar ✓"
              }
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
