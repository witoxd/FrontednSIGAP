"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save, Users, Phone, UserPlus, Trash2, Star } from "lucide-react"
import { toast } from "sonner"

import { acudientesApi } from "@/lib/api/services/acudientes"
import { PersonaForm, type PersonaFormData } from "@/components/forms/persona-form"
import { ContactoManager } from "@/components/shared/contactos/contacto-manager"
import { EstudianteSearchModal } from "@/components/shared/estudiante-search-modal"

import type {
  AcudienteWithPersona,
  AsignacionConEstudiante,
  EstudianteResumen,
} from "@/lib/types"

// ── Tipos internos ─────────────────────────────────────────────────────────────

/** Fila de asignación con estado de UI */
interface FilaAsignacion extends AsignacionConEstudiante {
  _uiEstado: "guardado" | "eliminando"
}

/**
 * Datos propios del acudiente (no de la persona).
 * Son los campos de la tabla `acudientes` que no están en `personas`.
 */
interface AcudienteFormData {
  parentesco:    string
  ocupacion:     string
  nivel_estudio: string
}

function acudienteFormVacio(): AcudienteFormData {
  return { parentesco: "", ocupacion: "", nivel_estudio: "" }
}

function acudienteFromApi(a: AcudienteWithPersona): AcudienteFormData {
  return {
    parentesco:    (a as any).parentesco    ?? "",
    ocupacion:     (a as any).ocupacion     ?? "",
    nivel_estudio: (a as any).nivel_estudio ?? "",
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function personaFormVacia(): PersonaFormData {
  return {
    nombres:           "",
    apellido_paterno:  "",
    apellido_materno:  "",
    tipo_documento_id: 0,
    numero_documento:  "",
    fecha_nacimiento:  "",
    genero:            "Masculino",
  }
}

function personaFromApi(a: AcudienteWithPersona): PersonaFormData {
  return {
    nombres:           a.persona.nombres           ?? "",
    apellido_paterno:  a.persona.apellido_paterno  ?? "",
    apellido_materno:  a.persona.apellido_materno  ?? "",
    tipo_documento_id: a.persona.tipo_documento.tipo_documento_id,
    numero_documento:  a.persona.numero_documento  ?? "",
    // El tipo AcudienteWithPersona no expone fecha_nacimiento —
    // si el backend la incluye, mapearla aquí.
    fecha_nacimiento:  (a.persona as any).fecha_nacimiento?.split("T")[0] ?? "",
    genero:            ((a.persona as any).genero as PersonaFormData["genero"]) ?? "Masculino",
    grupo_sanguineo:   (a.persona as any).grupo_sanguineo,
    grupo_etnico:      (a.persona as any).grupo_etnico,
    credo_religioso:   (a.persona as any).credo_religioso,
    lugar_nacimiento:  (a.persona as any).lugar_nacimiento,
    expedida_en:       (a.persona as any).expedida_en,
    serial_registro_civil: (a.persona as any).serial_registro_civil,
  }
}

function nombreCompleto(e: EstudianteResumen) {
  return [e.nombres, e.apellido_paterno, e.apellido_materno].filter(Boolean).join(" ")
}

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"

// ── Props ─────────────────────────────────────────────────────────────────────

interface AcudienteFormProps {
  modo: "crear" | "editar"
  acudienteId?: number
}

// ── Componente ────────────────────────────────────────────────────────────────

export function AcudienteForm({ modo, acudienteId }: AcudienteFormProps) {
  const router = useRouter()

  // ── Estado de IDs ─────────────────────────────────────────────────────────
  /**
   * En modo crear: ambos llegan null hasta que el POST responde.
   * En modo editar: llegan desde las props al montar.
   *
   * Analogía: idPersona es el DNI de la persona — necesario para guardar
   * contactos. idAcudiente es el número de expediente de acudiente —
   * necesario para asignar estudiantes.
   */
  const [idPersona,    setIdPersona]    = useState<number | null>(null)
  const [idAcudiente,  setIdAcudiente]  = useState<number | null>(acudienteId ?? null)
  const seccionsDesbloqueadas = idPersona !== null

  // ── Estado de carga y guardado ────────────────────────────────────────────
  const [cargandoInicial, setCargandoInicial] = useState(modo === "editar")
  const [guardandoPersona, setGuardandoPersona] = useState(false)
  const [errorPersona, setErrorPersona]         = useState<string | null>(null)

  // ── Datos del formulario ──────────────────────────────────────────────────
  const [personaData,   setPersonaData]   = useState<PersonaFormData>(personaFormVacia())
  const [acudienteData, setAcudienteData] = useState<AcudienteFormData>(acudienteFormVacio())

  // ── Asignaciones de estudiantes ───────────────────────────────────────────
  const [asignaciones, setAsignaciones]       = useState<FilaAsignacion[]>([])
  const [cargandoAsignaciones, setCargandoAsignaciones] = useState(false)
  const [modalAbierto, setModalAbierto]       = useState(false)

  // ── Carga inicial (modo editar) ───────────────────────────────────────────
  useEffect(() => {
    if (modo !== "editar" || !acudienteId) return

    async function cargar() {
      try {
        const [acudienteRes, asignacionesRes] = await Promise.all([
          acudientesApi.getById(acudienteId!),
          acudientesApi.getEstudiantes(acudienteId!),
        ])

        const acudiente = acudienteRes.data as AcudienteWithPersona
        setPersonaData(personaFromApi(acudiente))
        setAcudienteData(acudienteFromApi(acudiente))
        setIdPersona(acudiente.persona.persona_id)
        setIdAcudiente(acudiente.acudiente.acudiente_id)

        setAsignaciones(
          ((asignacionesRes.data ?? []) as AsignacionConEstudiante[]).map((a) => ({
            ...a,
            _uiEstado: "guardado",
          }))
        )
      } catch (err) {
        setErrorPersona(err instanceof Error ? err.message : "Error al cargar datos")
      } finally {
        setCargandoInicial(false)
      }
    }
    cargar()
  }, [modo, acudienteId])

  // ── Guardar persona ────────────────────────────────────────────────────────
  /**
   * En modo crear: POST → recibimos acudiente_id + persona_id → desbloqueamos secciones.
   * En modo editar: PUT → actualizamos y mostramos toast.
   *
   * El flujo es análogo al paso 1 del EstudianteStepper.
   */
  async function handleGuardarPersona(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setGuardandoPersona(true)
    setErrorPersona(null)

    try {
      if (modo === "crear") {
        const res = await acudientesApi.create({
          persona:   { ...personaData } as any,
          acudiente: {
            acudiente_id: 0, // 0 para que backend lo ignore y genere uno nuevo
            ...(acudienteData.parentesco    && { parentesco:    acudienteData.parentesco }),
            ...(acudienteData.ocupacion     && { ocupacion:     acudienteData.ocupacion }),
            ...(acudienteData.nivel_estudio && { nivel_estudio: acudienteData.nivel_estudio }),
          },
        })
        const nuevo = res.data as AcudienteWithPersona
        setIdPersona(nuevo.persona.persona_id)
        setIdAcudiente(nuevo.acudiente.acudiente_id)
        toast.success("Acudiente creado. Ahora puedes agregar contactos y estudiantes.")
      } else {
        await acudientesApi.update(idAcudiente!, {
          persona:   { ...personaData } as any,
          acudiente: {
            acudiente_id: 0, // 0 para que backend lo ignore y genere uno nuevo
            ...(acudienteData.parentesco    && { parentesco:    acudienteData.parentesco }),
            ...(acudienteData.ocupacion     && { ocupacion:     acudienteData.ocupacion }),
            ...(acudienteData.nivel_estudio && { nivel_estudio: acudienteData.nivel_estudio }),
          },
        })
        toast.success("Datos actualizados correctamente")
      }
    } catch (err) {
      setErrorPersona(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setGuardandoPersona(false)
    }
  }

  // ── Asignar estudiante ─────────────────────────────────────────────────────
  async function handleAsignar(estudiante: EstudianteResumen, tipoRelacion: string) {
    if (!idAcudiente) return

    const estudianteId = estudiante.estudiante_id ?? estudiante.persona_id

    const res = await acudientesApi.assignToEstudiante({
      assignToEstudiante: {
        acudiente_id:   idAcudiente,
        estudiante_id:  estudianteId,
        tipo_relacion:  tipoRelacion,
        es_principal:   asignaciones.length === 0,
      },
    })

    const nueva = res.data as AsignacionConEstudiante & { acudiente_estudiante_id?: number }

    // Agregamos la fila optimistamente — si el backend devuelve el id real, perfecto.
    // Si no, usamos un id temporal negativo para la key de React.
    setAsignaciones((prev) => [
      ...prev,
      {
        acudiente_estudiante_id: nueva?.acudiente_estudiante_id ?? -(Date.now()),
        acudiente_id:   idAcudiente,
        estudiante_id:  estudianteId,
        tipo_relacion:  tipoRelacion,
        es_principal:   asignaciones.length === 0,
        estudiante,
        _uiEstado: "guardado",
      },
    ])

    toast.success(`${nombreCompleto(estudiante)} asignado correctamente`)
  }

  // ── Eliminar asignación ────────────────────────────────────────────────────
  async function handleEliminarAsignacion(fila: FilaAsignacion) {
    if (!idAcudiente) return

    // Optimistic: marcamos como "eliminando"
    setAsignaciones((prev) =>
      prev.map((a) =>
        a.acudiente_estudiante_id === fila.acudiente_estudiante_id
          ? { ...a, _uiEstado: "eliminando" }
          : a
      )
    )

    try {
      await acudientesApi.removeFromEstudiante(fila.estudiante_id, idAcudiente)
      setAsignaciones((prev) =>
        prev.filter((a) => a.acudiente_estudiante_id !== fila.acudiente_estudiante_id)
      )
      toast.success("Estudiante desasignado")
    } catch (err) {
      // Revertimos el estado si falla
      setAsignaciones((prev) =>
        prev.map((a) =>
          a.acudiente_estudiante_id === fila.acudiente_estudiante_id
            ? { ...a, _uiEstado: "guardado" }
            : a
        )
      )
      toast.error(err instanceof Error ? err.message : "Error al desasignar")
    }
  }

  // ── Render: carga inicial ──────────────────────────────────────────────────
  if (cargandoInicial) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ── IDs de estudiantes ya asignados (para deshabilitar en el modal) ────────
  const estudiantesAsignadosIds = asignaciones.map((a) => a.estudiante_id)

  // ── Render principal ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ════════════════════════════════════════════════════════════════════
          § 1 — Información Personal
      ════════════════════════════════════════════════════════════════════ */}
      <section className="bg-card border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-5">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Información Personal</h2>
          {seccionsDesbloqueadas && modo === "crear" && (
            <span className="ml-auto text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
              Guardado ✓
            </span>
          )}
        </div>

        <form onSubmit={handleGuardarPersona} className="space-y-5">
          <PersonaForm
            data={personaData}
            onChange={setPersonaData}
            disabled={guardandoPersona}
          />

          {/* ── Datos propios del acudiente ── */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Datos del acudiente
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">
                  Parentesco
                </label>
                <select
                  disabled={guardandoPersona}
                  value={acudienteData.parentesco}
                  onChange={(e) =>
                    setAcudienteData((prev) => ({ ...prev, parentesco: e.target.value }))
                  }
                  className={inputClass}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Madre">Madre</option>
                  <option value="Padre">Padre</option>
                  <option value="Abuelo/a">Abuelo/a</option>
                  <option value="Tío/a">Tío/a</option>
                  <option value="Hermano/a">Hermano/a</option>
                  <option value="Tutor legal">Tutor legal</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">
                  Ocupación
                </label>
                <input
                  type="text"
                  disabled={guardandoPersona}
                  value={acudienteData.ocupacion}
                  onChange={(e) =>
                    setAcudienteData((prev) => ({ ...prev, ocupacion: e.target.value }))
                  }
                  placeholder="Ej: Comerciante, Docente"
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">
                  Nivel de estudio
                </label>
                <select
                  disabled={guardandoPersona}
                  value={acudienteData.nivel_estudio}
                  onChange={(e) =>
                    setAcudienteData((prev) => ({ ...prev, nivel_estudio: e.target.value }))
                  }
                  className={inputClass}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Primaria">Primaria</option>
                  <option value="Secundaria">Secundaria</option>
                  <option value="Técnico">Técnico</option>
                  <option value="Tecnólogo">Tecnólogo</option>
                  <option value="Universitario">Universitario</option>
                  <option value="Posgrado">Posgrado</option>
                  <option value="Ninguno">Ninguno</option>
                </select>
              </div>

            </div>
          </div>

          {errorPersona && (
            <p className="text-sm text-destructive">{errorPersona}</p>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={guardandoPersona}
              className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {guardandoPersona ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
              ) : (
                <><Save className="h-4 w-4" />
                  {modo === "crear" ? "Guardar y continuar" : "Guardar cambios"}
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          § 2 — Contactos
          Se muestra siempre pero bloqueado hasta tener personaId.
      ════════════════════════════════════════════════════════════════════ */}
      <section className={`bg-card border rounded-lg p-6 transition-opacity ${
        seccionsDesbloqueadas ? "" : "opacity-50 pointer-events-none"
      }`}>
        <div className="flex items-center gap-2 mb-5">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Contactos</h2>
          {!seccionsDesbloqueadas && (
            <span className="ml-2 text-xs text-muted-foreground">
              — Guarda primero la información personal
            </span>
          )}
        </div>

        {seccionsDesbloqueadas ? (
          <ContactoManager personaId={idPersona!} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Los contactos estarán disponibles después de guardar.
          </p>
        )}
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          § 3 — Estudiantes asignados
      ════════════════════════════════════════════════════════════════════ */}
      <section className={`bg-card border rounded-lg p-6 transition-opacity ${
        seccionsDesbloqueadas ? "" : "opacity-50 pointer-events-none"
      }`}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Estudiantes asignados</h2>
            {!seccionsDesbloqueadas && (
              <span className="ml-2 text-xs text-muted-foreground">
                — Guarda primero la información personal
              </span>
            )}
          </div>
          {seccionsDesbloqueadas && (
            <button
              type="button"
              onClick={() => setModalAbierto(true)}
              className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Asignar estudiante
            </button>
          )}
        </div>

        {/* Tabla de asignaciones */}
        {cargandoAsignaciones ? (
          <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando...
          </div>
        ) : asignaciones.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            {seccionsDesbloqueadas
              ? "Sin estudiantes asignados. Usa el botón para asignar uno."
              : "Los estudiantes se podrán asignar después de guardar."}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-2 text-left font-medium w-6">★</th>
                  <th className="px-4 py-2 text-left font-medium">Estudiante</th>
                  <th className="px-4 py-2 text-left font-medium">Documento</th>
                  <th className="px-4 py-2 text-left font-medium">Relación</th>
                  <th className="px-4 py-2 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {asignaciones.map((fila) => {
                  const eliminando = fila._uiEstado === "eliminando"
                  return (
                    <tr
                      key={fila.acudiente_estudiante_id}
                      className={`transition-opacity ${eliminando ? "opacity-40" : ""}`}
                    >
                      <td className="px-4 py-2 text-center">
                        {fila.es_principal && (
                          <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-2 font-medium text-foreground">
                        {nombreCompleto(fila.estudiante)}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {fila.estudiante.numero_documento}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {fila.tipo_relacion ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {eliminando ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mx-auto" />
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleEliminarAsignacion(fila)}
                            title="Desasignar"
                            className="text-muted-foreground/50 hover:text-destructive transition-colors p-1 rounded"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
      </section>

      {/* ── Botón volver ── */}
      <div className="flex justify-end pb-4">
        <button
          type="button"
          onClick={() => router.push("/dashboard/acudientes")}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Volver a la lista
        </button>
      </div>

      {/* ── Modal de búsqueda ── */}
      {modalAbierto && (
        <EstudianteSearchModal
          estudiantesAsignados={estudiantesAsignadosIds}
          onAsignar={handleAsignar}
          onCerrar={() => setModalAbierto(false)}
        />
      )}
    </div>
  )
}