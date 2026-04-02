"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Check } from "lucide-react"
import { toast } from "sonner"

import { estudiantesApi } from "@/lib/api/services/estudiantes"
import { expedienteApi }  from "@/lib/api/services/expediente"
import { acudientesApi }  from "@/lib/api/services/acudientes"
import { AcudienteSearchModal, type AcudienteResumen } from "@/components/acudientes/acudiente-search-modal"

import { PersonaForm, type PersonaFormData } from "@/components/personas/persona-form"
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

type Paso = 0 | 1 | 2 | 3 | 4

const PASOS = [
  { label: "Datos personales" },
  { label: "Ficha"            },
  { label: "Vivienda"         },
  { label: "Colegios"         },
  { label: "Acudientes"       },
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
  })
  const [estado, setEstado] = useState<
    "activo" | "inactivo" | "graduado" | "suspendido" | "expulsado"
  >("activo")
  const [fechaIngreso, setFechaIngreso]   = useState("")
  const [fichaData, setFichaData]         = useState<FichaFormData>(fichaFormVacio())
  const [viviendaData, setViviendaData]   = useState<ViviendaFormData>(viviendaFormVacio())
  const [colegiosData, setColegiosData]   = useState<ColegiosFormData>(colegiosFormVacio())

  // ── Estado paso 5 — Acudientes ─────────────────────────────────────────────
  /** Fila de asignación acudiente ↔ estudiante con estado de UI */
  interface FilaAcudiente {
    acudiente_estudiante_id: number
    acudiente_id:   number
    nombres:        string
    apellido_paterno?: string
    apellido_materno?: string
    numero_documento: string
    tipo_relacion?: string
    es_principal?:  boolean
    _uiEstado: "guardado" | "eliminando"
  }
  const [acudientes, setAcudientes]           = useState<FilaAcudiente[]>([])
  const [cargandoAcudientes, setCargandoAcudientes] = useState(false)
  const [modalAcudiente, setModalAcudiente]   = useState(false)

  // ── Carga inicial (solo modo editar) ───────────────────────────────────────
  useEffect(() => {
    if (modo !== "editar" || !estudianteId) return

    async function cargar() {
      try {
        // 2 requests en paralelo: datos del estudiante + expediente completo
        const [estudianteRes, expedienteRes, acudientesRes] = await Promise.all([
          estudiantesApi.getById(estudianteId!),
          expedienteApi.get(estudianteId!),
          acudientesApi.getByEstudiante(estudianteId!),
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
        })
        setEstado(est.estudiante.estado ?? "activo")
        setFechaIngreso(est.estudiante.fecha_ingreso?.split("T")[0] ?? "")

        // Poblar pasos 2-4 desde el expediente
        const exp = expedienteRes.data!
        if (exp.ficha)    setFichaData(fichaFromApi(exp.ficha))
        if (exp.vivienda) setViviendaData(viviendaFromApi(exp.vivienda))
        if (exp.colegios?.length) setColegiosData(colegiosFromApi(exp.colegios))

        // Poblar paso 5 — acudientes
        const rawAcudientes = (acudientesRes.data ?? []) as any[]
        setAcudientes(
          rawAcudientes.map((a: any) => ({
            acudiente_estudiante_id: a.acudiente_estudiante_id,
            acudiente_id:    a.acudiente_id,
            nombres:         a.persona?.nombres          ?? a.nombres ?? "",
            apellido_paterno: a.persona?.apellido_paterno,
            apellido_materno: a.persona?.apellido_materno,
            numero_documento: a.persona?.numero_documento ?? a.numero_documento ?? "",
            tipo_relacion:   a.tipo_relacion,
            es_principal:    a.es_principal,
            _uiEstado:       "guardado" as const,
          }))
        )
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
        const nuevoId = (res.data as any)?.estudiante?.estudiante_id
          ?? (res.data as any)?.estudiante_id
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
              onClick={() => handleGuardarExpediente(4)}
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
          PASO 5 — Acudientes
      ══════════════════════════════════════════════════════════════════════ */}
      {pasoActivo === 4 && (
        <Paso5Acudientes
          idInterno={idInterno}
          acudientes={acudientes}
          setAcudientes={setAcudientes}
          cargandoAcudientes={cargandoAcudientes}
          modalAcudiente={modalAcudiente}
          setModalAcudiente={setModalAcudiente}
          guardando={guardando}
          modo={modo}
          onAnterior={() => setPasoActivo(3)}
          onFinalizar={() => {
            router.push(`/dashboard/estudiantes/${idInterno}`)
          }}
          onVolverLista={() => {
            router.push("/dashboard/estudiantes")
            router.refresh()
          }}
        />
      )}

    </div>
  )
}

// ── Sub-componente paso 5 ─────────────────────────────────────────────────────
/**
 * Extraído como componente separado para mantener el stepper principal legible.
 * Recibe todo lo que necesita por props — no tiene estado propio.
 */

interface FilaAcudienteProp {
  acudiente_estudiante_id: number
  acudiente_id:    number
  nombres:         string
  apellido_paterno?: string
  apellido_materno?: string
  numero_documento:  string
  tipo_relacion?:  string
  es_principal?:   boolean
  _uiEstado: "guardado" | "eliminando"
}

interface Paso5Props {
  idInterno:           number | null
  acudientes:          FilaAcudienteProp[]
  setAcudientes:       React.Dispatch<React.SetStateAction<FilaAcudienteProp[]>>
  cargandoAcudientes:  boolean
  modalAcudiente:      boolean
  setModalAcudiente:   (v: boolean) => void
  guardando:           boolean
  modo:                "crear" | "editar"
  onAnterior:          () => void
  onFinalizar:         () => void
  onVolverLista:       () => void
}

function Paso5Acudientes({
  idInterno,
  acudientes,
  setAcudientes,
  cargandoAcudientes,
  modalAcudiente,
  setModalAcudiente,
  guardando,
  modo,
  onAnterior,
  onFinalizar,
  onVolverLista,
}: Paso5Props) {
  const acudientesAsignadosIds = acudientes.map((a) => a.acudiente_id)

  function nombreCompleto(a: FilaAcudienteProp) {
    return [a.nombres, a.apellido_paterno, a.apellido_materno].filter(Boolean).join(" ")
  }

  async function handleAsignarAcudiente(acudiente: AcudienteResumen, tipoRelacion: string) {
    if (!idInterno) return

    const res = await acudientesApi.assignToEstudiante({
      assignToEstudiante: {
        acudiente_id:   acudiente.acudiente_id,
        estudiante_id:  idInterno,
        tipo_relacion:  tipoRelacion,
        es_principal:   acudientes.length === 0,
      },
    })

    const nueva = res.data as any
    setAcudientes((prev) => [
      ...prev,
      {
        acudiente_estudiante_id: nueva?.acudiente_estudiante_id ?? -(Date.now()),
        acudiente_id:    acudiente.acudiente_id,
        nombres:         acudiente.nombres,
        apellido_paterno: acudiente.apellido_paterno,
        apellido_materno: acudiente.apellido_materno,
        numero_documento: acudiente.numero_documento,
        tipo_relacion:   tipoRelacion,
        es_principal:    acudientes.length === 0,
        _uiEstado:       "guardado",
      },
    ])
  }

  async function handleEliminar(fila: FilaAcudienteProp) {
    if (!idInterno) return

    setAcudientes((prev) =>
      prev.map((a) =>
        a.acudiente_estudiante_id === fila.acudiente_estudiante_id
          ? { ...a, _uiEstado: "eliminando" as const }
          : a
      )
    )

    try {
      await acudientesApi.removeFromEstudiante(idInterno, fila.acudiente_id)
      setAcudientes((prev) =>
        prev.filter((a) => a.acudiente_estudiante_id !== fila.acudiente_estudiante_id)
      )
    } catch {
      setAcudientes((prev) =>
        prev.map((a) =>
          a.acudiente_estudiante_id === fila.acudiente_estudiante_id
            ? { ...a, _uiEstado: "guardado" as const }
            : a
        )
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Acudientes</h2>
          <button
            type="button"
            onClick={() => setModalAcudiente(true)}
            disabled={!idInterno}
            className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors disabled:opacity-40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Buscar y asignar acudiente
          </button>
        </div>

        {cargandoAcudientes ? (
          <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando...
          </div>
        ) : acudientes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            Sin acudientes asignados. Usa el botón para buscar y asignar uno.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Nombre</th>
                  <th className="px-4 py-2 text-left font-medium">Documento</th>
                  <th className="px-4 py-2 text-left font-medium">Relación</th>
                  <th className="px-4 py-2 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {acudientes.map((fila) => {
                  const eliminando = fila._uiEstado === "eliminando"
                  return (
                    <tr key={fila.acudiente_estudiante_id}
                      className={`bg-background transition-opacity ${eliminando ? "opacity-40" : "hover:bg-muted/30"}`}>
                      <td className="px-4 py-2.5 font-medium text-foreground">
                        {nombreCompleto(fila)}
                        {fila.es_principal && (
                          <span className="ml-2 text-xs text-amber-600 font-normal">★ principal</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">
                        {fila.numero_documento}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {fila.tipo_relacion ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {eliminando ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mx-auto" />
                        ) : (
                          <button type="button" onClick={() => handleEliminar(fila)}
                            className="text-muted-foreground/50 hover:text-destructive transition-colors p-1 rounded">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Navegación */}
      <div className="flex items-center justify-between">
        <button type="button" onClick={onAnterior} disabled={guardando}
          className="px-4 py-2 border border-border rounded-md text-sm hover:bg-muted transition-colors disabled:opacity-50">
          ← Anterior
        </button>

        {/* Dos opciones al finalizar — la idea nueva */}
        <div className="flex items-center gap-3">
          <button type="button" onClick={onVolverLista}
            className="px-4 py-2 border border-border rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            {modo === "crear" ? "← Volver a la lista" : "← Volver a la lista"}
          </button>
          {modo === "crear" && (
            <button type="button" onClick={onFinalizar}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors">
              Ver perfil del estudiante →
            </button>
          )}
          {modo === "editar" && (
            <button type="button" onClick={onVolverLista}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors">
              Guardar y finalizar ✓
            </button>
          )}
        </div>
      </div>

      {modalAcudiente && idInterno && (
        <AcudienteSearchModal
          acudientesAsignados={acudientesAsignadosIds}
          onAsignar={handleAsignarAcudiente}
          onCerrar={() => setModalAcudiente(false)}
        />
      )}
    </div>
  )
}